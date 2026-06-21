export const BUG_STATUSES = ["Open", "In Progress", "Fixed", "Retest", "Closed", "Reopened"];
export const BUG_PRIORITIES = ["Low", "Medium", "High", "Critical"];
export const USER_ROLES = ["super_admin", "admin", "developer", "tester", "qa_lead", "project_manager"];
export const USER_ROLE_LABELS = {
  super_admin: "Super Admin",
  admin: "Admin",
  developer: "Developer",
  tester: "Tester",
  qa_lead: "QA Lead",
  project_manager: "Project Manager",
};
export const PROJECT_STATUSES = ["Active", "Completed", "Archived", "On Hold"];
export const PROJECT_CATEGORIES = ["Software", "Mobile App", "Web App", "API", "Infrastructure", "QA", "Security"];

export const statusColor = {
  Open: "bg-blue-50 text-blue-700 border-blue-200",
  "In Progress": "bg-amber-50 text-amber-700 border-amber-200",
  Fixed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Retest: "bg-violet-50 text-violet-700 border-violet-200",
  Closed: "bg-slate-100 text-slate-700 border-slate-200",
  Reopened: "bg-red-50 text-red-700 border-red-200",
};

export const priorityColor = {
  Low: "bg-slate-50 text-slate-700 border-slate-200",
  Medium: "bg-cyan-50 text-cyan-700 border-cyan-200",
  High: "bg-orange-50 text-orange-700 border-orange-200",
  Critical: "bg-red-50 text-red-700 border-red-200",
};
