import { ArrowLeft, Bot, UploadCloud } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import PageHeader from "../components/PageHeader.jsx";
import { bugApi, projectApi, userApi } from "../services/api.js";
import { useAuthStore } from "../store/authStore.js";
import { normalizeBug, normalizeProject, normalizeUser } from "../utils/apiNormalizers.js";
import { BUG_PRIORITIES, BUG_STATUSES } from "../utils/constants.js";
import hasPermission from "../utils/hasPermission.js";

function projectName(project) {
  return project.name || project.projectName;
}

const testCaseOptions = [
  { id: "TC-LOGIN-001", title: "Verify login with valid credentials" },
  { id: "TC-LOGIN-002", title: "Verify invalid password validation" },
  { id: "TC-API-001", title: "Verify API contract response" },
  { id: "TC-REG-001", title: "Verify regression suite remains stable" },
];

export default function CreateBug() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [saving, setSaving] = useState(false);
  const currentUser = useAuthStore((state) => state.user);
  const canCreateBug = hasPermission(currentUser, "bugs.create");
  const firstProject = projects[0];
  const firstDeveloper = users.find((user) => user.role === "developer") || users[0];
  const { register, handleSubmit, watch, reset } = useForm({
    defaultValues: {
      projectId: firstProject?.id,
      project: firstProject ? projectName(firstProject) : "",
      testCaseId: testCaseOptions[0].id,
      status: "Open",
      severity: "Medium",
      priority: "Medium",
      assignedTo: firstDeveloper?.fullname,
      assignedToId: firstDeveloper?.id,
      createdByAI: false,
    },
  });
  const screenshot = watch("screenshot");
  const screenshotName = screenshot?.[0]?.name;

  useEffect(() => {
    let active = true;

    async function loadCreateBugData() {
      try {
        const [projectsResponse, usersResponse] = await Promise.all([
          projectApi.list(),
          userApi.list(),
        ]);
        const projectList = (projectsResponse.data?.result || []).map(normalizeProject);
        const userList = (usersResponse.data?.result || []).map(normalizeUser);
        const defaultProject = projectList[0];
        const defaultDeveloper = userList.find((user) => user.role === "developer") || userList[0];

        if (active) {
          setProjects(projectList);
          setUsers(userList);
          reset({
            projectId: defaultProject?.id || "",
            project: defaultProject ? projectName(defaultProject) : "",
            testCaseId: "",
            status: "Open",
            severity: "Medium",
            priority: "Medium",
            assignedTo: defaultDeveloper?.fullname || "",
            assignedToId: defaultDeveloper?.id || "",
            createdByAI: false,
          });
        }
      } catch (error) {
        if (active) {
          toast.error(error.response?.data?.message || "Unable to load bug form data");
        }
      }
    }

    loadCreateBugData();

    return () => {
      active = false;
    };
  }, [reset]);

  const onSubmit = async (values) => {
    if (!canCreateBug) {
      toast.error("You do not have permission to create bugs.");
      return;
    }

    const selectedProject = projects.find((project) => project.id === values.projectId);
    const selectedUser = users.find((user) => user.id === values.assignedToId);

    try {
      setSaving(true);
      const response = await bugApi.create({
        ...values,
        projectId: selectedProject?.id || values.projectId,
        assignedTo: selectedUser?.id || values.assignedToId,
        screenshot: values.screenshot?.[0]?.name || "",
        reporter: currentUser?.fullname || currentUser?.name,
      });
      const bug = normalizeBug(response.data?.result);
      toast.success(response.data?.message || "Bug created successfully");
      navigate(`/bugs/${bug.id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to create bug");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Create bug report"
        description="Create a structured bug using the Bug Model fields for AI automation testing."
        action={
          <Link className="btn-muted" to="/bugs">
            <ArrowLeft size={17} />
            Back
          </Link>
        }
      />
      <form className="grid gap-5 xl:grid-cols-[1fr_360px]" onSubmit={handleSubmit(onSubmit)}>
        <section className="space-y-5">
          <div className="surface rounded-md p-5">
            <h2 className="mb-4 font-bold">Bug details</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="label">Project ID</span>
                <select className="input mt-1" {...register("projectId", { required: true })}>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {projectName(project)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="label">Test Case ID</span>
                <select className="input mt-1" {...register("testCaseId")}>
                  <option value="">No test case reference</option>
                  {testCaseOptions.map((testCase) => (
                    <option key={testCase.id} value={testCase.id}>
                      {testCase.id} - {testCase.title}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block md:col-span-2">
                <span className="label">Title</span>
                <input className="input mt-1" {...register("title", { required: true })} placeholder="Short, searchable bug title" />
              </label>
              <label className="block md:col-span-2">
                <span className="label">Description</span>
                <textarea className="input mt-1 min-h-32 resize-y" {...register("description", { required: true })} placeholder="What failed and where it happened" />
              </label>
              <label className="block md:col-span-2">
                <span className="label">Steps To Reproduce</span>
                <textarea className="input mt-1 min-h-32 resize-y" {...register("stepsToReproduce")} placeholder={"1. Open login page\n2. Enter invalid password\n3. Click Login"} />
              </label>
              <label className="block">
                <span className="label">Expected Result</span>
                <textarea className="input mt-1 min-h-28 resize-y" {...register("expectedResult")} placeholder="What should happen" />
              </label>
              <label className="block">
                <span className="label">Actual Result</span>
                <textarea className="input mt-1 min-h-28 resize-y" {...register("actualResult")} placeholder="What actually happened" />
              </label>
              <label className="block md:col-span-2">
                <span className="label">Suggested Fix</span>
                <textarea className="input mt-1 min-h-24 resize-y" {...register("suggestedFix")} placeholder="AI or tester suggested fix idea" />
              </label>
            </div>
          </div>

          <div className="surface rounded-md p-5">
            <h2 className="mb-4 font-bold">Evidence</h2>
            <label className="block">
              <span className="label">Screenshot</span>
              <div className="mt-1 flex min-h-28 flex-col items-center justify-center rounded-md border border-dashed border-line bg-slate-50 px-4 py-5 text-center dark:bg-slate-950">
                <UploadCloud className="text-slate-400" size={28} />
                <input className="mt-3 text-sm" type="file" accept="image/*" {...register("screenshot")} />
                {screenshotName ? <p className="mt-2 text-xs font-semibold text-brand">{screenshotName}</p> : null}
              </div>
            </label>
          </div>
        </section>

        <aside className="surface h-fit rounded-md p-5">
          <div className="mb-4 flex items-center gap-2">
            <Bot size={18} />
            <h2 className="font-bold">Classification</h2>
          </div>
          <div className="space-y-4">
            <label className="block">
              <span className="label">Severity</span>
              <select className="input mt-1" {...register("severity")}>
                {BUG_PRIORITIES.map((severity) => (
                  <option key={severity}>{severity}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="label">Priority</span>
              <select className="input mt-1" {...register("priority")}>
                {BUG_PRIORITIES.map((priority) => (
                  <option key={priority}>{priority}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="label">Status</span>
              <select className="input mt-1" {...register("status")}>
                {BUG_STATUSES.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="label">Assigned To</span>
              <select className="input mt-1" {...register("assignedToId")}>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.fullname || user.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-start gap-3 rounded-md border border-line bg-slate-50 p-3 text-sm dark:bg-slate-950">
              <input className="mt-1 h-4 w-4" type="checkbox" {...register("createdByAI")} />
              <span>
                <span className="block font-semibold">Created By AI</span>
                <span className="text-slate-500">Mark this if the bug came from AI failure analysis.</span>
              </span>
            </label>
            <button className="btn-primary w-full" type="submit" disabled={saving || !canCreateBug}>
              {saving ? "Creating..." : "Create bug"}
            </button>
          </div>
        </aside>
      </form>
    </>
  );
}
