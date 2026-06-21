const { TestCase } = require("../models/testCase.model");
const { TestResult } = require("../models/testResult.model");
const { User } = require("../models/user.model");
const { sendTestExecutionCompletedEmail } = require("../services/email.service");
const { scopedFilter, withCompany } = require("../utils/companyScope");

function analyzeFailure(testCase) {
  return {
    errorMessage: `${testCase.title} failed assertion`,
    expectedResult: testCase.expectedResult,
    actualResult: "Observed output did not match the expected result.",
    screenshot: `${testCase._id}-failure.png`,
    logs: [
      "AssertionError: expected result was not visible",
      "GET /api/test-run/mock 200",
      "POST /api/action/mock 422",
      "AI analysis: validation, async state, or API response mismatch near this workflow.",
      "Suggested fix: check UI state transition, API schema, and add regression assertion.",
    ],
  };
}

exports.runTests = async (req, res) => {
  try {
    const filter = {};
    if (req.body.projectId || req.body.project) filter.projectId = req.body.projectId || req.body.project;
    if (req.body.runType && req.body.runType !== "Full") filter.type = req.body.runType;

    const testCases = await TestCase.find(scopedFilter(req.user, filter)).limit(req.body.limit || 25);
    const resultsPayload = testCases.map((testCase, index) => {
      const failed = index % 4 === 1;
      return {
        projectId: testCase.projectId,
        testCaseId: testCase._id,
        companyId: testCase.companyId || req.user?.companyId,
        status: failed ? "Failed" : "Passed",
        executionTime: 350 + index * 90,
        ...(failed
          ? analyzeFailure(testCase)
          : {
              expectedResult: testCase.expectedResult,
              actualResult: testCase.expectedResult,
              logs: ["Test completed successfully."],
            }),
      };
    });

    const results = await TestResult.insertMany(resultsPayload);
    const summary = {
      total: results.length,
      passed: results.filter((result) => result.status === "Passed").length,
      failed: results.filter((result) => result.status === "Failed").length,
      skipped: results.filter((result) => result.status === "Skipped").length,
    };
    const recipients = await User.find(scopedFilter(req.user, { role: { $in: ["super_admin", "admin", "qa_lead", "project_manager"] } })).select("name fullName email");
    recipients.forEach((recipient) => {
      sendTestExecutionCompletedEmail({
        to: recipient.email,
        name: recipient.fullName || recipient.name,
        summary,
      }).catch((mailError) => console.log("Test execution email failed:", mailError.message));
    });

    res.status(201).json({
      result: {
        summary,
        results,
      },
      message: "Test run completed",
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getResults = async (req, res) => {
  try {
    const filter = {};
    if (req.params.runId) filter._id = req.params.runId;
    if (req.query.projectId || req.query.project) filter.projectId = req.query.projectId || req.query.project;
    if (req.query.testCaseId) filter.testCaseId = req.query.testCaseId;

    const results = await TestResult.find(scopedFilter(req.user, filter))
      .populate("projectId", "projectName")
      .populate("testCaseId", "title type priority")
      .sort({ createdAt: -1 });

    res.status(200).json({ result: req.params.runId ? results[0] : results });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getSingleResult = async (req, res) => {
  try {
    const result = await TestResult.findOne(scopedFilter(req.user, { _id: req.params.id }))
      .populate("projectId", "projectName")
      .populate("testCaseId", "title type priority");
    if (!result) return res.status(404).json({ message: "Test result not found" });
    res.status(200).json({ result });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
