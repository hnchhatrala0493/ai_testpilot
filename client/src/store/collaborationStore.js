import { create } from "zustand";
import { useAuditStore } from "./auditStore.js";

function extractMentions(message, users) {
  return users.filter((user) => message.toLowerCase().includes(`@${user.fullname.toLowerCase().split(" ")[0]}`));
}

const initialMessages = [
  {
    id: "chat-1",
    author: "Mira Shah",
    message: "@dev can you check the billing export bug before release?",
    channel: "Engineering",
    mentions: ["Dev Patel"],
    createdAt: "2026-06-14T08:50:00.000Z",
  },
  {
    id: "chat-2",
    author: "Dev Patel",
    message: "I am reviewing the CSV payload and report filters now.",
    channel: "Engineering",
    mentions: [],
    createdAt: "2026-06-14T09:05:00.000Z",
  },
];

export const useCollaborationStore = create((set, get) => ({
  chatMessages: initialMessages,
  emailNotifications: [
    {
      id: "email-1",
      to: "dev@acme.dev",
      subject: "Mentioned in Engineering chat",
      body: "Mira Shah mentioned you in a team chat message.",
      status: "Queued",
      createdAt: "2026-06-14T08:50:00.000Z",
    },
  ],
  addChatMessage: ({ author, message, channel = "Engineering", users = [] }) => {
    const mentionedUsers = extractMentions(message, users);
    const chat = {
      id: `chat-${Date.now()}`,
      author,
      message,
      channel,
      mentions: mentionedUsers.map((user) => user.fullname),
      createdAt: new Date().toISOString(),
    };
    const emails = mentionedUsers.map((user) => ({
      id: `email-${Date.now()}-${user.id}`,
      to: user.email,
      subject: `Mentioned by ${author}`,
      body: `${author} mentioned you in ${channel}: ${message}`,
      status: "Queued",
      createdAt: new Date().toISOString(),
    }));
    set((state) => ({
      chatMessages: [chat, ...state.chatMessages],
      emailNotifications: [...emails, ...state.emailNotifications],
    }));
    useAuditStore.getState().addLog({
      actor: author,
      action: "Sent team chat",
      module: "Collaboration",
      target: channel,
      details: message.slice(0, 120),
      severity: mentionedUsers.length ? "Medium" : "Low",
    });
  },
  addEmailNotification: ({ to, subject, body }) => {
    set((state) => ({
      emailNotifications: [
        {
          id: `email-${Date.now()}`,
          to,
          subject,
          body,
          status: "Queued",
          createdAt: new Date().toISOString(),
        },
        ...state.emailNotifications,
      ],
    }));
  },
  markEmailSent: (id) => {
    set((state) => ({
      emailNotifications: state.emailNotifications.map((email) =>
        email.id === id ? { ...email, status: "Sent" } : email,
      ),
    }));
  },
  getMentionedUsers: (message, users) => extractMentions(message, users),
}));
