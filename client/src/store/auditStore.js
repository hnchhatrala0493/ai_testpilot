import { create } from "zustand";

const initialLogs = [
  {
    id: "audit-1",
    actor: "AI Automation",
    action: "Created bug",
    module: "Automation",
    target: "AI detected: Create bug report",
    details: "Automation created a bug from a failed end-to-end check.",
    severity: "High",
    createdAt: "2026-06-14T09:30:00.000Z",
  },
  {
    id: "audit-2",
    actor: "Aarav Mehta",
    action: "Updated project",
    module: "Projects",
    target: "Customer Portal",
    details: "Project category and members were reviewed.",
    severity: "Medium",
    createdAt: "2026-06-13T11:15:00.000Z",
  },
  {
    id: "audit-3",
    actor: "Nisha Rao",
    action: "Changed bug status",
    module: "Bugs",
    target: "BUG-1026",
    details: "Status changed to Testing.",
    severity: "Low",
    createdAt: "2026-06-12T08:05:00.000Z",
  },
];

export const useAuditStore = create((set) => ({
  logs: initialLogs,
  addLog: ({ actor = "System", action, module, target, details, severity = "Low" }) => {
    const log = {
      id: `audit-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      actor,
      action,
      module,
      target,
      details,
      severity,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ logs: [log, ...state.logs] }));
  },
  clearLogs: () => set({ logs: [] }),
}));
