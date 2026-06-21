import { ChevronRight, Home } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const routeLabels = {
  dashboard: "Dashboard",
  bugs: "Bugs",
  create: "Create",
  projects: "Projects",
  users: "Users",
  companies: "Companies",
  "roles-permissions": "Roles & Permissions",
  "master-data": "Master Data",
  roles: "Role",
  "project-category": "Project Category",
  "assignment-group": "Assignment Group",
  designation: "Designation",
  department: "Department",
  reports: "Reports",
  automation: "AI Automation",
  "team-chat": "Team Chat",
  "audit-logs": "Audit Logs",
  "change-password": "Change Password",
  profile: "Profile",
};

function formatSegment(segment) {
  if (routeLabels[segment]) return routeLabels[segment];
  return segment
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function Breadcrumbs() {
  const { pathname } = useLocation();
  const segments = pathname.split("/").filter(Boolean);

  if (!segments.length || pathname === "/dashboard") return null;

  const crumbs = segments.map((segment, index) => {
    const path = `/${segments.slice(0, index + 1).join("/")}`;
    const parent = segments[index - 1];
    const isLast = index === segments.length - 1;
    const label = parent === "bugs" && segment !== "create"
      ? `Bug ${segment}`
      : parent === "projects"
        ? `Project ${segment}`
        : formatSegment(segment);

    return { label, path, isLast };
  });

  return (
    <nav className="mb-4 flex items-center gap-2 text-sm text-slate-500" aria-label="Breadcrumb">
      <Link className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-brand dark:text-slate-300" to="/dashboard">
        <Home size={15} />
        Dashboard
      </Link>
      {crumbs.map((crumb) => (
        <span key={crumb.path} className="inline-flex min-w-0 items-center gap-2">
          <ChevronRight size={15} className="shrink-0 text-slate-400" />
          {crumb.isLast ? (
            <span className="truncate font-semibold text-ink dark:text-slate-100">{crumb.label}</span>
          ) : (
            <Link className="truncate font-semibold text-slate-600 hover:text-brand dark:text-slate-300" to={crumb.path}>
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
