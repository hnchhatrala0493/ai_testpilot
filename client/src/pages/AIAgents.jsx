import { Bot, CheckCircle2, ClipboardList, FileSearch, RefreshCcw, Rocket, ShieldAlert, WandSparkles } from "lucide-react";
import PageHeader from "../components/PageHeader.jsx";

const agents = [
  {
    name: "Requirement Analyzer",
    icon: FileSearch,
    status: "Active",
    description: "Reviews requirements and identifies test scope, gaps, and acceptance criteria.",
  },
  {
    name: "Test Case Generator",
    icon: ClipboardList,
    status: "Active",
    description: "Creates functional, edge-case, API, and regression test cases from project requirements.",
  },
  {
    name: "Automation Generator",
    icon: WandSparkles,
    status: "Active",
    description: "Prepares automation script plans for UI, API, regression, and cross-browser coverage.",
  },
  {
    name: "Bug Analyzer",
    icon: ShieldAlert,
    status: "Active",
    description: "Analyzes failed tests, root cause, severity, confidence, and suggested fixes.",
  },
  {
    name: "Retest Agent",
    icon: RefreshCcw,
    status: "Active",
    description: "Tracks fixed bugs and queues retesting before UAT or production validation.",
  },
  {
    name: "Production Monitor",
    icon: Rocket,
    status: "Active",
    description: "Monitors production validation checks, release health, and post-deployment signals.",
  },
];

export default function AIAgents() {
  return (
    <>
      <PageHeader title="AI Agents" description="Manage AI agents across requirement analysis, test generation, automation, bug intelligence, retesting, and production monitoring." />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {agents.map((agent) => {
          const Icon = agent.icon;

          return (
            <article key={agent.name} className="surface rounded-md p-5">
              <div className="flex items-start justify-between gap-4">
                <span className="grid h-11 w-11 place-items-center rounded-md bg-blue-50 text-brand dark:bg-blue-950 dark:text-blue-200">
                  <Icon size={21} />
                </span>
                <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
                  <CheckCircle2 size={14} />
                  {agent.status}
                </span>
              </div>
              <div className="mt-4">
                <h2 className="text-lg font-bold">{agent.name}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{agent.description}</p>
              </div>
            </article>
          );
        })}
      </div>

      <section className="surface mt-5 rounded-md p-5">
        <div className="flex items-center gap-2">
          <Bot size={19} />
          <h2 className="font-bold">Agent Pipeline</h2>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {agents.map((agent) => (
            <span key={agent.name} className="rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
              {agent.name}
            </span>
          ))}
        </div>
      </section>
    </>
  );
}
