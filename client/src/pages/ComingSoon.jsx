import PageHeader from "../components/PageHeader.jsx";

const content = {
  releases: {
    title: "Releases",
    description: "Plan release readiness, testing scope, sign-offs, and deployment quality gates.",
  },
  "ai-agents": {
    title: "AI Agents",
    description: "Manage AI assistants for test generation, defect triage, automation analysis, and release insights.",
  },
  "ai-analytics": {
    title: "AI Analytics",
    description: "Review AI-driven quality trends, automation coverage, flaky checks, and defect prediction signals.",
  },
};

export default function ComingSoon({ page }) {
  const details = content[page] || { title: "Coming Soon", description: "This workspace area is being prepared." };

  return (
    <>
      <PageHeader title={details.title} description={details.description} />
      <section className="surface rounded-md p-6">
        <h2 className="text-lg font-bold">{details.title}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">{details.description}</p>
      </section>
    </>
  );
}
