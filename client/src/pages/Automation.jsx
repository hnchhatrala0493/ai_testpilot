import { Bot, Camera, CircleStop, ClipboardList, Code2, FileJson2, Film, Monitor, Play, Radio, RefreshCcw, Repeat2, ShieldCheck, Sparkles, Terminal, Wifi } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import PageHeader from "../components/PageHeader.jsx";
import StatCard from "../components/StatCard.jsx";
import { projectApi } from "../services/api.js";
import { useAutomationStore } from "../store/automationStore.js";
import { useAuthStore } from "../store/authStore.js";
import { useBugStore } from "../store/bugStore.js";
import { buildBugReportPrompt, createTestReport, generateBugReportFromFailedTest, summarizeTestResult } from "../utils/aiAssistant.js";
import { formatDate } from "../utils/format.js";
import hasPermission from "../utils/hasPermission.js";

function statusClass(status) {
  if (status === "passed") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "failed") return "border-red-200 bg-red-50 text-red-700";
  if (status === "running") return "border-blue-200 bg-blue-50 text-blue-700";
  return "border-line bg-slate-50 text-slate-600";
}

function ArtifactLink({ href, icon: Icon, label }) {
  return (
    <a
      className="inline-flex items-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-brand hover:text-brand dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
      href={href}
      target="_blank"
      rel="noreferrer"
      title={label}
    >
      <Icon size={15} />
      {label}
    </a>
  );
}

function FailedArtifactPanel({ artifacts }) {
  if (!artifacts) return null;

  return (
    <div className="mt-4 rounded-md border border-red-100 bg-red-50/60 p-3 dark:border-red-900/60 dark:bg-red-950/20">
      <div className="flex flex-wrap gap-2">
        {artifacts.screenshot ? <ArtifactLink href={artifacts.screenshot} icon={Camera} label="Screenshot" /> : null}
        {artifacts.videoRecording ? <ArtifactLink href={artifacts.videoRecording} icon={Film} label="Video Recording" /> : null}
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <div className="rounded-md border border-line bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase text-red-600">
            <Terminal size={14} />
            Console Errors
          </div>
          <pre className="max-h-32 overflow-auto whitespace-pre-wrap break-words font-mono text-xs leading-5 text-slate-700 dark:text-slate-200">
            {(artifacts.consoleErrors || []).join("\n") || "No console errors captured."}
          </pre>
        </div>

        <div className="rounded-md border border-line bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
            <Wifi size={14} />
            Network Logs
          </div>
          <div className="max-h-32 space-y-2 overflow-auto font-mono text-xs text-slate-700 dark:text-slate-200">
            {(artifacts.networkLogs || []).map((entry, index) => (
              <div key={`${entry.method}-${entry.url}-${index}`} className="grid grid-cols-[44px_48px_1fr] gap-2">
                <span className="font-bold">{entry.method}</span>
                <span className={entry.status >= 400 ? "text-red-600" : "text-emerald-600"}>{entry.status}</span>
                <span className="min-w-0 truncate" title={entry.error ? `${entry.url} - ${entry.error}` : entry.url}>
                  {entry.url} {entry.duration ? `(${entry.duration}ms)` : ""}
                </span>
              </div>
            ))}
            {(artifacts.networkLogs || []).length === 0 ? <p>No network logs captured.</p> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function getApiErrorMessage(error, fallback) {
  return error.response?.data?.message || error.message || fallback;
}

function normalizeProject(project) {
  return {
    ...project,
    id: project.id || project._id,
    name: project.name || project.projectName,
  };
}

const automationTabs = [
  { id: "bug-report", label: "AI Bug Report Generator", icon: FileJson2 },
  { id: "test-cases", label: "AI Test Case Generator", icon: ClipboardList },
  { id: "result-summary", label: "AI test result summary", icon: Bot },
];

export default function Automation() {
  const { pathname } = useLocation();
  const addBug = useBugStore((state) => state.addBug);
  const bugs = useBugStore((state) => state.bugs);
  const fallbackProjects = useBugStore((state) => state.projects);
  const users = useBugStore((state) => state.users);
  const user = useAuthStore((state) => state.user);
  const canRunAutomation = hasPermission(user, "automation.run");
  const canGenerateTestCases = hasPermission(user, "automation.generate-test-cases");
  const canGenerateBug = hasPermission(user, "automation.generate-bug");
  const canCreateBug = hasPermission(user, "bugs.create");
  const initialTab = pathname === "/test-cases" ? "test-cases" : pathname === "/test-execution" ? "result-summary" : "bug-report";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [aiCases, setAiCases] = useState([]);
  const [bugReportJson, setBugReportJson] = useState(null);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [startingMode, setStartingMode] = useState("");
  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      feature: "Login Page",
      websiteUrl: "https://staging.portal.acme.dev/login",
    },
  });
  const {
    register: registerBugReport,
    handleSubmit: handleBugReportSubmit,
    reset: resetBugReport,
  } = useForm({
    defaultValues: {
      testCaseTitle: "Create bug report should preserve screenshot metadata",
      expectedResult: "A bug is created with the uploaded screenshot filename attached.",
      actualResult: "The bug is created, but screenshot metadata is empty.",
      errorMessage: "AssertionError: expected screenshot to equal check-create-bug-evidence.png",
      consoleLogs: "POST /api/bugs 201; payload.screenshot undefined",
      screenshotUrl: "https://staging.portal.acme.dev/screenshots/check-create-bug.png",
      pageUrl: "https://staging.portal.acme.dev/bugs/create",
    },
  });
  const activeRun = useAutomationStore((state) => state.activeRun);
  const history = useAutomationStore((state) => state.history);
  const liveEnabled = useAutomationStore((state) => state.liveEnabled);
  const startRun = useAutomationStore((state) => state.startRun);
  const loadRuns = useAutomationStore((state) => state.loadRuns);
  const stopRun = useAutomationStore((state) => state.stopRun);
  const toggleLive = useAutomationStore((state) => state.toggleLive);
  const running = activeRun?.status === "running" || activeRun?.status === "queued";
  const latest = activeRun || history[0];
  const selectedProject = projects.find((project) => project.id === selectedProjectId) || projects[0];
  const generatedCases = bugs.flatMap((bug) => [
    {
      id: `${bug.id}-api`,
      suite: "API Testing",
      title: `${bug.ticketId} API consistency`,
      project: bug.project,
      priority: bug.priority,
      expected: "API response, stored ticket state, and audit log remain consistent.",
    },
    {
      id: `${bug.id}-ui`,
      suite: "UI Testing",
      title: `${bug.ticketId} user workflow`,
      project: bug.project,
      priority: bug.priority,
      expected: "User can reproduce, update, and review the ticket without broken UI state.",
    },
    {
      id: `${bug.id}-regression`,
      suite: "Regression Testing",
      title: `${bug.ticketId} regression guard`,
      project: bug.project,
      priority: bug.priority,
      expected: "Existing fixed behavior remains stable after new changes.",
    },
  ]);
  const coverage = latest
    ? {
        total: latest.checks.length,
        api: latest.checks.filter((check) => check.type === "API").length,
        ui: latest.checks.filter((check) => check.type === "UI").length,
        regression: latest.checks.filter((check) => check.type === "Regression").length,
        coveredProjects: new Set(latest.checks.map((check) => check.owner)).size,
        passed: latest.summary.passed,
      }
    : { total: 0, api: 0, ui: 0, regression: 0, coveredProjects: 0, passed: 0 };
  const coveragePercent = coverage.total ? Math.round((coverage.passed / coverage.total) * 100) : 0;
  useEffect(() => {
    let active = true;

    async function loadProjects() {
      try {
        setLoadingProjects(true);
        const response = await projectApi.list();
        const nextProjects = (response.data?.result || []).map(normalizeProject);

        if (active) {
          setProjects(nextProjects);
          setSelectedProjectId((current) => current || nextProjects[0]?.id || "");
        }
      } catch (error) {
        if (active) {
          toast.error(getApiErrorMessage(error, "Unable to load projects for automation"));
          setProjects([]);
        }
      } finally {
        if (active) setLoadingProjects(false);
      }
    }

    loadProjects();
    loadRuns().catch(() => {});

    return () => {
      active = false;
    };
  }, [loadRuns]);

  const handleStartRun = async (mode) => {
    if (!canRunAutomation || !selectedProject) return;

    try {
      setStartingMode(mode);
      await startRun(mode, { projectId: selectedProject.id });
      toast.success(`${mode === "full" ? "Full" : mode.toUpperCase()} automation run started`);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to start automation run"));
    } finally {
      setStartingMode("");
    }
  };

  const handleStopRun = async () => {
    try {
      await stopRun();
      toast.success("Automation run stopped");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to stop automation run"));
    }
  };

  const onGenerateCases = (values) => {
    if (!canGenerateTestCases) return;

    const feature = values.feature || "Feature";
    setAiCases([
      {
        id: `ai-${Date.now()}-1`,
        suite: "UI Testing",
        title: `Verify ${feature} with valid input`,
        project: values.websiteUrl || "Website",
        priority: "High",
        expected: "User completes the main workflow successfully.",
      },
      {
        id: `ai-${Date.now()}-2`,
        suite: "UI Testing",
        title: `Verify ${feature} required field validation`,
        project: values.websiteUrl || "Website",
        priority: "Medium",
        expected: "Required fields show validation messages and block submission.",
      },
      {
        id: `ai-${Date.now()}-3`,
        suite: "API Testing",
        title: `Verify ${feature} API contract and error response`,
        project: values.apiDetails || "API",
        priority: "High",
        expected: "API returns expected status, schema, and error messages.",
      },
      {
        id: `ai-${Date.now()}-4`,
        suite: "Regression Testing",
        title: `Verify ${feature} does not break existing flows`,
        project: values.userStory || "Regression",
        priority: "Medium",
        expected: "Existing linked workflows remain stable after the change.",
      },
      {
        id: `ai-${Date.now()}-5`,
        suite: "UI Testing",
        title: `Verify ${feature} responsive design on mobile`,
        project: values.websiteUrl || "Website",
        priority: "Low",
        expected: "Layout, controls, and text remain usable on mobile widths.",
      },
    ]);
    reset(values);
  };

  const onGenerateBugReport = (values) => {
    if (!canGenerateBug) return;

    const report = generateBugReportFromFailedTest(values);
    setBugReportJson({
      prompt: buildBugReportPrompt(values),
      bugReport: report,
    });
    resetBugReport(values);
  };

  const onCreateGeneratedBug = () => {
    if (!bugReportJson?.bugReport || !canCreateBug) return;
    const report = bugReportJson.bugReport;
    const firstProject = fallbackProjects[0];
    const firstDeveloper = users.find((user) => user.role === "developer") || users[0];

    addBug({
      title: report.bugTitle,
      description: report.description,
      stepsToReproduce: report.stepsToReproduce,
      expectedResult: report.expectedResult,
      actualResult: report.actualResult,
      severity: report.severity,
      priority: report.priority,
      possibleRootCause: report.possibleRootCause,
      suggestedFix: report.suggestedFix,
      project: firstProject?.name || firstProject?.projectName || "Automation",
      assignedTo: firstDeveloper?.fullname || firstDeveloper?.name || "QA Owner",
      reporter: "AI Automation",
      status: "Open",
      type: "Bug",
      screenshot: report.evidence.screenshotUrl,
      testCaseReference: report.bugTitle,
      createdByAI: true,
    });
  };

  return (
    <>
      <PageHeader
        title="AI Automation"
        description="Run end-to-end system checks, detect failures, create bug tickets, and watch progress update live."
        action={
          <div className="flex flex-wrap gap-2">
            <button className="btn-muted" type="button" onClick={toggleLive}>
              <Radio size={17} />
              {liveEnabled ? "Live on" : "Live off"}
            </button>
            {canRunAutomation && running ? (
              <button className="btn-muted" type="button" onClick={handleStopRun}>
                <CircleStop size={17} />
                Stop
              </button>
            ) : canRunAutomation ? (
              <button className="btn-primary" type="button" onClick={() => handleStartRun("full")} disabled={loadingProjects || !selectedProject || Boolean(startingMode)}>
                <Play size={17} />
                {startingMode === "full" ? "Starting..." : "Run Automated Tests"}
              </button>
            ) : null}
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Checks Passed" value={latest?.summary.passed || 0} icon={ShieldCheck} tone="emerald" helper="Successful workflow checks" />
        <StatCard label="Bugs Created" value={latest?.summary.created || 0} icon={Bot} tone="red" helper="AI-created defect tickets" />
        <StatCard label="Run Progress" value={`${latest?.progress || 0}%`} icon={RefreshCcw} tone="blue" helper={latest?.status || "No run started"} />
      </div>

      {canRunAutomation ? (
      <section className="surface mt-5 rounded-md p-5">
        <div className="mb-4 flex items-center gap-2">
          <Play size={19} />
          <h2 className="font-bold">Test execution</h2>
        </div>
        <label className="mb-4 block max-w-xl">
          <span className="label">Project</span>
          <select
            className="input mt-1"
            value={selectedProjectId}
            onChange={(event) => setSelectedProjectId(event.target.value)}
            disabled={loadingProjects || running || projects.length === 0}
          >
            {loadingProjects ? <option value="">Loading projects...</option> : null}
            {!loadingProjects && projects.length === 0 ? <option value="">No backend projects found</option> : null}
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </label>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <button className="btn-primary justify-start" type="button" onClick={() => handleStartRun("full")} disabled={running || loadingProjects || !selectedProject || Boolean(startingMode)}>
            <Play size={17} />
            {startingMode === "full" ? "Starting..." : "Run Automated Tests"}
          </button>
          <button className="btn-muted justify-start" type="button" onClick={() => handleStartRun("api")} disabled={running || loadingProjects || !selectedProject || Boolean(startingMode)}>
            <Code2 size={17} />
            API Testing
          </button>
          <button className="btn-muted justify-start" type="button" onClick={() => handleStartRun("ui")} disabled={running || loadingProjects || !selectedProject || Boolean(startingMode)}>
            <Monitor size={17} />
            UI Testing
          </button>
          <button className="btn-muted justify-start" type="button" onClick={() => handleStartRun("regression")} disabled={running || loadingProjects || !selectedProject || Boolean(startingMode)}>
            <Repeat2 size={17} />
            Regression Testing
          </button>
        </div>
      </section>
      ) : null}

      <section className="surface mt-5 rounded-md p-5">
        <div className="flex gap-2 overflow-x-auto border-b border-line pb-3 dark:border-slate-700" role="tablist" aria-label="AI automation tools">
          {automationTabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                className={`btn whitespace-nowrap border ${active ? "border-brand bg-brand text-white" : "border-line bg-white text-ink hover:bg-mist dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"}`}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={17} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="pt-5">
          {activeTab === "bug-report" ? (
            canGenerateBug ? (
              <div className="grid gap-5 xl:grid-cols-[1fr_440px]" role="tabpanel">
                <form className="grid gap-4 md:grid-cols-2" onSubmit={handleBugReportSubmit(onGenerateBugReport)}>
                  <label className="block md:col-span-2">
                    <span className="label">Test Case</span>
                    <input className="input mt-1" {...registerBugReport("testCaseTitle", { required: true })} />
                  </label>
                  <label className="block">
                    <span className="label">Expected Result</span>
                    <textarea className="input mt-1 min-h-28 resize-y" {...registerBugReport("expectedResult")} />
                  </label>
                  <label className="block">
                    <span className="label">Actual Result</span>
                    <textarea className="input mt-1 min-h-28 resize-y" {...registerBugReport("actualResult", { required: true })} />
                  </label>
                  <label className="block md:col-span-2">
                    <span className="label">Error Message</span>
                    <input className="input mt-1" {...registerBugReport("errorMessage")} />
                  </label>
                  <label className="block md:col-span-2">
                    <span className="label">Console Logs</span>
                    <textarea className="input mt-1 min-h-24 resize-y font-mono text-xs" {...registerBugReport("consoleLogs")} />
                  </label>
                  <label className="block">
                    <span className="label">Screenshot URL</span>
                    <input className="input mt-1" type="url" {...registerBugReport("screenshotUrl")} />
                  </label>
                  <label className="block">
                    <span className="label">Page URL</span>
                    <input className="input mt-1" type="url" {...registerBugReport("pageUrl")} />
                  </label>
                  <button className="btn-primary w-fit" type="submit">
                    <Sparkles size={17} />
                    Generate Bug Report
                  </button>
                </form>
                <aside className="space-y-3">
                  <label className="block">
                    <span className="label">JSON Output</span>
                    <textarea
                      className="input mt-1 min-h-80 resize-y font-mono text-xs"
                      readOnly
                      value={bugReportJson ? JSON.stringify(bugReportJson.bugReport, null, 2) : "Generate a failed-test bug report to see JSON output."}
                    />
                  </label>
                  <button className="btn-muted w-full" type="button" onClick={onCreateGeneratedBug} disabled={!bugReportJson || !canCreateBug}>
                    <Bot size={17} />
                    Create Bug From JSON
                  </button>
                </aside>
              </div>
            ) : (
              <p className="text-sm text-slate-500" role="tabpanel">You do not have permission to generate AI bug reports.</p>
            )
          ) : null}

          {activeTab === "test-cases" ? (
            canGenerateTestCases ? (
              <div role="tabpanel">
                <form className="mb-5 grid gap-4 lg:grid-cols-2" onSubmit={handleSubmit(onGenerateCases)}>
                  <label className="block lg:col-span-2">
                    <span className="label">Requirement document</span>
                    <textarea className="input mt-1 min-h-24 resize-y" placeholder="Paste requirement document or acceptance criteria" {...register("requirementDocument")} />
                  </label>
                  <label className="block">
                    <span className="label">Feature description</span>
                    <input className="input mt-1" {...register("feature", { required: true })} />
                  </label>
                  <label className="block">
                    <span className="label">User story</span>
                    <input className="input mt-1" placeholder="As a user, I want..." {...register("userStory")} />
                  </label>
                  <label className="block">
                    <span className="label">API details</span>
                    <input className="input mt-1" placeholder="POST /api/auth/login" {...register("apiDetails")} />
                  </label>
                  <label className="block">
                    <span className="label">Website URL</span>
                    <input className="input mt-1" type="url" {...register("websiteUrl")} />
                  </label>
                  <button className="btn-primary w-fit" type="submit">
                    <Sparkles size={17} />
                    Generate Test Cases
                  </button>
                </form>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[820px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Suite</th>
                        <th className="px-4 py-3 font-semibold">Test Case</th>
                        <th className="px-4 py-3 font-semibold">Project</th>
                        <th className="px-4 py-3 font-semibold">Priority</th>
                        <th className="px-4 py-3 font-semibold">Expected Result</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line dark:divide-slate-700">
                      {[...aiCases, ...generatedCases].slice(0, 16).map((test) => (
                        <tr key={test.id}>
                          <td className="px-4 py-4 font-semibold">{test.suite}</td>
                          <td className="px-4 py-4 text-slate-600 dark:text-slate-300">{test.title}</td>
                          <td className="px-4 py-4 text-slate-600 dark:text-slate-300">{test.project}</td>
                          <td className="px-4 py-4 text-slate-600 dark:text-slate-300">{test.priority}</td>
                          <td className="px-4 py-4 text-slate-600 dark:text-slate-300">{test.expected}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500" role="tabpanel">You do not have permission to generate AI test cases.</p>
            )
          ) : null}

          {activeTab === "result-summary" ? (
            <div className="grid gap-5 xl:grid-cols-[1fr_420px]" role="tabpanel">
              <div>
                <p className="rounded-md bg-slate-50 p-3 text-sm leading-6 text-slate-700">{summarizeTestResult(latest)}</p>
                <label className="mt-4 block">
                  <span className="label">Automatic test report</span>
                  <textarea className="input mt-1 min-h-56 resize-y font-mono text-xs" readOnly value={createTestReport(latest)} />
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                <StatCard label="Coverage" value={`${coveragePercent}%`} icon={ShieldCheck} tone="emerald" helper="Passed checks in latest run" />
                <StatCard label="API Tests" value={coverage.api} icon={Code2} helper="API checks included" />
                <StatCard label="UI Tests" value={coverage.ui} icon={Monitor} tone="amber" helper="UI checks included" />
                <StatCard label="Regression Tests" value={coverage.regression} icon={Repeat2} tone="red" helper="Regression checks included" />
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section className="surface mt-5 rounded-md p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-bold">Live run</h2>
            <p className="mt-1 text-sm text-slate-500">Checks update one by one and failed checks create Open bug reports.</p>
          </div>
          {canRunAutomation ? (
            <button className="btn-muted" type="button" onClick={() => handleStartRun("smoke")} disabled={running || loadingProjects || !selectedProject || Boolean(startingMode)}>
              <Sparkles size={17} />
              Smoke run
            </button>
          ) : null}
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-brand transition-all duration-500" style={{ width: `${latest?.progress || 0}%` }} />
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {(latest?.checks || []).map((check) => (
            <article key={check.id} className="rounded-md border border-line bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{check.name}</h3>
                  <p className="mt-1 text-xs text-slate-500">{check.type} - {check.target}</p>
                </div>
                <span className={`rounded-md border px-2 py-1 text-xs font-semibold capitalize ${statusClass(check.status)}`}>
                  {check.status}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">{check.evidence || "Waiting for the runner to reach this workflow."}</p>
              {check.status === "failed" ? <FailedArtifactPanel artifacts={check.artifacts} /> : null}
            </article>
          ))}
          {!latest ? <p className="text-sm text-slate-500">Start a run to see live workflow checks.</p> : null}
        </div>
      </section>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_360px]">
        <section className="surface rounded-md p-5">
          <h2 className="font-bold">Live updates</h2>
          <div className="mt-4 space-y-3">
            {(latest?.events || []).map((event) => (
              <div key={event.id} className="rounded-md border border-line bg-white p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold">{event.title}</p>
                  <span className={`rounded-md border px-2 py-1 text-xs font-semibold ${statusClass(event.type)}`}>{event.type}</span>
                </div>
                <p className="mt-2 text-sm text-slate-600">{event.message}</p>
              </div>
            ))}
            {!latest ? <p className="text-sm text-slate-500">No live updates yet.</p> : null}
          </div>
        </section>
        <aside className="surface h-fit rounded-md p-5">
          <h2 className="font-bold">Run history</h2>
          <div className="mt-4 space-y-3">
            {history.map((run) => (
              <div key={run.id} className="rounded-md border border-line bg-white p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-semibold capitalize">{run.mode} run</span>
                  <span className={`rounded-md border px-2 py-1 text-xs font-semibold ${statusClass(run.status)}`}>{run.status}</span>
                </div>
                <p className="mt-2 text-slate-500">{formatDate(run.startedAt)}</p>
                <p className="mt-1 text-slate-600">{run.summary.passed} passed, {run.summary.failed} failed, {run.summary.created} created</p>
              </div>
            ))}
            {history.length === 0 ? <p className="text-sm text-slate-500">Completed runs will appear here.</p> : null}
          </div>
        </aside>
      </div>
    </>
  );
}
