import { Bug, CheckCircle2, ClipboardList, FolderKanban, FolderOpen, Plus, ShieldCheck, Users, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import BugTable from "../components/BugTable.jsx";
import PageHeader from "../components/PageHeader.jsx";
import StatCard from "../components/StatCard.jsx";
import { automationApi, bugApi, projectApi, testCaseApi, testRunApi, userApi } from "../services/api.js";
import { useAuthStore } from "../store/authStore.js";
import { useBugStore } from "../store/bugStore.js";
import { useAutomationStore } from "../store/automationStore.js";
import { normalizeBug, normalizeProject, normalizeUser } from "../utils/apiNormalizers.js";
import hasPermission from "../utils/hasPermission.js";

function getTimeGreeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getList(payload) {
  const result = payload?.data?.result ?? payload?.result ?? payload?.data ?? payload;
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.items)) return result.items;
  if (Array.isArray(result?.docs)) return result.docs;
  if (Array.isArray(result?.data)) return result.data;
  if (Array.isArray(result?.results)) return result.results;
  return [];
}

function normalizeRun(run = {}) {
  const checks = run.checks || run.results || [];
  const passed = run.summary?.passed ?? run.passed ?? checks.filter((item) => item.status === "passed" || item.status === "Passed").length;
  const failed = run.summary?.failed ?? run.failed ?? checks.filter((item) => item.status === "failed" || item.status === "Failed").length;
  const created = run.summary?.created ?? run.created ?? run.bugsCreated ?? 0;

  return {
    ...run,
    id: run.id || run._id || run.runId || `run-${run.startedAt || run.createdAt || Date.now()}`,
    mode: run.mode || run.type || "automation",
    status: run.status || "completed",
    progress: run.progress ?? (checks.length ? Math.round(((passed + failed) / checks.length) * 100) : 100),
    startedAt: run.startedAt || run.createdAt || run.date || new Date().toISOString(),
    summary: { passed, failed, created },
  };
}

function normalizeTestResult(result = {}) {
  return {
    ...result,
    id: result.id || result._id || result.runId,
    status: String(result.status || result.result || result.outcome || "").toLowerCase(),
  };
}

const dashboardOwnerRoles = new Set(["qa_lead", "project_manager"]);

function normalizedText(value) {
  return String(value || "").trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function getUserRole(user = {}) {
  if (typeof user.role === "object") {
    return normalizedText(user.role.key || user.role.name || user.role.label);
  }

  return normalizedText(user.role);
}

function isDashboardOwner(user = {}) {
  const role = getUserRole(user);
  const designation = normalizedText(user.designation);

  return dashboardOwnerRoles.has(role) || dashboardOwnerRoles.has(designation);
}

function getUserNames(users) {
  return new Set(
    users.flatMap((user) =>
      [user.fullname, user.fullName, user.name, user.email]
        .filter(Boolean)
        .map((value) => String(value).trim().toLowerCase()),
    ),
  );
}

function isOwnedByDashboardOwner(project = {}, ownerNames) {
  const createdBy = project.createdBy || {};
  const ownerUser = typeof project.owner === "object" ? project.owner : createdBy;

  if (isDashboardOwner(ownerUser)) return true;

  const ownerValues = [
    project.owner,
    createdBy.fullname,
    createdBy.fullName,
    createdBy.name,
    createdBy.email,
  ]
    .filter((value) => typeof value === "string")
    .map((value) => value.trim().toLowerCase());

  return ownerValues.some((value) => ownerNames.has(value));
}

export default function Dashboard() {
  const fallbackBugs = useBugStore((state) => state.bugs);
  const fallbackUsers = useBugStore((state) => state.users);
  const fallbackProjects = useBugStore((state) => state.projects);
  const fallbackHistory = useAutomationStore((state) => state.history);
  const fallbackActiveRun = useAutomationStore((state) => state.activeRun);
  const user = useAuthStore((state) => state.user);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    bugs: [],
    users: [],
    projects: [],
    testCases: [],
    testResults: [],
    runs: [],
  });
  const [loadedSources, setLoadedSources] = useState({
    bugs: false,
    users: false,
    projects: false,
    testCases: false,
    testResults: false,
    runs: false,
  });
  const canCreateBug = hasPermission(user, "bugs.create");
  const canUpdateBug = hasPermission(user, "bugs.update");
  const now = new Date();
  const userName = user?.fullname || user?.fullName || user?.name || user?.email || "there";
  const dashboardTitle = `${getTimeGreeting(now)}, ${userName}`;
  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setLoading(true);

      const requests = await Promise.allSettled([
        bugApi.list(),
        userApi.list(),
        projectApi.list(),
        testCaseApi.list(),
        testRunApi.results(),
        automationApi.listRuns(),
      ]);

      if (!active) return;

      const [bugsResponse, usersResponse, projectsResponse, testCasesResponse, testResultsResponse, runsResponse] = requests;
      const failed = requests.some((request) => request.status === "rejected");

      setDashboardData({
        bugs: bugsResponse.status === "fulfilled" ? getList(bugsResponse.value).map(normalizeBug) : fallbackBugs,
        users: usersResponse.status === "fulfilled" ? getList(usersResponse.value).map(normalizeUser) : fallbackUsers,
        projects: projectsResponse.status === "fulfilled" ? getList(projectsResponse.value).map(normalizeProject) : fallbackProjects,
        testCases: testCasesResponse.status === "fulfilled" ? getList(testCasesResponse.value) : [],
        testResults: testResultsResponse.status === "fulfilled" ? getList(testResultsResponse.value).map(normalizeTestResult) : [],
        runs: runsResponse.status === "fulfilled" ? getList(runsResponse.value).map(normalizeRun) : [],
      });
      setLoadedSources({
        bugs: bugsResponse.status === "fulfilled",
        users: usersResponse.status === "fulfilled",
        projects: projectsResponse.status === "fulfilled",
        testCases: testCasesResponse.status === "fulfilled",
        testResults: testResultsResponse.status === "fulfilled",
        runs: runsResponse.status === "fulfilled",
      });
      setLoading(false);

      if (failed) {
        toast.info("Dashboard loaded with available data. Some backend endpoints did not respond.");
      }
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, [fallbackBugs, fallbackProjects, fallbackUsers]);

  const bugs = loadedSources.bugs ? dashboardData.bugs : fallbackBugs;
  const users = loadedSources.users ? dashboardData.users : fallbackUsers;
  const projects = loadedSources.projects ? dashboardData.projects : fallbackProjects;
  const history = loadedSources.runs ? dashboardData.runs : fallbackHistory;
  const activeRun = fallbackActiveRun;
  const recentBugs = useMemo(
    () => [...bugs].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 5),
    [bugs],
  );
  const recentRuns = [activeRun ? normalizeRun(activeRun) : null, ...history.map(normalizeRun)].filter(Boolean).slice(0, 4);
  const fixedBug = (bug) => bug.status === "Fixed" || bug.status === "Closed";
  const totalTestCases = loadedSources.testCases
    ? dashboardData.testCases.length
    : bugs.filter((bug) => bug.testCaseId || bug.testCaseReference).length || bugs.length * 3;
  const resultCounts = dashboardData.testResults.reduce(
    (total, result) => ({
      passed: total.passed + (result.status === "passed" || result.status === "pass" ? 1 : 0),
      failed: total.failed + (result.status === "failed" || result.status === "fail" ? 1 : 0),
    }),
    { passed: 0, failed: 0 },
  );
  const passedTests = loadedSources.testResults ? resultCounts.passed : recentRuns.reduce((total, run) => total + run.summary.passed, 0);
  const failedTests = loadedSources.testResults ? resultCounts.failed : recentRuns.reduce((total, run) => total + run.summary.failed, 0);
  const canSeeOwnerCards = isDashboardOwner(user);
  const dashboardOwners = users.filter(isDashboardOwner);
  const dashboardOwnerNames = getUserNames(dashboardOwners);
  const dashboardProjects = projects.filter((project) => isOwnedByDashboardOwner(project, dashboardOwnerNames));
  const updateBugStatus = async (id, status) => {
    if (!canUpdateBug) {
      toast.error("You do not have permission to update bugs.");
      return;
    }

    const currentBug = bugs.find((bug) => bug.id === id);
    if (!currentBug) return;

    const previousBugs = dashboardData.bugs;
    setDashboardData((current) => ({
      ...current,
      bugs: bugs.map((bug) => (bug.id === id ? { ...bug, status } : bug)),
    }));

    try {
      const response = await bugApi.update(id, { ...currentBug, projectId: currentBug.projectId, assignedTo: currentBug.assignedToId, status });
      setDashboardData((current) => ({
        ...current,
        bugs: current.bugs.map((bug) => (bug.id === id ? normalizeBug(response.data?.result) : bug)),
      }));
      toast.success(response.data?.message || "Bug updated successfully");
    } catch (error) {
      setDashboardData((current) => ({ ...current, bugs: previousBugs }));
      toast.error(error.response?.data?.message || "Unable to update bug");
    }
  };
  const counts = {
    users: dashboardOwners.length,
    projects: dashboardProjects.length,
    bugs: bugs.length,
    fixed: bugs.filter(fixedBug).length,
    open: bugs.filter((bug) => bug.status === "Open" || bug.status === "Reopened").length,
    critical: bugs.filter((bug) => bug.priority === "Critical").length,
  };

  return (
    <>
      <PageHeader
        title={dashboardTitle}
        description={loading ? "Loading live dashboard data..." : "Live triage overview for reported defects, priority work, and release readiness."}
        action={
          canCreateBug ? (
            <Link className="btn-primary" to="/bugs/create">
              <Plus size={17} />
              Create bug
            </Link>
          ) : null
        }
      />
      <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
        {canSeeOwnerCards ? (
          <>
            <StatCard label="Total Users" value={counts.users} icon={Users} tone="blue" variant="color" viewTo="/users" />
            <StatCard label="Total Projects" value={counts.projects} icon={FolderKanban} tone="amber" variant="color" viewTo="/projects" />
          </>
        ) : null}
        <StatCard label="Total Bugs" value={counts.bugs} icon={Bug} tone="red" variant="color" viewTo="/bugs" />
        <StatCard label="Fixed Bugs" value={counts.fixed} icon={CheckCircle2} tone="emerald" variant="color" viewTo="/bugs" />
        <StatCard label="Total Test Cases" value={totalTestCases} icon={ClipboardList} tone="violet" variant="color" viewTo="/automation" />
        <StatCard label="Passed Tests" value={passedTests} icon={ShieldCheck} tone="cyan" variant="color" viewTo="/automation" />
        <StatCard label="Failed Tests" value={failedTests} icon={XCircle} tone="red" variant="color" viewTo="/automation" />
        <StatCard label="Open Bugs" value={counts.open} icon={FolderOpen} tone="amber" variant="color" viewTo="/bugs" />
        <StatCard label="Critical Bugs" value={counts.critical} icon={Bug} tone="violet" variant="color" viewTo="/bugs" />
      </div>
      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">Recent test runs</h2>
          <Link className="text-sm font-semibold text-brand" to="/automation">
            View automation
          </Link>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {recentRuns.map((run) => (
            <article key={run.id} className="surface rounded-md p-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold capitalize">{run.mode} run</p>
                <span className="rounded-md border border-line px-2 py-1 text-xs font-semibold capitalize">{run.status}</span>
              </div>
              <p className="mt-3 text-sm text-slate-600">{run.summary.passed} passed, {run.summary.failed} failed</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-brand" style={{ width: `${run.progress}%` }} />
              </div>
            </article>
          ))}
          {recentRuns.length === 0 ? <p className="text-sm text-slate-500">No test runs yet.</p> : null}
        </div>
      </section>
      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">Recent bugs</h2>
          <Link className="text-sm font-semibold text-brand" to="/bugs">
            View all
          </Link>
        </div>
        <BugTable bugs={recentBugs} loading={loading} onStatusChange={updateBugStatus} canUpdate={canUpdateBug} />
      </section>
    </>
  );
}
