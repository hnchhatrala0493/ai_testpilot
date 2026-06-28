const { Project } = require("../models/project.model");
const { User } = require("../models/user.model");
const { sendProjectInvitationEmail } = require("../services/email.service");
const { buildRepositoryContext } = require("../services/githubRepository.service");
const { scopedFilter, withCompany } = require("../utils/companyScope");

function normalizeProjectPayload(body, user) {
  const techStack = Array.isArray(body.techStack || body.technologyStack)
    ? body.techStack || body.technologyStack
    : String(body.techStack || body.technologyStack || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

  return {
    projectName: body.projectName || body.name,
    description: body.description,
    projectUrl: body.projectUrl,
    githubUrl: body.githubUrl,
    testUrl: body.testUrl,
    category: body.category,
    status: body.status,
    techStack,
    createdBy: body.createdBy || user?._id,
    members: body.members || [],
  };
}

exports.createProject = async (req, res) => {
  try {
    const project = await Project.create(withCompany(normalizeProjectPayload(req.body, req.user), req.user));
    if (project.members?.length) {
      const members = await User.find({ _id: { $in: project.members } }).select("name fullName email");
      members.forEach((member) => {
        sendProjectInvitationEmail({
          to: member.email,
          name: member.fullName || member.name,
          projectName: project.projectName,
          invitedBy: req.user?.fullName || req.user?.name || req.user?.email,
        }).catch((mailError) => console.log("Project invitation email failed:", mailError.message));
      });
    }
    res.status(201).json({ result: project, message: "Project created successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getProjects = async (req, res) => {
  try {
    const projects = await Project.find(scopedFilter(req.user))
      .populate("createdBy", "name email role")
      .populate("members", "name email role")
      .sort({ createdAt: -1 });
    res.status(200).json({ result: projects });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findOne(scopedFilter(req.user, { _id: req.params.id }))
      .populate("createdBy", "name email role")
      .populate("members", "name email role");
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.status(200).json({ result: project });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getProjectRepositoryContext = async (req, res) => {
  try {
    const project = await Project.findOne(scopedFilter(req.user, { _id: req.params.id }));
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (!project.githubUrl) return res.status(400).json({ message: "Project GitHub URL is not configured" });

    const context = await buildRepositoryContext(project.githubUrl);

    res.status(200).json({
      result: {
        projectId: project._id,
        projectName: project.projectName,
        ...context,
      },
    });
  } catch (error) {
    res.status(error.status || 400).json({ message: error.message });
  }
};

exports.updateProject = async (req, res) => {
  try {
    const project = await Project.findOneAndUpdate(
      scopedFilter(req.user, { _id: req.params.id }),
      withCompany(normalizeProjectPayload(req.body, req.user), req.user),
      { new: true, runValidators: true },
    );
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.status(200).json({ result: project, message: "Project updated successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findOneAndDelete(scopedFilter(req.user, { _id: req.params.id }));
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.status(200).json({ message: "Project deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
