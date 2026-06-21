import { Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import BugTable from "../components/BugTable.jsx";
import PageHeader from "../components/PageHeader.jsx";
import { useFilteredBugs } from "../hooks/useFilteredBugs.js";
import { bugApi, projectApi } from "../services/api.js";
import { normalizeBug, normalizeProject } from "../utils/apiNormalizers.js";
import { BUG_PRIORITIES, BUG_STATUSES } from "../utils/constants.js";
import hasPermission from "../utils/hasPermission.js";
import { useAuthStore } from "../store/authStore.js";

export default function Bugs() {
  const [bugs, setBugs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: "", priority: "", project: "", search: "" });
  const user = useAuthStore((state) => state.user);
  const filteredBugs = useFilteredBugs(bugs, filters);
  const canCreateBug = hasPermission(user, "bugs.create");
  const canUpdateBug = hasPermission(user, "bugs.update");

  useEffect(() => {
    let active = true;

    async function loadBugModule() {
      try {
        setLoading(true);
        const [bugsResponse, projectsResponse] = await Promise.all([
          bugApi.list(),
          projectApi.list(),
        ]);

        if (active) {
          setBugs((bugsResponse.data?.result || []).map(normalizeBug));
          setProjects((projectsResponse.data?.result || []).map(normalizeProject));
        }
      } catch (error) {
        if (active) {
          toast.error(error.response?.data?.message || "Unable to load bugs");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadBugModule();

    return () => {
      active = false;
    };
  }, []);

  const setFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }));

  const updateBugStatus = async (id, status) => {
    if (!canUpdateBug) {
      toast.error("You do not have permission to update bugs.");
      return;
    }

    const currentBug = bugs.find((bug) => bug.id === id);
    if (!currentBug) return;

    const previousBugs = bugs;
    setBugs((current) => current.map((bug) => (bug.id === id ? { ...bug, status } : bug)));

    try {
      const response = await bugApi.update(id, { ...currentBug, projectId: currentBug.projectId, assignedTo: currentBug.assignedToId, status });
      setBugs((current) => current.map((bug) => (bug.id === id ? normalizeBug(response.data?.result) : bug)));
      toast.success(response.data?.message || "Bug updated successfully");
    } catch (error) {
      setBugs(previousBugs);
      toast.error(error.response?.data?.message || "Unable to update bug");
    }
  };

  return (
    <>
      <PageHeader
        title="Bugs"
        description="View all bugs, filter by status, priority, and project, then update status from the table."
        action={
          canCreateBug ? (
            <Link className="btn-primary" to="/bugs/create">
              <Plus size={17} />
              Create bug
            </Link>
          ) : null
        }
      />
      <section className="surface mb-4 rounded-md p-4">
        <div className="grid gap-3 md:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <label className="relative block">
            <span className="label">Search</span>
            <Search className="pointer-events-none absolute bottom-2.5 left-3 text-slate-400" size={17} />
            <input className="input mt-1 pl-9" placeholder="Ticket or title" value={filters.search} onChange={(event) => setFilter("search", event.target.value)} />
          </label>
          <label className="block">
            <span className="label">Status</span>
            <select className="input mt-1" value={filters.status} onChange={(event) => setFilter("status", event.target.value)}>
              <option value="">All statuses</option>
              {BUG_STATUSES.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="label">Priority</span>
            <select className="input mt-1" value={filters.priority} onChange={(event) => setFilter("priority", event.target.value)}>
              <option value="">All priorities</option>
              {BUG_PRIORITIES.map((priority) => (
                <option key={priority}>{priority}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="label">Project</span>
            <select className="input mt-1" value={filters.project} onChange={(event) => setFilter("project", event.target.value)}>
              <option value="">All projects</option>
              {projects.map((project) => (
                <option key={project.id}>{project.name}</option>
              ))}
            </select>
          </label>
        </div>
      </section>
      <BugTable bugs={filteredBugs} loading={loading} onStatusChange={updateBugStatus} canUpdate={canUpdateBug} />
    </>
  );
}
