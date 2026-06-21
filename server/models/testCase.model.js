const mongoose = require("mongoose");

const testCaseSchema = new mongoose.Schema(
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
    title: {
      type: String,
      required: true,
      trim: true,
    },
    preconditions: {
      type: String,
    },
    steps: [
      {
        type: String,
      },
    ],
    testData: {
      type: mongoose.Schema.Types.Mixed,
    },
    expectedResult: {
      type: String,
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Medium",
    },
    type: {
      type: String,
      enum: ["UI", "API", "Regression", "Unit", "Performance"],
      default: "UI",
    },
    generatedByAI: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

exports.TestCase = mongoose.model("TestCase", testCaseSchema);
