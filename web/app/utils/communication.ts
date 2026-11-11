/**
 * Comunicar: junta as antigas telas Mensagens (WhatsApp) e Publicações
 * (aviso, versículo, devocional, publicação) num lugar só, com um
 * "Novo comunicado" em 3 passos e um histórico único.
 */
import { hasChurchPermission, isChurchManager, type AccessUser } from "./churchAccess";

export type ComposerKind = "AVISO" | "WHATSAPP" | "VERSICULO" | "DEVOCIONAL" | "PUBLICACAO";

export type ComposerKindInfo = {
  kind: ComposerKind;
  label: string;
  description: string;
  /** Onde a pessoa recebe. */
  channel: "app" | "whatsapp";
};

export const COMPOSER_KINDS: Record<ComposerKind, ComposerKindInfo> = {
  AVISO: {
    kind: "AVISO",
    label: "Aviso no app",
    description: "Aparece no Início de todos e chega como notificação",
    channel: "app",
  },
  WHATSAPP: {
    kind: "WHATSAPP",
    label: "WhatsApp",
    description: "Mensagem no celular de membros e visitantes do cadastro",
    channel: "whatsapp",
  },
  VERSICULO: {
    kind: "VERSICULO",
    label: "Versículo do dia",
    description: "Um versículo com comentário para a igreja meditar",
    channel: "app",
  },
  DEVOCIONAL: {
    kind: "DEVOCIONAL",
    label: "Devocional",
    description: "Leitura em capítulos para acompanhar no app",
    channel: "app",
  },
  PUBLICACAO: {
    kind: "PUBLICACAO",
    label: "Publicação",
    description: "Foto com texto ou vídeo, como um post da igreja",
    channel: "app",
  },
};

/** WhatsApp sai em nome da igreja: só pastor/admin (a API exige o mesmo). */
export function canSendWhatsApp(user: AccessUser | null | undefined) {
  return isChurchManager(user);
}

/** Tipos que a pessoa pode publicar, na ordem em que aparecem no passo 1. */
export function composerKindsFor(user: AccessUser | null | undefined): ComposerKind[] {
  const kinds: ComposerKind[] = [];
  if (hasChurchPermission(user, "ANNOUNCEMENT_PUBLISH")) kinds.push("AVISO");
  if (canSendWhatsApp(user)) kinds.push("WHATSAPP");
  if (hasChurchPermission(user, "CONTENT_PUBLISH")) kinds.push("VERSICULO", "DEVOCIONAL", "PUBLICACAO");
  return kinds;
}

export function canUseCommunication(user: AccessUser | null | undefined) {
  return composerKindsFor(user).length > 0;
}

// ── Público do WhatsApp ──

export type WhatsAppAudience = "ALL" | "MEMBER" | "VISITOR" | "SELECTED";

export const WHATSAPP_AUDIENCE_LABELS: Record<string, string> = {
  ALL: "Membros e visitantes",
  MEMBER: "Só membros",
  VISITOR: "Só visitantes",
  SELECTED: "Pessoas escolhidas",
  BIRTHDAY: "Aniversariantes",
};

export function audienceLabel(audience: string) {
  return WHATSAPP_AUDIENCE_LABELS[audience] ?? audience;
}

const plural = (count: number, one: string, many: string) => (count === 1 ? one : many);

export function peopleCount(count: number) {
  return `${count} ${plural(count, "pessoa", "pessoas")}`;
}

/** "3 visitantes sem autorização ficaram de fora" (vazio quando ninguém). */
export function excludedWithoutConsentLabel(count: number) {
  if (count <= 0) return "";
  return `${count} ${plural(count, "visitante sem autorização ficou", "visitantes sem autorização ficaram")} de fora`;
}

/** Texto do botão final do comunicado. */
export function sendButtonLabel(kind: ComposerKind, recipients: number | null, editing = false) {
  if (editing) return "Salvar alterações";
  if (kind === "WHATSAPP") {
    return recipients === null ? "Enviar" : `Enviar para ${peopleCount(recipients)}`;
  }
  return recipients ? `Publicar para ${peopleCount(recipients)}` : "Publicar para a igreja";
}

// ── Aniversariantes ──

/** Antes dizia "todo dia às 8h" mesmo quando o horário tinha sido trocado. */
export function birthdayAutoDescription(notifyTime: string | null | undefined) {
  const time = notifyTime && /^\d{2}:\d{2}$/.test(notifyTime) ? notifyTime : "08:00";
  const [hours, minutes] = time.split(":");
  const label = minutes === "00" ? `${Number(hours)}h` : `${Number(hours)}h${minutes}`;
  return `Ligado, quem faz aniversário recebe a mensagem sozinho, todo dia às ${label}. Desligado, você manda quando quiser.`;
}

// ── Histórico único (Enviados) ──

export type SentItem = {
  key: string;
  kind: ComposerKind;
  kindLabel: string;
  title: string;
  date: string;
  meta: string;
  /** Publicações podem ser editadas e apagadas; envios de WhatsApp não. */
  manageable: boolean;
  id: string;
};

type Dated = { id: string; publishedAt?: string | null; createdAt?: string | null };

export type SentSources = {
  announcements?: (Dated & { title: string; kind?: string | null; isPublic?: boolean })[];
  verses?: (Dated & { reference: string; isPublic?: boolean })[];
  devotionals?: (Dated & { title: string; isPublic?: boolean })[];
  posts?: (Dated & { title: string; isPublic?: boolean })[];
  logs?: {
    id: string;
    createdAt: string;
    audience: string;
    status: string;
    totalCount: number;
    successCount: number;
    failedCount: number;
    ruleId: string | null;
    template: { name: string } | null;
  }[];
};

const visibility = (isPublic?: boolean) => (isPublic ? "No app e na página pública" : "Só no app");

const announcementKindLabel = (kind?: string | null) => {
  if (kind === "PASTOR_MESSAGE") return "Palavra do pastor";
  if (kind === "PRAYER") return "Oração";
  return "Aviso";
};

export function whatsappLogMeta(log: NonNullable<SentSources["logs"]>[number]) {
  const origin = log.ruleId ? "Automático" : log.audience === "BIRTHDAY" ? "Aniversário" : "Manual";
  if (log.status === "PROCESSING") {
    return `${audienceLabel(log.audience)} · enviando ${log.successCount + log.failedCount} de ${log.totalCount}`;
  }
  const failed = log.failedCount > 0 ? ` · ${log.failedCount} não ${plural(log.failedCount, "chegou", "chegaram")}` : "";
  return `${audienceLabel(log.audience)} · ${log.successCount} ${plural(log.successCount, "enviada", "enviadas")}${failed} · ${origin}`;
}

export function buildSentHistory(sources: SentSources): SentItem[] {
  const items: SentItem[] = [];
  const dateOf = (item: Dated) => item.publishedAt || item.createdAt || "";

  for (const item of sources.announcements ?? []) {
    items.push({
      key: `AVISO-${item.id}`,
      id: item.id,
      kind: "AVISO",
      kindLabel: announcementKindLabel(item.kind),
      title: item.title,
      date: dateOf(item),
      meta: visibility(item.isPublic),
      manageable: true,
    });
  }
  for (const item of sources.verses ?? []) {
    items.push({
      key: `VERSICULO-${item.id}`,
      id: item.id,
      kind: "VERSICULO",
      kindLabel: "Versículo",
      title: item.reference,
      date: dateOf(item),
      meta: visibility(item.isPublic),
      manageable: true,
    });
  }
  for (const item of sources.devotionals ?? []) {
    items.push({
      key: `DEVOCIONAL-${item.id}`,
      id: item.id,
      kind: "DEVOCIONAL",
      kindLabel: "Devocional",
      title: item.title,
      date: dateOf(item),
      meta: visibility(item.isPublic),
      manageable: true,
    });
  }
  for (const item of sources.posts ?? []) {
    items.push({
      key: `PUBLICACAO-${item.id}`,
      id: item.id,
      kind: "PUBLICACAO",
      kindLabel: "Publicação",
      title: item.title,
      date: dateOf(item),
      meta: visibility(item.isPublic),
      manageable: true,
    });
  }
  for (const log of sources.logs ?? []) {
    items.push({
      key: `WHATSAPP-${log.id}`,
      id: log.id,
      kind: "WHATSAPP",
      kindLabel: "WhatsApp",
      title: log.template?.name || "Modelo apagado",
      date: log.createdAt,
      meta: whatsappLogMeta(log),
      manageable: false,
    });
  }

  return items.sort((first, second) => second.date.localeCompare(first.date));
}

/** Rótulo de exclusão que diz exatamente o que some. */
export function deleteSentItemMessage(item: Pick<SentItem, "kindLabel" | "title">) {
  return `"${item.title}" (${item.kindLabel.toLowerCase()}) some do app e da página pública para todos. Isso não pode ser desfeito.`;
}
