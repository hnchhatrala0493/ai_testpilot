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
import StartAITesting from "./pages/StartAITesting.jsx";
import AuditLogs from "./pages/AuditLogs.jsx";
import TeamChat from "./pages/TeamChat.jsx";
import MasterData from "./pages/MasterData.jsx";
import Companies from "./pages/Companies.jsx";
import ChangePassword from "./pages/ChangePassword.jsx";
import ComingSoon from "./pages/ComingSoon.jsx";
import AICenter from "./pages/AICenter.jsx";
import { useAuthStore } from "./store/authStore.js";
import { hasAnyPermission } from "./utils/hasPermission.js";

const APP_NAME = "AI TestPilot";
const DEFAULT_DESCRIPTION =
  "AI TestPilot is an AI-powered QA automation platform for generating test cases, running UI and API tests, tracking bugs, and improving release quality.";
const DEFAULT_IMAGE = "/og-image.png";

const pageMetadata = [
  {
    path: "/",
    title: "AI-Powered QA Automation Platform",
    description:
      "Automate QA with AI TestPilot. Generate test cases, run UI and API tests, detect bugs, create reports, and release software faster.",
    robots: "index, follow",
  },
  {
    path: "/login",
    title: "Login",
    description: "Log in to AI TestPilot to manage AI-powered QA automation, bug tracking, reports, and release quality workflows.",
    robots: "noindex, nofollow",
  },
  {
    path: "/register",
    title: "Start Free Trial",
    description: "Create an AI TestPilot account and start automating QA workflows with AI-generated test cases and bug reports.",
    robots: "index, follow",
  },
  { path: "/forgot-password", title: "Forgot Password", description: "Recover access to your AI TestPilot account.", robots: "noindex, nofollow" },
  { path: "/dashboard", title: "Dashboard", description: "Monitor QA activity, test coverage, bugs, and release health in AI TestPilot.", robots: "noindex, nofollow" },
  { path: "/bugs", title: "Bugs", description: "Track, triage, and resolve software defects in AI TestPilot.", robots: "noindex, nofollow" },
  { path: "/bugs/create", title: "Create Bug", description: "Create detailed bug reports for your QA workflow.", robots: "noindex, nofollow" },
  { path: "/bugs/:id", title: "Bug Details", description: "Review bug details, status, and collaboration history.", robots: "noindex, nofollow" },
  { path: "/projects", title: "Projects", description: "Manage projects, QA scope, and testing workflows in AI TestPilot.", robots: "noindex, nofollow" },
  { path: "/projects/:id", title: "Project Details", description: "Review project-level testing activity and quality status.", robots: "noindex, nofollow" },
  { path: "/releases", title: "Releases", description: "Plan and monitor release readiness with AI TestPilot.", robots: "noindex, nofollow" },
  { path: "/users", title: "Users", description: "Manage AI TestPilot users and team access.", robots: "noindex, nofollow" },
  { path: "/companies", title: "Companies", description: "Manage company records and organization settings.", robots: "noindex, nofollow" },
  { path: "/roles-permissions", title: "Roles & Permissions", description: "Configure team permissions for AI TestPilot.", robots: "noindex, nofollow" },
  { path: "/master-data", title: "Master Data", description: "Manage shared data used across AI TestPilot.", robots: "noindex, nofollow" },
  { path: "/master-data/:section", title: "Master Data", description: "Manage shared data used across AI TestPilot.", robots: "noindex, nofollow" },
  { path: "/reports", title: "Reports", description: "Analyze QA metrics, defect trends, and release readiness.", robots: "noindex, nofollow" },
  { path: "/automation", title: "AI Automation", description: "Run AI-assisted testing workflows for UI, API, and regression coverage.", robots: "noindex, nofollow" },
  { path: "/start-ai-testing", title: "Start AI Testing", description: "Start an AI-powered testing workflow in AI TestPilot.", robots: "noindex, nofollow" },
  { path: "/test-cases", title: "Test Cases", description: "Generate and manage AI-assisted test cases.", robots: "noindex, nofollow" },
  { path: "/test-execution", title: "Test Execution", description: "Execute and review QA test runs in AI TestPilot.", robots: "noindex, nofollow" },
  { path: "/ai-agents", title: "AI Agents", description: "Use AI agents to accelerate QA automation workflows.", robots: "noindex, nofollow" },
  { path: "/ai-analytics", title: "AI Analytics", description: "Review AI-powered quality analytics and release insights.", robots: "noindex, nofollow" },
  { path: "/team-chat", title: "Team Chat", description: "Collaborate with your QA and engineering team.", robots: "noindex, nofollow" },
  { path: "/audit-logs", title: "Audit Logs", description: "Review audit history for account and workflow activity.", robots: "noindex, nofollow" },
  { path: "/settings", title: "Settings", description: "Configure your AI TestPilot workspace.", robots: "noindex, nofollow" },
  { path: "/profile", title: "Profile", description: "Manage your AI TestPilot user profile.", robots: "noindex, nofollow" },
  { path: "/change-password", title: "Change Password", description: "Change your AI TestPilot account password.", robots: "noindex, nofollow" },
];

function updateMetaTag(selector, attributes) {
  const head = document.head;
  let tag = document.head.querySelector(selector);

  if (!tag) {
    tag = document.createElement("meta");
    head.appendChild(tag);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    tag.setAttribute(key, value);
  });
}

function updateLinkTag(selector, attributes) {
  const head = document.head;
  let tag = document.head.querySelector(selector);

  if (!tag) {
    tag = document.createElement("link");
    head.appendChild(tag);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    tag.setAttribute(key, value);
  });
}

function PageMetadata() {
  const { pathname } = useLocation();

  useEffect(() => {
    const currentPage = pageMetadata.find((page) => matchPath({ path: page.path, end: true }, pathname));
    const title = currentPage ? `${currentPage.title} - ${APP_NAME}` : APP_NAME;
    const description = currentPage?.description || DEFAULT_DESCRIPTION;
    const robots = currentPage?.robots || "noindex, nofollow";
    const canonicalUrl = new URL(pathname, window.location.origin).toString();
    const imageUrl = new URL(DEFAULT_IMAGE, window.location.origin).toString();

    document.title = title;
    updateMetaTag('meta[name="description"]', { name: "description", content: description });
    updateMetaTag('meta[name="robots"]', { name: "robots", content: robots });
    updateLinkTag('link[rel="canonical"]', { rel: "canonical", href: canonicalUrl });
    updateMetaTag('meta[property="og:title"]', { property: "og:title", content: title });
    updateMetaTag('meta[property="og:description"]', { property: "og:description", content: description });
    updateMetaTag('meta[property="og:url"]', { property: "og:url", content: canonicalUrl });
    updateMetaTag('meta[property="og:image"]', { property: "og:image", content: imageUrl });
    updateMetaTag('meta[name="twitter:title"]', { name: "twitter:title", content: title });
    updateMetaTag('meta[name="twitter:description"]', { name: "twitter:description", content: description });
    updateMetaTag('meta[name="twitter:image"]', { name: "twitter:image", content: imageUrl });
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
      <PageMetadata />
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
          <Route path="/start-ai-testing" element={<RoleRoute permissions={["automation.view"]}><StartAITesting /></RoleRoute>} />
          <Route path="/test-cases" element={<RoleRoute permissions={["automation.view"]}><AICenter moduleSlug="test-cases" /></RoleRoute>} />
          <Route path="/test-execution" element={<RoleRoute permissions={["automation.view"]}><AICenter moduleSlug="test-execution" /></RoleRoute>} />
          <Route path="/ai-agents" element={<RoleRoute permissions={["automation.view"]}><AICenter moduleSlug="ai-agents" /></RoleRoute>} />
          <Route path="/ai-analytics" element={<RoleRoute permissions={["report:view"]}><AICenter moduleSlug="ai-analytics" /></RoleRoute>} />
          <Route path="/ai-center/:slug" element={<RoleRoute permissions={["automation.view", "report:view"]}><AICenter /></RoleRoute>} />
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
