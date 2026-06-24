import { matchPath, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useEffect } from "react";
import AppLayout from "./components/AppLayout.jsx";
import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Bugs from "./pages/Bugs.jsx";
import CreateBug from "./pages/CreateBug.jsx";
import BugDetails from "./pages/BugDetails.jsx";
import Projects from "./pages/Projects.jsx";
import ProjectDetails from "./pages/ProjectDetails.jsx";
import Users from "./pages/Users.jsx";
import RolesPermissions from "./pages/RolesPermissions.jsx";
import Reports from "./pages/Reports.jsx";
import Profile from "./pages/Profile.jsx";
import Settings from "./pages/Settings.jsx";
import Automation from "./pages/Automation.jsx";
import AuditLogs from "./pages/AuditLogs.jsx";
import TeamChat from "./pages/TeamChat.jsx";
import MasterData from "./pages/MasterData.jsx";
import Companies from "./pages/Companies.jsx";
import ChangePassword from "./pages/ChangePassword.jsx";
import ComingSoon from "./pages/ComingSoon.jsx";
import AIAgents from "./pages/AIAgents.jsx";
import { useAuthStore } from "./store/authStore.js";
import { hasAnyPermission } from "./utils/hasPermission.js";

const APP_NAME = "AI TestPilot";

const pageTitles = [
  { path: "/", title: "Modern QA Platform" },
  { path: "/login", title: "Login" },
  { path: "/register", title: "Register" },
  { path: "/forgot-password", title: "Forgot Password" },
  { path: "/dashboard", title: "Dashboard" },
  { path: "/bugs", title: "Bugs" },
  { path: "/bugs/create", title: "Create Bug" },
  { path: "/bugs/:id", title: "Bug Details" },
  { path: "/projects", title: "Projects" },
  { path: "/projects/:id", title: "Project Details" },
  { path: "/releases", title: "Releases" },
  { path: "/users", title: "Users" },
  { path: "/companies", title: "Companies" },
  { path: "/roles-permissions", title: "Roles & Permissions" },
  { path: "/master-data", title: "Master Data" },
  { path: "/master-data/:section", title: "Master Data" },
  { path: "/reports", title: "Reports" },
  { path: "/automation", title: "AI Automation" },
  { path: "/test-cases", title: "Test Cases" },
  { path: "/test-execution", title: "Test Execution" },
  { path: "/ai-agents", title: "AI Agents" },
  { path: "/ai-analytics", title: "AI Analytics" },
  { path: "/team-chat", title: "Team Chat" },
  { path: "/audit-logs", title: "Audit Logs" },
  { path: "/settings", title: "Settings" },
  { path: "/profile", title: "Profile" },
  { path: "/change-password", title: "Change Password" },
];

function PageTitle() {
  const { pathname } = useLocation();

  useEffect(() => {
    const currentPage = pageTitles.find((page) => matchPath({ path: page.path, end: true }, pathname));
    document.title = currentPage ? `${currentPage.title} - ${APP_NAME}` : APP_NAME;
  }, [pathname]);

  return null;
}

function ProtectedRoute() {
  const token = useAuthStore((state) => state.token);
  const checking = useAuthStore((state) => state.checking);
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    if (token) checkAuth();
  }, [token, checkAuth]);

  if (checking) {
    return (
      <div className="grid min-h-screen place-items-center bg-mist text-sm font-semibold text-slate-600">
        Checking session...
      </div>
    );
  }

  return token ? <AppLayout /> : <Navigate to="/login" replace />;
}

function RoleRoute({ permissions, children }) {
  const user = useAuthStore((state) => state.user);

  const allowed = permissions?.length ? hasAnyPermission(user, permissions) : true;

  if (!allowed) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default function App() {
  return (
    <>
      <PageTitle />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<RoleRoute><Dashboard /></RoleRoute>} />
          <Route path="/bugs" element={<RoleRoute permissions={["bug:view"]}><Bugs /></RoleRoute>} />
          <Route path="/bugs/create" element={<RoleRoute permissions={["bug:create"]}><CreateBug /></RoleRoute>} />
          <Route path="/bugs/:id" element={<RoleRoute permissions={["bug:view"]}><BugDetails /></RoleRoute>} />
          <Route path="/projects" element={<RoleRoute permissions={["project:view"]}><Projects /></RoleRoute>} />
          <Route path="/projects/:id" element={<RoleRoute permissions={["project:view"]}><ProjectDetails /></RoleRoute>} />
          <Route path="/releases" element={<RoleRoute permissions={["project:view"]}><ComingSoon page="releases" /></RoleRoute>} />
          <Route path="/users" element={<RoleRoute permissions={["user:view"]}><Users /></RoleRoute>} />
          <Route path="/companies" element={<Companies />} />
          <Route path="/roles-permissions" element={<RoleRoute permissions={["role:view", "role:update"]}><RolesPermissions /></RoleRoute>} />
          <Route path="/master-data" element={<RoleRoute permissions={["role:view", "settings:view"]}><Navigate to="/master-data/roles" replace /></RoleRoute>} />
          <Route path="/master-data/:section" element={<RoleRoute permissions={["role:view", "settings:view"]}><MasterData /></RoleRoute>} />
          <Route path="/reports" element={<RoleRoute permissions={["report:view"]}><Reports /></RoleRoute>} />
          <Route path="/automation" element={<RoleRoute permissions={["automation.view"]}><Automation /></RoleRoute>} />
          <Route path="/test-cases" element={<RoleRoute permissions={["automation.view"]}><Automation /></RoleRoute>} />
          <Route path="/test-execution" element={<RoleRoute permissions={["automation.view"]}><Automation /></RoleRoute>} />
          <Route path="/ai-agents" element={<RoleRoute permissions={["automation.view"]}><AIAgents /></RoleRoute>} />
          <Route path="/ai-analytics" element={<RoleRoute permissions={["report:view"]}><ComingSoon page="ai-analytics" /></RoleRoute>} />
          <Route path="/team-chat" element={<RoleRoute><TeamChat /></RoleRoute>} />
          <Route path="/audit-logs" element={<RoleRoute permissions={["settings:view"]}><AuditLogs /></RoleRoute>} />
          <Route path="/settings" element={<RoleRoute permissions={["settings:view"]}><Settings /></RoleRoute>} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/change-password" element={<ChangePassword />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
