import {
  BarChart3,
  Bot,
  CheckCircle2,
  ClipboardList,
  FileSearch,
  PlayCircle,
  RefreshCcw,
  Rocket,
  Send,
  ShieldAlert,
  WandSparkles,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import PageHeader from "../components/PageHeader.jsx";
import { aiApi } from "../services/api.js";

const iconMap = {
  BarChart3,
  Bot,
  ClipboardList,
  FileSearch,
  PlayCircle,
  RefreshCcw,
  Rocket,
  ShieldAlert,
  WandSparkles,
};

const toneClasses = {
  blue: "border-blue-100 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200",
  emerald: "border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  amber: "border-amber-100 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200",
  rose: "border-rose-100 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200",
  violet: "border-violet-100 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950 dark:text-violet-200",
};

function Field({ field, value, onChange }) {
  const commonProps = {
    className: "input mt-1",
    value: value || "",
    placeholder: field.placeholder || "",
    required: field.required,
    onChange: (event) => onChange(field.name, event.target.value),
  };

  if (field.type === "textarea") {
    return <textarea {...commonProps} rows={4} />;
  }

  if (field.type === "select") {
    return (
      <select {...commonProps}>
        <option value="">{field.placeholder || "Select option"}</option>
        <option value="7d">Last 7 days</option>
        <option value="30d">Last 30 days</option>
        <option value="90d">Last 90 days</option>
      </select>
    );
  }

  return <input {...commonProps} type={field.type || "text"} />;
}

export default function AICenter({ moduleSlug }) {
  const params = useParams();
  const activeSlug = moduleSlug || params.slug || "ai-agents";
  const [modules, setModules] = useState([]);
  const [activeModule, setActiveModule] = useState(null);
  const [form, setForm] = useState({});
  const [runResult, setRunResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadAICenter() {
      try {
        setLoading(true);
        const modulesResponse = await aiApi.modules();
        const loadedModules = modulesResponse.data.result || [];
        let loadedModule = loadedModules.find((item) => item.slug === activeSlug);

        try {
          const moduleResponse = await aiApi.module(activeSlug);
          loadedModule = moduleResponse.data.result || loadedModule;
        } catch (error) {
          if (!loadedModule) throw error;
        }

        if (!mounted) return;
        setModules(loadedModules);
        setActiveModule(loadedModule);
        setRunResult(null);
        setForm({});
      } catch (error) {
        toast.error(error.response?.data?.message || "Unable to load AI Center module");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadAICenter();
    return () => {
      mounted = false;
    };
  }, [activeSlug]);

  const visibleModules = useMemo(() => modules.filter((item) => item.enabled !== false), [modules]);
  const Icon = iconMap[activeModule?.icon] || Bot;

  const updateField = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
  };

  const runAction = async (event) => {
    event.preventDefault();

    try {
      const actionKey = activeModule.actions?.[0]?.key;
      const response = await aiApi.runModule(activeModule.slug, { actionKey, payload: form });
      setRunResult(response.data.result);
      toast.success(response.data.result?.message || "AI module action completed");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to run AI module action");
    }
  };

  if (loading && !activeModule) {
    return <div className="surface rounded-md p-6 text-sm font-semibold text-slate-500">Loading AI Center...</div>;
  }

  if (!activeModule) {
    return <div className="surface rounded-md p-6 text-sm font-semibold text-slate-500">AI module not found.</div>;
  }

  return (
    <>
      <PageHeader
        title={activeModule.name}
        description={activeModule.summary}
        action={
          <span className="inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
            <CheckCircle2 size={16} />
            {activeModule.status}
          </span>
        }
      />

      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {visibleModules.map((item) => (
          <Link
            key={item.slug}
            to={item.route}
            className={`shrink-0 rounded-md border px-3 py-2 text-sm font-semibold transition ${
              item.slug === activeModule.slug
                ? "border-blue-200 bg-blue-50 text-brand dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200"
                : "border-line bg-white text-slate-600 hover:bg-mist dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
          >
            {item.navLabel || item.name}
          </Link>
        ))}
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {(activeModule.metrics || []).map((metric) => (
          <article key={metric.label} className={`rounded-md border p-4 ${toneClasses[metric.tone] || toneClasses.blue}`}>
            <p className="text-xs font-semibold uppercase">{metric.label}</p>
            <p className="mt-2 text-2xl font-bold">{metric.value}</p>
          </article>
        ))}
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[1.4fr_0.9fr]">
        <div className="surface rounded-md p-5">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-md bg-blue-50 text-brand dark:bg-blue-950 dark:text-blue-200">
              <Icon size={21} />
            </span>
            <div>
              <h2 className="font-bold">Module Capabilities</h2>
              <p className="text-sm text-slate-500">{activeModule.category}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {(activeModule.capabilities || []).map((capability) => (
              <article key={capability.title} className="rounded-md border border-line bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
                <h3 className="font-bold">{capability.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{capability.description}</p>
              </article>
            ))}
          </div>
        </div>

        <form className="surface rounded-md p-5" onSubmit={runAction}>
          <h2 className="font-bold">Action Runner</h2>
          <div className="mt-4 space-y-4">
            {(activeModule.fields || []).map((field) => (
              <label key={field.name} className="block">
                <span className="label">{field.label}</span>
                <Field field={field} value={form[field.name]} onChange={updateField} />
              </label>
            ))}
          </div>
          <button className="btn-primary mt-5 w-full" type="submit">
            <Send size={16} />
            {activeModule.actions?.[0]?.label || "Run module"}
          </button>
          {runResult ? (
            <div className="mt-4 rounded-md border border-line bg-slate-50 p-4 text-sm dark:border-slate-700 dark:bg-slate-950">
              <p className="font-bold">{runResult.message}</p>
              {runResult.payloadSummary?.length ? <p className="mt-2 text-slate-600 dark:text-slate-300">{runResult.payloadSummary.join(" | ")}</p> : null}
            </div>
          ) : null}
        </form>
      </section>

      <section className="surface mt-5 rounded-md p-5">
        <h2 className="font-bold">AI Pipeline</h2>
        <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          {(activeModule.pipeline || []).map((step, index) => (
            <div key={`${step}-${index}`} className="rounded-md border border-line bg-white p-3 text-sm font-semibold dark:border-slate-700 dark:bg-slate-950">
              <span className="mr-2 text-slate-400">{String(index + 1).padStart(2, "0")}</span>
              {step}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
