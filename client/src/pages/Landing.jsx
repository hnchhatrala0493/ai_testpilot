import {
  ArrowRight,
  BarChart3,
  Bot,
  Bug,
  CheckCircle2,
  ClipboardCheck,
  Code2,
  FileText,
  Mail,
  Menu,
  PlayCircle,
  Rocket,
  SearchCheck,
  Sparkles,
  TestTubeDiagonal,
  UploadCloud,
  Workflow,
} from "lucide-react";
import { Link } from "react-router-dom";
import aiLandingBg from "../assets/ai-landing-bg.png";

const navItems = [
  { label: "Home", href: "#home" },
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
];

const features = [
  {
    icon: FileText,
    title: "AI Test Case Generator",
    description: "Turn requirements, stories, and acceptance criteria into structured test cases in seconds.",
  },
  {
    icon: Workflow,
    title: "AI UI Testing",
    description: "Run intelligent UI checks, catch visual issues, and validate user journeys faster.",
  },
  {
    icon: Code2,
    title: "AI API Testing",
    description: "Generate API test scenarios, validate responses, and identify contract failures early.",
  },
  {
    icon: Bug,
    title: "Bug Tracker",
    description: "Capture, prioritize, assign, and monitor defects across every release cycle.",
  },
  {
    icon: Bot,
    title: "AI Bug Report Generator",
    description: "Create clear bug reports with steps, impact, severity, and suggested reproduction details.",
  },
  {
    icon: BarChart3,
    title: "Reports & Analytics",
    description: "Track test coverage, defect trends, release readiness, and team performance.",
  },
];

const steps = [
  { icon: UploadCloud, title: "Upload Requirements" },
  { icon: FileText, title: "AI Generates Test Cases" },
  { icon: Workflow, title: "Run UI/API Tests" },
  { icon: SearchCheck, title: "AI Detects Bugs" },
  { icon: BarChart3, title: "Get Reports" },
];

const pricing = [
  {
    name: "Free",
    price: "$0",
    description: "Explore AI QA automation with a small project.",
    features: ["1 project", "AI test case samples", "Basic bug tracking"],
  },
  {
    name: "Startup",
    price: "$49",
    description: "For growing teams that need faster releases.",
    features: ["Unlimited test cases", "UI and API test runs", "AI bug reports", "Analytics dashboard"],
    featured: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For larger teams with advanced governance needs.",
    features: ["Custom workflows", "Role permissions", "Audit logs", "Dedicated support"],
  },
];

function DashboardPreview() {
  const bars = ["h-20", "h-28", "h-16", "h-32", "h-24", "h-36", "h-28"];

  return (
    <div className="relative mx-auto w-full max-w-3xl overflow-hidden rounded-2xl border border-white/15 bg-slate-950/85 shadow-2xl shadow-indigo-950/40 backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-red-400" />
          <span className="h-3 w-3 rounded-full bg-amber-300" />
          <span className="h-3 w-3 rounded-full bg-emerald-400" />
        </div>
        <div className="rounded-full bg-indigo-500/15 px-3 py-1 text-xs font-semibold text-indigo-100">Dashboard Preview</div>
      </div>
      <div className="grid gap-0 md:grid-cols-[180px_1fr]">
        <aside className="hidden border-r border-white/10 bg-slate-900/70 p-4 md:block">
          <div className="mb-6 flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-[#6366F1] text-white">
              <TestTubeDiagonal size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-white">QA Control</p>
              <p className="text-xs text-slate-400">AI workspace</p>
            </div>
          </div>
          {["Overview", "Test Cases", "UI Tests", "API Tests", "Reports"].map((item, index) => (
            <div className={`mb-2 rounded-lg px-3 py-2 text-sm font-semibold ${index === 0 ? "bg-indigo-500/20 text-white" : "text-slate-400"}`} key={item}>
              {item}
            </div>
          ))}
        </aside>
        <div className="p-4 sm:p-6">
          <div className="mb-5 grid gap-3 sm:grid-cols-3">
            {[
              ["Test cases", "1,284", "+42 today"],
              ["Pass rate", "96%", "stable"],
              ["Bugs found", "38", "AI detected"],
            ].map(([label, value, meta]) => (
              <div className="rounded-xl border border-white/10 bg-white/10 p-4" key={label}>
                <p className="text-xs font-semibold uppercase text-slate-300">{label}</p>
                <p className="mt-2 text-2xl font-black text-white">{value}</p>
                <p className="mt-1 text-xs font-semibold text-[#22C55E]">{meta}</p>
              </div>
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
            <div className="rounded-xl border border-white/10 bg-white/10 p-4">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-white">Release quality</p>
                  <p className="text-xs text-slate-400">Automation trend</p>
                </div>
                <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-bold text-emerald-300">Ready</span>
              </div>
              <div className="flex h-40 items-end gap-3">
                {bars.map((height, index) => (
                  <div className="flex flex-1 flex-col items-center gap-2" key={height + index}>
                    <div className={`w-full rounded-t-lg bg-gradient-to-t from-[#6366F1] to-[#22C55E] ${height}`} />
                    <span className="text-[10px] font-semibold text-slate-500">S{index + 1}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/10 p-4">
              <p className="text-sm font-bold text-white">AI insights</p>
              <div className="mt-4 space-y-3">
                {["Checkout flow needs retest", "API latency regression", "Bug report drafted"].map((item) => (
                  <div className="flex items-start gap-2 rounded-lg bg-slate-950/50 p-3" key={item}>
                    <CheckCircle2 className="mt-0.5 text-[#22C55E]" size={16} />
                    <p className="text-xs font-semibold leading-5 text-slate-300">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  return (
    <main
      className="min-h-screen bg-[#0F172A] bg-cover bg-fixed bg-center text-white"
      style={{ backgroundImage: `linear-gradient(180deg, rgba(15, 23, 42, 0.90), rgba(15, 23, 42, 0.84) 42%, rgba(15, 23, 42, 0.96) 100%), url(${aiLandingBg})` }}
    >
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0F172A]/85 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <a className="flex items-center gap-3" href="#home" aria-label="AI TestPilot home">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#6366F1] text-white shadow-lg shadow-indigo-500/30">
              <TestTubeDiagonal size={20} />
            </span>
            <span className="text-lg font-black text-white">AI TestPilot</span>
          </a>
          <div className="hidden items-center gap-6 lg:flex">
            {navItems.map((item) => (
              <a className="text-sm font-semibold text-[#CBD5E1] transition hover:text-white" href={item.href} key={item.label}>
                {item.label}
              </a>
            ))}
            <Link className="text-sm font-bold text-[#CBD5E1] transition hover:text-white" to="/login">
              Login
            </Link>
          </div>
          <Link className="hidden rounded-lg bg-[#6366F1] px-4 py-2 text-sm font-bold text-white transition hover:bg-indigo-500 lg:inline-flex" to="/register">
            Get Started
          </Link>
          <button className="grid h-10 w-10 place-items-center rounded-lg border border-white/15 text-white lg:hidden" type="button" aria-label="Open menu">
            <Menu size={20} />
          </button>
        </nav>
      </header>

      <section className="relative overflow-hidden" id="home">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[0.88fr_1.12fr] lg:px-8 lg:py-24">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-white/10 px-4 py-2 text-sm font-bold text-indigo-100 backdrop-blur">
              <Sparkles size={16} />
              Test smarter. Release faster. Build better software with AI.
            </div>
            <p className="mb-4 text-sm font-black uppercase tracking-wide text-[#22C55E]">AI-Powered QA Automation Platform</p>
            <h1 className="max-w-3xl text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">
              AI QA Platform for Modern Software Teams
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#CBD5E1]">
              Automate your complete QA process with AI. Generate test cases, run UI and API tests, detect bugs, create bug reports, and improve release quality faster.
            </p>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
              Generate test cases, execute UI/API tests, detect bugs, and create reports using AI.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#6366F1] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-500" to="/register">
                Start Free Trial
                <ArrowRight size={18} />
              </Link>
              <a className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/10 px-6 py-3 text-sm font-bold text-white backdrop-blur transition hover:border-[#22C55E] hover:text-[#22C55E]" href="#how-it-works">
                <PlayCircle size={18} />
                Watch Demo
              </a>
            </div>
          </div>
          <DashboardPreview />
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#0F172A]/88 py-16 backdrop-blur-md" id="features">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 max-w-3xl">
            <p className="text-sm font-black uppercase text-[#22C55E]">Features</p>
            <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">Complete AI automation for QA teams.</h2>
            <p className="mt-4 leading-7 text-[#CBD5E1]">From requirement analysis to release reports, AI TestPilot keeps every quality workflow in one focused platform.</p>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {features.map((feature) => (
              <article className="rounded-xl border border-white/10 bg-white/[0.07] p-6 shadow-sm backdrop-blur transition hover:-translate-y-1 hover:border-indigo-400/50" key={feature.title}>
                <div className="mb-5 grid h-12 w-12 place-items-center rounded-xl bg-indigo-500/15 text-indigo-200">
                  <feature.icon size={24} />
                </div>
                <h3 className="text-xl font-black text-white">{feature.title}</h3>
                <p className="mt-3 leading-7 text-[#CBD5E1]">{feature.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-950/70 py-16 backdrop-blur-sm" id="how-it-works">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="text-sm font-black uppercase text-[#22C55E]">How It Works</p>
            <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">From requirements to reports in five steps.</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-5">
            {steps.map((step, index) => (
              <div className="rounded-xl border border-white/10 bg-white/[0.07] p-5 text-center backdrop-blur" key={step.title}>
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-[#6366F1] text-white">
                  <step.icon size={22} />
                </div>
                <p className="mt-4 text-xs font-black uppercase text-[#22C55E]">Step {index + 1}</p>
                <h3 className="mt-2 text-base font-black leading-6 text-white">{step.title}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#0F172A]/88 py-16 backdrop-blur-md" id="pricing">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <p className="text-sm font-black uppercase text-[#22C55E]">Pricing</p>
            <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">Choose the right QA automation plan.</h2>
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            {pricing.map((plan) => (
              <article className={`rounded-xl border p-6 shadow-sm backdrop-blur ${plan.featured ? "border-indigo-400 bg-indigo-500/15" : "border-white/10 bg-white/[0.07]"}`} key={plan.name}>
                <h3 className="text-xl font-black text-white">{plan.name}</h3>
                <p className="mt-2 text-sm leading-6 text-[#CBD5E1]">{plan.description}</p>
                <div className="mt-6 flex items-end gap-1">
                  <span className="text-4xl font-black text-white">{plan.price}</span>
                  {plan.price.startsWith("$") && <span className="pb-1 text-sm font-bold text-slate-400">/mo</span>}
                </div>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <li className="flex items-center gap-2 text-sm font-semibold text-[#CBD5E1]" key={feature}>
                      <CheckCircle2 className="text-[#22C55E]" size={17} />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link className={`mt-7 inline-flex w-full items-center justify-center rounded-lg px-4 py-3 text-sm font-bold transition ${plan.featured ? "bg-[#6366F1] text-white hover:bg-indigo-500" : "border border-white/20 text-white hover:border-[#22C55E] hover:text-[#22C55E]"}`} to="/register">
                  Get Started
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-950/70 py-16 backdrop-blur-sm" id="about">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div>
            <p className="text-sm font-black uppercase text-[#22C55E]">About</p>
            <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">Built for modern software teams.</h2>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.07] p-6 text-[#CBD5E1] backdrop-blur">
            <p className="leading-8">
              AI TestPilot helps QA, product, and engineering teams reduce manual testing effort, improve defect visibility, and release with more confidence. It brings test generation, UI/API execution, bug reporting, and analytics into one AI-powered workflow.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-[#0F172A]/88 py-16 backdrop-blur-md" id="contact">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <div>
            <p className="text-sm font-black uppercase text-[#22C55E]">Contact</p>
            <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">Ready to automate your QA process?</h2>
            <p className="mt-4 leading-7 text-[#CBD5E1]">Share your team details and we will help you get started with AI-powered testing.</p>
          </div>
          <form className="rounded-xl border border-white/10 bg-white/[0.07] p-6 shadow-sm backdrop-blur">
            <div className="grid gap-4 sm:grid-cols-2">
              <input className="w-full rounded-md border border-white/15 bg-slate-950/50 px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#6366F1] focus:ring-2 focus:ring-indigo-500/20" placeholder="Your name" type="text" />
              <input className="w-full rounded-md border border-white/15 bg-slate-950/50 px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#6366F1] focus:ring-2 focus:ring-indigo-500/20" placeholder="Work email" type="email" />
            </div>
            <textarea className="mt-4 min-h-32 w-full resize-none rounded-md border border-white/15 bg-slate-950/50 px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#6366F1] focus:ring-2 focus:ring-indigo-500/20" placeholder="Tell us about your QA workflow" />
            <button className="mt-5 inline-flex items-center justify-center gap-2 rounded-lg bg-[#22C55E] px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400" type="button">
              <Mail size={18} />
              Send Message
            </button>
          </form>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-slate-950 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm text-[#CBD5E1] md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#6366F1] text-white">
              <Rocket size={18} />
            </span>
            <span className="font-bold text-white">AI TestPilot</span>
          </div>
          <p>Test smarter. Release faster. Build better software with AI.</p>
          <p>© 2026 AI TestPilot. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
