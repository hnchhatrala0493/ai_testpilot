const criticalWords = ["crash", "payment", "invoice", "login", "security", "data loss", "empty file"];
const highWords = ["upload", "export", "failed", "error", "broken", "redirect", "archived"];
const mediumWords = ["focus", "filter", "toggle", "settings", "comment", "search"];

function textFor(bug) {
  return `${bug.title || ""} ${bug.description || ""}`.toLowerCase();
}

function includesAny(text, words) {
  return words.some((word) => text.includes(word));
}

export function predictPriority(bug) {
  const text = textFor(bug);
  if (includesAny(text, criticalWords)) return "Critical";
  if (includesAny(text, highWords)) return "High";
  if (includesAny(text, mediumWords)) return "Medium";
  return bug.priority || "Low";
}

export function suggestRootCause(bug) {
  const text = textFor(bug);
  if (text.includes("export") || text.includes("csv")) {
    return "Export query parameters or backend serialization may not match the filtered table state.";
  }
  if (text.includes("upload") || text.includes("screenshot") || text.includes("png")) {
    return "Client-side file validation and server upload limits may be using different size or MIME rules.";
  }
  if (text.includes("focus") || text.includes("keyboard")) {
    return "A component re-render after state update is probably remounting the focused control.";
  }
  if (text.includes("toggle") || text.includes("inverted")) {
    return "Boolean mapping may be inverted between UI state, form payload, and persisted settings.";
  }
  if (text.includes("search") || text.includes("archived")) {
    return "The search query may be missing an active project or isDeleted filter.";
  }
  return "The issue likely sits near the workflow boundary where UI state is converted into an API request.";
}

export function generateReproductionSteps(bug) {
  const route = bug.project === "Billing Engine" ? "Billing module" : bug.project;
  return [
    `Open the ${route} workflow.`,
    `Perform the action related to "${bug.title}".`,
    "Use the same filters, file, or status values described in the bug.",
    "Observe the actual behavior and compare it with the expected result.",
    `Capture console logs and network requests for ticket ${bug.ticketId}.`,
  ];
}

export function generateTestCases(bug) {
  return [
    {
      name: "Happy path",
      expected: "The workflow completes and persists the expected state.",
    },
    {
      name: "Validation path",
      expected: "Invalid input is rejected with a clear message and no partial save.",
    },
    {
      name: "Regression path",
      expected: "Existing bugs with the same project and priority remain unaffected.",
    },
    {
      name: "Accessibility path",
      expected: "Keyboard focus and screen-reader labels remain stable after the action.",
    },
  ];
}

export function suggestFixIdea(bug) {
  const rootCause = suggestRootCause(bug);
  return `${rootCause} Add a focused unit/integration test around that boundary, then verify the E2E path with the generated reproduction steps.`;
}

export function buildBugReportPrompt(testResult = {}) {
  return `Analyze this failed test result and create a professional bug report.

Test Case: ${testResult.testCaseTitle || ""}
Expected Result: ${testResult.expectedResult || ""}
Actual Result: ${testResult.actualResult || ""}
Error Message: ${testResult.errorMessage || ""}
Console Logs: ${testResult.consoleLogs || ""}
Screenshot URL: ${testResult.screenshotUrl || ""}
Page URL: ${testResult.pageUrl || ""}

Create bug report with:

Bug title
Description
Steps to reproduce
Expected result
Actual result
Severity
Priority
Possible root cause
Suggested fix

Return output in JSON format.`;
}

function inferSeverity(testResult) {
  const text = [
    testResult.testCaseTitle,
    testResult.actualResult,
    testResult.errorMessage,
    testResult.consoleLogs,
  ]
    .join(" ")
    .toLowerCase();

  if (includesAny(text, criticalWords) || text.includes("500") || text.includes("exception")) {
    return "Critical";
  }
  if (includesAny(text, highWords) || text.includes("timeout") || text.includes("failed")) {
    return "High";
  }
  if (includesAny(text, mediumWords) || text.includes("validation")) {
    return "Medium";
  }
  return "Low";
}

function inferRootCause(testResult) {
  const text = [
    testResult.testCaseTitle,
    testResult.actualResult,
    testResult.errorMessage,
    testResult.consoleLogs,
  ]
    .join(" ")
    .toLowerCase();

  if (text.includes("500") || text.includes("exception")) {
    return "Backend request handling or data persistence may be failing after the UI action.";
  }
  if (text.includes("timeout")) {
    return "The workflow may be waiting on a slow network request, long-running query, or missing async completion signal.";
  }
  if (text.includes("redirect") || text.includes("navigation")) {
    return "Route transition state may not be updated after the action completes.";
  }
  if (text.includes("upload") || text.includes("screenshot") || text.includes("file")) {
    return "File metadata may not be preserved consistently between the form, upload adapter, and saved ticket payload.";
  }
  if (text.includes("validation")) {
    return "Frontend validation rules may not match the API schema or expected test data.";
  }
  return "The failure likely occurs where the tested workflow converts UI state into an API request or persisted response.";
}

export function generateBugReportFromFailedTest(testResult = {}) {
  const severity = inferSeverity(testResult);
  const titleSubject = testResult.testCaseTitle || "Automated test";
  const pageContext = testResult.pageUrl ? ` on ${testResult.pageUrl}` : "";
  const errorContext = testResult.errorMessage ? ` Error observed: ${testResult.errorMessage}` : "";
  const rootCause = inferRootCause(testResult);

  return {
    bugTitle: `${titleSubject} failed${pageContext}`,
    description: `The automated test "${titleSubject}" failed while validating the expected behavior.${errorContext}`.trim(),
    stepsToReproduce: [
      `Open ${testResult.pageUrl || "the page covered by the failed test"}.`,
      `Run the test case "${titleSubject}".`,
      "Perform the workflow exactly as defined in the automated test.",
      "Compare the observed result with the expected result and review the captured evidence.",
    ],
    expectedResult: testResult.expectedResult || "The workflow should complete with the expected result defined by the test case.",
    actualResult: testResult.actualResult || testResult.errorMessage || "The automated test failed before a matching result was observed.",
    severity,
    priority: severity === "Critical" ? "Critical" : severity === "High" ? "High" : "Medium",
    possibleRootCause: rootCause,
    suggestedFix: `${rootCause} Reproduce with the captured logs, add a focused regression test, and verify the fix against the same page URL and screenshot evidence.`,
    evidence: {
      errorMessage: testResult.errorMessage || "",
      consoleLogs: testResult.consoleLogs || "",
      screenshotUrl: testResult.screenshotUrl || "",
      pageUrl: testResult.pageUrl || "",
    },
  };
}

export function analyzeLogs(logs = "", bug) {
  const text = logs.toLowerCase();
  const findings = [];
  if (text.includes("500") || text.includes("exception")) findings.push("Server-side exception or 500 response detected.");
  if (text.includes("401") || text.includes("403")) findings.push("Authentication or role permission failure detected.");
  if (text.includes("timeout")) findings.push("Timeout found; check network latency, database query cost, or long-running jobs.");
  if (text.includes("validation")) findings.push("Validation failure found; compare frontend fields with backend schema.");
  if (findings.length === 0) findings.push(`No obvious fatal signature found. Focus investigation on ${bug.project} workflow state.`);
  return findings;
}

export function detectDuplicates(bug, allBugs) {
  const currentWords = new Set(textFor(bug).split(/\W+/).filter((word) => word.length > 3));
  return allBugs
    .filter((item) => item.id !== bug.id)
    .map((item) => {
      const words = textFor(item).split(/\W+/).filter((word) => word.length > 3);
      const overlap = words.filter((word) => currentWords.has(word)).length;
      const score = Math.min(96, Math.round((overlap / Math.max(currentWords.size, 1)) * 100));
      return { ...item, score };
    })
    .filter((item) => item.score >= 18 || item.project === bug.project)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

export function summarizeTestResult(run) {
  if (!run) return "No automation run is available yet.";
  return `${run.mode} run ${run.status}: ${run.summary.passed} checks passed, ${run.summary.failed} failed, and ${run.summary.created} bug tickets were created.`;
}

export function createTestReport(run) {
  if (!run) return "Start an automation run to generate a report.";
  const lines = [
    `Test Report: ${run.mode.toUpperCase()} automation run`,
    `Status: ${run.status}`,
    `Progress: ${run.progress}%`,
    `Passed: ${run.summary.passed}`,
    `Failed: ${run.summary.failed}`,
    `Bugs created: ${run.summary.created}`,
    "",
    "Check results:",
    ...run.checks.map((check) => `- [${check.type || "E2E"}] ${check.name}: ${check.status} - ${check.evidence || "No evidence captured"}`),
  ];
  return lines.join("\n");
}
