import { create } from "zustand";
import { authApi, roleApi } from "../services/api.js";
import { useAuditStore } from "./auditStore.js";

const fallbackUser = {
  id: "u-1",
  fullname: "Aarav Mehta",
  email: "aarav@acme.dev",
  role: "admin",
  employeeId: "EMP1042",
  mobileNo: "+91 98765 43210",
  designation: "QA Lead",
  department: "Engineering",
  gender: "male",
  dateOfBirth: "1994-08-18",
  address: "12 MG Road",
  city: "Bengaluru",
  state: "Karnataka",
  country: "India",
  postalCode: "560001",
  area: "MG Road",
  timezone: "Asia/Calcutta",
  skills: "React, Node.js, Playwright, API Testing",
  bio: "Leads triage and release quality for product engineering.",
  availability: "Full-time",
  photo: "",
};

function normalizeUser(data, fallback = {}) {
  return data?.result?.user || data?.user || data?.result || data || fallback;
}

function normalizeToken(data) {
  return data?.bearerToken || data?.token || data?.accessToken || data?.result?.token || "";
}

async function hydrateRolePermissions(user) {
  const roleValue = typeof user?.role === "object" ? user.role?.key || user.role?.label || user.role?.name : user?.role;
  if (!roleValue || typeof roleValue !== "string") return user;

  try {
    const { data } = await roleApi.list();
    const roles = data?.result || [];
    const normalizedRole = roleValue.trim().toLowerCase();
    const role = roles.find((item) =>
      [item.key, item.label, item.name]
        .filter(Boolean)
        .map((value) => String(value).trim().toLowerCase())
        .includes(normalizedRole),
    );
    return role ? { ...user, role: role.key || user.role, rolePermissions: role.permissions || [] } : user;
  } catch {
    return user;
  }
}

export const useAuthStore = create((set, get) => ({
  token: localStorage.getItem("bug-tracker-token") || "",
  user: JSON.parse(localStorage.getItem("bug-tracker-user") || "null"),
  loading: false,
  checking: false,
  error: "",
  checkAuth: async () => {
    const token = get().token || localStorage.getItem("bug-tracker-token");
    if (!token) {
      set({ user: null, token: "", checking: false });
      return false;
    }

    set({ checking: true, error: "" });
    try {
      const { data } = await authApi.me();
      const user = await hydrateRolePermissions(normalizeUser(data));
      localStorage.setItem("bug-tracker-user", JSON.stringify(user));
      set({ user, token, checking: false });
      return true;
    } catch (error) {
      localStorage.removeItem("bug-tracker-token");
      localStorage.removeItem("bug-tracker-user");
      set({
        token: "",
        user: null,
        checking: false,
        error: error.response?.data?.message || "Session expired. Please login again.",
      });
      return false;
    }
  },
  login: async (payload) => {
    set({ loading: true, error: "" });
    try {
      const { data } = await authApi.login(payload);
      const token = normalizeToken(data);
      if (!token) throw new Error("Login response did not include a token.");
      let user = normalizeUser(data, { email: payload.email });
      localStorage.setItem("bug-tracker-token", token);
      try {
        const meResponse = await authApi.me();
        user = normalizeUser(meResponse.data, user);
      } catch {
        // Login can still succeed if the backend returns user data but /me is not ready yet.
      }
      user = await hydrateRolePermissions(user);
      localStorage.setItem("bug-tracker-user", JSON.stringify(user));
      set({ token, user, loading: false });
      useAuditStore.getState().addLog({
        actor: user.fullname || user.email,
        action: "Logged in",
        module: "Auth",
        target: user.email,
        details: "User authenticated successfully.",
        severity: "Low",
      });
      return true;
    } catch (error) {
      set({
        token: "",
        user: null,
        loading: false,
        error: error.response?.data?.message || error.message || "Login failed.",
      });
      return false;
    }
  },
  register: async (payload) => {
    set({ loading: true, error: "" });
    try {
      const { data } = await authApi.register(payload);
      const token = normalizeToken(data);
      let user = normalizeUser(data, {
        fullname: payload.fullname,
        email: payload.email,
        role: payload.role || "tester",
      });
      if (token) {
        localStorage.setItem("bug-tracker-token", token);
        try {
          const meResponse = await authApi.me();
          user = normalizeUser(meResponse.data, user);
        } catch {
          // Some register APIs return only a token; keep submitted profile until /me is available.
        }
      }
      user = await hydrateRolePermissions(user);
      localStorage.setItem("bug-tracker-user", JSON.stringify(user));
      set({ token, user, loading: false });
      useAuditStore.getState().addLog({
        actor: user.fullname,
        action: "Registered user",
        module: "Auth",
        target: user.email,
        details: "New user account created.",
        severity: "Medium",
      });
      return true;
    } catch (error) {
      set({ loading: false, error: error.response?.data?.message || "Registration failed." });
      return false;
    }
  },
  logout: () => {
    localStorage.removeItem("bug-tracker-token");
    localStorage.removeItem("bug-tracker-user");
    set({ token: "", user: null, error: "" });
  },
  updateProfile: (updates) => {
    set((state) => {
      const user = { ...state.user, ...updates };
      localStorage.setItem("bug-tracker-user", JSON.stringify(user));
      useAuditStore.getState().addLog({
        actor: user.fullname,
        action: "Updated profile",
        module: "Profile",
        target: user.email,
        details: "Profile details were updated.",
        severity: "Low",
      });
      return { user };
    });
  },
}));
