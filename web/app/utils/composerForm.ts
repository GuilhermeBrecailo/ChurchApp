/**
 * Formulário do "Novo comunicado": um objeto só para os 5 tipos, com as
 * validações e os payloads que cada endpoint espera (os mesmos das antigas
 * telas Publicações e Mensagens).
 */
import type { ComposerKind, WhatsAppAudience } from "./communication";

export type ComposerChapter = { title: string; content: string; bibleRef: string };

export type ComposerForm = {
  // Aviso / Publicação / Devocional
  title: string;
  body: string;
  kind: "ANNOUNCEMENT" | "PASTOR_MESSAGE" | "PRAYER";
  pinned: boolean;
  expiresAt: string;
  description: string;
  chapters: ComposerChapter[];
  // Versículo
  text: string;
  reference: string;
  commentary: string;
  // Mídia
  imageUrl: string | null;
  imageKey: string | null;
  videoUrl: string;
  // Para quem (app)
  isPublic: boolean;
  // WhatsApp
  templateId: string;
  audience: WhatsAppAudience;
  recipientIds: string[];
};

export function emptyComposerForm(kind?: ComposerKind | null): ComposerForm {
  return {
    title: "",
    body: "",
    kind: "ANNOUNCEMENT",
    pinned: false,
    expiresAt: "",
    description: "",
    chapters: [{ title: "", content: "", bibleRef: "" }],
    text: "",
    reference: "",
    commentary: "",
    imageUrl: "",
    imageKey: "",
    videoUrl: "",
    // Publicação nasceu para a página pública; o resto começa só no app.
    isPublic: kind === "PUBLICACAO",
    templateId: "",
    audience: "ALL",
    recipientIds: [],
  };
}

type AnyEntity = Record<string, unknown> & { id: string };

/** Algo já publicado sendo editado pelo mesmo editor do "Novo comunicado". */
export type ComposerEditing = { kind: ComposerKind; entity: AnyEntity };

const str = (value: unknown) => (typeof value === "string" ? value : "");

/** Preenche o formulário para editar algo já publicado. */
export function composerFormFromEntity(kind: ComposerKind, entity: AnyEntity): ComposerForm {
  const form = emptyComposerForm(kind);
  form.isPublic = entity.isPublic === true;
  form.imageUrl = str(entity.imageUrl);
  form.imageKey = str(entity.imageKey);
  form.videoUrl = str(entity.videoUrl);

  if (kind === "AVISO") {
    form.title = str(entity.title);
    form.body = str(entity.body);
    form.pinned = entity.pinned === true;
    form.expiresAt = str(entity.expiresAt).slice(0, 10);
    form.kind = (str(entity.kind) || "ANNOUNCEMENT") as ComposerForm["kind"];
  } else if (kind === "VERSICULO") {
    form.text = str(entity.text);
    form.reference = str(entity.reference);
    form.commentary = str(entity.commentary);
  } else if (kind === "DEVOCIONAL") {
    form.title = str(entity.title);
    form.description = str(entity.description);
    const chapters = Array.isArray(entity.chapters) ? (entity.chapters as AnyEntity[]) : [];
    if (chapters.length) {
      form.chapters = chapters.map((chapter) => ({
        title: str(chapter.title),
        content: str(chapter.content),
        bibleRef: str(chapter.bibleRef),
      }));
    }
  } else if (kind === "PUBLICACAO") {
    form.title = str(entity.title);
    form.body = str(entity.body);
    form.pinned = entity.pinned === true;
  }
  return form;
}

/** Erro do passo "O quê" (vazio quando dá para seguir). */
export function validateComposerContent(kind: ComposerKind, form: ComposerForm) {
  if (kind === "AVISO" && (!form.title.trim() || !form.body.trim())) return "Escreva o título e o texto do aviso.";
  if (kind === "VERSICULO" && (!form.text.trim() || !form.reference.trim())) {
    return "Escreva o versículo e a referência.";
  }
  if (kind === "DEVOCIONAL") {
    if (!form.title.trim()) return "Dê um título ao devocional.";
    if (!completeChapters(form).length) return "Escreva ao menos um capítulo com título e texto.";
  }
  if (kind === "PUBLICACAO" && !form.title.trim()) return "Dê um título à publicação.";
  if (kind === "WHATSAPP" && !form.templateId) return "Escolha a mensagem que vai ser enviada.";
  return "";
}

/** Erro do passo "Para quem". */
export function validateComposerAudience(kind: ComposerKind, form: ComposerForm) {
  if (kind === "WHATSAPP" && form.audience === "SELECTED" && form.recipientIds.length === 0) {
    return "Escolha ao menos uma pessoa.";
  }
  return "";
}

function completeChapters(form: ComposerForm) {
  return form.chapters
    .map((chapter) => ({
      title: chapter.title.trim(),
      content: chapter.content.trim(),
      bibleRef: chapter.bibleRef.trim() || null,
    }))
    .filter((chapter) => chapter.title && chapter.content);
}

const media = (form: ComposerForm) => ({
  imageUrl: form.imageUrl || null,
  imageKey: form.imageKey || null,
  videoUrl: form.videoUrl.trim() || null,
});

export function announcementPayload(form: ComposerForm) {
  return {
    title: form.title.trim(),
    body: form.body.trim(),
    pinned: form.pinned,
    expiresAt: form.expiresAt || null,
    isPublic: form.isPublic,
    kind: form.kind,
    ...media(form),
  };
}

export function versePayload(form: ComposerForm) {
  return {
    text: form.text.trim(),
    reference: form.reference.trim(),
    commentary: form.commentary.trim() || null,
    isPublic: form.isPublic,
    ...media(form),
  };
}

export function devotionalPayload(form: ComposerForm) {
  return {
    title: form.title.trim(),
    description: form.description.trim() || null,
    isPublic: form.isPublic,
    chapters: completeChapters(form),
    ...media(form),
  };
}

export function postPayload(form: ComposerForm) {
  return {
    title: form.title.trim(),
    body: form.body.trim() || null,
    isPublic: form.isPublic,
    pinned: form.pinned,
    ...media(form),
  };
}

/** Título curto para a prévia e para o histórico. */
export function composerTitle(kind: ComposerKind, form: ComposerForm) {
  if (kind === "VERSICULO") return form.reference.trim();
  return form.title.trim();
}

/** Troca {nome} por um nome de exemplo, como na mensagem que chega. */
export function previewTemplateBody(body: string, sampleName = "Maria") {
  return body.replaceAll("{nome}", sampleName);
}
