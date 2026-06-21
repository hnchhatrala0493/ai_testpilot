import { Bot, Bug, CheckCircle2, LockKeyhole, PlayCircle, ShieldCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import loginBackground from "../assets/ai-testpilot-login-bg.png";
import { useAuthStore } from "../store/authStore.js";

const highlights = [
  { icon: Bot, label: "AI test generation" },
  { icon: PlayCircle, label: "Automated execution" },
  { icon: Bug, label: "Bug intelligence" },
  { icon: CheckCircle2, label: "Release readiness" },
];

export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const loading = useAuthStore((state) => state.loading);
  const error = useAuthStore((state) => state.error);
  const { register, handleSubmit } = useForm({
    defaultValues: { email: "aarav@acme.dev", password: "password" },
  });

  const onSubmit = async (values) => {
    const ok = await login(values);
    if (ok) navigate("/dashboard");
  };

  return (
    <main
      className="relative isolate min-h-screen overflow-hidden bg-ink px-5 py-6 text-white"
      style={{
        backgroundImage: `url(${loginBackground})`,
        backgroundPosition: "center center",
        backgroundSize: "cover",
      }}
    >
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(3,7,18,0.74)_0%,rgba(8,16,30,0.50)_48%,rgba(3,7,18,0.84)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-48 bg-gradient-to-t from-slate-950 to-transparent" />

      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl items-center gap-8 lg:grid-cols-[0.95fr_0.78fr]">
        <section className="max-w-2xl">
          <span className="grid h-12 w-12 place-items-center rounded-md bg-cyan-400 text-slate-950 shadow-soft">
            <Bot size={24} />
          </span>
          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.28em] text-cyan-200">AI TestPilot</p>
          <h1 className="mt-3 max-w-xl text-4xl font-bold leading-tight md:text-5xl">
            AI-based automation testing and bug tracking platform.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-200">
            Plan intelligent test coverage, execute automated checks, surface defects, and keep release quality visible from one secure workspace.
          </p>
          <div className="mt-7 grid max-w-xl gap-3 text-sm sm:grid-cols-2">
            {highlights.map((item) => (
              <div key={item.label} className="flex min-h-14 items-center gap-3 rounded-md border border-white/15 bg-slate-950/45 p-3 backdrop-blur-md">
                <item.icon className="text-cyan-200" size={18} />
                <span className="font-semibold">{item.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-md border border-white/18 bg-white/95 p-5 text-ink shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl dark:bg-slate-950/92 dark:text-slate-100">
          <div className="mb-5 flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-md bg-cyan-500 text-slate-950">
              <LockKeyhole size={21} />
            </span>
            <div>
              <h2 className="text-2xl font-bold">Login to AI TestPilot</h2>
              <p className="text-sm text-slate-500">Access automation, defects, and release intelligence.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
              <label className="block">
                <span className="label">Work email</span>
                <input className="input mt-1" type="email" {...register("email", { required: true })} />
              </label>
              <label className="block">
                <span className="label">Password</span>
                <input className="input mt-1" type="password" {...register("password", { required: true })} />
              </label>
              <div className="flex items-center justify-between gap-3 text-sm">
                <label className="flex items-center gap-2 text-slate-500">
                  <input type="checkbox" className="h-4 w-4 rounded border-line" />
                  Keep me signed in
                </label>
                <Link className="font-semibold text-brand" to="/forgot-password">
                  Forgot password?
                </Link>
              </div>
              {error ? <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700">{error}</p> : null}
              <button className="btn-primary w-full" type="submit" disabled={loading}>
                <ShieldCheck size={17} />
                {loading ? "Signing in..." : "Login"}
              </button>
            </div>
          </form>

          <p className="mt-4 text-sm text-slate-500">
            New QA, developer, or manager?{" "}
            <Link className="font-semibold text-brand" to="/register">
              Create workspace account
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
