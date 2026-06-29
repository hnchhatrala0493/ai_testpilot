import { create } from "zustand";
import { automationApi } from "../services/api.js";
import { useAuditStore } from "./auditStore.js";

let pollTimer = null;

function clearRunPoll() {
  if (pollTimer) {
    window.clearInterval(pollTimer);
    pollTimer = null;
  }
}

function normalizeCheck(check = {}) {
  const id = check.id || check._id || check.testCaseId?._id || check.testCaseId || check.title;
  const title = check.name || check.title || check.testCaseId?.title || "Automation check";
  const failedArtifacts =
    check.status === "failed"
      ? {
          screenshot: check.screenshot,
          videoRecording: check.videoRecording,
          consoleErrors: check.consoleErrors || [],
          networkLogs: check.networkLogs || [],
          traceUrl: check.traceUrl,
        }
      : null;

  return {
    ...check,
    id,
    name: title,
    title,
    target: check.target || check.testCaseId?.title || "Configured target",
    type: check.type || check.testCaseId?.type || "API",
    owner: check.owner || check.projectName || "Automation",
    risk: check.risk || check.priority || "Medium",
    status: check.status || "queued",
    progress: check.progress || 0,
    evidence: check.evidence || check.actualResult || check.errorMessage || check.expectedResult || "",
    artifacts: failedArtifacts,
  };
}

function buildEvents(run, checks) {
  const startedAt = run.startedAt || run.createdAt || new Date().toISOString();
  const events = [
    {
      id: `${run.id}-started`,
      type: "info",
      title: "AI automation run started",
      message: `${run.runType || "Full"} coverage is checking selected workflows.`,
      createdAt: startedAt,
    },
  ];

  checks
    .filter((check) => ["passed", "failed", "skipped"].includes(check.status))
    .forEach((check) => {
      events.unshift({
        id: `${run.id}-${check.id}-${check.status}`,
        type: check.status,
        title: `${check.name} ${check.status}`,
        message: check.evidence || `${check.name} finished with status ${check.status}.`,
        createdAt: check.finishedAt || run.updatedAt || startedAt,
      });
    });

  if (run.status === "stopped") {
    events.unshift({
      id: `${run.id}-stopped`,
      type: "info",
      title: "Run stopped",
      message: "Live automation was stopped by the user.",
      createdAt: run.finishedAt || new Date().toISOString(),
    });
  }

  return events;
}

function normalizeRun(run = {}) {
  const id = run.id || run._id || run.runId;
  const checks = (run.checks || []).map(normalizeCheck);
  const passed = run.summary?.passed ?? checks.filter((check) => check.status === "passed").length;
  const failed = run.summary?.failed ?? checks.filter((check) => check.status === "failed").length;
  const skipped = run.summary?.skipped ?? checks.filter((check) => check.status === "skipped").length;
  const completed = run.summary?.completed ?? passed + failed + skipped;
  const created = run.summary?.created ?? checks.filter((check) => check.bugId).length;
  const total = run.summary?.total ?? checks.length;
  const progress = run.summary?.percentage ?? (total ? Math.round((completed / total) * 100) : 0);
  const normalized = {
    ...run,
    id,
    mode: String(run.runType || run.mode || "full").toLowerCase(),
    status: run.status || "queued",
    progress,
    startedAt: run.startedAt || run.createdAt || new Date().toISOString(),
    finishedAt: run.finishedAt || "",
    checks,
    summary: {
      ...run.summary,
      total,
      completed,
      passed,
      failed,
      skipped,
      created,
      percentage: progress,
    },
  };

  return {
    ...normalized,
    events: buildEvents(normalized, checks),
  };
}

function resolveRunType(mode) {
  const value = String(mode || "full").toLowerCase();
  if (value === "api") return "API";
  if (value === "ui") return "UI";
  if (value === "regression") return "Regression";
  if (value === "unit") return "Unit";
  if (value === "smoke") return "Smoke";
  return "Full";
}

function startPolling(runId, set, get) {
  clearRunPoll();

  pollTimer = window.setInterval(async () => {
    try {
      const response = await automationApi.getRun(runId);
      const run = normalizeRun(response.data?.result || {});
      const done = ["completed", "failed", "stopped"].includes(run.status);

      set((state) => ({
        activeRun: run,
        history: done ? [run, ...state.history.filter((item) => item.id !== run.id)].slice(0, 6) : state.history,
      }));

      if (done || !get().liveEnabled) clearRunPoll();
    } catch (_error) {
      clearRunPoll();
    }
  }, 1500);
}

export const useAutomationStore = create((set, get) => ({
  activeRun: null,
  history: [],
  liveEnabled: true,
  startRun: async (mode = "full", options = {}) => {
    const payload = {
      projectId: options.projectId,
      runType: resolveRunType(mode),
      autoCreateBug: options.autoCreateBug !== false,
      generateReport: options.generateReport !== false,
      limit: options.limit || 50,
    };
    const response = await automationApi.startRun(payload);
    const run = normalizeRun(response.data?.result || {});

    set({ activeRun: run });
    useAuditStore.getState().addLog({
      actor: "AI Automation",
      action: "Started automation run",
      module: "Automation",
      target: run.id,
      details: `${run.mode} run started.`,
      severity: "Medium",
    });

    if (get().liveEnabled) startPolling(run.id, set, get);
    return run;
  },
  loadRuns: async (params) => {
    const response = await automationApi.listRuns(params);
    const runs = (response.data?.result || []).map(normalizeRun);
    const runningRun = runs.find((run) => ["queued", "running"].includes(run.status));
    const shouldPoll = !get().activeRun && runningRun && get().liveEnabled;

    set((state) => ({
      history: runs.slice(0, 6),
      activeRun: state.activeRun || runningRun || null,
    }));

    if (shouldPoll) {
      startPolling(runningRun.id, set, get);
    }

    return runs;
  },
  stopRun: async () => {
    const state = get();
    if (!state.activeRun) return null;

    clearRunPoll();
    const response = await automationApi.stopRun(state.activeRun.id);
    const stoppedRun = normalizeRun(response.data?.result || state.activeRun);

    set((current) => ({
      activeRun: stoppedRun,
      history: [stoppedRun, ...current.history.filter((run) => run.id !== stoppedRun.id)].slice(0, 6),
    }));
    useAuditStore.getState().addLog({
      actor: "Current User",
      action: "Stopped automation run",
      module: "Automation",
      target: stoppedRun.id,
      details: "Automation run was stopped.",
      severity: "Medium",
    });

    return stoppedRun;
  },
  toggleLive: () => {
    set((state) => ({ liveEnabled: !state.liveEnabled }));
    if (get().liveEnabled && get().activeRun?.id && ["queued", "running"].includes(get().activeRun.status)) {
      startPolling(get().activeRun.id, set, get);
    } else {
      clearRunPoll();
    }
  },
}));
