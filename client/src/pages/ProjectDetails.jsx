import { ArrowLeft, ExternalLink, Github, Plus, Trash2, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import Badge from "../components/Badge.jsx";
import PageHeader from "../components/PageHeader.jsx";
import { projectApi, userApi } from "../services/api.js";
import { useBugStore } from "../store/bugStore.js";
import { useAuthStore } from "../store/authStore.js";
import { formatDate, initials } from "../utils/format.js";
import hasPermission from "../utils/hasPermission.js";

function normalizeUser(user) {
  return {
    ...user,
    id: user.id || user._id,
    fullname: user.fullName || user.fullname || user.name || user.email,
  };
}

function normalizeProject(project) {
  const members = (project.members || []).map(normalizeUser);
  const createdBy = project.createdBy || {};
  return {
    ...project,
    id: project.id || project._id,
    name: project.name || project.projectName,
    owner: project.owner || createdBy.fullName || createdBy.name || createdBy.email || "Not assigned",
    memberIds: project.memberIds || members.map((member) => member.id),
    members,
    techStack: Array.isArray(project.techStack) ? project.techStack.join(", ") : project.techStack || "",
    category: project.category || "Software",
    status: project.status || "Active",
    testUrl: project.testUrl || "",
  };
}

export default function ProjectDetails() {
  const { id } = useParams();
  const [selectedUserId, setSelectedUserId] = useState("");
  const [project, setProject] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const bugs = useBugStore((state) => state.bugs);
  const user = useAuthStore((state) => state.user);
  const canManageMembers = hasPermission(user, "projects.manage-members");

  useEffect(() => {
    let active = true;

    async function loadProjectDetails() {
      try {
        setLoading(true);
        const [projectResponse, usersResponse] = await Promise.all([
          projectApi.get(id),
          userApi.list(),
        ]);

        if (active) {
          setProject(normalizeProject(projectResponse.data?.result));
          setUsers((usersResponse.data?.result || []).map(normalizeUser));
        }
      } catch (error) {
        if (active) {
          toast.error(error.response?.data?.message || "Unable to load project details");
          setProject(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProjectDetails();

    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return <div className="surface rounded-md p-6 text-sm text-slate-500">Loading project...</div>;
  }

  if (!project) return <Navigate to="/projects" replace />;

  const projectMembers = users.filter((user) => project.memberIds?.includes(user.id));
  const availableUsers = users.filter((user) => !project.memberIds?.includes(user.id));
  const projectBugs = bugs.filter((bug) => bug.project === project.name);

  const updateMembers = async (memberIds, successMessage) => {
    if (!canManageMembers) {
      toast.error("You do not have permission to manage project members.");
      return;
    }

    try {
      const response = await projectApi.update(project.id, {
        ...project,
        name: project.name,
        projectName: project.name,
        techStack: project.techStack,
        members: memberIds,
      });
      setProject(normalizeProject(response.data?.result));
      toast.success(successMessage);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to update project members");
    }
  };

  const handleAddMember = async () => {
    if (!selectedUserId) return;
    await updateMembers([...new Set([...(project.memberIds || []), selectedUserId])], "Project member added");
    setSelectedUserId("");
  };

  const handleRemoveMember = (memberId) => {
    updateMembers((project.memberIds || []).filter((item) => item !== memberId), "Project member removed");
  };

  return (
    <>
      <PageHeader
        title={project.name}
        description={project.description}
        action={
          <Link className="btn-muted" to="/projects">
            <ArrowLeft size={17} />
            Back
          </Link>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <section className="space-y-5">
          <article className="surface rounded-md p-5">
            <div className="grid gap-4 sm:grid-cols-4">
              <div>
                <p className="label">Category</p>
                <p className="mt-1 font-semibold">{project.category || "Software"}</p>
              </div>
              <div>
                <p className="label">Status</p>
                <p className="mt-1 font-semibold">{project.status}</p>
              </div>
              <div>
                <p className="label">Owner</p>
                <p className="mt-1 font-semibold">{project.owner}</p>
              </div>
              <div>
                <p className="label">Bugs</p>
                <p className="mt-1 font-semibold">{projectBugs.length}</p>
              </div>
            </div>
            <div className="mt-5 grid gap-3 border-t border-line pt-5 sm:grid-cols-3">
              <a className="btn-muted justify-start" href={project.projectUrl || "#"} target="_blank" rel="noreferrer">
                <ExternalLink size={16} />
                Project URL
              </a>
              <a className="btn-muted justify-start" href={project.githubUrl || "#"} target="_blank" rel="noreferrer">
                <Github size={16} />
                GitHub
              </a>
              <a className="btn-muted justify-start" href={project.testUrl || "#"} target="_blank" rel="noreferrer">
                <ExternalLink size={16} />
                Test Environment
              </a>
            </div>
            <div className="mt-4">
              <p className="label">Technology Stack</p>
              <p className="mt-1 text-sm font-semibold text-slate-600">{project.techStack || "Not set"}</p>
            </div>
          </article>

          <section className="surface overflow-hidden rounded-md">
            <div className="border-b border-line px-5 py-4">
              <h2 className="font-bold">Project bugs</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Bug</th>
                    <th className="px-4 py-3 font-semibold">Assigned To</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Priority</th>
                    <th className="px-4 py-3 font-semibold">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {projectBugs.map((bug) => (
                    <tr key={bug.id}>
                      <td className="px-4 py-4">
                        <Link className="font-semibold text-brand" to={`/bugs/${bug.id}`}>
                          {bug.ticketId}
                        </Link>
                        <p className="mt-1 text-xs text-slate-500">{bug.title}</p>
                      </td>
                      <td className="px-4 py-4 text-slate-600">{bug.assignedTo}</td>
                      <td className="px-4 py-4">
                        <Badge value={bug.status} />
                      </td>
                      <td className="px-4 py-4">
                        <Badge value={bug.priority} type="priority" />
                      </td>
                      <td className="px-4 py-4 text-slate-600">{formatDate(bug.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {projectBugs.length === 0 ? <div className="px-5 py-8 text-sm text-slate-500">No bugs are linked to this project.</div> : null}
          </section>
        </section>

        <aside className="surface h-fit rounded-md p-5">
          <div className="mb-4 flex items-center gap-2">
            <UserPlus size={18} />
            <h2 className="font-bold">Project members</h2>
          </div>
          {canManageMembers ? (
            <div className="flex gap-2">
              <select className="input" value={selectedUserId} onChange={(event) => setSelectedUserId(event.target.value)}>
                <option value="">Select member</option>
                {availableUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.fullname}
                  </option>
                ))}
              </select>
              <button className="btn-primary h-10 w-10 p-0" type="button" onClick={handleAddMember} aria-label="Add member">
                <Plus size={17} />
              </button>
            </div>
          ) : null}

          <div className="mt-4 space-y-3">
            {projectMembers.map((member) => (
              <div key={member.id} className="flex items-center justify-between gap-3 rounded-md border border-line bg-white p-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-md bg-ink text-xs font-bold text-white">{initials(member.fullname)}</span>
                  <div>
                    <p className="text-sm font-semibold">{member.fullname}</p>
                    <p className="text-xs capitalize text-slate-500">{member.role}</p>
                  </div>
                </div>
                {canManageMembers ? (
                  <button className="btn-muted h-9 w-9 p-0 text-red-600" type="button" onClick={() => handleRemoveMember(member.id)} aria-label={`Remove ${member.fullname}`}>
                    <Trash2 size={15} />
                  </button>
                ) : null}
              </div>
            ))}
            {projectMembers.length === 0 ? <p className="text-sm text-slate-500">No members added yet.</p> : null}
          </div>
        </aside>
      </div>
    </>
  );
}
