const { Settings } = require("../models/settings.model");
const { getCompanyId } = require("../utils/companyScope");

const editableFields = [
  "appName",
  "supportEmail",
  "defaultUserRole",
  "timezone",
  "dateFormat",
  "allowRegistration",
  "requireEmailVerification",
  "sessionTimeoutMinutes",
  "passwordMinLength",
  "emailNotifications",
  "bugAssignmentEmails",
  "testRunAlerts",
  "weeklyReportEmails",
  "autoAssignBugs",
  "aiSuggestionsEnabled",
  "automationRetryCount",
];

function settingsFilter(user) {
  const companyId = getCompanyId(user);
  return companyId ? { key: "system", companyId } : { key: "system", companyId: { $exists: false } };
}

async function getSettingsDocument(user) {
  return Settings.findOneAndUpdate(
    settingsFilter(user),
    { $setOnInsert: { key: "system", companyId: getCompanyId(user) || undefined } },
    { new: true, upsert: true, runValidators: true },
  ).populate("updatedBy", "name fullName email");
}

function normalizePayload(body = {}) {
  return editableFields.reduce((payload, field) => {
    if (body[field] !== undefined) {
      payload[field] = body[field];
    }
    return payload;
  }, {});
}

exports.getSettings = async (user) => getSettingsDocument(user);

exports.updateSettings = async (body, user) => {
  const payload = normalizePayload(body);
  payload.updatedBy = user._id;

  return Settings.findOneAndUpdate(
    settingsFilter(user),
    payload,
    { new: true, upsert: true, runValidators: true },
  ).populate("updatedBy", "name fullName email");
};
