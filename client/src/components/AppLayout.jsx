import { Bell, Bot, Bug, Building2, ChartNoAxesColumn, ChevronDown, ClipboardList, Database, FolderKanban, LayoutDashboard, LogOut, Menu, MessageSquare, Moon, Settings, ShieldCheck, Sun, User, Users, X } from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore.js";
import { useThemeStore } from "../store/themeStore.js";
import { USER_ROLE_LABELS } from "../utils/constants.js";
import { initials } from "../utils/format.js";
import { hasAnyPermission } from "../utils/hasPermission.js";
import Breadcrumbs from "./Breadcrumbs.jsx";

const navigation = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/bugs", label: "Bugs", icon: Bug, permissions: ["bug:view"] },
  { to: "/projects", label: "Projects", icon: FolderKanban, permissions: ["project:view"] },
  { to: "/users", label: "Users", icon: Users, permissions: ["user:view"] },
  { to: "/companies", label: "Companies", icon: Building2, mainAdminOnly: true },
  { to: "/roles-permissions", label: "Roles", icon: ShieldCheck, permissions: ["role:view", "role:update"] },
  {
    label: "Master Data",
    icon: Database,
    permissions: ["role:view", "settings:view"],
    children: [
      { to: "/master-data/roles", label: "Role" },
      { to: "/master-data/project-category", label: "Project Category" },
      { to: "/master-data/assignment-group", label: "Assignment Group" },
      { to: "/master-data/designation", label: "Designation" },
      { to: "/master-data/department", label: "Department" },
    ],
  },
  { to: "/reports", label: "Reports", icon: ChartNoAxesColumn, permissions: ["report:view"] },
  { to: "/automation", label: "AI Automation", icon: Bot, permissions: ["automation.view"] },
  { to: "/team-chat", label: "Team Chat", icon: MessageSquare },
  { to: "/audit-logs", label: "Audit Logs", icon: ClipboardList, permissions: ["settings:view"] },
  { to: "/settings", label: "Settings", icon: Settings, permissions: ["settings:view"] },
  { to: "/profile", label: "Profile", icon: User },
];

export default function AppLayout() {
  const [open, setOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({ "Master Data": false });
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const navigate = useNavigate();
  const location = useLocation();
  const visibleNavigation = navigation.filter((item) => !item.permissions?.length || hasAnyPermission(user, item.permissions));
  const filteredNavigation = visibleNavigation.filter((item) => !item.mainAdminOnly || (user?.role === "super_admin" && !user?.companyId));

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-mist text-ink dark:bg-slate-950 dark:text-slate-100">
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-line bg-white transition-transform dark:border-slate-700 dark:bg-slate-900 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-line px-5 dark:border-slate-700">
          <NavLink to="/dashboard" className="flex items-center gap-3 font-bold" onClick={() => setOpen(false)}>
            <span className="grid h-9 w-9 place-items-center rounded-md bg-brand text-white">
              <Bug size={19} />
            </span>
            Bug Tracker
          </NavLink>
          <button className="btn-muted h-9 w-9 p-0 lg:hidden" type="button" onClick={() => setOpen(false)} aria-label="Close menu">
            <X size={18} />
          </button>
        </div>
        <nav className="space-y-1 p-3">
          {filteredNavigation.map((item) => {
            const hasChildren = Boolean(item.children?.length);
            const childActive = hasChildren && item.children.some((child) => location.pathname === child.to);
            const expanded = childActive || expandedMenus[item.label];

            if (hasChildren) {
              return (
                <div key={item.label}>
                  <button
                    className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-semibold transition ${
                      childActive
                        ? "bg-blue-50 text-brand dark:bg-blue-950 dark:text-blue-300"
                        : "text-slate-600 hover:bg-mist hover:text-ink dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                    }`}
                    type="button"
                    aria-expanded={expanded}
                    onClick={() => setExpandedMenus((current) => ({ ...current, [item.label]: !current[item.label] }))}
                  >
                    <item.icon size={18} />
                    <span className="flex-1">{item.label}</span>
                    <ChevronDown className={`transition-transform ${expanded ? "rotate-180" : ""}`} size={16} />
                  </button>
                  {expanded ? (
                    <div className="mt-1 space-y-1 pl-8">
                      {item.children.map((child) => (
                        <NavLink
                          key={child.to}
                          to={child.to}
                          onClick={() => setOpen(false)}
                          className={({ isActive }) =>
                            `block rounded-md px-3 py-2 text-sm font-semibold transition ${
                              isActive
                                ? "bg-blue-50 text-brand dark:bg-blue-950 dark:text-blue-300"
                                : "text-slate-500 hover:bg-mist hover:text-ink dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                            }`
                          }
                        >
                          {child.label}
                        </NavLink>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            }

            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold transition ${
                    isActive
                      ? "bg-blue-50 text-brand dark:bg-blue-950 dark:text-blue-300"
                      : "text-slate-600 hover:bg-mist hover:text-ink dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                  }`
                }
              >
                <item.icon size={18} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-white/95 px-4 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95 lg:px-7">
          <button className="btn-muted h-10 w-10 p-0 lg:hidden" type="button" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu size={18} />
          </button>
          <div className="hidden min-w-0 lg:block">
            <p className="text-sm font-semibold">Issue operations</p>
            <p className="text-xs text-slate-500">Triage, assign, and resolve product defects.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="btn-muted h-10 w-10 p-0" type="button" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button className="btn-muted h-10 w-10 p-0" type="button" aria-label="Notifications">
              <Bell size={18} />
            </button>
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold">{user?.fullname}</p>
                <p className="text-xs text-slate-500">{USER_ROLE_LABELS[user?.role] || user?.role}</p>
              </div>
              <div className="grid h-10 w-10 place-items-center rounded-md bg-ink text-sm font-bold text-white dark:bg-blue-600">
                {initials(user?.fullname)}
              </div>
            </div>
            <button className="btn-muted h-10 w-10 p-0" type="button" onClick={handleLogout} aria-label="Logout">
              <LogOut size={18} />
            </button>
          </div>
        </header>
        <main className="mx-auto max-w-8xl px-4 py-6 lg:px-7">
          <Breadcrumbs />
          <Outlet />
        </main>
      </div>
    </div>
  );
}
