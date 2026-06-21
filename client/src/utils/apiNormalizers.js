export function normalizeUser(user = {}) {
  return {
    ...user,
    id: user.id || user._id,
    fullname: user.fullName || user.fullname || user.name || user.email || "Unassigned",
  };
}

export function normalizeProject(project = {}) {
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

export function normalizeBug(bug = {}) {
  const project = bug.projectId || {};
  const assignedUser = bug.assignedTo || {};
  const id = bug.id || bug._id;

  return {
    ...bug,
    id,
    ticketId: bug.ticketId || `BUG-${String(id || "").slice(-4).toUpperCase()}`,
    projectId: typeof bug.projectId === "object" ? project._id || project.id : bug.projectId,
    project: bug.project || project.projectName || project.name || "Not linked",
    assignedToId: typeof bug.assignedTo === "object" ? assignedUser._id || assignedUser.id : bug.assignedTo,
    assignedTo: bug.assignedToName || assignedUser.fullName || assignedUser.name || assignedUser.email || "Unassigned",
    comments: bug.comments || [],
    internalNotes: bug.internalNotes || [],
    stepsToReproduce: Array.isArray(bug.stepsToReproduce) ? bug.stepsToReproduce : [],
    priority: bug.priority || bug.severity || "Medium",
    status: bug.status || "Open",
  };
}
