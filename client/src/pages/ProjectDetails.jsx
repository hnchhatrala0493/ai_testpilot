import { ArrowLeft, Bot, Bug, CheckCircle2, ClipboardList, Code2, ExternalLink, FileText, Github, Play, RefreshCcw, Rocket, Plus, ServerCog, ShieldCheck, Trash2, UserPlus } from "lucide-react";
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

const projectStages = [
  { id: "requirements", label: "Requirement Analysis", icon: FileText },
  { id: "development", label: "Development", icon: Github },
  { id: "ai-testing", label: "QA Testing", icon: Bot },
  { id: "uat-testing", label: "UAT Testing", icon: CheckCircle2 },
  { id: "production-validation", label: "Production Validation", icon: Rocket },
  { id: "reports", label: "Reports", icon: ShieldCheck },
];

const testingPipeline = [
  { label: "Requirement Analysis", icon: FileText, state: "done" },
  { label: "Test Case Generation", icon: ClipboardList, state: "done" },
  { label: "Automation Script Generation", icon: Code2, state: "active" },
  { label: "Test Execution", icon: Play, state: "pending" },
  { label: "Bug Creation", icon: Bug, state: "pending" },
  { label: "Retesting", icon: RefreshCcw, state: "pending" },
  { label: "UAT Validation", icon: CheckCircle2, state: "pending" },
  { label: "Production Validation", icon: Rocket, state: "pending" },
];

const testExecutionTypes = [
  { suite: "UI Testing", icon: Bot, status: "Ready" },
  { suite: "API Testing", icon: Code2, status: "Ready" },
  { suite: "Regression Testing", icon: RefreshCcw, status: "Ready" },
  { suite: "Security Testing", icon: ShieldCheck, status: "Planned" },
  { suite: "Performance Testing", icon: Rocket, status: "Planned" },
  { suite: "Database Testing", icon: ServerCog, status: "Planned" },
  { suite: "Cross Browser Testing", icon: ExternalLink, status: "Queued" },
  { suite: "Mobile Testing", icon: Play, status: "Queued" },
];

const aiBugAnalysis = {
  rootCause: "Reports API cache issue",
  severity: "Medium",
  confidence: "92%",
  suggestedFix: "Refresh report aggregation after status update.",
};

const autoBugWorkflow = ["Failed", "AI Generated Bug", "Assigned Group", "Developer", "Retest Required"];

const aiBugCard = {
  bugId: "BUG-101",
  module: "Reports",
  aiSeverity: "High",
  assigned: "Backend Team",
  status: "Open",
};

const lifecycleProgress = [
  { label: "Requirement", mark: "✓", state: "done" },
  { label: "Development", mark: "✓", state: "done" },
  { label: "QA Testing", mark: "✓", state: "done" },
  { label: "UAT", mark: "⏳", state: "active" },
  { label: "Production", mark: "⏳", state: "pending" },
];

const projectLifecycle = [
  { label: "Requirement", progress: 100, tone: "bg-emerald-500" },
  { label: "Development", progress: 80, tone: "bg-blue-500" },
  { label: "Testing", progress: 65, tone: "bg-violet-500" },
  { label: "UAT", progress: 20, tone: "bg-amber-500" },
  { label: "Production", progress: 0, tone: "bg-slate-400" },
];

const pipelineStateClasses = {
  done: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  active: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200",
  pending: "border-line bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400",
};

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
  const [activeStage, setActiveStage] = useState("requirements");
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
  const openProjectBugs = projectBugs.filter((bug) => !["Closed", "Fixed"].includes(bug.status));
  const highPriorityBugs = projectBugs.filter((bug) => ["High", "Critical"].includes(bug.priority));
  const generatedTests = testExecutionTypes.map((type) => ({
    ...type,
    title: `Run ${type.suite.toLowerCase()} for ${project.name}`,
  }));

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

      <section className="surface mb-5 rounded-md p-5">
        <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="label">Project</p>
            <h2 className="text-lg font-bold">Project Lifecycle Dashboard</h2>
          </div>
          <p className="text-sm font-semibold text-slate-500">Lifecycle completion across delivery stages.</p>
        </div>
        <div className="space-y-4">
          {projectLifecycle.map((stage) => (
            <div key={stage.label} className="grid gap-2 sm:grid-cols-[150px_1fr_56px] sm:items-center">
              <p className="font-semibold">{stage.label}</p>
              <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div className={`h-full rounded-full ${stage.tone}`} style={{ width: `${stage.progress}%` }} />
              </div>
              <p className="text-right text-sm font-bold">{stage.progress}%</p>
            </div>
          ))}
        </div>
      </section>

      <section className="surface mb-5 rounded-md p-5">
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="label">Project Stage</p>
            <h2 className="text-lg font-bold">Testing Pipeline</h2>
          </div>
          <p className="text-sm font-semibold text-slate-500">Requirement and Development complete, UAT in progress.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-5">
          {lifecycleProgress.map((stage, index) => (
            <div key={stage.label} className="relative">
              {index < lifecycleProgress.length - 1 ? (
                <div className={`absolute left-[calc(50%+1.25rem)] right-[calc(-50%+1.25rem)] top-5 hidden h-0.5 md:block ${stage.state === "pending" ? "bg-slate-200 dark:bg-slate-700" : "bg-emerald-300 dark:bg-emerald-700"}`} />
              ) : null}
              <div className="relative flex flex-col items-center gap-2 rounded-md border border-line bg-white p-3 text-center dark:border-slate-700 dark:bg-slate-950">
                <span className={`grid h-10 w-10 place-items-center rounded-md border text-base font-bold ${pipelineStateClasses[stage.state]}`}>
                  {stage.mark}
                </span>
                <span className="text-sm font-semibold">{stage.label}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="mb-5 overflow-x-auto">
        <div className="flex min-w-max gap-2 rounded-md border border-line bg-white p-2 dark:border-slate-700 dark:bg-slate-900">
          {projectStages.map((stage) => {
            const Icon = stage.icon;
            const active = activeStage === stage.id;

            return (
              <button
                key={stage.id}
                className={`btn whitespace-nowrap border ${
                  active
                    ? "border-brand bg-brand text-white"
                    : "border-line bg-white text-ink hover:bg-mist dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                }`}
                type="button"
                onClick={() => setActiveStage(stage.id)}
              >
                <Icon size={17} />
                {stage.label}
              </button>
            );
          })}
        </div>
      </div>

      {activeStage === "requirements" ? (
        <section className="grid gap-5 xl:grid-cols-[1fr_360px]">
          <article className="surface rounded-md p-5">
            <div className="mb-4 flex items-center gap-2">
              <FileText size={19} />
              <h2 className="font-bold">Requirements</h2>
            </div>
            <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{project.description || "No requirement summary added yet."}</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
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
            </div>
          </article>
          <aside className="surface h-fit rounded-md p-5">
            <h2 className="font-bold">Requirement checklist</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
              {["Business requirement captured", "Acceptance criteria reviewed", "Test scope identified", "Release risks documented"].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </aside>
        </section>
      ) : null}

      {activeStage === "development" ? (
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
      ) : null}

      {activeStage === "ai-testing" ? (
        <section className="space-y-5">
          <article className="surface rounded-md p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="label">Project Stage</p>
                <h2 className="font-bold">QA Testing Pipeline</h2>
              </div>
              <button className="btn-primary" type="button" onClick={() => toast.info(`AI testing queued for ${project.name}.`)}>
                <Bot size={17} />
                Run AI Testing
              </button>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {testingPipeline.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div key={step.label} className={`rounded-md border p-4 ${pipelineStateClasses[step.state]}`}>
                    <div className="flex items-center justify-between gap-3">
                      <span className="grid h-9 w-9 place-items-center rounded-md bg-white/75 dark:bg-slate-900/75">
                        <Icon size={17} />
                      </span>
                      <span className="text-xs font-bold">{String(index + 1).padStart(2, "0")}</span>
                    </div>
                    <p className="mt-3 text-sm font-bold">{step.label}</p>
                    <p className="mt-1 text-xs font-semibold capitalize">{step.state === "done" ? "Completed" : step.state === "active" ? "In progress" : "Pending"}</p>
                  </div>
                );
              })}
            </div>
          </article>

          <div className="grid gap-4 sm:grid-cols-3">
            <article className="surface rounded-md p-5">
              <p className="label">Generated Test Cases</p>
              <p className="mt-2 text-3xl font-bold">{generatedTests.length}</p>
            </article>
            <article className="surface rounded-md p-5">
              <p className="label">Open Bugs</p>
              <p className="mt-2 text-3xl font-bold">{openProjectBugs.length}</p>
            </article>
            <article className="surface rounded-md p-5">
              <p className="label">High Risk Defects</p>
              <p className="mt-2 text-3xl font-bold">{highPriorityBugs.length}</p>
            </article>
          </div>

          <article className="surface rounded-md p-5">
            <div className="mb-4 flex items-center gap-2">
              <Play size={19} />
              <h2 className="font-bold">Test Execution Types</h2>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {testExecutionTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <div key={type.suite} className="rounded-md border border-line bg-white p-4 dark:border-slate-700 dark:bg-slate-950">
                    <div className="flex items-center justify-between gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-md bg-blue-50 text-brand dark:bg-blue-950 dark:text-blue-200">
                        <Icon size={18} />
                      </span>
                      <Badge value={type.status} />
                    </div>
                    <p className="mt-3 font-semibold">{type.suite}</p>
                  </div>
                );
              })}
            </div>
          </article>

          <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
            <article className="surface rounded-md p-5">
              <div className="mb-4 flex items-center gap-2">
                <Bot size={19} />
                <h2 className="font-bold">AI Bug Analysis Panel</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-md border border-line bg-white p-4 dark:border-slate-700 dark:bg-slate-950">
                  <p className="label">Root Cause</p>
                  <p className="mt-2 font-semibold">{aiBugAnalysis.rootCause}</p>
                </div>
                <div className="rounded-md border border-line bg-white p-4 dark:border-slate-700 dark:bg-slate-950">
                  <p className="label">Severity</p>
                  <p className="mt-2 font-semibold">{aiBugAnalysis.severity}</p>
                </div>
                <div className="rounded-md border border-line bg-white p-4 dark:border-slate-700 dark:bg-slate-950">
                  <p className="label">Confidence</p>
                  <p className="mt-2 font-semibold">{aiBugAnalysis.confidence}</p>
                </div>
                <div className="rounded-md border border-line bg-white p-4 dark:border-slate-700 dark:bg-slate-950">
                  <p className="label">Suggested Fix</p>
                  <p className="mt-2 font-semibold">{aiBugAnalysis.suggestedFix}</p>
                </div>
              </div>

              <div className="mt-5 border-t border-line pt-5 dark:border-slate-700">
                <h3 className="font-bold">Auto Bug Creation Workflow</h3>
                <div className="mt-4 grid gap-3 md:grid-cols-5">
                  {autoBugWorkflow.map((step, index) => (
                    <div key={step} className="relative">
                      {index < autoBugWorkflow.length - 1 ? <div className="absolute left-[calc(50%+1.25rem)] right-[calc(-50%+1.25rem)] top-5 hidden h-0.5 bg-blue-200 dark:bg-blue-900 md:block" /> : null}
                      <div className="relative rounded-md border border-blue-200 bg-blue-50 p-3 text-center text-sm font-semibold text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200">
                        <span className="mx-auto mb-2 grid h-9 w-9 place-items-center rounded-md bg-white dark:bg-slate-900">
                          {index + 1}
                        </span>
                        {step}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </article>

            <aside className="surface h-fit rounded-md p-5">
              <div className="mb-4 flex items-center gap-2">
                <Bug size={19} />
                <h2 className="font-bold">AI Generated Bug</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="label">Bug ID</p>
                  <p className="mt-1 text-lg font-bold">{aiBugCard.bugId}</p>
                </div>
                <div>
                  <p className="label">Module</p>
                  <p className="mt-1 font-semibold">{aiBugCard.module}</p>
                </div>
                <div>
                  <p className="label">AI Severity</p>
                  <p className="mt-1 font-semibold">{aiBugCard.aiSeverity}</p>
                </div>
                <div>
                  <p className="label">Assigned</p>
                  <p className="mt-1 font-semibold">{aiBugCard.assigned}</p>
                </div>
                <div>
                  <p className="label">Status</p>
                  <div className="mt-2">
                    <Badge value={aiBugCard.status} />
                  </div>
                </div>
              </div>
            </aside>
          </div>

          <article className="surface rounded-md p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Bot size={19} />
                <h2 className="font-bold">Project AI testing</h2>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {generatedTests.map((test) => (
                <div key={test.title} className="rounded-md border border-line bg-white p-4 dark:border-slate-700 dark:bg-slate-950">
                  <p className="text-xs font-semibold uppercase text-slate-500">{test.suite}</p>
                  <p className="mt-2 text-sm font-semibold">{test.title}</p>
                  <Badge value={test.status} />
                </div>
              ))}
            </div>
          </article>
        </section>
      ) : null}

      {activeStage === "uat-testing" ? (
        <section className="surface rounded-md p-5">
          <div className="mb-4 flex items-center gap-2">
            <CheckCircle2 size={19} />
            <h2 className="font-bold">UAT Testing</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {["Business users assigned", "UAT scenarios prepared", "User feedback captured", "UAT sign-off ready"].map((item) => (
              <div key={item} className="rounded-md border border-line bg-white p-4 dark:border-slate-700 dark:bg-slate-950">
                <p className="font-semibold">{item}</p>
                <p className="mt-1 text-sm text-slate-500">Track this checkpoint for {project.name}.</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {activeStage === "production-validation" ? (
        <section className="surface rounded-md p-5">
          <div className="mb-4 flex items-center gap-2">
            <ServerCog size={19} />
            <h2 className="font-bold">Production Validation</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {["Deployment smoke test", "Production URL validation", "Monitoring and rollback check"].map((item) => (
              <div key={item} className="rounded-md border border-line bg-white p-4 dark:border-slate-700 dark:bg-slate-950">
                <p className="font-semibold">{item}</p>
                <p className="mt-1 text-sm text-slate-500">Ready for release validation.</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {activeStage === "reports" ? (
        <section className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <article className="surface rounded-md p-5">
              <p className="label">Total Bugs</p>
              <p className="mt-2 text-3xl font-bold">{projectBugs.length}</p>
            </article>
            <article className="surface rounded-md p-5">
              <p className="label">Open Bugs</p>
              <p className="mt-2 text-3xl font-bold">{openProjectBugs.length}</p>
            </article>
            <article className="surface rounded-md p-5">
              <p className="label">Members</p>
              <p className="mt-2 text-3xl font-bold">{projectMembers.length}</p>
            </article>
          </div>
          <section className="surface overflow-hidden rounded-md">
            <div className="border-b border-line px-5 py-4">
              <h2 className="font-bold">Project reports</h2>
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
      ) : null}
    </>
  );
}
