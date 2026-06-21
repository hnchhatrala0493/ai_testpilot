import { Eye, FolderPlus, Pencil, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import PageHeader from "../components/PageHeader.jsx";
import { companyApi, projectApi } from "../services/api.js";
import { useAuthStore } from "../store/authStore.js";
import { PROJECT_CATEGORIES, PROJECT_STATUSES } from "../utils/constants.js";
import hasPermission from "../utils/hasPermission.js";

const emptyProject = {
  name: "",
  description: "",
  projectUrl: "",
  githubUrl: "",
  testUrl: "",
  techStack: "",
  category: "Software",
  status: "Active",
  companyId: "",
};

function normalizeProject(project) {
  const members = project.members || [];
  const createdBy = project.createdBy || {};
  return {
    ...project,
    id: project.id || project._id,
    name: project.name || project.projectName,
    owner: project.owner || createdBy.fullName || createdBy.name || createdBy.email || "Not assigned",
    memberIds: project.memberIds || members.map((member) => member.id || member._id),
    members,
    techStack: Array.isArray(project.techStack) ? project.techStack.join(", ") : project.techStack || "",
    category: project.category || "Software",
    status: project.status || "Active",
    testUrl: project.testUrl || "",
    companyId: project.companyId?._id || project.companyId || "",
  };
}

function buildProjectPayload(values) {
  return {
    ...values,
    projectName: values.name,
    companyId: values.companyId || undefined,
    techStack: String(values.techStack || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
  };
}

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [editingProject, setEditingProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [companies, setCompanies] = useState([]);
  const user = useAuthStore((state) => state.user);
  const canCreateProject = hasPermission(user, "projects.create");
  const canUpdateProject = hasPermission(user, "projects.update");
  const canDeleteProject = hasPermission(user, "projects.delete");
  const isMainAdministrator = user?.role === "super_admin" && !user?.companyId;
  const { register, handleSubmit, reset } = useForm({ defaultValues: emptyProject });

  useEffect(() => {
    let active = true;

    async function loadProjects() {
      try {
        setLoading(true);
        const [response, companiesResponse] = await Promise.all([
          projectApi.list(),
          isMainAdministrator ? companyApi.list() : Promise.resolve({ data: { result: [] } }),
        ]);
        if (active) {
          setProjects((response.data?.result || []).map(normalizeProject));
          setCompanies((companiesResponse.data?.result || []).map((company) => ({ ...company, id: company.id || company._id })));
        }
      } catch (error) {
        if (active) {
          toast.error(error.response?.data?.message || "Unable to load projects");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProjects();

    return () => {
      active = false;
    };
  }, [isMainAdministrator]);

  useEffect(() => {
    reset(editingProject || emptyProject);
  }, [editingProject, reset]);

  const onSubmit = async (values) => {
    if (editingProject && !canUpdateProject) {
      toast.error("You do not have permission to update projects.");
      return;
    }

    if (!editingProject && !canCreateProject) {
      toast.error("You do not have permission to create projects.");
      return;
    }

    try {
      setSaving(true);
      if (editingProject) {
        const response = await projectApi.update(editingProject.id, buildProjectPayload(values));
        setProjects((current) =>
          current.map((project) =>
            project.id === editingProject.id ? normalizeProject(response.data.result) : project,
          ),
        );
        setEditingProject(null);
        toast.success(response.data?.message || "Project updated successfully");
      } else {
        const response = await projectApi.create({
          ...buildProjectPayload(values),
          owner: user?.fullname,
        });
        setProjects((current) => [normalizeProject(response.data.result), ...current]);
        toast.success(response.data?.message || "Project created successfully");
      }
      reset(emptyProject);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to save project");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (project) => {
    if (!canDeleteProject) {
      toast.error("You do not have permission to delete projects.");
      return;
    }

    if (window.confirm(`Delete project "${project.name}"?`)) {
      try {
        const response = await projectApi.remove(project.id);
        setProjects((current) => current.filter((item) => item.id !== project.id));
        toast.success(response.data?.message || "Project deleted successfully");
      } catch (error) {
        toast.error(error.response?.data?.message || "Unable to delete project");
      }
    }
  };

  return (
    <>
      <PageHeader title="Projects" description="Create, read, update, delete, categorize, and manage project workspaces." />
      <div className={`grid gap-5 ${canCreateProject || editingProject ? "xl:grid-cols-[390px_1fr]" : ""}`}>
        {(canCreateProject || editingProject) ? (
          <form className="surface h-fit rounded-md p-5" onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-md bg-blue-50 text-brand">
                <FolderPlus size={20} />
              </span>
              <h2 className="font-bold">{editingProject ? "Update project" : "Create project"}</h2>
            </div>
            {editingProject ? (
              <button className="btn-muted h-9 w-9 p-0" type="button" onClick={() => setEditingProject(null)} aria-label="Cancel edit">
                <X size={16} />
              </button>
            ) : null}
          </div>
          <div className="space-y-4">
            <label className="block">
              <span className="label">Name</span>
              <input className="input mt-1" {...register("name", { required: true })} />
            </label>
            <label className="block">
              <span className="label">Description</span>
              <textarea className="input mt-1 min-h-24 resize-y" {...register("description", { required: true })} />
            </label>
            <label className="block">
              <span className="label">Project URL</span>
              <input className="input mt-1" type="url" placeholder="https://app.example.com" {...register("projectUrl")} />
            </label>
            <label className="block">
              <span className="label">GitHub Repository</span>
              <input className="input mt-1" type="url" placeholder="https://github.com/org/repo" {...register("githubUrl")} />
            </label>
            <label className="block">
              <span className="label">Test Environment URL</span>
              <input className="input mt-1" type="url" placeholder="https://staging.example.com" {...register("testUrl")} />
            </label>
            <label className="block">
              <span className="label">Technology Stack</span>
              <input className="input mt-1" placeholder="React, Node.js, MongoDB, Playwright" {...register("techStack")} />
            </label>
            {isMainAdministrator ? (
              <label className="block">
                <span className="label">Company</span>
                <select className="input mt-1" {...register("companyId", { required: true })}>
                  <option value="">Select company</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="label">Category</span>
                <select className="input mt-1" {...register("category")}>
                  {PROJECT_CATEGORIES.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="label">Status</span>
                <select className="input mt-1" {...register("status")}>
                  {PROJECT_STATUSES.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
              </label>
            </div>
            <button className="btn-primary w-full" type="submit" disabled={saving || (editingProject ? !canUpdateProject : !canCreateProject)}>
              {saving ? "Saving..." : editingProject ? "Update project" : "Create project"}
            </button>
          </div>
        </form>
        ) : null}

        <section className="surface overflow-hidden rounded-md">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[840px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Project</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">Tech Stack</th>
                  <th className="px-4 py-3 font-semibold">Owner</th>
                  <th className="px-4 py-3 font-semibold">Members</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {loading ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-slate-500" colSpan="7">
                      Loading projects...
                    </td>
                  </tr>
                ) : null}
                {!loading && projects.map((project) => (
                  <tr key={project.id}>
                    <td className="px-4 py-4">
                      <p className="font-semibold">{project.name}</p>
                      <p className="mt-1 max-w-md truncate text-xs text-slate-500">{project.description}</p>
                    </td>
                    <td className="px-4 py-4 text-slate-600">{project.category || "Software"}</td>
                    <td className="px-4 py-4 text-slate-600">{project.techStack || "Not set"}</td>
                    <td className="px-4 py-4 text-slate-600">{project.owner}</td>
                    <td className="px-4 py-4 text-slate-600">{project.memberIds?.length || 0}</td>
                    <td className="px-4 py-4">
                      <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">{project.status}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <Link className="btn-muted h-9 w-9 p-0" to={`/projects/${project.id}`} aria-label={`View ${project.name}`}>
                          <Eye size={16} />
                        </Link>
                        {canUpdateProject ? (
                          <button className="btn-muted h-9 w-9 p-0" type="button" onClick={() => setEditingProject(project)} aria-label={`Edit ${project.name}`}>
                            <Pencil size={16} />
                          </button>
                        ) : null}
                        {canDeleteProject ? (
                          <button className="btn-muted h-9 w-9 p-0 text-red-600" type="button" onClick={() => handleDelete(project)} aria-label={`Delete ${project.name}`}>
                            <Trash2 size={16} />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!loading && projects.length === 0 ? <div className="px-4 py-10 text-center text-sm text-slate-500">No projects created yet.</div> : null}
        </section>
      </div>
    </>
  );
}
