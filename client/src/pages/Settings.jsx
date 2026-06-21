import { Bell, Bot, Building2, Clock, KeyRound, Mail, RotateCcw, Save, ShieldCheck, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import PageHeader from "../components/PageHeader.jsx";
import { settingsApi } from "../services/api.js";
import { useAuthStore } from "../store/authStore.js";
import { USER_ROLES, USER_ROLE_LABELS } from "../utils/constants.js";
import hasPermission from "../utils/hasPermission.js";

const defaultSettings = {
  appName: "AI TestPilot",
  supportEmail: "",
  defaultUserRole: "tester",
  timezone: "Asia/Calcutta",
  dateFormat: "DD MMM YYYY",
  allowRegistration: true,
  requireEmailVerification: false,
  sessionTimeoutMinutes: 60,
  passwordMinLength: 8,
  emailNotifications: true,
  bugAssignmentEmails: true,
  testRunAlerts: true,
  weeklyReportEmails: false,
  autoAssignBugs: false,
  aiSuggestionsEnabled: true,
  automationRetryCount: 1,
};

function FieldIcon({ icon: Icon }) {
  return <Icon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />;
}

function Toggle({ label, description, registerProps, disabled }) {
  return (
    <label className="flex min-h-20 cursor-pointer items-center justify-between gap-4 rounded-md border border-line bg-white p-4 text-sm dark:border-slate-700 dark:bg-slate-950">
      <span>
        <span className="block font-semibold text-ink dark:text-slate-100">{label}</span>
        <span className="mt-1 block text-xs leading-5 text-slate-500 dark:text-slate-400">{description}</span>
      </span>
      <input className="h-5 w-5 shrink-0 accent-blue-600" type="checkbox" disabled={disabled} {...registerProps} />
    </label>
  );
}

export default function Settings() {
  const user = useAuthStore((state) => state.user);
  const canUpdateSettings = hasPermission(user, "settings:update");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset } = useForm({ defaultValues: defaultSettings });

  useEffect(() => {
    let active = true;

    async function loadSettings() {
      try {
        setLoading(true);
        const response = await settingsApi.get();
        if (active) reset({ ...defaultSettings, ...(response.data?.result || {}) });
      } catch (error) {
        if (active) toast.error(error.response?.data?.message || "Unable to load settings");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadSettings();

    return () => {
      active = false;
    };
  }, [reset]);

  const onSubmit = async (values) => {
    if (!canUpdateSettings) {
      toast.error("You do not have permission to update settings.");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        ...values,
        sessionTimeoutMinutes: Number(values.sessionTimeoutMinutes),
        passwordMinLength: Number(values.passwordMinLength),
        automationRetryCount: Number(values.automationRetryCount),
      };
      const response = await settingsApi.update(payload);
      reset({ ...defaultSettings, ...(response.data?.result || {}) });
      toast.success(response.data?.message || "Settings updated successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to update settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Settings"
        description="Update platform defaults, account security, notification behavior, and automation preferences."
        action={
          <button className="btn-muted" type="button" onClick={() => reset(defaultSettings)} disabled={saving || !canUpdateSettings}>
            <RotateCcw size={17} />
            Reset form
          </button>
        }
      />

      {loading ? (
        <section className="surface rounded-md p-6 text-sm font-semibold text-slate-500">Loading settings...</section>
      ) : (
        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <section className="surface rounded-md p-5">
            <div className="mb-4 flex items-center gap-2">
              <Building2 size={18} />
              <h2 className="font-bold">Workspace Defaults</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <label className="block">
                <span className="label">Application name</span>
                <div className="relative mt-1">
                  <FieldIcon icon={Building2} />
                  <input className="input pl-10" disabled={!canUpdateSettings} {...register("appName", { required: true })} />
                </div>
              </label>
              <label className="block">
                <span className="label">Support email</span>
                <div className="relative mt-1">
                  <FieldIcon icon={Mail} />
                  <input className="input pl-10" type="email" disabled={!canUpdateSettings} {...register("supportEmail")} />
                </div>
              </label>
              <label className="block">
                <span className="label">Default user role</span>
                <div className="relative mt-1">
                  <FieldIcon icon={UserRound} />
                  <select className="input pl-10" disabled={!canUpdateSettings} {...register("defaultUserRole")}>
                    {USER_ROLES.map((role) => (
                      <option key={role} value={role}>{USER_ROLE_LABELS[role] || role}</option>
                    ))}
                  </select>
                </div>
              </label>
              <label className="block">
                <span className="label">Timezone</span>
                <div className="relative mt-1">
                  <FieldIcon icon={Clock} />
                  <input className="input pl-10" disabled={!canUpdateSettings} {...register("timezone")} />
                </div>
              </label>
            </div>
          </section>

          <section className="grid gap-5 xl:grid-cols-2">
            <div className="surface rounded-md p-5">
              <div className="mb-4 flex items-center gap-2">
                <ShieldCheck size={18} />
                <h2 className="font-bold">Security</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="label">Session timeout minutes</span>
                  <div className="relative mt-1">
                    <FieldIcon icon={Clock} />
                    <input className="input pl-10" type="number" min="15" max="1440" disabled={!canUpdateSettings} {...register("sessionTimeoutMinutes")} />
                  </div>
                </label>
                <label className="block">
                  <span className="label">Password min length</span>
                  <div className="relative mt-1">
                    <FieldIcon icon={KeyRound} />
                    <input className="input pl-10" type="number" min="6" max="32" disabled={!canUpdateSettings} {...register("passwordMinLength")} />
                  </div>
                </label>
                <Toggle label="Allow registration" description="Allow new users to create accounts from the register page." disabled={!canUpdateSettings} registerProps={register("allowRegistration")} />
                <Toggle label="Require email verification" description="Mark new accounts as needing email verification before full access." disabled={!canUpdateSettings} registerProps={register("requireEmailVerification")} />
              </div>
            </div>

            <div className="surface rounded-md p-5">
              <div className="mb-4 flex items-center gap-2">
                <Bell size={18} />
                <h2 className="font-bold">Notifications</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Toggle label="Email notifications" description="Enable outgoing email notifications across the workspace." disabled={!canUpdateSettings} registerProps={register("emailNotifications")} />
                <Toggle label="Bug assignment emails" description="Notify users when a bug is assigned to them." disabled={!canUpdateSettings} registerProps={register("bugAssignmentEmails")} />
                <Toggle label="Test run alerts" description="Notify teams when automation runs finish or fail." disabled={!canUpdateSettings} registerProps={register("testRunAlerts")} />
                <Toggle label="Weekly report emails" description="Send weekly quality and defect summary emails." disabled={!canUpdateSettings} registerProps={register("weeklyReportEmails")} />
              </div>
            </div>
          </section>

          <section className="surface rounded-md p-5">
            <div className="mb-4 flex items-center gap-2">
              <Bot size={18} />
              <h2 className="font-bold">Automation</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <Toggle label="Auto assign bugs" description="Automatically assign newly created bugs based on workspace rules." disabled={!canUpdateSettings} registerProps={register("autoAssignBugs")} />
              <Toggle label="AI suggestions" description="Enable AI suggestions for test cases, triage notes, and bug fixes." disabled={!canUpdateSettings} registerProps={register("aiSuggestionsEnabled")} />
              <label className="block">
                <span className="label">Automation retry count</span>
                <div className="relative mt-1">
                  <FieldIcon icon={Bot} />
                  <input className="input pl-10" type="number" min="0" max="5" disabled={!canUpdateSettings} {...register("automationRetryCount")} />
                </div>
              </label>
            </div>
          </section>

          <button className="btn-primary" type="submit" disabled={saving || !canUpdateSettings}>
            <Save size={17} />
            {saving ? "Saving settings..." : "Save settings"}
          </button>
        </form>
      )}
    </>
  );
}
