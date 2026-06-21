const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    projectName: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
    },
    projectUrl: {
      type: String,
    },
    githubUrl: {
      type: String,
    },
    testUrl: {
      type: String,
    },
    category: {
      type: String,
      default: "Software",
    },
    status: {
      type: String,
      default: "Active",
    },
    techStack: [
      {
        type: String,
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      index: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

exports.Project = mongoose.model("Project", projectSchema);
