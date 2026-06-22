import { create } from "zustand";
import { useAuditStore } from "./auditStore.js";

const checks = [
  {
    id: "check-login",
    name: "Login and session",
    target: "/login",
    type: "UI",
    owner: "QA Automation",
    risk: "Critical",
    passMessage: "Login accepted credentials and redirected to dashboard.",
    failMessage: "Login submitted successfully but dashboard redirect did not complete.",
  },
  {
    id: "check-create-bug",
    name: "Create bug report",
    target: "/bugs/create",
    type: "UI",
    owner: "Bug Intake",
    risk: "High",
    passMessage: "Bug form created a ticket with status Open and priority Medium.",
    failMessage: "Screenshot upload control accepted the file but did not preserve filename metadata.",
  },
  {
    id: "check-filter",
    name: "Filter bugs",
    target: "/bugs",
    type: "Regression",
    owner: "Triage",
    risk: "Medium",
    passMessage: "Status, priority, project, and search filters returned consistent table rows.",
    failMessage: "Project filter did not reset when navigating back from a detail page.",
  },
  {
    id: "check-comments",
    name: "Comment workflow",
    target: "/bugs/:id",
    type: "API",
    owner: "Collaboration",
    risk: "Medium",
    passMessage: "Comment was added to the bug timeline without losing existing updates.",
    failMessage: "Comment textarea reset before the comment appeared in the activity list.",
  },
  {
    id: "check-reports",
    name: "Reports analytics",
    target: "/reports",
    type: "Regression",
    owner: "Management",
    risk: "Low",
    passMessage: "Report cards and progress bars matched the current bug state.",
    failMessage: "Resolved percentage did not update after changing a bug to Closed.",
  },
  {
    id: "check-project-api",
    name: "Project CRUD API",
    target: "/api/projects",
    type: "API",
    owner: "Projects",
    risk: "High",
    passMessage: "Project create, update, member add, and delete endpoints returned expected responses.",
    failMessage: "Project update returned success but member count did not match the saved project.",
  },
  {
    id: "check-bug-api",
    name: "Bug lifecycle API",
    target: "/api/bugs",
    type: "API",
    owner: "Bugs",
    risk: "Critical",
    passMessage: "Bug create, status update, priority update, and comment APIs stayed consistent.",
    failMessage: "Bug status update response did not match the latest stored ticket state.",
  },
  {
    id: "check-profile-ui",
    name: "Profile photo UI",
    target: "/profile",
    type: "UI",
    owner: "Profile",
    risk: "Medium",
    passMessage: "Profile photo preview and profile fields saved successfully.",
    failMessage: "Profile photo preview appeared but saved profile data did not keep the image value.",
  },
];

function buildFailureArtifacts(check) {
  const route = check.target.replace(/[:/]+/g, "-").replace(/^-|-$/g, "") || "workflow";
  const screenshot = `/artifacts/${check.id}/${route}-screenshot.png`;
  const videoRecording = `/artifacts/${check.id}/${route}-recording.webm`;
  const consoleErrors = [
    `Error: ${check.failMessage}`,
    `AssertionError: expected ${check.target} to match the completed ${check.name} state`,
  ];
  const networkLogs = [
    {
      method: "GET",
      url: check.target,
      status: 200,
      duration: 96,
    },
    {
      method: check.type === "API" ? "PATCH" : "POST",
      url: check.type === "API" ? check.target : `/api${check.target}`,
      status: check.risk === "Critical" ? 500 : 422,
      duration: 318,
      error: check.risk === "Critical" ? "Internal server error" : "Validation mismatch",
    },
  ];

  return {
    screenshot,
    videoRecording,
    consoleErrors,
    networkLogs,
    traceUrl: `/artifacts/${check.id}/trace.zip`,
  };
}

function buildRun(mode) {
  const runChecks =
    mode === "api"
      ? checks.filter((check) => check.type === "API")
      : mode === "ui"
        ? checks.filter((check) => check.type === "UI")
        : mode === "regression"
          ? checks.filter((check) => check.type === "Regression" || check.risk === "Critical")
          : checks;

  return {
    id: `run-${Date.now()}`,
    mode,
    status: "running",
    progress: 0,
    startedAt: new Date().toISOString(),
    finishedAt: "",
    summary: {
      passed: 0,
      failed: 0,
      created: 0,
    },
    events: [
      {
        id: `event-${Date.now()}`,
        type: "info",
        title: "AI end-to-end run started",
        message: `${mode === "full" ? "Full system" : mode.toUpperCase()} coverage is now checking selected workflows.`,
        createdAt: new Date().toISOString(),
      },
    ],
    checks: runChecks.map((check) => ({ ...check, status: "queued", evidence: "" })),
  };
}

export const useAutomationStore = create((set, get) => ({
  activeRun: null,
  history: [],
  liveEnabled: true,
  startRun: (mode = "full", createBug) => {
    const run = buildRun(mode);
    set({ activeRun: run });
    useAuditStore.getState().addLog({
      actor: "AI Automation",
      action: "Started automation run",
      module: "Automation",
      target: run.id,
      details: `${mode} run started.`,
      severity: "Medium",
    });

    run.checks.forEach((check, index) => {
      window.setTimeout(() => {
        const shouldFail =
          mode === "api"
            ? index === 1
            : mode === "ui"
              ? index === 2
              : mode === "regression"
                ? index === 0
                : mode === "full"
                  ? index === 1 || index === 4
                  : index === 1;
        const finishedCheck = {
          ...check,
          status: shouldFail ? "failed" : "passed",
          evidence: shouldFail ? check.failMessage : check.passMessage,
          artifacts: shouldFail ? buildFailureArtifacts(check) : null,
        };

        let createdTicketId = "";
        if (shouldFail && createBug) {
          createdTicketId = createBug({
            title: `AI detected: ${check.name}`,
            description: `${check.failMessage}\n\nRoute checked: ${check.target}\nOwner area: ${check.owner}\nSuggested fix: review the affected workflow and rerun the automated check.`,
            stepsToReproduce: [
              `Run ${check.type} automation for ${check.name}.`,
              `Open target ${check.target}.`,
              "Compare expected result with actual result from the runner.",
              "Review captured logs and screenshot evidence.",
            ],
            expectedResult: check.passMessage,
            actualResult: check.failMessage,
            severity: check.risk,
            project: check.owner === "Management" ? "Customer Portal" : "Billing Engine",
            assignedTo: "Dev Patel",
            reporter: "AI Automation",
            status: "Open",
            priority: check.risk,
            type: "Bug",
            screenshot: `${check.id}-evidence.png`,
            testCaseReference: check.id,
            suggestedFix: "Review the affected component/API boundary and add a regression check before closing.",
          });
        }

        set((state) => {
          if (!state.activeRun || state.activeRun.id !== run.id) return state;

          const nextChecks = state.activeRun.checks.map((item) =>
            item.id === check.id ? finishedCheck : item,
          );
          const passed = nextChecks.filter((item) => item.status === "passed").length;
          const failed = nextChecks.filter((item) => item.status === "failed").length;
          const completed = passed + failed;
          const done = completed === nextChecks.length;
          const event = {
            id: `event-${Date.now()}-${index}`,
            type: shouldFail ? "failed" : "passed",
            title: `${check.name} ${shouldFail ? "failed" : "passed"}`,
            message: shouldFail
              ? `${check.failMessage}${createdTicketId ? ` Ticket created: ${createdTicketId}.` : ""}`
              : check.passMessage,
            createdAt: new Date().toISOString(),
          };
          if (shouldFail) {
            useAuditStore.getState().addLog({
              actor: "AI Automation",
              action: "Detected failed check",
              module: "Automation",
              target: check.name,
              details: event.message,
              severity: check.risk === "Critical" || check.risk === "High" ? "High" : "Medium",
            });
          }
          const nextRun = {
            ...state.activeRun,
            status: done ? "completed" : "running",
            progress: Math.round((completed / nextChecks.length) * 100),
            finishedAt: done ? new Date().toISOString() : "",
            checks: nextChecks,
            summary: {
              passed,
              failed,
              created: state.activeRun.summary.created + (createdTicketId ? 1 : 0),
            },
            events: [event, ...state.activeRun.events],
          };

          return {
            activeRun: nextRun,
            history: done ? [nextRun, ...state.history].slice(0, 6) : state.history,
          };
        });
      }, 1000 + index * 1100);
    });
  },
  stopRun: () => {
    const state = get();
    if (!state.activeRun) return;
    const stoppedRun = {
      ...state.activeRun,
      status: "stopped",
      finishedAt: new Date().toISOString(),
      events: [
        {
          id: `event-${Date.now()}`,
          type: "info",
          title: "Run stopped",
          message: "Live automation was stopped by the user.",
          createdAt: new Date().toISOString(),
        },
        ...state.activeRun.events,
      ],
    };
    set((current) => ({
      activeRun: stoppedRun,
      history: [stoppedRun, ...current.history].slice(0, 6),
    }));
    useAuditStore.getState().addLog({
      actor: "Current User",
      action: "Stopped automation run",
      module: "Automation",
      target: stoppedRun.id,
      details: "Automation run was stopped.",
      severity: "Medium",
    });
  },
  toggleLive: () => set((state) => ({ liveEnabled: !state.liveEnabled })),
}));
