// Conteúdo: avisos, versículo do dia, devocionais (progresso e comentários),
// mural (posts), pedidos de oração e anotações da Bíblia.

import {
  DemoError,
  defineHandlers,
  findOr,
  newId,
  paginate,
  removeWhere,
  uploadedFile,
  userName,
  type DemoContext,
} from "../lib";
import type { DemoDevotional } from "../types";

const assertPublisher = (ctx: DemoContext, permission: "CONTENT_PUBLISH" | "ANNOUNCEMENT_PUBLISH") => {
  ctx.requireChurch();
  if (!ctx.can(permission)) throw new DemoError("Você não tem permissão para publicar conteúdo da igreja");
};

const author = (ctx: DemoContext, id: string | null) => (id ? { id, name: userName(ctx.db, id) } : null);

function verseView(ctx: DemoContext, verse: (typeof ctx.db.dailyVerses)[number]) {
  return {
    id: verse.id,
    text: verse.text,
    reference: verse.reference,
    commentary: verse.commentary,
    videoUrl: verse.videoUrl,
    imageUrl: verse.imageUrl,
    imageKey: verse.imageKey,
    isPublic: verse.isPublic,
    publishedAt: verse.publishedAt,
    author: author(ctx, verse.authorId),
  };
}

function devotionalView(ctx: DemoContext, devotional: DemoDevotional, withChapters: boolean) {
  const userId = ctx.user?.id;
  const progress = ctx.db.devotionalProgress.find((item) => item.devotionalId === devotional.id && item.userId === userId);
  return {
    id: devotional.id,
    title: devotional.title,
    description: devotional.description,
    videoUrl: devotional.videoUrl,
    imageUrl: devotional.imageUrl,
    imageKey: devotional.imageKey,
    isPublic: devotional.isPublic,
    publishedAt: devotional.publishedAt,
    crunchId: devotional.churchId,
    authorId: devotional.authorId,
    ...(withChapters
      ? { chapters: [...devotional.chapters].sort((a, b) => a.order - b.order) }
      : { _count: { chapters: devotional.chapters.length } }),
    progresses: progress ? [{ lastChapterId: progress.lastChapterId, updatedAt: progress.updatedAt }] : [],
  };
}

function postView(ctx: DemoContext, post: (typeof ctx.db.posts)[number]) {
  return {
    id: post.id,
    title: post.title,
    body: post.body,
    imageUrl: post.imageUrl,
    imageKey: post.imageKey,
    videoUrl: post.videoUrl,
    isPublic: post.isPublic,
    pinned: post.pinned,
    publishedAt: post.publishedAt,
    author: author(ctx, post.authorId),
  };
}

function prayerView(ctx: DemoContext, prayer: (typeof ctx.db.prayerRequests)[number]) {
  return {
    id: prayer.id,
    title: prayer.title,
    body: prayer.body,
    isAnonymous: prayer.isAnonymous,
    isAnswered: prayer.isAnswered,
    status: prayer.status,
    rejectionReason: prayer.rejectionReason,
    createdAt: prayer.createdAt,
    crunchId: prayer.churchId,
    authorName: prayer.isAnonymous ? "Anônimo" : userName(ctx.db, prayer.userId),
  };
}

const pickFields = <T extends object>(target: T, body: Record<string, unknown>, fields: string[]) => {
  for (const field of fields) {
    if (body[field] !== undefined) (target as Record<string, unknown>)[field] = body[field];
  }
};

export default defineHandlers((r) => {
  // ---- avisos --------------------------------------------------------------
  const announcementView = (item: DemoContext["db"]["announcements"][number]) => {
    const { churchId, ...rest } = item;
    return { ...rest, crunchId: churchId };
  };

  r.get("/api/church/announcements", (ctx) => {
    const church = ctx.requireChurch();
    const now = ctx.now.getTime();
    return ctx.db.announcements
      .filter((item) => item.churchId === church.id && (!item.expiresAt || new Date(item.expiresAt).getTime() > now))
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.publishedAt.localeCompare(a.publishedAt))
      .map(announcementView);
  });

  r.post("/api/church/announcements", (ctx) => {
    assertPublisher(ctx, "ANNOUNCEMENT_PUBLISH");
    const church = ctx.requireChurch();
    const body = ctx.body ?? {};
    if (!body.title?.trim() || !body.body?.trim()) throw new DemoError("Título e texto são obrigatórios");
    const item = {
      id: newId("an"),
      churchId: church.id,
      title: body.title.trim(),
      body: body.body.trim(),
      pinned: Boolean(body.pinned),
      publishedAt: ctx.now.toISOString(),
      expiresAt: body.expiresAt ? new Date(body.expiresAt).toISOString() : null,
      isPublic: Boolean(body.isPublic),
      kind: body.kind ?? "ANNOUNCEMENT",
      imageUrl: body.imageUrl ?? null,
      imageKey: body.imageKey ?? null,
      videoUrl: body.videoUrl ?? null,
    };
    ctx.db.announcements.push(item);
    return announcementView(item);
  });

  r.patch("/api/church/announcements/:id", (ctx) => {
    assertPublisher(ctx, "ANNOUNCEMENT_PUBLISH");
    const item = findOr(ctx.db.announcements, (entry) => entry.id === ctx.params.id, "Aviso não encontrado");
    pickFields(item, ctx.body ?? {}, ["title", "body", "pinned", "isPublic", "kind", "imageUrl", "imageKey", "videoUrl"]);
    if (ctx.body?.expiresAt !== undefined) item.expiresAt = ctx.body.expiresAt ? new Date(ctx.body.expiresAt).toISOString() : null;
    return announcementView(item);
  });

  r.delete("/api/church/announcements/:id", (ctx) => {
    assertPublisher(ctx, "ANNOUNCEMENT_PUBLISH");
    removeWhere(ctx.db.announcements, (item) => item.id === ctx.params.id);
    return { success: true };
  });

  // ---- versículo do dia ----------------------------------------------------
  const versesOf = (ctx: DemoContext) => {
    const church = ctx.requireChurch();
    return ctx.db.dailyVerses
      .filter((item) => item.churchId === church.id)
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  };

  r.get("/api/church/daily-verse", (ctx) => {
    const latest = versesOf(ctx)[0];
    return latest ? verseView(ctx, latest) : null;
  });

  r.get("/api/church/daily-verse/list", (ctx) => {
    const page = Number(ctx.query.page) || 1;
    const result = paginate(versesOf(ctx), page, Number(ctx.query.pageSize) || 20);
    return { ...result, items: result.items.map((item) => verseView(ctx, item)) };
  });

  r.post("/api/church/daily-verse", (ctx) => {
    assertPublisher(ctx, "CONTENT_PUBLISH");
    const church = ctx.requireChurch();
    const body = ctx.body ?? {};
    if (!body.text?.trim() || !body.reference?.trim()) throw new DemoError("Texto e referência são obrigatórios");
    const verse = {
      id: newId("vs"),
      churchId: church.id,
      text: body.text.trim(),
      reference: body.reference.trim(),
      commentary: body.commentary || null,
      videoUrl: body.videoUrl || null,
      imageUrl: body.imageUrl ?? null,
      imageKey: body.imageKey ?? null,
      isPublic: Boolean(body.isPublic),
      publishedAt: ctx.now.toISOString(),
      authorId: ctx.user?.id ?? null,
    };
    ctx.db.dailyVerses.push(verse);
    return verseView(ctx, verse);
  });

  r.patch("/api/church/daily-verse/:id", (ctx) => {
    assertPublisher(ctx, "CONTENT_PUBLISH");
    const verse = findOr(ctx.db.dailyVerses, (item) => item.id === ctx.params.id, "Versículo não encontrado");
    pickFields(verse, ctx.body ?? {}, ["text", "reference", "commentary", "videoUrl", "imageUrl", "imageKey", "isPublic"]);
    return verseView(ctx, verse);
  });

  r.delete("/api/church/daily-verse/:id", (ctx) => {
    assertPublisher(ctx, "CONTENT_PUBLISH");
    removeWhere(ctx.db.dailyVerses, (item) => item.id === ctx.params.id);
    return { success: true };
  });

  // ---- devocionais -----------------------------------------------------------
  const devotionalOf = (ctx: DemoContext, id: string | undefined) => {
    const church = ctx.requireChurch();
    return findOr(ctx.db.devotionals, (item) => item.id === id && item.churchId === church.id, "Devocional não encontrado");
  };

  const chaptersFrom = (body: Record<string, unknown>) =>
    (Array.isArray(body.chapters) ? body.chapters : []).map((chapter: Record<string, unknown>, order: number) => ({
      id: (chapter.id as string) || newId("dvc"),
      title: String(chapter.title ?? ""),
      content: String(chapter.content ?? ""),
      bibleRef: (chapter.bibleRef as string) || null,
      order,
    }));

  r.get("/api/church/devotionals", (ctx) => {
    const church = ctx.requireChurch();
    return ctx.db.devotionals
      .filter((item) => item.churchId === church.id)
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
      .map((item) => devotionalView(ctx, item, false));
  });

  r.get("/api/church/devotionals/:id", (ctx) => devotionalView(ctx, devotionalOf(ctx, ctx.params.id), true));

  r.post("/api/church/devotionals", (ctx) => {
    assertPublisher(ctx, "CONTENT_PUBLISH");
    const church = ctx.requireChurch();
    const body = ctx.body ?? {};
    if (!body.title?.trim()) throw new DemoError("Título é obrigatório");
    const devotional: DemoDevotional = {
      id: newId("dv"),
      churchId: church.id,
      title: body.title.trim(),
      description: body.description || null,
      videoUrl: body.videoUrl || null,
      imageUrl: body.imageUrl ?? null,
      imageKey: body.imageKey ?? null,
      isPublic: Boolean(body.isPublic),
      publishedAt: ctx.now.toISOString(),
      authorId: ctx.user?.id ?? null,
      chapters: chaptersFrom(body),
    };
    ctx.db.devotionals.push(devotional);
    return devotionalView(ctx, devotional, true);
  });

  r.patch("/api/church/devotionals/:id", (ctx) => {
    assertPublisher(ctx, "CONTENT_PUBLISH");
    const devotional = devotionalOf(ctx, ctx.params.id);
    const body = ctx.body ?? {};
    pickFields(devotional, body, ["title", "description", "videoUrl", "imageUrl", "imageKey", "isPublic"]);
    if (Array.isArray(body.chapters)) devotional.chapters = chaptersFrom(body);
    return devotionalView(ctx, devotional, true);
  });

  r.delete("/api/church/devotionals/:id", (ctx) => {
    assertPublisher(ctx, "CONTENT_PUBLISH");
    removeWhere(ctx.db.devotionals, (item) => item.id === ctx.params.id);
    removeWhere(ctx.db.devotionalProgress, (item) => item.devotionalId === ctx.params.id);
    removeWhere(ctx.db.devotionalComments, (item) => item.devotionalId === ctx.params.id);
    return { success: true };
  });

  r.patch("/api/church/devotionals/:id/progress", (ctx) => {
    const user = ctx.me();
    const devotional = devotionalOf(ctx, ctx.params.id);
    const chapterId = ctx.body?.chapterId;
    if (!devotional.chapters.some((item) => item.id === chapterId)) throw new DemoError("Capítulo não encontrado");
    let progress = ctx.db.devotionalProgress.find((item) => item.devotionalId === devotional.id && item.userId === user.id);
    if (!progress) {
      progress = { id: newId("dp"), userId: user.id, devotionalId: devotional.id, lastChapterId: chapterId, updatedAt: ctx.now.toISOString() };
      ctx.db.devotionalProgress.push(progress);
    }
    progress.lastChapterId = chapterId;
    progress.updatedAt = ctx.now.toISOString();
    return { id: progress.id };
  });

  const commentView = (ctx: DemoContext, comment: DemoContext["db"]["devotionalComments"][number]) => ({
    id: comment.id,
    body: comment.body,
    createdAt: comment.createdAt,
    authorId: comment.authorId,
    author: { id: comment.authorId, name: userName(ctx.db, comment.authorId) },
  });

  r.get("/api/church/devotionals/:id/comments", (ctx) => {
    devotionalOf(ctx, ctx.params.id);
    return ctx.db.devotionalComments
      .filter((item) => item.devotionalId === ctx.params.id)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map((item) => commentView(ctx, item));
  });

  r.post("/api/church/devotionals/:id/comments", (ctx) => {
    const user = ctx.me();
    devotionalOf(ctx, ctx.params.id);
    const text = String(ctx.body?.body ?? "").trim();
    if (!text) throw new DemoError("Escreva um comentário");
    const comment = { id: newId("dc"), devotionalId: ctx.params.id!, authorId: user.id, body: text, createdAt: ctx.now.toISOString() };
    ctx.db.devotionalComments.push(comment);
    return commentView(ctx, comment);
  });

  r.delete("/api/church/devotionals/:id/comments/:commentId", (ctx) => {
    const user = ctx.me();
    const comment = findOr(ctx.db.devotionalComments, (item) => item.id === ctx.params.commentId, "Comentário não encontrado");
    if (comment.authorId !== user.id && !ctx.can("CONTENT_PUBLISH")) throw new DemoError("Você só pode apagar seus comentários");
    removeWhere(ctx.db.devotionalComments, (item) => item.id === comment.id);
    return { success: true };
  });

  // ---- mural (posts) ---------------------------------------------------------
  r.get("/api/church/posts", (ctx) => {
    const church = ctx.requireChurch();
    return ctx.db.posts
      .filter((item) => item.churchId === church.id)
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.publishedAt.localeCompare(a.publishedAt))
      .map((item) => postView(ctx, item));
  });

  r.post("/api/church/posts", (ctx) => {
    assertPublisher(ctx, "CONTENT_PUBLISH");
    const church = ctx.requireChurch();
    const body = ctx.body ?? {};
    if (!body.title?.trim()) throw new DemoError("Título é obrigatório");
    const post = {
      id: newId("po"),
      churchId: church.id,
      title: body.title.trim(),
      body: body.body ?? null,
      imageUrl: body.imageUrl ?? null,
      imageKey: body.imageKey ?? null,
      videoUrl: body.videoUrl ?? null,
      isPublic: Boolean(body.isPublic),
      pinned: Boolean(body.pinned),
      publishedAt: ctx.now.toISOString(),
      authorId: ctx.user?.id ?? null,
    };
    ctx.db.posts.push(post);
    return postView(ctx, post);
  });

  r.patch("/api/church/posts/:id", (ctx) => {
    assertPublisher(ctx, "CONTENT_PUBLISH");
    const post = findOr(ctx.db.posts, (item) => item.id === ctx.params.id, "Publicação não encontrada");
    pickFields(post, ctx.body ?? {}, ["title", "body", "imageUrl", "imageKey", "videoUrl", "isPublic", "pinned"]);
    return postView(ctx, post);
  });

  r.delete("/api/church/posts/:id", (ctx) => {
    assertPublisher(ctx, "CONTENT_PUBLISH");
    removeWhere(ctx.db.posts, (item) => item.id === ctx.params.id);
    return { success: true };
  });

  r.post("/api/church/uploads/image", async (ctx) => uploadedFile(ctx.body));

  // ---- pedidos de oração -------------------------------------------------------
  const prayersOf = (ctx: DemoContext, status: "APPROVED" | "PENDING") => {
    const church = ctx.requireChurch();
    return ctx.db.prayerRequests
      .filter((item) => item.churchId === church.id && item.status === status)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  };

  r.get("/api/church/prayer-requests", (ctx) => {
    const result = paginate(prayersOf(ctx, "APPROVED"), Number(ctx.query.page) || 1);
    return { ...result, items: result.items.map((item) => prayerView(ctx, item)) };
  });

  r.get("/api/church/prayer-requests/mine", (ctx) => {
    const church = ctx.requireChurch();
    const user = ctx.me();
    return {
      items: ctx.db.prayerRequests
        .filter((item) => item.churchId === church.id && item.userId === user.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 50)
        .map((item) => ({
          id: item.id,
          title: item.title,
          body: item.body,
          isAnonymous: item.isAnonymous,
          isAnswered: item.isAnswered,
          status: item.status,
          rejectionReason: item.rejectionReason,
          reviewedAt: item.status === "PENDING" ? null : item.createdAt,
          createdAt: item.createdAt,
        })),
    };
  });

  r.get("/api/church/prayer-requests/pending", (ctx) => {
    if (!ctx.can("PRAYER_MANAGE")) throw new DemoError("Sem permissão para moderar pedidos de oração");
    const result = paginate(prayersOf(ctx, "PENDING"), Number(ctx.query.page) || 1);
    return { ...result, items: result.items.map((item) => prayerView(ctx, item)) };
  });

  r.post("/api/church/prayer-requests", (ctx) => {
    const church = ctx.requireChurch();
    const user = ctx.me();
    const body = ctx.body ?? {};
    if (!body.title?.trim() || !body.body?.trim()) throw new DemoError("Título e pedido são obrigatórios");
    const prayer = {
      id: newId("pr"),
      churchId: church.id,
      userId: user.id,
      title: body.title.trim(),
      body: body.body.trim(),
      isAnonymous: Boolean(body.isAnonymous),
      isAnswered: false,
      // Quem modera publica direto; os demais aguardam aprovação
      status: ctx.can("PRAYER_MANAGE") ? ("APPROVED" as const) : ("PENDING" as const),
      rejectionReason: null,
      createdAt: ctx.now.toISOString(),
    };
    ctx.db.prayerRequests.push(prayer);
    return prayerView(ctx, prayer);
  });

  const moderate = (ctx: DemoContext) => {
    const prayer = findOr(ctx.db.prayerRequests, (item) => item.id === ctx.params.id, "Pedido não encontrado");
    return prayer;
  };

  r.patch("/api/church/prayer-requests/:id/answered", (ctx) => {
    const prayer = moderate(ctx);
    if (prayer.userId !== ctx.user?.id && !ctx.can("PRAYER_MANAGE")) throw new DemoError("Sem permissão");
    prayer.isAnswered = true;
    return prayerView(ctx, prayer);
  });

  r.patch("/api/church/prayer-requests/:id/approve", (ctx) => {
    if (!ctx.can("PRAYER_MANAGE")) throw new DemoError("Sem permissão para moderar pedidos de oração");
    const prayer = moderate(ctx);
    prayer.status = "APPROVED";
    return prayerView(ctx, prayer);
  });

  r.patch("/api/church/prayer-requests/:id/reject", (ctx) => {
    if (!ctx.can("PRAYER_MANAGE")) throw new DemoError("Sem permissão para moderar pedidos de oração");
    const prayer = moderate(ctx);
    prayer.status = "REJECTED";
    prayer.rejectionReason = ctx.body?.reason ?? null;
    return prayerView(ctx, prayer);
  });

  // ---- anotações da Bíblia -----------------------------------------------------
  r.get("/api/bible/notes/:bookAbbrev/:chapter", (ctx) => {
    const user = ctx.me();
    const note = ctx.db.bibleNotes.find(
      (item) => item.userId === user.id && item.bookAbbrev === ctx.params.bookAbbrev && item.chapter === Number(ctx.params.chapter),
    );
    return { id: note?.id ?? null, content: note?.content ?? "", updatedAt: note?.updatedAt ?? null };
  });

  r.put("/api/bible/notes/:bookAbbrev/:chapter", (ctx) => {
    const user = ctx.me();
    let note = ctx.db.bibleNotes.find(
      (item) => item.userId === user.id && item.bookAbbrev === ctx.params.bookAbbrev && item.chapter === Number(ctx.params.chapter),
    );
    if (!note) {
      note = { id: newId("bn"), userId: user.id, bookAbbrev: ctx.params.bookAbbrev!, chapter: Number(ctx.params.chapter), content: "", updatedAt: ctx.now.toISOString() };
      ctx.db.bibleNotes.push(note);
    }
    note.content = String(ctx.body?.content ?? "");
    note.updatedAt = ctx.now.toISOString();
    return { id: note.id, content: note.content, updatedAt: note.updatedAt };
  });
});
