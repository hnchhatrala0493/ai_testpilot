import axios from "axios";
import { useLoadingStore } from "../store/loadingStore.js";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://ai-testpilot-snowy.vercel.app",
});

api.interceptors.request.use(
  (config) => {
    useLoadingStore.getState().startLoading();
    const token = localStorage.getItem("bug-tracker-token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    useLoadingStore.getState().stopLoading();
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => {
    useLoadingStore.getState().stopLoading();
    return response;
  },
  (error) => {
    useLoadingStore.getState().stopLoading();
    return Promise.reject(error);
  },
);

export const authApi = {
  register: (payload) => api.post("/api/auth/register", payload),
  login: (payload) => api.post("/api/auth/login", payload),
  forgotPassword: (payload) => api.post("/api/auth/forgot-password", payload),
  resetPassword: (payload) => api.post("/api/auth/reset-password", payload),
  changePassword: (payload) => api.post("/api/auth/change-password", payload),
  me: () => api.get("/api/auth/me"),
  logout: () => api.post("/api/auth/logout"),
};

export const bugApi = {
  list: (params) => api.get("/api/bugs", { params }),
  create: (payload) => api.post("/api/bugs", payload),
  get: (id) => api.get(`/api/bugs/${id}`),
  update: (id, payload) => api.put(`/api/bugs/${id}`, payload),
  remove: (id) => api.delete(`/api/bugs/${id}`),
  addComment: (id, payload) => api.post(`/api/bugs/${id}/comments`, payload),
  addInternalNote: (id, payload) => api.post(`/api/bugs/${id}/internal-notes`, payload),
};

export const projectApi = {
  list: () => api.get("/api/projects"),
  create: (payload) => api.post("/api/projects", payload),
  get: (id) => api.get(`/api/projects/${id}`),
  update: (id, payload) => api.put(`/api/projects/${id}`, payload),
  remove: (id) => api.delete(`/api/projects/${id}`),
};

export const userApi = {
  create: (payload) => api.post("/api/users", payload),
  list: () => api.get("/api/users"),
  get: (id) => api.get(`/api/users/${id}`),
  update: (id, payload) => api.put(`/api/users/${id}`, payload),
  remove: (id) => api.delete(`/api/users/${id}`),
};

export const companyApi = {
  list: () => api.get("/api/companies"),
  create: (payload) => api.post("/api/companies", payload),
  update: (id, payload) => api.put(`/api/companies/${id}`, payload),
  remove: (id) => api.delete(`/api/companies/${id}`),
};

export const locationApi = {
  countries: (params) => api.get("/api/locations/countries", { params }),
  states: (params) => api.get("/api/locations/states", { params }),
  cities: (params) => api.get("/api/locations/cities", { params }),
};

export const postalCodeApi = {
  lookup: (pincode) => axios.get(`https://api.postalpincode.in/pincode/${encodeURIComponent(pincode)}`),
};

export const roleApi = {
  list: () => api.get("/api/roles"),
  permissions: () => api.get("/api/roles/permissions"),
  updatePermissions: (id, permissions) => api.put(`/api/roles/${id}/permissions`, { permissions }),
};

export const masterDataApi = {
  types: () => api.get("/api/master-data/types"),
  list: (section, params) => api.get(`/api/master-data/${section}`, { params }),
  create: (section, payload) => api.post(`/api/master-data/${section}`, payload),
  update: (section, id, payload) => api.put(`/api/master-data/${section}/${id}`, payload),
  remove: (section, id) => api.delete(`/api/master-data/${section}/${id}`),
};

export const settingsApi = {
  get: () => api.get("/api/settings"),
  update: (payload) => api.put("/api/settings", payload),
};

export const automationApi = {
  startRun: (payload) => api.post("/api/automation/runs", payload),
  getRun: (id) => api.get(`/api/automation/runs/${id}`),
  listRuns: () => api.get("/api/automation/runs"),
  streamUrl: (id) => `${api.defaults.baseURL}/api/automation/runs/${id}/events`,
};

export const aiApi = {
  generateTestCases: (payload) => api.post("/api/ai/generate-test-cases", payload),
};

export const testCaseApi = {
  list: (params) => api.get("/api/test-cases", { params }),
  get: (id) => api.get(`/api/test-cases/${id}`),
  update: (id, payload) => api.put(`/api/test-cases/${id}`, payload),
  remove: (id) => api.delete(`/api/test-cases/${id}`),
};

export const testRunApi = {
  run: (payload) => api.post("/api/tests/run", payload),
  results: (params) => api.get("/api/tests/results", { params }),
  resultByRun: (runId) => api.get(`/api/tests/results/${runId}`),
  singleResult: (id) => api.get(`/api/tests/result/${id}`),
};

export default api;
