import { create } from "zustand";
import { sampleBugs, sampleProjects, sampleUsers } from "./sampleData.js";
import { useAuditStore } from "./auditStore.js";
import { useCollaborationStore } from "./collaborationStore.js";

function audit(entry) {
  useAuditStore.getState().addLog(entry);
}

export const useBugStore = create((set, get) => ({
  bugs: sampleBugs,
  projects: sampleProjects,
  users: sampleUsers,
  addBug: (bug) => {
    const stepsToReproduce = Array.isArray(bug.stepsToReproduce)
      ? bug.stepsToReproduce
      : String(bug.stepsToReproduce || "")
          .split("\n")
          .map((step) => step.trim())
          .filter(Boolean);
    const nextBug = {
      ...bug,
      id: `b-${Date.now()}`,
      ticketId: `BUG-${1030 + get().bugs.length}`,
      createdAt: new Date().toISOString(),
      comments: [],
      expectedResult: bug.expectedResult || "System should match the expected workflow behavior.",
      actualResult: bug.actualResult || bug.description,
      severity: bug.severity || bug.priority || "Medium",
      stepsToReproduce,
      suggestedFix: bug.suggestedFix || "",
      testCaseId: bug.testCaseId || "",
      testCaseReference: bug.testCaseReference || bug.testCaseId || "",
      createdByAI: Boolean(bug.createdByAI),
    };
    set((state) => ({ bugs: [nextBug, ...state.bugs] }));
    audit({
      actor: bug.reporter || "System",
      action: "Created bug",
      module: "Bugs",
      target: nextBug.ticketId,
      details: nextBug.title,
      severity: nextBug.priority === "Critical" ? "High" : "Medium",
    });
    return nextBug.id;
  },
  updateBug: (id, updates) => {
    const bug = get().bugs.find((item) => item.id === id);
    set((state) => ({
      bugs: state.bugs.map((bug) => (bug.id === id ? { ...bug, ...updates } : bug)),
    }));
    if (bug) {
      audit({
        actor: "Current User",
        action: updates.status ? "Changed bug status" : updates.priority ? "Changed bug priority" : "Updated bug",
        module: "Bugs",
        target: bug.ticketId,
        details: Object.entries(updates)
          .map(([key, value]) => `${key}: ${value}`)
          .join(", "),
        severity: updates.priority === "Critical" || bug.priority === "Critical" ? "High" : "Low",
      });
    }
  },
  addComment: (id, message, author) => {
    const bug = get().bugs.find((item) => item.id === id);
    const comment = {
      id: `c-${Date.now()}`,
      author,
      message,
      type: "comment",
      createdAt: new Date().toISOString(),
    };
    const mentionedUsers = useCollaborationStore.getState().getMentionedUsers(message, get().users);
    set((state) => ({
      bugs: state.bugs.map((bug) =>
        bug.id === id ? { ...bug, comments: [comment, ...bug.comments] } : bug,
      ),
    }));
    mentionedUsers.forEach((user) => {
      useCollaborationStore.getState().addEmailNotification({
        to: user.email,
        subject: `Mentioned on ${bug?.ticketId || "bug discussion"}`,
        body: `${author} mentioned you: ${message}`,
      });
    });
    audit({
      actor: author,
      action: "Added comment",
      module: "Bugs",
      target: bug?.ticketId || id,
      details: message.slice(0, 120),
      severity: "Low",
    });
  },
  addInternalNote: (id, message, author) => {
    const bug = get().bugs.find((item) => item.id === id);
    const note = {
      id: `n-${Date.now()}`,
      author,
      message,
      type: "note",
      createdAt: new Date().toISOString(),
    };
    const mentionedUsers = useCollaborationStore.getState().getMentionedUsers(message, get().users);
    set((state) => ({
      bugs: state.bugs.map((bug) =>
        bug.id === id ? { ...bug, internalNotes: [note, ...(bug.internalNotes || [])] } : bug,
      ),
    }));
    mentionedUsers.forEach((user) => {
      useCollaborationStore.getState().addEmailNotification({
        to: user.email,
        subject: `Internal note mention on ${bug?.ticketId || "bug"}`,
        body: `${author} mentioned you in an internal note: ${message}`,
      });
    });
    audit({
      actor: author,
      action: "Added internal note",
      module: "Bugs",
      target: bug?.ticketId || id,
      details: message.slice(0, 120),
      severity: "Medium",
    });
  },
  addProject: (project) => {
    const owner = get().users.find((user) => user.fullname === project.owner) || get().users[0];
    set((state) => ({
      projects: [
        {
          ...project,
          id: `p-${Date.now()}`,
          status: "Active",
          category: project.category || "Software",
          projectUrl: project.projectUrl || "",
          githubUrl: project.githubUrl || "",
          testUrl: project.testUrl || "",
          techStack: project.techStack || "",
          memberIds: owner ? [owner.id] : [],
          bugCount: 0,
          createdAt: new Date().toISOString(),
        },
        ...state.projects,
      ],
    }));
    audit({
      actor: project.owner || "Current User",
      action: "Created project",
      module: "Projects",
      target: project.name,
      details: `Category: ${project.category || "Software"}`,
      severity: "Medium",
    });
  },
  updateProject: (id, updates) => {
    const project = get().projects.find((item) => item.id === id);
    set((state) => ({
      projects: state.projects.map((project) =>
        project.id === id ? { ...project, ...updates } : project,
      ),
    }));
    if (project) {
      audit({
        actor: "Current User",
        action: "Updated project",
        module: "Projects",
        target: project.name,
        details: Object.keys(updates).join(", "),
        severity: "Medium",
      });
    }
  },
  deleteProject: (id) => {
    const project = get().projects.find((item) => item.id === id);
    set((state) => ({
      projects: state.projects.filter((project) => project.id !== id),
    }));
    audit({
      actor: "Current User",
      action: "Deleted project",
      module: "Projects",
      target: project?.name || id,
      details: "Project removed from active list.",
      severity: "High",
    });
  },
  addProjectMember: (projectId, userId) => {
    const project = get().projects.find((item) => item.id === projectId);
    const user = get().users.find((item) => item.id === userId);
    set((state) => ({
      projects: state.projects.map((project) => {
        if (project.id !== projectId || project.memberIds?.includes(userId)) return project;
        return { ...project, memberIds: [...(project.memberIds || []), userId] };
      }),
    }));
    audit({
      actor: "Current User",
      action: "Added project member",
      module: "Projects",
      target: project?.name || projectId,
      details: user?.fullname || userId,
      severity: "Low",
    });
  },
  removeProjectMember: (projectId, userId) => {
    const project = get().projects.find((item) => item.id === projectId);
    const user = get().users.find((item) => item.id === userId);
    set((state) => ({
      projects: state.projects.map((project) =>
        project.id === projectId
          ? { ...project, memberIds: (project.memberIds || []).filter((id) => id !== userId) }
          : project,
      ),
    }));
    audit({
      actor: "Current User",
      action: "Removed project member",
      module: "Projects",
      target: project?.name || projectId,
      details: user?.fullname || userId,
      severity: "Medium",
    });
  },
  updateUser: (id, updates) => {
    const user = get().users.find((item) => item.id === id);
    set((state) => ({
      users: state.users.map((user) => (user.id === id ? { ...user, ...updates } : user)),
    }));
    audit({
      actor: "Current User",
      action: "Updated user",
      module: "Users",
      target: user?.fullname || id,
      details: Object.entries(updates)
        .map(([key, value]) => `${key}: ${value}`)
        .join(", "),
      severity: "Medium",
    });
  },
}));
