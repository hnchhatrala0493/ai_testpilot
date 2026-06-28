import { Bot, CheckCircle2, Clock3, FileCode2, FileText, FolderKanban, Github, Link2, Play, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import PageHeader from "../components/PageHeader.jsx";
import { projectApi, testRunApi } from "../services/api.js";
import { useAuthStore } from "../store/authStore.js";
import hasPermission from "../utils/hasPermission.js";

const testingModes = [
  { value: "standard", label: "Standard Run" },
  { value: "smoke", label: "Smoke Run" },
  { value: "regression", label: "Regression Run" },
];

const testTypes = [
  { value: "api", label: "API Testing" },
  { value: "ui", label: "UI Testing" },
  { value: "full", label: "Full Testing" },
];

const runTabs = [
  { value: "project", label: "Project Tests" },
  { value: "specific-api", label: "Specific API" },
];

const httpMethods = ["GET", "POST", "PUT", "PATCH", "DELETE"];

const yesNoOptions = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

function normalizeProject(project) {
  return {
    ...project,
    id: project.id || project._id,
    name: project.name || project.projectName,
  };
}

function formatDuration(milliseconds) {
  if (!milliseconds || milliseconds < 0) return "0s";

  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

function getApiErrorMessage(error, fallback) {
  return error.response?.data?.message || error.message || fallback;
}

function normalizeLegacyRun(response, projectName) {
  const result = response.data?.result || {};
  const results = result.results || [];
  const completed = results.length;
  const passed = results.filter((item) => item.status === "Passed").length;
  const failed = results.filter((item) => item.status === "Failed").length;
  const skipped = results.filter((item) => item.status === "Skipped").length;
  const startedAt = new Date().toISOString();

  return {
    id: `legacy-${Date.now()}`,
    projectName,
    status: "completed",
    startedAt,
    finishedAt: startedAt,
    durationMs: results.reduce((total, item) => total + (item.executionTime || 0), 0),
    summary: {
      total: completed,
      queued: 0,
      inProgress: 0,
      completed,
      passed,
      failed,
      skipped,
      percentage: completed ? 100 : 0,
    },
    checks: results.map((item) => ({
      id: item._id,
      title: item.testCaseId?.title || "Executed test",
      type: item.testCaseId?.type || "API",
      executor: item.testCaseId?.type === "UI" ? "Playwright" : item.testCaseId?.type === "Unit" ? "Jest" : "Axios",
      status: item.status === "Failed" ? "failed" : item.status === "Skipped" ? "skipped" : "passed",
      progress: 100,
      durationMs: item.executionTime || 0,
    })),
  };
}

function SegmentedChoice({ label, name, value, options, onChange }) {
  return (
    <fieldset>
      <legend className="label">{label}</legend>
      <div className="mt-2 grid gap-2 sm:grid-cols-3">
        {options.map((option) => {
          const selected = value === option.value;

          return (
            <label
              key={option.value}
              className={`flex cursor-pointer items-center justify-center rounded-md border px-3 py-2 text-sm font-semibold transition ${
                selected
                  ? "border-brand bg-brand text-white"
                  : "border-line bg-white text-slate-600 hover:border-brand hover:text-brand dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
              }`}
            >
              <input
                className="sr-only"
                type="radio"
                name={name}
                value={option.value}
                checked={selected}
                onChange={() => onChange(option.value)}
              />
              {option.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function ToggleChoice({ label, name, value, onChange }) {
  return (
    <SegmentedChoice
      label={label}
      name={name}
      value={value}
      options={yesNoOptions}
      onChange={onChange}
    />
  );
}

export default function StartAITesting() {
  const user = useAuthStore((state) => state.user);
  const canRunAutomation = hasPermission(user, "automation.run");
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [startingRun, setStartingRun] = useState(false);
  const [activeRun, setActiveRun] = useState(null);
  const [repositoryContext, setRepositoryContext] = useState(null);
  const [repositoryStatus, setRepositoryStatus] = useState({ loading: false, error: "" });
  const [activeTab, setActiveTab] = useState("project");
  const [form, setForm] = useState({
    projectId: "",
    testingMode: "standard",
    testType: "full",
    autoCreateBug: "yes",
    generateReport: "yes",
  });
  const [specificApi, setSpecificApi] = useState({
    method: "GET",
    url: "",
    params: "",
    headers: "",
    body: "",
    expectedStatus: "200",
  });
  const [lastLaunch, setLastLaunch] = useState(null);
  const [now, setNow] = useState(Date.now());

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === form.projectId) || projects[0],
    [form.projectId, projects],
  );
  const running = activeRun?.status === "running" || activeRun?.status === "queued";
  const summary = activeRun?.summary || {};
  const totalTests = summary.total || activeRun?.checks?.length || 0;
  const completedTests = summary.completed || 0;
  const inProgressTests = summary.inProgress || 0;
  const queuedTests = summary.queued || 0;
  const progressPercent = summary.percentage || 0;
  const apiChecks = activeRun?.checks?.filter((check) => check.type === "API") || [];
  const completedApiChecks = apiChecks.filter((check) => ["passed", "failed", "skipped"].includes(check.status)).length;
  const inProgressApiChecks = apiChecks.filter((check) => check.status === "running").length;
  const elapsedMs = activeRun?.startedAt
    ? (activeRun.finishedAt ? Date.parse(activeRun.finishedAt) : now) - Date.parse(activeRun.startedAt)
    : 0;
  const timeLabel = activeRun?.status === "completed" ? "Total time taken" : "Elapsed time";

  useEffect(() => {
    let active = true;

    async function loadProjects() {
      try {
        setLoadingProjects(true);
        const response = await projectApi.list();
        const nextProjects = (response.data?.result || []).map(normalizeProject);

        if (active) {
          setProjects(nextProjects);
          setForm((current) => ({
            ...current,
            projectId: current.projectId || nextProjects[0]?.id || "",
          }));
        }
      } catch (error) {
        if (active) {
          toast.error(getApiErrorMessage(error, "Unable to load projects"));
          setProjects([]);
        }
      } finally {
        if (active) {
          setLoadingProjects(false);
        }
      }
    }

    loadProjects();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!running) return undefined;

    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, [running]);

  useEffect(() => {
    if (!form.projectId) {
      setRepositoryContext(null);
      setRepositoryStatus({ loading: false, error: "" });
      return undefined;
    }

    let active = true;

    async function loadRepositoryContext() {
      try {
        setRepositoryStatus({ loading: true, error: "" });
        const response = await projectApi.repositoryContext(form.projectId);

        if (active) {
          setRepositoryContext(response.data?.result || null);
          setRepositoryStatus({ loading: false, error: "" });
        }
      } catch (error) {
        if (active) {
          setRepositoryContext(null);
          setRepositoryStatus({
            loading: false,
            error:
              error.response?.status === 404
                ? "Repository scanner API is not available on the running backend. Restart the backend server and try again."
                : getApiErrorMessage(error, "Unable to read selected project repository"),
          });
        }
      }
    }

    loadRepositoryContext();

    return () => {
      active = false;
    };
  }, [form.projectId]);

  useEffect(() => {
    if (!activeRun?.id || !running) return undefined;

    const poll = window.setInterval(async () => {
      try {
        const response = await testRunApi.get(activeRun.id);
        setActiveRun(response.data?.result || null);
      } catch (error) {
        toast.error(getApiErrorMessage(error, "Unable to refresh testing progress"));
        window.clearInterval(poll);
      }
    }, 1500);

    return () => window.clearInterval(poll);
  }, [activeRun?.id, running]);

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const setSpecificApiField = (field, value) => {
    setSpecificApi((current) => ({ ...current, [field]: value }));
  };

  const resolveRunMode = () => {
    if (form.testType === "api") return "API";
    if (form.testType === "ui") return "UI";
    if (form.testingMode === "smoke") return "Smoke";
    if (form.testingMode === "regression") return "Regression";
    return "Full";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canRunAutomation || !selectedProject) return;
    if (activeTab === "specific-api" && !specificApi.url.trim()) {
      toast.error("API URL is required for Specific API testing");
      return;
    }

    try {
      setStartingRun(true);
      const payload = {
        projectId: selectedProject.id,
        runType: activeTab === "specific-api" ? "API" : resolveRunMode(),
        runSource: activeTab,
        specificApi: activeTab === "specific-api" ? specificApi : null,
        autoCreateBug: form.autoCreateBug === "yes",
        generateReport: form.generateReport === "yes",
        repositoryContext: repositoryContext
          ? {
              repository: repositoryContext.repository,
              summary: repositoryContext.summary,
              routeInventory: repositoryContext.routeInventory,
              groups: repositoryContext.groups?.map((group) => ({
                key: group.key,
                label: group.label,
                found: group.found,
                files: group.files?.map((file) => ({ path: file.path, size: file.size, skipped: file.skipped })) || [],
              })),
            }
          : null,
      };
      let response;

      try {
        response = await testRunApi.start(payload);
        setActiveRun(response.data?.result || null);
      } catch (startError) {
        if (startError.response?.status !== 404 && startError.response?.status !== 405) {
          throw startError;
        }

        const legacyResponse = await testRunApi.run(payload);
        setActiveRun(normalizeLegacyRun(legacyResponse, selectedProject.name));
        response = { data: { message: legacyResponse.data?.message || "Testing completed using compatibility API" } };
      }

      setLastLaunch({
        projectName: selectedProject?.name || selectedProject?.projectName || "Selected project",
        testType: testTypes.find((type) => type.value === form.testType)?.label,
        apiTarget: activeTab === "specific-api" ? `${specificApi.method} ${specificApi.url}` : "",
        testingMode: testingModes.find((mode) => mode.value === form.testingMode)?.label,
        autoCreateBug: form.autoCreateBug,
        generateReport: form.generateReport,
      });
      toast.success(response.data?.message || "Backend testing engine started");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to start backend testing engine"));
    } finally {
      setStartingRun(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Start AI Testing"
        description="Choose the project, testing coverage, and automation outputs before launching an AI test run."
      />

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <section className="surface rounded-md p-5">
          <form className="grid gap-5" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-2 rounded-md border border-line bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-950">
              {runTabs.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  className={`rounded px-3 py-2 text-sm font-semibold transition ${
                    activeTab === tab.value
                      ? "bg-white text-brand shadow-sm dark:bg-slate-900"
                      : "text-slate-600 hover:text-brand dark:text-slate-300"
                  }`}
                  onClick={() => setActiveTab(tab.value)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <label className="block">
              <span className="label">Select Project</span>
              <div className="relative mt-2">
                <FolderKanban className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <select
                  className="input appearance-none pl-10"
                  value={form.projectId}
                  onChange={(event) => setField("projectId", event.target.value)}
                  required
                  disabled={loadingProjects || projects.length === 0}
                >
                  {loadingProjects ? <option value="">Loading projects...</option> : null}
                  {!loadingProjects && projects.length === 0 ? <option value="">No projects found</option> : null}
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
            </label>

            {activeTab === "project" ? (
              <>
                <label className="block">
                  <span className="label">Select Testing Mode</span>
                  <div className="relative mt-2">
                    <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <select
                      className="input appearance-none pl-10"
                      value={form.testingMode}
                      onChange={(event) => setField("testingMode", event.target.value)}
                    >
                      {testingModes.map((mode) => (
                        <option key={mode.value} value={mode.value}>
                          {mode.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </label>

                <SegmentedChoice
                  label="Select Test Type"
                  name="testType"
                  value={form.testType}
                  options={testTypes}
                  onChange={(value) => setField("testType", value)}
                />
              </>
            ) : (
              <div className="grid gap-4">
                <div className="grid gap-4 md:grid-cols-[160px_1fr_140px]">
                  <label className="block">
                    <span className="label">Method</span>
                    <select
                      className="input mt-2"
                      value={specificApi.method}
                      onChange={(event) => setSpecificApiField("method", event.target.value)}
                    >
                      {httpMethods.map((method) => (
                        <option key={method} value={method}>
                          {method}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="label">API URL</span>
                    <div className="relative mt-2">
                      <Link2 className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        className="input pl-10"
                        type="url"
                        value={specificApi.url}
                        onChange={(event) => setSpecificApiField("url", event.target.value)}
                        placeholder="https://api.example.com/users"
                        required={activeTab === "specific-api"}
                      />
                    </div>
                  </label>

                  <label className="block">
                    <span className="label">Expected Status</span>
                    <input
                      className="input mt-2"
                      type="number"
                      min="100"
                      max="599"
                      value={specificApi.expectedStatus}
                      onChange={(event) => setSpecificApiField("expectedStatus", event.target.value)}
                    />
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="label">Params</span>
                    <textarea
                      className="input mt-2 min-h-28"
                      value={specificApi.params}
                      onChange={(event) => setSpecificApiField("params", event.target.value)}
                      placeholder={"page=1\nlimit=20"}
                    />
                  </label>
                  <label className="block">
                    <span className="label">Headers</span>
                    <textarea
                      className="input mt-2 min-h-28"
                      value={specificApi.headers}
                      onChange={(event) => setSpecificApiField("headers", event.target.value)}
                      placeholder={"Authorization=Bearer token\nContent-Type=application/json"}
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="label">Body</span>
                  <textarea
                    className="input mt-2 min-h-32 font-mono text-sm"
                    value={specificApi.body}
                    onChange={(event) => setSpecificApiField("body", event.target.value)}
                    placeholder={'{"name":"Test user"}'}
                    disabled={specificApi.method === "GET"}
                  />
                </label>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <ToggleChoice
                label="Auto Create Bug"
                name="autoCreateBug"
                value={form.autoCreateBug}
                onChange={(value) => setField("autoCreateBug", value)}
              />
              <ToggleChoice
                label="Generate Report"
                name="generateReport"
                value={form.generateReport}
                onChange={(value) => setField("generateReport", value)}
              />
            </div>

            <button className="btn-primary w-fit px-5" type="submit" disabled={!canRunAutomation || running || startingRun || loadingProjects || !selectedProject}>
              <Play size={17} />
              {startingRun ? "Starting..." : "Start Testing"}
            </button>
          </form>

          <div className="mt-6 border-t border-line pt-5 dark:border-slate-700">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <h2 className="font-bold">Testing Progress</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {activeRun ? `${completedTests} of ${totalTests} tests completed` : "No testing run started yet"}
                </p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-3xl font-bold text-brand">{progressPercent}%</p>
                <p className="text-xs font-semibold uppercase text-slate-500">Completed</p>
              </div>
            </div>

            <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div className="h-full rounded-full bg-brand transition-all duration-500" style={{ width: `${progressPercent}%` }} />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-md border border-line bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950">
                <p className="text-xs font-semibold uppercase text-slate-500">Testing completed</p>
                <p className="mt-1 text-lg font-bold text-ink dark:text-slate-100">{completedTests}/{totalTests}</p>
              </div>
              <div className="rounded-md border border-line bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950">
                <p className="text-xs font-semibold uppercase text-slate-500">In progress</p>
                <p className="mt-1 text-lg font-bold text-ink dark:text-slate-100">{inProgressTests}</p>
              </div>
              <div className="rounded-md border border-line bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950">
                <p className="text-xs font-semibold uppercase text-slate-500">Queued</p>
                <p className="mt-1 text-lg font-bold text-ink dark:text-slate-100">{queuedTests}</p>
              </div>
              <div className="rounded-md border border-line bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950">
                <p className="text-xs font-semibold uppercase text-slate-500">{timeLabel}</p>
                <p className="mt-1 flex items-center gap-2 text-lg font-bold text-ink dark:text-slate-100">
                  <Clock3 size={17} />
                  {formatDuration(elapsedMs)}
                </p>
              </div>
              <div className="rounded-md border border-line bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950">
                <p className="text-xs font-semibold uppercase text-slate-500">Run status</p>
                <p className="mt-1 text-lg font-bold capitalize text-ink dark:text-slate-100">{activeRun?.status || "Not started"}</p>
              </div>
            </div>

            <div className="mt-4 rounded-md border border-line bg-white p-3 dark:border-slate-700 dark:bg-slate-950">
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                <div>
                  <p className="font-semibold">API execution indicator</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {apiChecks.length ? `${completedApiChecks} API completed, ${inProgressApiChecks} API in progress` : "No API checks in this run"}
                  </p>
                </div>
                <span className="rounded-md border border-line px-2 py-1 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300">
                  {apiChecks.length ? `${Math.round((completedApiChecks / apiChecks.length) * 100)}% API` : "0% API"}
                </span>
              </div>
            </div>

            {activeRun?.checks?.length ? (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Test</th>
                      <th className="px-3 py-2 font-semibold">Type</th>
                      <th className="px-3 py-2 font-semibold">Tool</th>
                      <th className="px-3 py-2 font-semibold">Status</th>
                      <th className="px-3 py-2 font-semibold">Progress</th>
                      <th className="px-3 py-2 font-semibold">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line dark:divide-slate-700">
                    {activeRun.checks.map((check) => (
                      <tr key={check._id || check.id}>
                        <td className="px-3 py-3 font-semibold">{check.title}</td>
                        <td className="px-3 py-3 text-slate-600 dark:text-slate-300">{check.type}</td>
                        <td className="px-3 py-3 text-slate-600 dark:text-slate-300">{check.executor}</td>
                        <td className="px-3 py-3">
                          <span className="rounded-md border border-line px-2 py-1 text-xs font-semibold capitalize text-slate-600 dark:border-slate-700 dark:text-slate-300">
                            {check.status}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-slate-600 dark:text-slate-300">{check.progress || 0}%</td>
                        <td className="px-3 py-3 text-slate-600 dark:text-slate-300">{formatDuration(check.durationMs || 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>
        </section>

        <aside className="surface h-fit rounded-md p-5">
          <div className="flex items-center gap-2">
            <Bot size={19} />
            <h2 className="font-bold">Launch Summary</h2>
          </div>

          <div className="mt-4 space-y-3 text-sm">
            <div className="rounded-md border border-line bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950">
              <p className="font-semibold text-ink dark:text-slate-100">{selectedProject?.name || selectedProject?.projectName || "No project selected"}</p>
              <p className="mt-1 text-slate-500">Selected project</p>
            </div>

            <div className="rounded-md border border-line bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950">
              <div className="flex items-center gap-2 font-semibold text-ink dark:text-slate-100">
                <Github size={16} />
                Repository Read
              </div>
              {repositoryStatus.loading ? (
                <p className="mt-2 text-slate-500">Reading project repository...</p>
              ) : repositoryStatus.error ? (
                <p className="mt-2 text-amber-600 dark:text-amber-300">{repositoryStatus.error}</p>
              ) : repositoryContext ? (
                <div className="mt-2 space-y-2">
                  <p className="text-slate-600 dark:text-slate-300">
                    {repositoryContext.repository?.fullName} - {repositoryContext.summary?.foundGroups}/{repositoryContext.summary?.totalGroups} targets found
                  </p>
                  <p className="text-xs font-semibold text-brand">
                    {repositoryContext.routeInventory?.count || 0} API routes discovered
                  </p>
                  {repositoryContext.routeInventory?.routes?.length ? (
                    <div className="max-h-36 overflow-auto rounded-md border border-line bg-white dark:border-slate-700 dark:bg-slate-900">
                      {repositoryContext.routeInventory.routes.slice(0, 12).map((route, index) => (
                        <div key={`${route.method}-${route.path}-${route.file}-${index}`} className="flex gap-2 border-b border-line px-2 py-1 text-xs last:border-b-0 dark:border-slate-700">
                          <span className="w-12 shrink-0 font-bold text-slate-700 dark:text-slate-200">{route.method}</span>
                          <span className="min-w-0 flex-1 truncate text-slate-600 dark:text-slate-300">{route.path}</span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <div className="grid gap-2">
                    {repositoryContext.groups?.map((group) => (
                      <div key={group.key} className="flex items-center justify-between gap-2 text-xs">
                        <span className="flex min-w-0 items-center gap-2 text-slate-600 dark:text-slate-300">
                          <FileCode2 size={14} className="shrink-0" />
                          <span className="truncate">{group.label}</span>
                        </span>
                        <span className={`shrink-0 font-semibold ${group.found ? "text-emerald-600 dark:text-emerald-300" : "text-slate-400"}`}>
                          {group.found ? `${group.files?.length || 0} files` : "Missing"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-slate-500">Select a project with a GitHub URL.</p>
              )}
            </div>

            <div className="grid gap-3">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <ShieldCheck size={16} />
                {activeTab === "specific-api" ? "Specific API" : testTypes.find((type) => type.value === form.testType)?.label}
              </div>
              {activeTab === "specific-api" ? (
                <div className="flex min-w-0 items-center gap-2 text-slate-600 dark:text-slate-300">
                  <Link2 size={16} className="shrink-0" />
                  <span className="truncate">{specificApi.method} {specificApi.url || "No API URL"}</span>
                </div>
              ) : null}
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <CheckCircle2 size={16} />
                Auto create bug: {form.autoCreateBug === "yes" ? "Yes" : "No"}
              </div>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <FileText size={16} />
                Generate report: {form.generateReport === "yes" ? "Yes" : "No"}
              </div>
            </div>

            {lastLaunch ? (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
                <p className="font-semibold">Testing started for {lastLaunch.projectName}.</p>
                <p className="mt-1">
                  {lastLaunch.apiTarget || `${lastLaunch.testingMode} with ${lastLaunch.testType}`} is running.
                </p>
              </div>
            ) : null}

            {!canRunAutomation ? (
              <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
                You do not have permission to start AI testing.
              </p>
            ) : null}
          </div>
        </aside>
      </div>
    </>
  );
}
