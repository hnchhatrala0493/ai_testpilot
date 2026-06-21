const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: "system",
      immutable: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      index: true,
    },
    appName: {
      type: String,
      trim: true,
      default: "AI TestPilot",
    },
    supportEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    defaultUserRole: {
      type: String,
      trim: true,
      default: "tester",
    },
    timezone: {
      type: String,
      trim: true,
      default: "Asia/Calcutta",
    },
    dateFormat: {
      type: String,
      trim: true,
      default: "DD MMM YYYY",
    },
    allowRegistration: {
      type: Boolean,
      default: true,
    },
    requireEmailVerification: {
      type: Boolean,
      default: false,
    },
    sessionTimeoutMinutes: {
      type: Number,
      min: 15,
      max: 1440,
      default: 60,
    },
    passwordMinLength: {
      type: Number,
      min: 6,
      max: 32,
      default: 8,
    },
    emailNotifications: {
      type: Boolean,
      default: true,
    },
    bugAssignmentEmails: {
      type: Boolean,
      default: true,
    },
    testRunAlerts: {
      type: Boolean,
      default: true,
    },
    weeklyReportEmails: {
      type: Boolean,
      default: false,
    },
    autoAssignBugs: {
      type: Boolean,
      default: false,
    },
    aiSuggestionsEnabled: {
      type: Boolean,
      default: true,
    },
    automationRetryCount: {
      type: Number,
      min: 0,
      max: 5,
      default: 1,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

settingsSchema.index({ companyId: 1, key: 1 }, { unique: true });

exports.Settings = mongoose.model("Settings", settingsSchema);
