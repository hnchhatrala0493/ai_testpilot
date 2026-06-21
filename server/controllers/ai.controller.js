const { TestCase } = require("../models/testCase.model");
const { getCompanyId } = require("../utils/companyScope");

function buildGeneratedCases(payload) {
  const feature = payload.featureDescription || payload.feature || "Feature";
  const apiDetails = payload.apiDetails || "API endpoint";
  const websiteUrl = payload.websiteUrl || "Application";

  return [
    {
      title: `Verify ${feature} with valid data`,
      type: "UI",
      priority: "High",
      preconditions: "User has access to the test environment.",
      steps: [`Open ${websiteUrl}`, `Navigate to ${feature}`, "Enter valid input", "Submit the workflow"],
      testData: { websiteUrl, inputType: "valid" },
      expectedResult: `${feature} completes successfully and displays the expected success state.`,
    },
    {
      title: `Verify ${feature} validation errors`,
      type: "UI",
      priority: "Medium",
      preconditions: "User is on the feature page.",
      steps: [`Open ${websiteUrl}`, `Navigate to ${feature}`, "Leave required fields empty", "Submit the form"],
      testData: { websiteUrl, inputType: "invalid" },
      expectedResult: "Validation messages are shown and the invalid request is not submitted.",
    },
    {
      title: `Verify ${feature} API contract`,
      type: "API",
      priority: "High",
      preconditions: "API service is reachable and authentication is configured.",
      steps: [`Call ${apiDetails}`, "Send valid payload", "Send invalid payload", "Compare response schema"],
      testData: { apiDetails, payloadType: "valid-and-invalid" },
      expectedResult: "API returns expected status codes, response body, and validation errors.",
    },
    {
      title: `Verify ${feature} regression coverage`,
      type: "Regression",
      priority: "Medium",
      preconditions: "Regression suite is available.",
      steps: ["Run linked smoke suite", "Run impacted UI/API tests", "Review failed checks"],
      testData: { userStory: payload.userStory },
      expectedResult: "Existing critical flows remain stable.",
    },
    {
      title: `Verify ${feature} responsive behavior`,
      type: "UI",
      priority: "Low",
      preconditions: "Browser viewport can be resized.",
      steps: [`Open ${websiteUrl}`, "Switch to mobile viewport", "Complete the workflow", "Repeat on desktop"],
      testData: { viewports: ["mobile", "desktop"] },
      expectedResult: "Layout, labels, and controls remain usable across viewport sizes.",
    },
  ];
}

exports.generateTestCases = async (req, res) => {
  try {
    const generated = buildGeneratedCases(req.body);
    const savedCases = await TestCase.insertMany(
      generated.map((testCase) => ({
        ...testCase,
        projectId: req.body.projectId || req.body.project,
        companyId: req.body.companyId || getCompanyId(req.user),
        generatedByAI: true,
        testData: {
          ...(testCase.testData || {}),
          requirementDocument: req.body.requirementDocument,
          featureDescription: req.body.featureDescription || req.body.feature,
          userStory: req.body.userStory,
          apiDetails: req.body.apiDetails,
          websiteUrl: req.body.websiteUrl,
        },
      })),
    );

    res.status(201).json({
      result: savedCases,
      message: "AI test cases generated successfully",
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
