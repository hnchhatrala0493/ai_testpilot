import { ArrowLeft, LockKeyhole, MessageSquare, Paperclip } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, Navigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import AIBugAssistant from "../components/AIBugAssistant.jsx";
import Badge from "../components/Badge.jsx";
import PageHeader from "../components/PageHeader.jsx";
import { bugApi, userApi } from "../services/api.js";
import { useAuthStore } from "../store/authStore.js";
import { useBugStore } from "../store/bugStore.js";
import { normalizeBug, normalizeUser } from "../utils/apiNormalizers.js";
import { BUG_PRIORITIES, BUG_STATUSES } from "../utils/constants.js";
import { formatDate } from "../utils/format.js";
import hasPermission from "../utils/hasPermission.js";

export default function BugDetails() {
  const { id } = useParams();
  const [bug, setBug] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const bugs = useBugStore((state) => state.bugs);
  const user = useAuthStore((state) => state.user);
  const canAssignBug = hasPermission(user, "bug:assign");
  const canUpdateBug = hasPermission(user, "bugs.update");
  const canCommentBug = hasPermission(user, "bugs.comment");
  const canAddInternalNote = hasPermission(user, "bugs.internal-note");
  const commentForm = useForm();
  const noteForm = useForm();

  useEffect(() => {
    let active = true;

    async function loadBugDetails() {
      try {
        setLoading(true);
        const [bugResponse, usersResponse] = await Promise.all([
          bugApi.get(id),
          userApi.list(),
        ]);

        if (active) {
          setBug(normalizeBug(bugResponse.data?.result));
          setUsers((usersResponse.data?.result || []).map(normalizeUser));
        }
      } catch (error) {
        if (active) {
          toast.error(error.response?.data?.message || "Unable to load bug details");
          setBug(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadBugDetails();

    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return <div className="surface rounded-md p-6 text-sm text-slate-500">Loading bug...</div>;
  }

  if (!bug) return <Navigate to="/bugs" replace />;

  const updateBug = async (bugId, updates) => {
    if (!canUpdateBug && !("assignedToId" in updates && canAssignBug)) {
      toast.error("You do not have permission to update this bug.");
      return;
    }

    const previousBug = bug;
    setBug((current) => normalizeBug({ ...current, ...updates }));

    try {
      const response = await bugApi.update(bugId, {
        ...bug,
        ...updates,
        projectId: bug.projectId,
        assignedTo: updates.assignedToId || bug.assignedToId,
      });
      setBug(normalizeBug(response.data?.result));
      toast.success(response.data?.message || "Bug updated successfully");
    } catch (error) {
      setBug(previousBug);
      toast.error(error.response?.data?.message || "Unable to update bug");
    }
  };

  const onComment = async (values) => {
    if (!canCommentBug) {
      toast.error("You do not have permission to add bug comments.");
      return;
    }

    try {
      const response = await bugApi.addComment(bug.id, {
        message: values.message,
        author: user?.fullname || user?.name || "Team member",
      });
      setBug(normalizeBug(response.data?.result));
      toast.success(response.data?.message || "Comment added successfully");
      commentForm.reset();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to add comment");
    }
  };

  const onInternalNote = async (values) => {
    if (!canAddInternalNote) {
      toast.error("You do not have permission to add internal notes.");
      return;
    }

    try {
      const response = await bugApi.addInternalNote(bug.id, {
        message: values.note,
        author: user?.fullname || user?.name || "Team member",
      });
      setBug(normalizeBug(response.data?.result));
      toast.success(response.data?.message || "Internal note added successfully");
      noteForm.reset();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to add internal note");
    }
  };

  return (
    <>
      <PageHeader
        title={bug.ticketId}
        description={bug.title}
        action={
          <Link className="btn-muted" to="/bugs">
            <ArrowLeft size={17} />
            Back
          </Link>
        }
      />
      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <section className="space-y-5">
          <article className="surface rounded-md p-5">
            <div className="mb-4 flex flex-wrap gap-2">
              <Badge value={bug.status} />
              <Badge value={bug.priority} type="priority" />
            </div>
            <h2 className="text-xl font-bold">{bug.title}</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">{bug.description}</p>
            {bug.screenshot ? (
              <div className="mt-5 flex items-center gap-3 rounded-md border border-line bg-slate-50 px-3 py-3 text-sm text-slate-600">
                <Paperclip size={18} />
                <span className="font-semibold">{bug.screenshot}</span>
              </div>
            ) : null}
            <div className="mt-5 grid gap-4 border-t border-line pt-5 md:grid-cols-2">
              <div>
                <p className="label">Expected Result</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">{bug.expectedResult || "Not provided"}</p>
              </div>
              <div>
                <p className="label">Actual Result</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">{bug.actualResult || "Not provided"}</p>
              </div>
              <div>
                <p className="label">Severity</p>
                <p className="mt-1 text-sm font-semibold">{bug.severity || bug.priority}</p>
              </div>
              <div>
                <p className="label">Test Case Reference</p>
                <p className="mt-1 text-sm font-semibold">{bug.testCaseId || bug.testCaseReference || "Manual report"}</p>
              </div>
              <div>
                <p className="label">Project ID</p>
                <p className="mt-1 text-sm font-semibold">{bug.projectId || "Not linked"}</p>
              </div>
              <div>
                <p className="label">Created By AI</p>
                <p className="mt-1 text-sm font-semibold">{bug.createdByAI ? "Yes" : "No"}</p>
              </div>
              <div className="md:col-span-2">
                <p className="label">Steps to Reproduce</p>
                {bug.stepsToReproduce?.length ? (
                  <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm leading-6 text-slate-600">
                    {bug.stepsToReproduce.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                ) : (
                  <p className="mt-1 text-sm text-slate-600">Not provided</p>
                )}
              </div>
              <div className="md:col-span-2">
                <p className="label">Suggested Fix</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">{bug.suggestedFix || "Not provided"}</p>
              </div>
            </div>
          </article>
          <AIBugAssistant bug={bug} bugs={bugs} onApplyPriority={(priority) => updateBug(bug.id, { priority })} canApplyPriority={canUpdateBug} />
          <section className="surface rounded-md p-5">
            <div className="mb-4 flex items-center gap-2">
              <MessageSquare size={18} />
              <h2 className="font-bold">Comments & Discussions</h2>
            </div>
            {canCommentBug ? (
              <form className="mb-5" onSubmit={commentForm.handleSubmit(onComment)}>
                <textarea
                  className="input min-h-24 resize-y"
                  placeholder="Add discussion update. Mention teammates with @dev, @mira, @nisha, @aarav"
                  {...commentForm.register("message", { required: true })}
                />
                <button className="btn-primary mt-3" type="submit">
                  Add discussion
                </button>
              </form>
            ) : null}
            <div className="space-y-3">
              {bug.comments.map((comment) => (
                <div key={comment.id} className="rounded-md border border-line bg-white p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold">{comment.author}</p>
                    <p className="text-xs text-slate-500">{formatDate(comment.createdAt)}</p>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{comment.message}</p>
                  {comment.message.includes("@") ? (
                    <p className="mt-2 text-xs font-semibold text-brand">Mentions detected. Email notification queued.</p>
                  ) : null}
                </div>
              ))}
              {bug.comments.length === 0 ? <p className="text-sm text-slate-500">No comments yet.</p> : null}
            </div>
          </section>

          <section className="surface rounded-md p-5">
            <div className="mb-4 flex items-center gap-2">
              <LockKeyhole size={18} />
              <h2 className="font-bold">Internal Notes</h2>
            </div>
            {canAddInternalNote ? (
              <form className="mb-5" onSubmit={noteForm.handleSubmit(onInternalNote)}>
                <textarea
                  className="input min-h-24 resize-y"
                  placeholder="Add private team note. Mentions still queue internal email notifications."
                  {...noteForm.register("note", { required: true })}
                />
                <button className="btn-muted mt-3" type="submit">
                  Add internal note
                </button>
              </form>
            ) : null}
            <div className="space-y-3">
              {(bug.internalNotes || []).map((note) => (
                <div key={note.id} className="rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold">{note.author}</p>
                    <p className="text-xs text-slate-500">{formatDate(note.createdAt)}</p>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{note.message}</p>
                </div>
              ))}
              {(bug.internalNotes || []).length === 0 ? <p className="text-sm text-slate-500">No internal notes yet.</p> : null}
            </div>
          </section>
        </section>
        <aside className="surface h-fit rounded-md p-5">
          <div className="space-y-4">
            <label className="block">
              <span className="label">Status</span>
              <select className="input mt-1" value={bug.status} onChange={(event) => updateBug(bug.id, { status: event.target.value })} disabled={!canUpdateBug}>
                {BUG_STATUSES.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="label">Priority</span>
              <select className="input mt-1" value={bug.priority} onChange={(event) => updateBug(bug.id, { priority: event.target.value })} disabled={!canUpdateBug}>
                {BUG_PRIORITIES.map((priority) => (
                  <option key={priority}>{priority}</option>
                ))}
              </select>
            </label>
            {canAssignBug ? (
              <label className="block">
                <span className="label">Assigned To</span>
              <select className="input mt-1" value={bug.assignedToId || ""} onChange={(event) => updateBug(bug.id, { assignedToId: event.target.value })}>
                {users.map((item) => (
                    <option key={item.id} value={item.id}>{item.fullname}</option>
                  ))}
                </select>
              </label>
            ) : null}
            <dl className="grid gap-3 border-t border-line pt-4 text-sm">
              <div>
                <dt className="label">Project</dt>
                <dd className="mt-1 font-semibold">{bug.project}</dd>
              </div>
              <div>
                <dt className="label">Assigned To</dt>
                <dd className="mt-1 font-semibold">{bug.assignedTo}</dd>
              </div>
              <div>
                <dt className="label">Reporter</dt>
                <dd className="mt-1 font-semibold">{bug.reporter}</dd>
              </div>
              <div>
                <dt className="label">Created Date</dt>
                <dd className="mt-1 font-semibold">{formatDate(bug.createdAt)}</dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </>
  );
}
