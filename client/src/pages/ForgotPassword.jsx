import { ArrowLeft, Bot, KeyRound, LockKeyhole, Mail, MailCheck, Send, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { authApi } from "../services/api.js";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const resetToken = searchParams.get("token") || "";
  const [sentTo, setSentTo] = useState("");
  const [requesting, setRequesting] = useState(false);
  const [resetting, setResetting] = useState(false);
  const { register: registerRequest, handleSubmit: handleRequestSubmit } = useForm();
  const {
    register: registerReset,
    handleSubmit: handleResetSubmit,
    watch,
    formState: { errors: resetErrors },
  } = useForm();

  const onRequestSubmit = async (values) => {
    try {
      setRequesting(true);
      const response = await authApi.forgotPassword(values);
      setSentTo(values.email);
      toast.success(response.data?.message || "Reset link sent");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to send reset link");
    } finally {
      setRequesting(false);
    }
  };

  const onResetSubmit = async (values) => {
    try {
      setResetting(true);
      const response = await authApi.resetPassword({
        token: resetToken,
        password: values.password,
        confirmPassword: values.confirmPassword,
      });
      toast.success(response.data?.message || "Password reset successfully");
      navigate("/login");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to reset password");
    } finally {
      setResetting(false);
    }
  };

  return (
    <main
      className="relative min-h-screen bg-ink px-5 py-8 text-white"
      style={{
        backgroundImage:
          "linear-gradient(180deg, rgba(15, 23, 42, 0.22) 0%, rgba(15, 23, 42, 0.70) 48%, rgba(15, 23, 42, 0.94) 100%), url('https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1800&q=85')",
        backgroundPosition: "center",
        backgroundSize: "cover",
      }}
    >
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 lg:grid-cols-[0.95fr_0.8fr]">
        <section className="max-w-xl">
          <Link className="mb-8 inline-flex w-fit items-center gap-2 rounded-md border border-white/15 bg-slate-950/45 px-3 py-2 text-sm font-semibold text-white backdrop-blur" to="/login">
            <ArrowLeft size={16} />
            Back to login
          </Link>
          <span className="grid h-12 w-12 place-items-center rounded-md bg-brand text-white shadow-soft">
            <Bot size={24} />
          </span>
          <h1 className="mt-5 text-4xl font-bold leading-tight md:text-5xl">Recover access to your AI testing workspace.</h1>
          <p className="mt-4 text-base leading-7 text-slate-200">
            Reset your password and get back to automation runs, AI-generated test cases, and bug triage dashboards.
          </p>
          <div className="mt-6 grid gap-3 text-sm sm:grid-cols-3">
            {["Secure reset", "Team access", "Testing workspace"].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-md border border-white/15 bg-slate-950/55 p-3 backdrop-blur">
                <ShieldCheck className="text-blue-200" size={18} />
                <span className="font-semibold">{item}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-md border border-white/15 bg-white/95 p-6 text-ink shadow-soft backdrop-blur dark:bg-slate-900/95 dark:text-slate-100">
          <div className="mb-6 flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-md bg-brand text-white">
              {resetToken ? <KeyRound size={23} /> : sentTo ? <MailCheck size={23} /> : <Bot size={23} />}
            </span>
            <div>
              <h2 className="text-2xl font-bold">{resetToken ? "Create New Password" : "Forgot Password"}</h2>
              <p className="text-sm text-slate-500">
                {resetToken ? "Enter and confirm your new account password." : "Request a reset link for your AI TestOps account."}
              </p>
            </div>
          </div>

          {resetToken ? (
            <form onSubmit={handleResetSubmit(onResetSubmit)}>
              <div className="space-y-4">
                <label className="block">
                  <span className="label">New password</span>
                  <div className="relative mt-1">
                    <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                    <input
                      className="input pl-10"
                      type="password"
                      placeholder="Enter new password"
                      {...registerReset("password", {
                        required: true,
                        minLength: { value: 6, message: "Password must be at least 6 characters" },
                      })}
                    />
                  </div>
                  {resetErrors.password ? <p className="mt-1 text-xs font-semibold text-amber-600">{resetErrors.password.message || "New password is required"}</p> : null}
                </label>
                <label className="block">
                  <span className="label">Confirm password</span>
                  <div className="relative mt-1">
                    <ShieldCheck className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                    <input
                      className="input pl-10"
                      type="password"
                      placeholder="Confirm new password"
                      {...registerReset("confirmPassword", {
                        required: true,
                        validate: (value) => value === watch("password") || "Passwords do not match",
                      })}
                    />
                  </div>
                  {resetErrors.confirmPassword ? <p className="mt-1 text-xs font-semibold text-amber-600">{resetErrors.confirmPassword.message || "Confirm password is required"}</p> : null}
                </label>
              </div>
              <button className="btn-primary mt-5 w-full" type="submit" disabled={resetting}>
                <KeyRound size={17} />
                {resetting ? "Resetting password..." : "Reset password"}
              </button>
            </form>
          ) : sentTo ? (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
              Reset instructions have been sent to <span className="font-bold">{sentTo}</span>. Open the email and click the secure reset link to create a new password.
            </div>
          ) : (
            <form onSubmit={handleRequestSubmit(onRequestSubmit)}>
              <label className="block">
                <span className="label">Registered email</span>
                <div className="relative mt-1">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                  <input className="input pl-10" type="email" placeholder="qa.lead@company.com" {...registerRequest("email", { required: true })} />
                </div>
              </label>
              <button className="btn-primary mt-5 w-full" type="submit" disabled={requesting}>
                <Send size={17} />
                {requesting ? "Sending reset link..." : "Send reset link"}
              </button>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
