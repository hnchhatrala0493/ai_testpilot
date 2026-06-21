const mongoose = require("mongoose");

const bugSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      index: true,
    },
    testCaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TestCase",
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
    },
    stepsToReproduce: [
      {
        type: String,
      },
    ],
    expectedResult: {
      type: String,
    },
    actualResult: {
      type: String,
    },
    severity: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Medium",
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Medium",
    },
    status: {
      type: String,
      enum: ["Open", "In Progress", "Fixed", "Retest", "Closed", "Reopened"],
      default: "Open",
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    screenshot: {
      type: String,
    },
    suggestedFix: {
      type: String,
    },
    createdByAI: {
      type: Boolean,
      default: false,
    },
    comments: [
      {
        author: String,
        message: String,
        type: {
          type: String,
          default: "comment",
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    internalNotes: [
      {
        author: String,
        message: String,
        type: {
          type: String,
          default: "note",
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

exports.Bug = mongoose.model("Bug", bugSchema);
