import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function StatCard({ label, value, icon: Icon, tone = "blue", helper, change, variant = "default", viewTo }) {
  const tones = {
    blue: "bg-blue-50 text-blue-700",
    red: "bg-red-50 text-red-700",
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
  };
  const colorTones = {
    blue: {
      card: "border-blue-200 bg-blue-50 hover:border-blue-300 hover:shadow-blue-100/80 dark:border-blue-900 dark:bg-blue-950/50 dark:hover:border-blue-700 dark:hover:shadow-blue-950/40",
      icon: "bg-blue-600 text-white",
      label: "text-blue-700 dark:text-blue-200",
      value: "text-blue-950 dark:text-blue-50",
      helper: "text-blue-700/80 dark:text-blue-200/80",
    },
    red: {
      card: "border-red-200 bg-red-50 hover:border-red-300 hover:shadow-red-100/80 dark:border-red-900 dark:bg-red-950/50 dark:hover:border-red-700 dark:hover:shadow-red-950/40",
      icon: "bg-red-600 text-white",
      label: "text-red-700 dark:text-red-200",
      value: "text-red-950 dark:text-red-50",
      helper: "text-red-700/80 dark:text-red-200/80",
    },
    emerald: {
      card: "border-emerald-200 bg-emerald-50 hover:border-emerald-300 hover:shadow-emerald-100/80 dark:border-emerald-900 dark:bg-emerald-950/50 dark:hover:border-emerald-700 dark:hover:shadow-emerald-950/40",
      icon: "bg-emerald-600 text-white",
      label: "text-emerald-700 dark:text-emerald-200",
      value: "text-emerald-950 dark:text-emerald-50",
      helper: "text-emerald-700/80 dark:text-emerald-200/80",
    },
    amber: {
      card: "border-amber-200 bg-amber-50 hover:border-amber-300 hover:shadow-amber-100/80 dark:border-amber-900 dark:bg-amber-950/50 dark:hover:border-amber-700 dark:hover:shadow-amber-950/40",
      icon: "bg-amber-500 text-white",
      label: "text-amber-700 dark:text-amber-200",
      value: "text-amber-950 dark:text-amber-50",
      helper: "text-amber-700/80 dark:text-amber-200/80",
    },
    violet: {
      card: "border-violet-200 bg-violet-50 hover:border-violet-300 hover:shadow-violet-100/80 dark:border-violet-900 dark:bg-violet-950/50 dark:hover:border-violet-700 dark:hover:shadow-violet-950/40",
      icon: "bg-violet-600 text-white",
      label: "text-violet-700 dark:text-violet-200",
      value: "text-violet-950 dark:text-violet-50",
      helper: "text-violet-700/80 dark:text-violet-200/80",
    },
    cyan: {
      card: "border-cyan-200 bg-cyan-50 hover:border-cyan-300 hover:shadow-cyan-100/80 dark:border-cyan-900 dark:bg-cyan-950/50 dark:hover:border-cyan-700 dark:hover:shadow-cyan-950/40",
      icon: "bg-cyan-600 text-white",
      label: "text-cyan-700 dark:text-cyan-200",
      value: "text-cyan-950 dark:text-cyan-50",
      helper: "text-cyan-700/80 dark:text-cyan-200/80",
    },
  };
  const colorTone = colorTones[tone] || colorTones.blue;

  if (variant === "color") {
    return (
      <section className={`group flex h-full min-h-32 flex-col rounded-md border p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg ${colorTone.card}`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className={`text-base font-bold ${colorTone.label}`}>{label}</p>
            <p className={`mt-2 text-3xl font-bold ${colorTone.value}`}>{value}</p>
          </div>
          <span className={`grid h-11 w-11 place-items-center rounded-md shadow-sm ${colorTone.icon}`}>
            <Icon size={21} />
          </span>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {change ? (
            <span
              className={`rounded-md px-2 py-1 text-xs font-semibold ${
                change.direction === "down"
                  ? "bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-100"
                  : change.direction === "flat"
                    ? "bg-white/70 text-slate-600 dark:bg-slate-900/60 dark:text-slate-200"
                    : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-100"
              }`}
            >
              {change.label}
            </span>
          ) : null}
          {helper ? <p className={`text-xs font-medium ${colorTone.helper}`}>{helper}</p> : null}
        </div>
        {viewTo ? (
          <div className="mt-auto pt-4">
            <Link
              className="inline-flex translate-y-1 items-center gap-1 rounded-md bg-white/80 px-2.5 py-1.5 text-xs font-bold text-slate-800 opacity-0 shadow-sm transition duration-200 hover:bg-white group-hover:translate-y-0 group-hover:opacity-100 focus:translate-y-0 focus:opacity-100 dark:bg-slate-950/70 dark:text-slate-100 dark:hover:bg-slate-950"
              to={viewTo}
            >
              View
              <ArrowRight size={14} />
            </Link>
          </div>
        ) : null}
      </section>
    );
  }

  return (
    <section className="surface group flex h-full min-h-44 flex-col rounded-md p-4 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div>
            <p className="text-base font-bold text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold">{value}</p>
        </div>
        <span className={`grid h-11 w-11 place-items-center rounded-md ${tones[tone]}`}>
          <Icon size={21} />
        </span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {change ? (
          <span
            className={`rounded-md px-2 py-1 text-xs font-semibold ${
              change.direction === "down"
                ? "bg-red-50 text-red-700"
                : change.direction === "flat"
                  ? "bg-slate-100 text-slate-600"
                  : "bg-emerald-50 text-emerald-700"
            }`}
          >
            {change.label}
          </span>
        ) : null}
        {helper ? <p className="text-xs text-slate-500">{helper}</p> : null}
      </div>
      {viewTo ? (
        <div className="mt-auto pt-4">
          <Link
            className="inline-flex translate-y-1 items-center gap-1 rounded-md border border-line bg-white px-2.5 py-1.5 text-xs font-bold text-ink opacity-0 shadow-sm transition duration-200 hover:bg-mist group-hover:translate-y-0 group-hover:opacity-100 focus:translate-y-0 focus:opacity-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-800"
            to={viewTo}
          >
            View
            <ArrowRight size={14} />
          </Link>
        </div>
      ) : null}
    </section>
  );
}
