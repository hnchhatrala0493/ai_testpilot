const mongoose = require("mongoose");

const testRunCheckSchema = new mongoose.Schema(
  {
    testCaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TestCase",
    },
    title: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["UI", "API", "Regression", "Unit", "Performance"],
      default: "UI",
    },
    executor: {
      type: String,
      enum: ["Playwright", "Axios", "Supertest", "Jest", "Manual"],
      default: "Manual",
    },
    target: {
      type: String,
    },
    status: {
      type: String,
      enum: ["queued", "running", "passed", "failed", "skipped"],
      default: "queued",
    },
    progress: {
      type: Number,
      default: 0,
    },
    startedAt: {
      type: Date,
    },
    finishedAt: {
      type: Date,
    },
    durationMs: {
      type: Number,
      default: 0,
    },
    expectedResult: String,
    actualResult: String,
    errorMessage: String,
    screenshot: String,
    videoRecording: String,
    consoleErrors: [String],
    networkLogs: [
      {
        method: String,
        url: String,
        status: Number,
        duration: Number,
        error: String,
      },
    ],
    logs: [String],
    aiAnalysis: {
      summary: String,
      possibleRootCause: String,
      suggestedFix: String,
      confidence: Number,
    },
    bugId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bug",
    },
    resultId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TestResult",
    },
  },
  { _id: true },
);

const testRunSchema = new mongoose.Schema(
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
    runType: {
      type: String,
      enum: ["API", "UI", "Full", "Regression", "Unit", "Smoke"],
      default: "Full",
    },
    status: {
      type: String,
      enum: ["queued", "running", "completed", "failed", "stopped"],
      default: "queued",
    },
    startedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    finishedAt: {
      type: Date,
    },
    durationMs: {
      type: Number,
      default: 0,
    },
    autoCreateBug: {
      type: Boolean,
      default: true,
    },
    generateReport: {
      type: Boolean,
      default: true,
    },
    summary: {
      total: { type: Number, default: 0 },
      queued: { type: Number, default: 0 },
      inProgress: { type: Number, default: 0 },
      completed: { type: Number, default: 0 },
      passed: { type: Number, default: 0 },
      failed: { type: Number, default: 0 },
      skipped: { type: Number, default: 0 },
      percentage: { type: Number, default: 0 },
    },
    checks: [testRunCheckSchema],
    repositoryContext: {
      repository: {
        owner: String,
        name: String,
        fullName: String,
        defaultBranch: String,
        url: String,
        private: Boolean,
      },
      summary: mongoose.Schema.Types.Mixed,
      routeInventory: {
        count: Number,
        files: [String],
        routes: [
          {
            method: String,
            path: String,
            file: String,
          },
        ],
      },
      groups: [
        {
          key: String,
          label: String,
          found: Boolean,
          files: [
            {
              path: String,
              size: Number,
              skipped: Boolean,
            },
          ],
        },
      ],
    },
    report: {
      type: String,
      default: "",
    },
  },
  { timestamps: { createdAt: true, updatedAt: true } },
);

exports.TestRun = mongoose.model("TestRun", testRunSchema);
