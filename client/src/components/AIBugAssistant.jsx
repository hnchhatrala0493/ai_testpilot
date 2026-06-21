import { Bot, ClipboardList, CopyCheck, FileSearch, Lightbulb, ListChecks, Route, Sparkles, TriangleAlert } from "lucide-react";
import { useMemo, useState } from "react";
import { analyzeLogs, detectDuplicates, generateReproductionSteps, generateTestCases, predictPriority, suggestFixIdea, suggestRootCause } from "../utils/aiAssistant.js";
import Badge from "./Badge.jsx";

export default function AIBugAssistant({ bug, bugs, onApplyPriority, canApplyPriority = false }) {
  const [logs, setLogs] = useState("POST /api/bugs 500 ValidationError: screenshot metadata missing");
  const insights = useMemo(
    () => ({
      priority: predictPriority(bug),
      rootCause: suggestRootCause(bug),
      steps: generateReproductionSteps(bug),
      tests: generateTestCases(bug),
      fix: suggestFixIdea(bug),
      duplicates: detectDuplicates(bug, bugs),
    }),
    [bug, bugs],
  );
  const logFindings = analyzeLogs(logs, bug);

  return (
    <section className="surface rounded-md p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Bot size={19} />
          <h2 className="font-bold">AI assistant</h2>
        </div>
        <Badge value={insights.priority} type="priority" />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-md border border-line bg-white p-4">
          <div className="mb-2 flex items-center gap-2 font-semibold">
            <TriangleAlert size={17} />
            Predict bug priority
          </div>
          <p className="text-sm text-slate-600">Suggested priority is {insights.priority} based on impact keywords and workflow area.</p>
          {canApplyPriority ? (
            <button className="btn-muted mt-3" type="button" onClick={() => onApplyPriority(insights.priority)}>
              Apply priority
            </button>
          ) : null}
        </article>

        <article className="rounded-md border border-line bg-white p-4">
          <div className="mb-2 flex items-center gap-2 font-semibold">
            <FileSearch size={17} />
            Suggest root cause
          </div>
          <p className="text-sm leading-6 text-slate-600">{insights.rootCause}</p>
        </article>

        <article className="rounded-md border border-line bg-white p-4">
          <div className="mb-2 flex items-center gap-2 font-semibold">
            <Route size={17} />
            Generate reproduction steps
          </div>
          <ol className="list-decimal space-y-1 pl-5 text-sm leading-6 text-slate-600">
            {insights.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </article>

        <article className="rounded-md border border-line bg-white p-4">
          <div className="mb-2 flex items-center gap-2 font-semibold">
            <ClipboardList size={17} />
            Auto-generate test cases
          </div>
          <div className="space-y-2 text-sm text-slate-600">
            {insights.tests.map((test) => (
              <div key={test.name} className="rounded-md bg-slate-50 p-2">
                <p className="font-semibold text-ink">{test.name}</p>
                <p>{test.expected}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-md border border-line bg-white p-4">
          <div className="mb-2 flex items-center gap-2 font-semibold">
            <CopyCheck size={17} />
            Detect duplicate bugs
          </div>
          <div className="space-y-2 text-sm">
            {insights.duplicates.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 rounded-md bg-slate-50 p-2">
                <span className="font-semibold">{item.ticketId}</span>
                <span className="text-slate-600">{item.score}% match</span>
              </div>
            ))}
            {insights.duplicates.length === 0 ? <p className="text-slate-500">No likely duplicates found.</p> : null}
          </div>
        </article>

        <article className="rounded-md border border-line bg-white p-4">
          <div className="mb-2 flex items-center gap-2 font-semibold">
            <Lightbulb size={17} />
            Suggest fix idea
          </div>
          <p className="text-sm leading-6 text-slate-600">{insights.fix}</p>
        </article>
      </div>

      <article className="mt-4 rounded-md border border-line bg-white p-4">
        <div className="mb-2 flex items-center gap-2 font-semibold">
          <ListChecks size={17} />
          Analyze error logs
        </div>
        <textarea className="input min-h-24 resize-y" value={logs} onChange={(event) => setLogs(event.target.value)} />
        <div className="mt-3 space-y-2">
          {logFindings.map((finding) => (
            <p key={finding} className="rounded-md bg-slate-50 p-2 text-sm text-slate-600">
              {finding}
            </p>
          ))}
        </div>
      </article>

      <div className="mt-4 flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
        <Sparkles size={17} />
        AI output is generated from ticket text, logs, project, status, and nearby bugs.
      </div>
    </section>
  );
}
