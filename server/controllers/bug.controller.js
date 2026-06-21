const { Bug } = require("../models/bugs.model");
const { User } = require("../models/user.model");
const mongoose = require("mongoose");
const {
  sendAiCriticalBugDetectedEmail,
  sendBugAssignedEmail,
  sendBugStatusChangedEmail,
} = require("../services/email.service");
const { scopedFilter, withCompany } = require("../utils/companyScope");

function normalizeSteps(steps) {
  if (Array.isArray(steps)) return steps;
  return String(steps || "")
    .split("\n")
    .map((step) => step.trim())
    .filter(Boolean);
}

function buildBugPayload(body) {
  const payload = {
    title: body.title,
    description: body.description,
    stepsToReproduce: normalizeSteps(body.stepsToReproduce),
    expectedResult: body.expectedResult,
    actualResult: body.actualResult,
    severity: body.severity || "Medium",
    priority: body.priority || "Medium",
    status: body.status || "Open",
    assignedTo: body.assignedTo,
    screenshot: body.screenshot,
    suggestedFix: body.suggestedFix,
    createdByAI: Boolean(body.createdByAI),
  };

  if (mongoose.Types.ObjectId.isValid(body.projectId)) {
    payload.projectId = body.projectId;
  }

  if (mongoose.Types.ObjectId.isValid(body.testCaseId)) {
    payload.testCaseId = body.testCaseId;
  } else if (body.testCaseId === "" || body.testCaseId === null) {
    payload.testCaseId = undefined;
  }

  return payload;
}

function buildFilter(query) {
  const filter = {};
  if (query.projectId) filter.projectId = query.projectId;
  if (query.testCaseId) filter.testCaseId = query.testCaseId;
  if (query.status) filter.status = query.status;
  if (query.priority) filter.priority = query.priority;
  if (query.severity) filter.severity = query.severity;
  if (query.createdByAI !== undefined) filter.createdByAI = query.createdByAI === "true";
  return filter;
}

function populateBug(query) {
  return query
    .populate("projectId", "projectName")
    .populate("testCaseId", "title type priority")
    .populate("assignedTo", "name email role");
}

exports.createBug = async (req, res) => {
  try {
    const createdBug = await Bug.create(withCompany(buildBugPayload(req.body), req.user));
    const bug = await populateBug(Bug.findById(createdBug._id));
    if (createdBug.assignedTo) {
      const assignedUser = await User.findById(createdBug.assignedTo).select("name fullName email");
      if (assignedUser?.email) {
        sendBugAssignedEmail({
          to: assignedUser.email,
          name: assignedUser.fullName || assignedUser.name,
          bugTitle: createdBug.title,
          ticketId: String(createdBug._id).slice(-6).toUpperCase(),
        }).catch((mailError) => console.log("Bug assigned email failed:", mailError.message));
      }
    }
    if (createdBug.createdByAI && createdBug.priority === "Critical") {
      const admins = await User.find(scopedFilter(req.user, { role: { $in: ["super_admin", "admin", "qa_lead"] } })).select("name fullName email");
      admins.forEach((admin) => {
        sendAiCriticalBugDetectedEmail({
          to: admin.email,
          name: admin.fullName || admin.name,
          bugTitle: createdBug.title,
          ticketId: String(createdBug._id).slice(-6).toUpperCase(),
        }).catch((mailError) => console.log("AI critical bug email failed:", mailError.message));
      });
    }
    res.status(201).json({ result: bug, message: "Bug created successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getBugs = async (req, res) => {
  try {
    const bugs = await populateBug(Bug.find(scopedFilter(req.user, buildFilter(req.query)))).sort({ createdAt: -1 });
    res.status(200).json({ result: bugs });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getBugById = async (req, res) => {
  try {
    const bug = await populateBug(Bug.findOne(scopedFilter(req.user, { _id: req.params.id })));
    if (!bug) return res.status(404).json({ message: "Bug not found" });
    res.status(200).json({ result: bug });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateBug = async (req, res) => {
  try {
    const existingBug = await Bug.findOne(scopedFilter(req.user, { _id: req.params.id }));
    const updatedBug = await Bug.findOneAndUpdate(
      scopedFilter(req.user, { _id: req.params.id }),
      withCompany(buildBugPayload(req.body), req.user),
      { new: true, runValidators: true },
    );
    const bug = updatedBug ? await populateBug(Bug.findById(updatedBug._id)) : null;
    if (!bug) return res.status(404).json({ message: "Bug not found" });
    if (updatedBug.assignedTo && String(existingBug?.assignedTo || "") !== String(updatedBug.assignedTo)) {
      const assignedUser = await User.findById(updatedBug.assignedTo).select("name fullName email");
      if (assignedUser?.email) {
        sendBugAssignedEmail({
          to: assignedUser.email,
          name: assignedUser.fullName || assignedUser.name,
          bugTitle: updatedBug.title,
          ticketId: String(updatedBug._id).slice(-6).toUpperCase(),
        }).catch((mailError) => console.log("Bug assigned email failed:", mailError.message));
      }
    }
    if (existingBug?.status && existingBug.status !== updatedBug.status) {
      const recipients = await User.find(scopedFilter(req.user, { role: { $in: ["super_admin", "admin", "qa_lead", "project_manager"] } })).select("name fullName email");
      recipients.forEach((recipient) => {
        sendBugStatusChangedEmail({
          to: recipient.email,
          name: recipient.fullName || recipient.name,
          bugTitle: updatedBug.title,
          ticketId: String(updatedBug._id).slice(-6).toUpperCase(),
          status: updatedBug.status,
        }).catch((mailError) => console.log("Bug status email failed:", mailError.message));
      });
    }
    res.status(200).json({ result: bug, message: "Bug updated successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.addComment = async (req, res) => {
  try {
    const comment = {
      author: req.body.author || req.user?.name || req.user?.fullName || req.user?.email,
      message: req.body.message,
      type: "comment",
      createdAt: new Date(),
    };

    const updatedBug = await Bug.findOneAndUpdate(
      scopedFilter(req.user, { _id: req.params.id }),
      { $push: { comments: { $each: [comment], $position: 0 } } },
      { new: true, runValidators: true },
    );
    const bug = updatedBug ? await populateBug(Bug.findById(updatedBug._id)) : null;

    if (!bug) return res.status(404).json({ message: "Bug not found" });
    res.status(201).json({ result: bug, message: "Comment added successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.addInternalNote = async (req, res) => {
  try {
    const note = {
      author: req.body.author || req.user?.name || req.user?.fullName || req.user?.email,
      message: req.body.message || req.body.note,
      type: "note",
      createdAt: new Date(),
    };

    const updatedBug = await Bug.findOneAndUpdate(
      scopedFilter(req.user, { _id: req.params.id }),
      { $push: { internalNotes: { $each: [note], $position: 0 } } },
      { new: true, runValidators: true },
    );
    const bug = updatedBug ? await populateBug(Bug.findById(updatedBug._id)) : null;

    if (!bug) return res.status(404).json({ message: "Bug not found" });
    res.status(201).json({ result: bug, message: "Internal note added successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteBug = async (req, res) => {
  try {
    const bug = await Bug.findOneAndDelete(scopedFilter(req.user, { _id: req.params.id }));
    if (!bug) return res.status(404).json({ message: "Bug not found" });
    res.status(200).json({ message: "Bug deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
