import { ArrowLeft, Bot, ShieldCheck, UserPlus } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore.js";
import { USER_ROLE_LABELS, USER_ROLES } from "../utils/constants.js";

export default function Register() {
  const navigate = useNavigate();
  const registerUser = useAuthStore((state) => state.register);
  const loading = useAuthStore((state) => state.loading);
  const error = useAuthStore((state) => state.error);
  const { register, handleSubmit } = useForm({ defaultValues: { role: "tester" } });

  const onSubmit = async (values) => {
    const ok = await registerUser(values);
    if (ok) navigate("/dashboard");
  };

  return (
    <main
      className="relative min-h-screen bg-ink px-5 py-8 text-white"
      style={{
        backgroundImage:
          "linear-gradient(180deg, rgba(15, 23, 42, 0.28) 0%, rgba(15, 23, 42, 0.70) 45%, rgba(15, 23, 42, 0.94) 100%), url('https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1800&q=85')",
        backgroundPosition: "center",
        backgroundSize: "cover",
      }}
    >
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col">
        <Link className="inline-flex w-fit items-center gap-2 rounded-md border border-white/15 bg-slate-950/45 px-3 py-2 text-sm font-semibold text-white backdrop-blur" to="/login">
          <ArrowLeft size={16} />
          Login
        </Link>

        <div className="grid flex-1 items-center gap-8 py-8 lg:grid-cols-[0.9fr_1fr]">
          <section className="max-w-xl">
            <span className="grid h-12 w-12 place-items-center rounded-md bg-brand text-white shadow-soft">
              <Bot size={24} />
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-tight md:text-5xl">Join the AI testing command center.</h1>
            <p className="mt-4 text-base leading-7 text-slate-200">
              Register your workspace account for AI-generated test cases, automated UI/API runs, bug detection, and release health reporting.
            </p>
            <div className="mt-6 grid gap-3 text-sm sm:grid-cols-3">
              {["AI test cases", "Automated runs", "Bug reports"].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-md border border-white/15 bg-slate-950/55 p-3 backdrop-blur">
                  <ShieldCheck className="text-blue-200" size={18} />
                  <span className="font-semibold">{item}</span>
                </div>
              ))}
            </div>
          </section>

          <form className="rounded-md border border-white/15 bg-white/95 p-5 text-ink shadow-soft backdrop-blur dark:bg-slate-900/95 dark:text-slate-100" onSubmit={handleSubmit(onSubmit)}>
            <div className="mb-5 flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-md bg-brand text-white">
                <UserPlus size={21} />
              </span>
              <div>
                <h2 className="text-2xl font-bold">Register</h2>
                <p className="text-sm text-slate-500">Join the AI Automation Testing & Bug Reporting System.</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="label">Username</span>
                <input className="input mt-1" {...register("username", { required: true })} />
              </label>
              <label className="block">
                <span className="label">Full name</span>
                <input className="input mt-1" {...register("fullname", { required: true })} />
              </label>
              <label className="block">
                <span className="label">Email</span>
                <input className="input mt-1" type="email" {...register("email", { required: true })} />
              </label>
              <label className="block">
                <span className="label">Mobile number</span>
                <input className="input mt-1" {...register("mobileNo")} />
              </label>
              <label className="block">
                <span className="label">Role</span>
                <select className="input mt-1 capitalize" {...register("role")}>
                  {USER_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {USER_ROLE_LABELS[role]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="label">Primary skill</span>
                <input className="input mt-1" placeholder="Playwright, API testing, bug triage" {...register("skills")} />
              </label>
              <label className="block sm:col-span-2">
                <span className="label">Password</span>
                <input className="input mt-1" type="password" {...register("password", { required: true })} />
              </label>
            </div>
            {error ? <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
            <button className="btn-primary mt-5 w-full sm:w-auto" type="submit" disabled={loading}>
              {loading ? "Creating..." : "Register account"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
