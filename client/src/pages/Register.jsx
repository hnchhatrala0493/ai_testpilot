import { ArrowLeft, Bot, BriefcaseBusiness, Check, ShieldCheck, UserPlus, Users } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore.js";

const companyFields = [
  "company.name",
  "company.email",
  "company.phone",
  "company.size",
  "company.industry",
  "company.country",
  "company.state",
  "company.city",
  "company.address",
];

const steps = [
  { id: 1, label: "Company", icon: BriefcaseBusiness },
  { id: 2, label: "Admin", icon: UserPlus },
  { id: 3, label: "Employees", icon: Users },
];

export default function Register() {
  const navigate = useNavigate();
  const registerUser = useAuthStore((state) => state.register);
  const loading = useAuthStore((state) => state.loading);
  const error = useAuthStore((state) => state.error);
  const [step, setStep] = useState(1);
  const {
    register,
    handleSubmit,
    trigger,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      company: {
        name: "",
        email: "",
        phone: "",
        website: "",
        size: "",
        industry: "",
        country: "",
        state: "",
        city: "",
        address: "",
      },
      fullname: "",
      email: "",
      mobileNo: "",
      password: "",
      confirmPassword: "",
    },
  });

  const password = watch("password");

  const goToAdminStep = async () => {
    const isValid = await trigger(companyFields);
    if (isValid) setStep(2);
  };

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
            <h1 className="mt-5 text-4xl font-bold leading-tight md:text-5xl">Create your company workspace.</h1>
            <p className="mt-4 text-base leading-7 text-slate-200">
              Start with organization details, create the first admin account, then add company employees from the workspace.
            </p>
            <div className="mt-6 grid gap-3 text-sm sm:grid-cols-3">
              {["Company profile", "Admin account", "Employee setup"].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-md border border-white/15 bg-slate-950/55 p-3 backdrop-blur">
                  <ShieldCheck className="text-blue-200" size={18} />
                  <span className="font-semibold">{item}</span>
                </div>
              ))}
            </div>
          </section>

          <form className="rounded-md border border-white/15 bg-white/95 p-5 text-ink shadow-soft backdrop-blur dark:bg-slate-900/95 dark:text-slate-100" onSubmit={handleSubmit(onSubmit)}>
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-md bg-brand text-white">
                  {step === 1 ? <BriefcaseBusiness size={21} /> : <UserPlus size={21} />}
                </span>
                <div>
                  <h2 className="text-2xl font-bold">{step === 1 ? "Company details" : "Admin user registration"}</h2>
                  <p className="text-sm text-slate-500">Step {step} of 2</p>
                </div>
              </div>
            </div>

            <div className="mb-5 grid grid-cols-3 gap-2">
              {steps.map((item) => {
                const Icon = item.icon;
                const complete = item.id < step || (item.id === 3 && step > 2);
                const active = item.id === step;
                const upcoming = item.id === 3;
                return (
                  <div
                    key={item.id}
                    className={`flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-semibold ${
                      active
                        ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200"
                        : complete
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
                          : "border-line bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400"
                    }`}
                  >
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-white dark:bg-slate-900">
                      {complete ? <Check size={15} /> : <Icon size={15} />}
                    </span>
                    <span className={upcoming ? "truncate" : ""}>{item.label}</span>
                  </div>
                );
              })}
            </div>

            {step === 1 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="label">Company Name</span>
                  <input className="input mt-1" {...register("company.name", { required: "Company name is required" })} />
                  {errors.company?.name ? <span className="mt-1 block text-xs text-red-600">{errors.company.name.message}</span> : null}
                </label>
                <label className="block">
                  <span className="label">Company Email</span>
                  <input className="input mt-1" type="email" {...register("company.email", { required: "Company email is required" })} />
                  {errors.company?.email ? <span className="mt-1 block text-xs text-red-600">{errors.company.email.message}</span> : null}
                </label>
                <label className="block">
                  <span className="label">Company Phone</span>
                  <input className="input mt-1" {...register("company.phone", { required: "Company phone is required" })} />
                  {errors.company?.phone ? <span className="mt-1 block text-xs text-red-600">{errors.company.phone.message}</span> : null}
                </label>
                <label className="block">
                  <span className="label">Company Website</span>
                  <input className="input mt-1" type="url" placeholder="https://example.com" {...register("company.website")} />
                </label>
                <label className="block">
                  <span className="label">Company Size</span>
                  <select className="input mt-1" {...register("company.size", { required: "Company size is required" })}>
                    <option value="">Select size</option>
                    <option value="1-10">1-10 employees</option>
                    <option value="11-50">11-50 employees</option>
                    <option value="51-200">51-200 employees</option>
                    <option value="201-500">201-500 employees</option>
                    <option value="501-1000">501-1000 employees</option>
                    <option value="1000+">1000+ employees</option>
                  </select>
                  {errors.company?.size ? <span className="mt-1 block text-xs text-red-600">{errors.company.size.message}</span> : null}
                </label>
                <label className="block">
                  <span className="label">Industry</span>
                  <input className="input mt-1" {...register("company.industry", { required: "Industry is required" })} />
                  {errors.company?.industry ? <span className="mt-1 block text-xs text-red-600">{errors.company.industry.message}</span> : null}
                </label>
                <label className="block">
                  <span className="label">Country</span>
                  <input className="input mt-1" {...register("company.country", { required: "Country is required" })} />
                  {errors.company?.country ? <span className="mt-1 block text-xs text-red-600">{errors.company.country.message}</span> : null}
                </label>
                <label className="block">
                  <span className="label">State</span>
                  <input className="input mt-1" {...register("company.state", { required: "State is required" })} />
                  {errors.company?.state ? <span className="mt-1 block text-xs text-red-600">{errors.company.state.message}</span> : null}
                </label>
                <label className="block">
                  <span className="label">City</span>
                  <input className="input mt-1" {...register("company.city", { required: "City is required" })} />
                  {errors.company?.city ? <span className="mt-1 block text-xs text-red-600">{errors.company.city.message}</span> : null}
                </label>
                <label className="block sm:col-span-2">
                  <span className="label">Company Address</span>
                  <textarea className="input mt-1 min-h-20 resize-y" {...register("company.address", { required: "Company address is required" })} />
                  {errors.company?.address ? <span className="mt-1 block text-xs text-red-600">{errors.company.address.message}</span> : null}
                </label>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="label">Full Name</span>
                  <input className="input mt-1" {...register("fullname", { required: "Full name is required" })} />
                  {errors.fullname ? <span className="mt-1 block text-xs text-red-600">{errors.fullname.message}</span> : null}
                </label>
                <label className="block">
                  <span className="label">Email</span>
                  <input className="input mt-1" type="email" {...register("email", { required: "Email is required" })} />
                  {errors.email ? <span className="mt-1 block text-xs text-red-600">{errors.email.message}</span> : null}
                </label>
                <label className="block">
                  <span className="label">Mobile Number</span>
                  <input className="input mt-1" {...register("mobileNo", { required: "Mobile number is required" })} />
                  {errors.mobileNo ? <span className="mt-1 block text-xs text-red-600">{errors.mobileNo.message}</span> : null}
                </label>
                <div className="hidden sm:block" />
                <label className="block">
                  <span className="label">Password</span>
                  <input className="input mt-1" type="password" {...register("password", { required: "Password is required", minLength: { value: 6, message: "Password must be at least 6 characters" } })} />
                  {errors.password ? <span className="mt-1 block text-xs text-red-600">{errors.password.message}</span> : null}
                </label>
                <label className="block">
                  <span className="label">Confirm Password</span>
                  <input
                    className="input mt-1"
                    type="password"
                    {...register("confirmPassword", {
                      required: "Confirm password is required",
                      validate: (value) => value === password || "Passwords do not match",
                    })}
                  />
                  {errors.confirmPassword ? <span className="mt-1 block text-xs text-red-600">{errors.confirmPassword.message}</span> : null}
                </label>
              </div>
            )}

            {error ? <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
              {step === 2 ? (
                <button className="btn-muted" type="button" onClick={() => setStep(1)}>
                  Back
                </button>
              ) : (
                <span />
              )}
              {step === 1 ? (
                <button className="btn-primary" type="button" onClick={goToAdminStep}>
                  Continue
                </button>
              ) : (
                <button className="btn-primary" type="submit" disabled={loading}>
                  {loading ? "Creating..." : "Create company and admin"}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
