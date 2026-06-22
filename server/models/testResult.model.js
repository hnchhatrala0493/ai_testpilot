const mongoose = require("mongoose");

const testResultSchema = new mongoose.Schema(
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
      required: true,
    },
    status: {
      type: String,
      enum: ["Passed", "Failed", "Skipped"],
      default: "Passed",
    },
    expectedResult: {
      type: String,
    },
    actualResult: {
      type: String,
    },
    errorMessage: {
      type: String,
    },
    screenshot: {
      type: String,
    },
    videoRecording: {
      type: String,
    },
    consoleErrors: [
      {
        type: String,
      },
    ],
    networkLogs: [
      {
        method: String,
        url: String,
        status: Number,
        duration: Number,
        error: String,
      },
    ],
    logs: [
      {
        type: String,
      },
    ],
    executionTime: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

exports.TestResult = mongoose.model("TestResult", testResultSchema);
