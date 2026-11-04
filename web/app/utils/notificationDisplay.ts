import { Bell, CalendarCheck, Megaphone, UserCheck } from "lucide-vue-next";

type NotificationLike = {
  type?: string | null;
  title?: string | null;
  body?: string | null;
  url?: string | null;
};

export type NotificationTone = "schedule" | "member" | "announcement" | "general";

export const notificationToneFor = (notification: NotificationLike): NotificationTone => {
  const context = `${notification.type || ""} ${notification.title || ""} ${notification.body || ""} ${notification.url || ""}`.toLowerCase();

  if (context.includes("escala") || context.includes("schedule")) return "schedule";
  if (context.includes("membro") || context.includes("user")) return "member";
  if (context.includes("aviso") || context.includes("conteudo") || context.includes("post")) {
    return "announcement";
  }

  return "general";
};

const ICONS = {
  schedule: CalendarCheck,
  member: UserCheck,
  announcement: Megaphone,
  general: Bell,
} as const;

export const notificationIconFor = (notification: NotificationLike) =>
  ICONS[notificationToneFor(notification)];

export const formatNotificationRelativeDate = (value: string, now = Date.now()): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const diffMin = Math.floor((now - date.getTime()) / 60_000);
  if (diffMin < 1) return "agora";
  if (diffMin < 60) return `há ${diffMin} min`;

  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `há ${diffH}h`;

  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return "ontem";
  if (diffD < 7) return `há ${diffD} dias`;

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  }).format(date);
};

export const formatNotificationFullDate = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
};
