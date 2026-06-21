import { Mail, MessageSquare, Send } from "lucide-react";
import { useForm } from "react-hook-form";
import PageHeader from "../components/PageHeader.jsx";
import { useAuthStore } from "../store/authStore.js";
import { useBugStore } from "../store/bugStore.js";
import { useCollaborationStore } from "../store/collaborationStore.js";
import { formatDate, initials } from "../utils/format.js";

export default function TeamChat() {
  const user = useAuthStore((state) => state.user);
  const users = useBugStore((state) => state.users);
  const chatMessages = useCollaborationStore((state) => state.chatMessages);
  const emailNotifications = useCollaborationStore((state) => state.emailNotifications);
  const addChatMessage = useCollaborationStore((state) => state.addChatMessage);
  const markEmailSent = useCollaborationStore((state) => state.markEmailSent);
  const { register, handleSubmit, reset } = useForm({ defaultValues: { channel: "Engineering" } });

  const onSubmit = (values) => {
    addChatMessage({
      author: user?.fullname || "Team member",
      message: values.message,
      channel: values.channel,
      users,
    });
    reset({ channel: values.channel, message: "" });
  };

  return (
    <>
      <PageHeader title="Team Chat" description="Discuss bugs with the team, mention teammates, and queue email notifications." />
      <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <section className="surface rounded-md p-5">
          <div className="mb-4 flex items-center gap-2">
            <MessageSquare size={18} />
            <h2 className="font-bold">Team discussion</h2>
          </div>
          <form className="mb-5 grid gap-3 md:grid-cols-[180px_1fr_auto]" onSubmit={handleSubmit(onSubmit)}>
            <select className="input" {...register("channel")}>
              <option>Engineering</option>
              <option>QA</option>
              <option>Managers</option>
              <option>Release</option>
            </select>
            <input className="input" placeholder="Message team. Try @dev, @mira, @nisha, @aarav" {...register("message", { required: true })} />
            <button className="btn-primary" type="submit">
              <Send size={17} />
              Send
            </button>
          </form>
          <div className="space-y-3">
            {chatMessages.map((message) => (
              <article key={message.id} className="rounded-md border border-line bg-white p-4 dark:border-slate-700 dark:bg-slate-950">
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-md bg-ink text-xs font-bold text-white dark:bg-blue-600">
                    {initials(message.author)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold">{message.author}</p>
                      <p className="text-xs text-slate-500">{formatDate(message.createdAt)}</p>
                    </div>
                    <p className="mt-1 text-xs font-semibold text-brand">{message.channel}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{message.message}</p>
                    {message.mentions.length ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {message.mentions.map((mention) => (
                          <span key={mention} className="rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300">
                            @{mention.split(" ")[0]}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="surface h-fit rounded-md p-5">
          <div className="mb-4 flex items-center gap-2">
            <Mail size={18} />
            <h2 className="font-bold">Email Notifications</h2>
          </div>
          <div className="space-y-3">
            {emailNotifications.map((email) => (
              <article key={email.id} className="rounded-md border border-line bg-white p-3 text-sm dark:border-slate-700 dark:bg-slate-950">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold">{email.to}</p>
                  <span className={`rounded-md border px-2 py-1 text-xs font-semibold ${email.status === "Sent" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>
                    {email.status}
                  </span>
                </div>
                <p className="mt-2 font-semibold">{email.subject}</p>
                <p className="mt-1 text-slate-600">{email.body}</p>
                {email.status !== "Sent" ? (
                  <button className="btn-muted mt-3 w-full" type="button" onClick={() => markEmailSent(email.id)}>
                    Mark sent
                  </button>
                ) : null}
              </article>
            ))}
            {emailNotifications.length === 0 ? <p className="text-sm text-slate-500">No email notifications queued.</p> : null}
          </div>
        </aside>
      </div>
    </>
  );
}
