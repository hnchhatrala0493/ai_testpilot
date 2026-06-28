const { TestCase } = require("../models/testCase.model");
const { Bug } = require("../models/bugs.model");
const { TestResult } = require("../models/testResult.model");
const { AIModule } = require("../models/aiModule.model");
const { getCompanyId, scopedFilter, withCompany } = require("../utils/companyScope");

const defaultModules = [
  {
    slug: "test-execution",
    name: "Test Execution",
    navLabel: "Test Execution",
    summary: "Run AI-assisted test execution and review live quality signals.",
    route: "/test-execution",
    icon: "PlayCircle",
    permissions: ["automation.view"],
    metrics: [
      { label: "Run mode", value: "AI assisted", tone: "blue" },
      { label: "Signal depth", value: "Logs + network", tone: "emerald" },
      { label: "Auto triage", value: "Enabled", tone: "violet" },
    ],
    capabilities: [
      { title: "Smart run selection", description: "Prioritizes checks based on recent failures, project risk, and coverage gaps." },
      { title: "Failure intelligence", description: "Summarizes console errors, network failures, screenshots, and failed assertions." },
    ],
    fields: [
      { name: "projectId", label: "Project ID", type: "text", placeholder: "Paste project id", required: true },
      { name: "limit", label: "Execution limit", type: "number", placeholder: "25" },
    ],
    actions: [{ key: "start-run", label: "Start AI run", endpoint: "/api/tests/run", method: "POST" }],
    pipeline: ["Select scope", "Execute tests", "Analyze failures", "Queue bug drafts"],
    sortOrder: 10,
  },
  {
    slug: "test-cases",
    name: "Test Cases",
    navLabel: "Test Cases",
    summary: "Generate functional, API, regression, edge-case, and responsive test cases from requirements.",
    route: "/test-cases",
    icon: "ClipboardList",
    permissions: ["automation.view"],
    metrics: [
      { label: "Generation", value: "5 cases/run", tone: "blue" },
      { label: "Coverage", value: "UI + API", tone: "emerald" },
      { label: "Storage", value: "Saved cases", tone: "amber" },
    ],
    capabilities: [
      { title: "Requirement parsing", description: "Transforms feature descriptions, user stories, API details, and URLs into executable coverage." },
      { title: "Reusable outputs", description: "Generated cases are stored with project and company scope for later execution." },
    ],
    fields: [
      { name: "projectId", label: "Project ID", type: "text", placeholder: "Paste project id", required: true },
      { name: "featureDescription", label: "Feature description", type: "textarea", placeholder: "Describe the workflow to test", required: true },
      { name: "apiDetails", label: "API details", type: "textarea", placeholder: "Endpoint, method, payload, auth details" },
      { name: "websiteUrl", label: "Website URL", type: "url", placeholder: "https://app.example.com" },
    ],
    actions: [{ key: "generate-test-cases", label: "Generate test cases", endpoint: "/api/ai/generate-test-cases", method: "POST" }],
    pipeline: ["Read requirement", "Build coverage", "Create test data", "Save cases"],
    sortOrder: 20,
  },
  {
    slug: "ai-agents",
    name: "AI Agents",
    navLabel: "AI Agents",
    summary: "Manage the AI assistants that power requirement analysis, test generation, automation, and defect intelligence.",
    route: "/ai-agents",
    icon: "Bot",
    permissions: ["automation.view"],
    metrics: [
      { label: "Agents", value: "6 active", tone: "blue" },
      { label: "Pipeline", value: "End-to-end", tone: "emerald" },
      { label: "Status", value: "Operational", tone: "violet" },
    ],
    capabilities: [
      { title: "Requirement Analyzer", description: "Identifies test scope, gaps, acceptance criteria, and risk signals." },
      { title: "Test Case Generator", description: "Creates functional, edge-case, API, responsive, and regression test cases." },
      { title: "Bug Analyzer", description: "Reviews failed tests, severity, root cause, confidence, and fix ideas." },
      { title: "Production Monitor", description: "Tracks release health, validation checks, and post-deployment quality signals." },
    ],
    fields: [
      { name: "agentGoal", label: "Agent goal", type: "textarea", placeholder: "Describe what you want the agents to coordinate" },
    ],
    actions: [{ key: "preview-agent-plan", label: "Preview agent plan", endpoint: "/api/ai/modules/ai-agents/run", method: "POST" }],
    pipeline: ["Requirement Analyzer", "Test Case Generator", "Automation Generator", "Bug Analyzer", "Retest Agent", "Production Monitor"],
    sortOrder: 30,
  },
  {
    slug: "ai-analytics",
    name: "AI Analytics",
    navLabel: "AI Analytics",
    summary: "Review AI-generated quality trends, automation coverage, defect prediction, and execution health.",
    route: "/ai-analytics",
    icon: "BarChart3",
    permissions: ["report:view"],
    metrics: [
      { label: "AI cases", value: "Live", tone: "blue" },
      { label: "AI bugs", value: "Live", tone: "rose" },
      { label: "Pass rate", value: "Live", tone: "emerald" },
    ],
    capabilities: [
      { title: "Coverage trend", description: "Compares generated test coverage with failed execution signals." },
      { title: "Defect intelligence", description: "Highlights AI-created bugs, open severity, and risk concentration." },
    ],
    fields: [
      { name: "timeframe", label: "Timeframe", type: "select", placeholder: "Last 30 days" },
    ],
    actions: [{ key: "refresh-analytics", label: "Refresh analytics", endpoint: "/api/ai/modules/ai-analytics/run", method: "POST" }],
    pipeline: ["Collect test cases", "Read executions", "Analyze defects", "Report risk"],
    sortOrder: 40,
  },
];

async function ensureDefaultModules(user) {
  const companyId = getCompanyId(user);
  for (const module of defaultModules) {
    await AIModule.findOneAndUpdate(
      { slug: module.slug, companyId: companyId || null },
      withCompany(module, user),
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }
}

function getDefaultModule(slug) {
  return defaultModules.find((module) => module.slug === slug);
}

async function findOrCreateModule(slug, user) {
  const companyId = getCompanyId(user);
  const scopedModule = await AIModule.findOne(scopedFilter(user, { slug, enabled: true }));

  if (scopedModule) return scopedModule;

  const globalModule = await AIModule.findOne({
    slug,
    enabled: true,
    $or: [{ companyId: null }, { companyId: { $exists: false } }],
  });

  if (globalModule) return globalModule;

  const fallback = getDefaultModule(slug);
  if (!fallback) return null;

  return AIModule.findOneAndUpdate(
    { slug, companyId: companyId || null },
    withCompany(fallback, user),
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
}

async function listOrCreateModules(user) {
  await ensureDefaultModules(user);
  const modules = await AIModule.find(scopedFilter(user, { enabled: true })).sort({ sortOrder: 1, name: 1 });

  if (modules.length) return modules;

  await Promise.all(
    defaultModules.map((module) =>
      AIModule.findOneAndUpdate(
        { slug: module.slug, companyId: getCompanyId(user) || null },
        withCompany(module, user),
        { upsert: true, new: true, setDefaultsOnInsert: true },
      ),
    ),
  );

  return AIModule.find(scopedFilter(user, { enabled: true })).sort({ sortOrder: 1, name: 1 });
}

async function buildAnalytics(user) {
  const [aiCases, aiBugs, passed, failed, skipped, openBugs, criticalBugs] = await Promise.all([
    TestCase.countDocuments(scopedFilter(user, { generatedByAI: true })),
    Bug.countDocuments(scopedFilter(user, { createdByAI: true })),
    TestResult.countDocuments(scopedFilter(user, { status: "Passed" })),
    TestResult.countDocuments(scopedFilter(user, { status: "Failed" })),
    TestResult.countDocuments(scopedFilter(user, { status: "Skipped" })),
    Bug.countDocuments(scopedFilter(user, { status: { $nin: ["Closed"] } })),
    Bug.countDocuments(scopedFilter(user, { severity: "Critical", status: { $nin: ["Closed"] } })),
  ]);
  const totalResults = passed + failed + skipped;
  const passRate = totalResults ? Math.round((passed / totalResults) * 100) : 0;

  return {
    aiCases,
    aiBugs,
    passed,
    failed,
    skipped,
    openBugs,
    criticalBugs,
    passRate,
    riskLevel: criticalBugs > 0 || failed > passed ? "High" : openBugs > 3 ? "Medium" : "Low",
  };
}

function mergeLiveMetrics(module, analytics) {
  if (module.slug !== "ai-analytics") return module;

  return {
    ...module,
    metrics: [
      { label: "AI cases", value: String(analytics.aiCases), tone: "blue" },
      { label: "AI bugs", value: String(analytics.aiBugs), tone: "rose" },
      { label: "Pass rate", value: `${analytics.passRate}%`, tone: "emerald" },
      { label: "Open bugs", value: String(analytics.openBugs), tone: "amber" },
      { label: "Risk", value: analytics.riskLevel, tone: analytics.riskLevel === "High" ? "rose" : "violet" },
    ],
  };
}

function serializeModule(module) {
  const doc = module.toObject ? module.toObject() : module;
  return {
    ...doc,
    id: doc._id,
  };
}

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

exports.listModules = async (req, res) => {
  try {
    const modules = await listOrCreateModules(req.user);
    const analytics = await buildAnalytics(req.user);
    const result = modules.map((module) => mergeLiveMetrics(serializeModule(module), analytics));

    res.status(200).json({ result });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getModule = async (req, res) => {
  try {
    await ensureDefaultModules(req.user);
    const module = await findOrCreateModule(req.params.slug, req.user);

    if (!module) {
      return res.status(404).json({ message: "AI module not found" });
    }

    const analytics = await buildAnalytics(req.user);
    res.status(200).json({ result: mergeLiveMetrics(serializeModule(module), analytics), analytics });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateModule = async (req, res) => {
  try {
    const allowed = ["name", "navLabel", "summary", "status", "metrics", "capabilities", "fields", "actions", "pipeline", "sortOrder", "enabled"];
    const payload = allowed.reduce((next, key) => {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) next[key] = req.body[key];
      return next;
    }, {});
    const module = await AIModule.findOneAndUpdate(
      scopedFilter(req.user, { slug: req.params.slug }),
      withCompany(payload, req.user),
      { new: true, runValidators: true },
    );

    if (!module) {
      return res.status(404).json({ message: "AI module not found" });
    }

    res.status(200).json({ result: serializeModule(module), message: "AI module updated successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.runModuleAction = async (req, res) => {
  try {
    const module = await findOrCreateModule(req.params.slug, req.user);

    if (!module) {
      return res.status(404).json({ message: "AI module not found" });
    }

    const analytics = await buildAnalytics(req.user);
    const action = module.actions.find((item) => item.key === req.body.actionKey) || module.actions[0];
    const payload = req.body.payload || {};

    if (module.slug === "test-cases" || action?.key === "generate-test-cases") {
      if (!payload.projectId && !payload.project) {
        return res.status(400).json({ message: "Project ID is required to generate test cases" });
      }

      const generated = buildGeneratedCases(payload);
      const savedCases = await TestCase.insertMany(
        generated.map((testCase) => ({
          ...testCase,
          projectId: payload.projectId || payload.project,
          companyId: payload.companyId || getCompanyId(req.user),
          generatedByAI: true,
          testData: {
            ...(testCase.testData || {}),
            requirementDocument: payload.requirementDocument,
            featureDescription: payload.featureDescription || payload.feature,
            userStory: payload.userStory,
            apiDetails: payload.apiDetails,
            websiteUrl: payload.websiteUrl,
          },
        })),
      );

      return res.status(201).json({
        result: {
          module: module.slug,
          action: action?.key || "generate-test-cases",
          status: "completed",
          message: `${savedCases.length} AI test cases generated successfully.`,
          created: savedCases,
          nextSteps: module.pipeline,
          analytics: await buildAnalytics(req.user),
        },
      });
    }

    const payloadSummary = Object.entries(req.body.payload || {})
      .filter(([, value]) => value !== "" && value !== null && value !== undefined)
      .map(([key, value]) => `${key}: ${String(value).slice(0, 80)}`);

    res.status(200).json({
      result: {
        module: module.slug,
        action: action?.key || "preview",
        status: "ready",
        message: `${module.name} action is ready to run.`,
        nextSteps: module.pipeline,
        payloadSummary,
        analytics,
      },
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
