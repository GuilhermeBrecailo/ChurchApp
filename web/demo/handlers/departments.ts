// Ministérios: CRUD, membros, tarefas, recursos, repertório (músicas, mix,
// Cifra Club, PDF), preferências de música e o módulo Infantil (crianças,
// aulas/presença e materiais).

import { getDepartmentSchedulePreset } from "../../app/utils/departmentScheduleConfig";
import {
  DemoError,
  defineHandlers,
  departmentView,
  findOr,
  mediaItemView,
  newId,
  rawResponse,
  removeWhere,
  uploadedFile,
  userRef,
  type DemoContext,
} from "../lib";
import type { DemoDepartment, DemoMediaItem, DemoRosterMember } from "../types";

const DEFAULT_MODULES = ["SCHEDULES", "TASKS", "RESOURCES"];

function departmentOf(ctx: DemoContext, id: string | undefined): DemoDepartment {
  const church = ctx.requireChurch();
  return findOr(
    ctx.db.departments,
    (item) => item.id === id && item.churchId === church.id,
    "Ministério não encontrado nesta igreja",
  );
}

function taskView(ctx: DemoContext, task: (typeof ctx.db.tasks)[number]) {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate,
    createdAt: task.createdAt,
    assigneeId: task.assigneeId,
    assignee: userRef(ctx.db, task.assigneeId),
  };
}

function departmentMemberView(ctx: DemoContext, member: (typeof ctx.db.departmentMembers)[number]) {
  const user = ctx.db.users.find((item) => item.id === member.userId);
  return {
    id: member.id,
    function: member.function,
    isPrimary: member.isPrimary,
    user: user ? { id: user.id, name: user.name, email: user.email, phone: user.phone } : undefined,
  };
}

function pdfFromBody(body: Record<string, unknown>) {
  if (body.removePdf) return null;
  if (!body.pdfUrl) return undefined;
  return {
    url: body.pdfUrl,
    key: body.pdfKey,
    fileName: body.pdfFileName,
    mimeType: body.pdfMimeType,
    size: body.pdfSize,
  };
}

const SONG_FIELDS = ["artist", "key", "bpm", "songCategory", "notes", "lyrics", "chords", "keyboardChords", "mediaLink"];

function applySongBody(item: DemoMediaItem, body: Record<string, unknown>) {
  const metadata = { ...(item.metadata ?? {}) } as Record<string, unknown>;
  for (const field of SONG_FIELDS) {
    if (body[field] !== undefined) metadata[field] = body[field] ?? "";
  }
  const pdf = pdfFromBody(body);
  if (pdf !== undefined) metadata.pdf = pdf;
  if (body.title !== undefined) item.title = String(body.title);
  if (body.url !== undefined) item.url = String(body.url ?? "");
  item.metadata = metadata;
}

function childView(ctx: DemoContext, child: (typeof ctx.db.children)[number]) {
  const person = ctx.db.roster.find((item) => item.id === child.rosterMemberId);
  return {
    id: child.id,
    departmentId: child.departmentId,
    groupName: child.groupName,
    isActive: child.isActive,
    createdAt: child.createdAt,
    rosterMember: {
      id: person?.id ?? child.rosterMemberId,
      name: person?.name ?? "",
      email: person?.email ?? null,
      phone: person?.phone ?? null,
      birthDate: person?.birthDate ?? null,
    },
    guardians: child.guardianRosterIds.flatMap((guardianId) => {
      const guardian = ctx.db.roster.find((item) => item.id === guardianId);
      return guardian
        ? [{ id: `${child.id}-${guardian.id}`, guardianRosterMember: { id: guardian.id, name: guardian.name, email: guardian.email, phone: guardian.phone } }]
        : [];
    }),
  };
}

function sessionView(ctx: DemoContext, session: (typeof ctx.db.childSessions)[number]) {
  return {
    id: session.id,
    departmentId: session.departmentId,
    date: session.date,
    groupName: session.groupName,
    createdAt: session.createdAt,
    attendances: session.attendances.flatMap((attendance) => {
      const child = ctx.db.children.find((item) => item.id === attendance.childProfileId);
      if (!child) return [];
      const person = ctx.db.roster.find((item) => item.id === child.rosterMemberId);
      return [{
        id: attendance.id,
        status: attendance.status,
        childProfile: { id: child.id, groupName: child.groupName, rosterMember: { id: person?.id ?? "", name: person?.name ?? "" } },
      }];
    }),
  };
}

/** Acha ou cria uma pessoa no rol (usado por crianças e responsáveis). */
function upsertRosterPerson(ctx: DemoContext, input: Record<string, unknown>): DemoRosterMember {
  const church = ctx.requireChurch();
  if (input.rosterMemberId) {
    return findOr(ctx.db.roster, (item) => item.id === input.rosterMemberId, "Pessoa não encontrada");
  }
  if (!input.name) throw new DemoError("Informe o nome");
  const person: DemoRosterMember = {
    id: newId("r"),
    churchId: church.id,
    name: String(input.name),
    email: (input.email as string) ?? null,
    phone: (input.phone as string) ?? null,
    birthDate: (input.birthDate as string) ?? null,
    notes: null,
    status: "MEMBER",
    joinedAt: ctx.now.toISOString(),
    leftAt: null,
    createdAt: ctx.now.toISOString(),
    userId: null,
    contactConsent: false,
  };
  ctx.db.roster.push(person);
  return person;
}

// PDF mínimo válido para o "material" do infantil abrir no visualizador.
const SAMPLE_PDF = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj
4 0 obj<</Length 96>>stream
BT /F1 24 Tf 72 760 Td (Atividade - Modo demonstracao) Tj 0 -40 Td /F1 14 Tf (Pinte e recorte!) Tj ET
endstream
endobj
5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj
xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000052 00000 n
0000000101 00000 n
0000000222 00000 n
0000000368 00000 n
trailer<</Size 6/Root 1 0 R>>
startxref
431
%%EOF`;

export default defineHandlers((r) => {
  // ---- ministérios --------------------------------------------------------
  r.get("/api/church/departments", (ctx) => {
    const church = ctx.requireChurch();
    return ctx.db.departments
      .filter((item) => item.churchId === church.id)
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
      .map((item) => departmentView(ctx, item));
  });

  r.get("/api/church/departments/:id", (ctx) => departmentView(ctx, departmentOf(ctx, ctx.params.id)));

  r.post("/api/church/departments", (ctx) => {
    const church = ctx.requireChurch();
    if (!ctx.isPrivileged) throw new DemoError("Apenas o pastor pode criar ministérios");
    const body = ctx.body ?? {};
    if (!body.name?.trim()) throw new DemoError("Nome do ministério é obrigatório");
    const type = body.type || "OTHER";
    const leaderId = body.leaderId || ctx.me().id;
    const department: DemoDepartment = {
      id: newId("d"),
      churchId: church.id,
      name: body.name.trim(),
      type,
      isActive: true,
      modules: Array.isArray(body.modules) && body.modules.length ? body.modules : type === "WORSHIP" ? [...DEFAULT_MODULES, "SONGS"] : type === "KIDS" ? [...DEFAULT_MODULES, "CLASSES"] : DEFAULT_MODULES,
      scheduleConfig: body.scheduleConfig ?? getDepartmentSchedulePreset(type),
      leaderId,
      createdAt: ctx.now.toISOString(),
    };
    ctx.db.departments.push(department);
    if (!ctx.db.departmentMembers.some((item) => item.departmentId === department.id && item.userId === leaderId)) {
      ctx.db.departmentMembers.push({ id: newId("dm"), departmentId: department.id, userId: leaderId, function: null, isPrimary: false });
    }
    return departmentView(ctx, department);
  });

  r.patch("/api/church/departments/:id", (ctx) => {
    const department = departmentOf(ctx, ctx.params.id);
    ctx.assertCan("MINISTRY_MANAGE", department.id, "Sem permissão para editar este ministério");
    const body = ctx.body ?? {};
    for (const field of ["name", "type", "isActive", "modules", "scheduleConfig", "leaderId"] as const) {
      if (body[field] !== undefined) (department as unknown as Record<string, unknown>)[field] = body[field];
    }
    if (body.leaderId && !ctx.db.departmentMembers.some((item) => item.departmentId === department.id && item.userId === body.leaderId)) {
      ctx.db.departmentMembers.push({ id: newId("dm"), departmentId: department.id, userId: body.leaderId, function: null, isPrimary: false });
    }
    return departmentView(ctx, department);
  });

  r.delete("/api/church/departments/:id", (ctx) => {
    const department = departmentOf(ctx, ctx.params.id);
    if (!ctx.isPrivileged) throw new DemoError("Apenas o pastor pode apagar ministérios");
    const { db } = ctx;
    const scheduleIds = new Set(db.schedules.filter((item) => item.departmentId === department.id).map((item) => item.id));
    const mediaIds = new Set(db.mediaItems.filter((item) => item.departmentId === department.id).map((item) => item.id));
    removeWhere(db.assignments, (item) => scheduleIds.has(item.scheduleId));
    removeWhere(db.checklistItems, (item) => scheduleIds.has(item.scheduleId));
    removeWhere(db.scheduleMedia, (item) => scheduleIds.has(item.scheduleId) || mediaIds.has(item.mediaItemId));
    removeWhere(db.schedules, (item) => scheduleIds.has(item.id));
    removeWhere(db.songPreferences, (item) => mediaIds.has(item.mediaItemId));
    removeWhere(db.mediaItems, (item) => mediaIds.has(item.id));
    removeWhere(db.tasks, (item) => item.departmentId === department.id);
    removeWhere(db.departmentMembers, (item) => item.departmentId === department.id);
    removeWhere(db.churchRoles, (item) => item.departmentId === department.id);
    removeWhere(db.departments, (item) => item.id === department.id);
    return { success: true };
  });

  // ---- membros do ministério ---------------------------------------------
  r.get("/api/church/departments/:id/schedule-managers", (ctx) => {
    const department = departmentOf(ctx, ctx.params.id);
    const allowed =
      ctx.can("MINISTRY_MEMBER_MANAGE", department.id) ||
      ctx.can("SCHEDULE_CREATE", department.id) ||
      ctx.can("SCHEDULE_EDIT", department.id);
    if (!allowed) {
      throw new DemoError("Apenas pastores, admins, lideres ou cargos com permissao podem listar os membros deste ministerio");
    }
    return ctx.db.departmentMembers
      .filter((item) => item.departmentId === department.id)
      .map((item) => departmentMemberView(ctx, item))
      .sort((a, b) => (a.user?.name ?? "").localeCompare(b.user?.name ?? "", "pt-BR"));
  });

  r.post("/api/church/departments/:id/members", (ctx) => {
    const department = departmentOf(ctx, ctx.params.id);
    ctx.assertCan("MINISTRY_MEMBER_MANAGE", department.id, "Sem permissão para adicionar membros neste ministério");
    const userId = ctx.body?.userId;
    findOr(ctx.db.users, (item) => item.id === userId, "Membro não encontrado");
    let member = ctx.db.departmentMembers.find((item) => item.departmentId === department.id && item.userId === userId);
    if (!member) {
      member = { id: newId("dm"), departmentId: department.id, userId, function: ctx.body?.function ?? null, isPrimary: false };
      ctx.db.departmentMembers.push(member);
    }
    return departmentMemberView(ctx, member);
  });

  r.delete("/api/church/departments/:id/members/:userId", (ctx) => {
    const department = departmentOf(ctx, ctx.params.id);
    ctx.assertCan("MINISTRY_MEMBER_MANAGE", department.id, "Sem permissão para remover membros deste ministério");
    if (department.leaderId === ctx.params.userId) throw new DemoError("Troque o líder antes de remover esta pessoa");
    removeWhere(ctx.db.departmentMembers, (item) => item.departmentId === department.id && item.userId === ctx.params.userId);
    return { success: true };
  });

  // ---- tarefas -----------------------------------------------------------------
  r.get("/api/church/departments/:id/tasks", (ctx) => {
    const department = departmentOf(ctx, ctx.params.id);
    return ctx.db.tasks
      .filter((item) => item.departmentId === department.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((item) => taskView(ctx, item));
  });

  r.post("/api/church/departments/:id/tasks", (ctx) => {
    const department = departmentOf(ctx, ctx.params.id);
    ctx.assertCan("MINISTRY_MANAGE", department.id, "Sem permissão para criar tarefas neste ministério");
    const body = ctx.body ?? {};
    if (!body.title?.trim()) throw new DemoError("Título da tarefa é obrigatório");
    const task = {
      id: newId("task"),
      departmentId: department.id,
      title: body.title.trim(),
      description: body.description ?? null,
      status: "TODO",
      priority: body.priority ?? "MEDIUM",
      dueDate: body.dueDate ? new Date(body.dueDate).toISOString() : null,
      assigneeId: body.assigneeId ?? null,
      createdAt: ctx.now.toISOString(),
    };
    ctx.db.tasks.push(task);
    return taskView(ctx, task);
  });

  r.patch("/api/church/departments/:departmentId/tasks/:taskId", (ctx) => {
    const department = departmentOf(ctx, ctx.params.departmentId);
    const task = findOr(ctx.db.tasks, (item) => item.id === ctx.params.taskId && item.departmentId === department.id, "Tarefa não encontrada");
    const body = ctx.body ?? {};
    for (const field of ["title", "description", "status", "priority", "assigneeId"] as const) {
      if (body[field] !== undefined) (task as unknown as Record<string, unknown>)[field] = body[field];
    }
    if (body.dueDate !== undefined) task.dueDate = body.dueDate ? new Date(body.dueDate).toISOString() : null;
    return taskView(ctx, task);
  });

  r.delete("/api/church/departments/:departmentId/tasks/:taskId", (ctx) => {
    departmentOf(ctx, ctx.params.departmentId);
    removeWhere(ctx.db.tasks, (item) => item.id === ctx.params.taskId);
    return { success: true };
  });

  // ---- recursos ------------------------------------------------------------
  r.get("/api/church/departments/:id/resources", (ctx) => {
    const department = departmentOf(ctx, ctx.params.id);
    return ctx.db.mediaItems
      .filter((item) => item.departmentId === department.id && item.category !== "MUSIC" && !(department.type === "KIDS" && item.category === "ACTIVITY"))
      .sort((a, b) => a.title.localeCompare(b.title, "pt-BR"))
      .map(mediaItemView);
  });

  r.post("/api/church/departments/:id/resources", (ctx) => {
    const department = departmentOf(ctx, ctx.params.id);
    ctx.assertCan("MINISTRY_MANAGE", department.id, "Sem permissão para criar recursos neste ministério");
    const body = ctx.body ?? {};
    if (!body.title?.trim()) throw new DemoError("Título é obrigatório");
    const pdf = pdfFromBody(body);
    const item: DemoMediaItem = {
      id: newId("res"),
      departmentId: department.id,
      title: body.title.trim(),
      url: body.url ?? "",
      category: body.category?.trim() || "Geral",
      metadata: { notes: body.notes ?? "", ...(pdf ? { pdf } : {}) },
      createdAt: ctx.now.toISOString(),
    };
    ctx.db.mediaItems.push(item);
    return mediaItemView(item);
  });

  r.patch("/api/church/departments/:departmentId/resources/:resourceId", (ctx) => {
    departmentOf(ctx, ctx.params.departmentId);
    const item = findOr(ctx.db.mediaItems, (entry) => entry.id === ctx.params.resourceId, "Recurso não encontrado");
    const body = ctx.body ?? {};
    if (body.title !== undefined) item.title = body.title;
    if (body.url !== undefined) item.url = body.url;
    if (body.category !== undefined) item.category = body.category?.trim() || "Geral";
    const metadata = { ...(item.metadata ?? {}) } as Record<string, unknown>;
    if (body.notes !== undefined) metadata.notes = body.notes;
    const pdf = pdfFromBody(body);
    if (pdf !== undefined) metadata.pdf = pdf;
    item.metadata = metadata;
    return mediaItemView(item);
  });

  r.delete("/api/church/departments/:departmentId/resources/:resourceId", (ctx) => {
    departmentOf(ctx, ctx.params.departmentId);
    removeWhere(ctx.db.mediaItems, (item) => item.id === ctx.params.resourceId);
    removeWhere(ctx.db.scheduleMedia, (item) => item.mediaItemId === ctx.params.resourceId);
    return { success: true };
  });

  r.post("/api/church/departments/:id/uploads/pdf", async (ctx) => {
    departmentOf(ctx, ctx.params.id);
    return uploadedFile(ctx.body);
  });

  // ---- repertório ------------------------------------------------------------
  r.get("/api/church/departments/:id/songs", (ctx) => {
    const department = departmentOf(ctx, ctx.params.id);
    return ctx.db.mediaItems
      .filter((item) => item.departmentId === department.id && item.category === "MUSIC")
      .sort((a, b) => a.title.localeCompare(b.title, "pt-BR"))
      .map(mediaItemView);
  });

  r.post("/api/church/departments/:id/songs", (ctx) => {
    const department = departmentOf(ctx, ctx.params.id);
    ctx.assertCan("SONG_CREATE", department.id, "Sem permissão para adicionar músicas neste ministério");
    const body = ctx.body ?? {};
    if (!body.title?.trim()) throw new DemoError("Título da música é obrigatório");
    const item: DemoMediaItem = {
      id: newId("song"),
      departmentId: department.id,
      title: body.title.trim(),
      url: body.url ?? "",
      category: "MUSIC",
      metadata: {},
      createdAt: ctx.now.toISOString(),
    };
    applySongBody(item, body);
    ctx.db.mediaItems.push(item);
    return mediaItemView(item);
  });

  r.post("/api/church/departments/:id/songs/mix", (ctx) => {
    const department = departmentOf(ctx, ctx.params.id);
    const body = ctx.body ?? {};
    const first = findOr(ctx.db.mediaItems, (item) => item.id === body.primaryMediaItemId, "Música não encontrada");
    const second = findOr(ctx.db.mediaItems, (item) => item.id === body.secondaryMediaItemId, "Música não encontrada");
    const meta = (item: DemoMediaItem) => (item.metadata ?? {}) as Record<string, string>;
    const item: DemoMediaItem = {
      id: newId("song"),
      departmentId: department.id,
      title: body.title?.trim() || `${first.title} + ${second.title}`,
      url: "",
      category: "MUSIC",
      metadata: {
        artist: [meta(first).artist, meta(second).artist].filter(Boolean).join(" / "),
        key: meta(first).key ?? "",
        lyrics: `[${first.title}]\n${meta(first).lyrics ?? ""}\n\n[${second.title}]\n${meta(second).lyrics ?? ""}`,
        chords: `[${first.title}]\n${meta(first).chords ?? ""}\n\n[${second.title}]\n${meta(second).chords ?? ""}`,
        mixSources: [first.id, second.id],
      },
      createdAt: ctx.now.toISOString(),
    };
    ctx.db.mediaItems.push(item);
    return mediaItemView(item);
  });

  r.post("/api/church/departments/:id/songs/cifraclub", (ctx) => {
    departmentOf(ctx, ctx.params.id);
    const body = ctx.body ?? {};
    const title = body.title || "Música importada";
    return {
      title,
      artist: body.artist || "Artista",
      key: "G",
      bpm: "",
      songCategory: "",
      url: body.url || "https://www.cifraclub.com.br/",
      notes: "Importada do Cifra Club (exemplo da demonstração).",
      lyrics: "[Verso]\nEsta é uma cifra de exemplo\nNa versão real ela vem do Cifra Club",
      chords: "[Verso]\nG              D\nEsta é uma cifra de exemplo\nEm            C\nNa versão real ela vem do Cifra Club",
      keyboardChords: "",
      source: "cifraclub",
    };
  });

  r.post("/api/church/departments/:id/songs/import-pdf/preview", (ctx) => {
    departmentOf(ctx, ctx.params.id);
    return {
      songs: [
        { title: "Canção do PDF 1", artist: "", key: "D", lyrics: "Letra encontrada no PDF", chords: "D       A\nLetra encontrada no PDF" },
        { title: "Canção do PDF 2", artist: "", key: "E", lyrics: "Outra letra do PDF", chords: "E       B\nOutra letra do PDF" },
      ],
    };
  });

  r.post("/api/church/departments/:id/songs/import-pdf/confirm", (ctx) => {
    const department = departmentOf(ctx, ctx.params.id);
    const songs = Array.isArray(ctx.body?.songs) ? ctx.body.songs : [];
    const created = songs.map((song: Record<string, unknown>) => {
      const item: DemoMediaItem = {
        id: newId("song"),
        departmentId: department.id,
        title: String(song.title || "Sem título"),
        url: "",
        category: "MUSIC",
        metadata: {},
        createdAt: ctx.now.toISOString(),
      };
      applySongBody(item, song);
      ctx.db.mediaItems.push(item);
      return mediaItemView(item);
    });
    return { songs: created };
  });

  r.patch("/api/church/departments/:departmentId/songs/:songId", (ctx) => {
    const department = departmentOf(ctx, ctx.params.departmentId);
    ctx.assertCan("SONG_EDIT", department.id, "Sem permissão para editar músicas deste ministério");
    const item = findOr(ctx.db.mediaItems, (entry) => entry.id === ctx.params.songId, "Música não encontrada");
    applySongBody(item, ctx.body ?? {});
    return mediaItemView(item);
  });

  r.delete("/api/church/departments/:departmentId/songs/:songId", (ctx) => {
    const department = departmentOf(ctx, ctx.params.departmentId);
    ctx.assertCan("SONG_DELETE", department.id, "Sem permissão para apagar músicas deste ministério");
    removeWhere(ctx.db.mediaItems, (item) => item.id === ctx.params.songId);
    removeWhere(ctx.db.scheduleMedia, (item) => item.mediaItemId === ctx.params.songId);
    removeWhere(ctx.db.songPreferences, (item) => item.mediaItemId === ctx.params.songId);
    return { success: true };
  });

  // ---- preferências pessoais de música --------------------------------------
  const preferenceView = (pref: (DemoContext["db"]["songPreferences"])[number] | undefined) => ({
    id: pref?.id ?? null,
    personalKey: pref?.personalKey ?? null,
    chords: pref?.chords ?? null,
    notes: pref?.notes ?? null,
    updatedAt: pref?.updatedAt ?? null,
  });

  r.get("/api/church/songs/:songId/preference", (ctx) => {
    const user = ctx.me();
    return preferenceView(ctx.db.songPreferences.find((item) => item.userId === user.id && item.mediaItemId === ctx.params.songId));
  });

  r.patch("/api/church/songs/:songId/preference", (ctx) => {
    const user = ctx.me();
    findOr(ctx.db.mediaItems, (item) => item.id === ctx.params.songId, "Música não encontrada");
    let pref = ctx.db.songPreferences.find((item) => item.userId === user.id && item.mediaItemId === ctx.params.songId);
    if (!pref) {
      pref = { id: newId("sp"), userId: user.id, mediaItemId: ctx.params.songId!, personalKey: null, chords: null, notes: null, updatedAt: ctx.now.toISOString() };
      ctx.db.songPreferences.push(pref);
    }
    const body = ctx.body ?? {};
    if (body.personalKey !== undefined) pref.personalKey = body.personalKey;
    if (body.chords !== undefined) pref.chords = body.chords;
    if (body.notes !== undefined) pref.notes = body.notes;
    pref.updatedAt = ctx.now.toISOString();
    return preferenceView(pref);
  });

  r.get("/api/church/my-song-preferences", (ctx) => {
    const user = ctx.me();
    return ctx.db.songPreferences
      .filter((item) => item.userId === user.id)
      .flatMap((pref) => {
        const media = ctx.db.mediaItems.find((item) => item.id === pref.mediaItemId);
        if (!media) return [];
        const department = ctx.db.departments.find((item) => item.id === media.departmentId);
        return [{
          id: pref.id,
          personalKey: pref.personalKey,
          chords: pref.chords,
          updatedAt: pref.updatedAt,
          mediaItem: {
            id: media.id,
            title: media.title,
            url: media.url,
            category: media.category,
            metadata: media.metadata,
            department: { id: department?.id ?? "", name: department?.name ?? "" },
          },
        }];
      });
  });

  // ---- infantil --------------------------------------------------------------
  r.get("/api/church/departments/:id/children", (ctx) => {
    const department = departmentOf(ctx, ctx.params.id);
    return ctx.db.children
      .filter((item) => item.departmentId === department.id)
      .map((item) => childView(ctx, item))
      .sort((a, b) => a.rosterMember.name.localeCompare(b.rosterMember.name, "pt-BR"));
  });

  r.post("/api/church/departments/:id/children", (ctx) => {
    const department = departmentOf(ctx, ctx.params.id);
    const body = ctx.body ?? {};
    const person = upsertRosterPerson(ctx, body);
    const guardians = (Array.isArray(body.guardians) ? body.guardians : []).map(
      (guardian: Record<string, unknown>) => upsertRosterPerson(ctx, guardian).id,
    );
    const child = {
      id: newId("ch"),
      departmentId: department.id,
      rosterMemberId: person.id,
      groupName: body.groupName ?? null,
      isActive: true,
      guardianRosterIds: guardians,
      createdAt: ctx.now.toISOString(),
    };
    ctx.db.children.push(child);
    return childView(ctx, child);
  });

  r.patch("/api/church/departments/:departmentId/children/:childId", (ctx) => {
    departmentOf(ctx, ctx.params.departmentId);
    const child = findOr(ctx.db.children, (item) => item.id === ctx.params.childId, "Criança não encontrada");
    const body = ctx.body ?? {};
    const person = ctx.db.roster.find((item) => item.id === child.rosterMemberId);
    if (person && body.name !== undefined) person.name = body.name;
    if (person && body.birthDate !== undefined) person.birthDate = body.birthDate;
    if (body.groupName !== undefined) child.groupName = body.groupName;
    if (body.isActive !== undefined) child.isActive = Boolean(body.isActive);
    if (Array.isArray(body.guardians)) {
      child.guardianRosterIds = body.guardians.map((guardian: Record<string, unknown>) => upsertRosterPerson(ctx, guardian).id);
    }
    return childView(ctx, child);
  });

  r.get("/api/church/departments/:id/children/sessions", (ctx) => {
    const department = departmentOf(ctx, ctx.params.id);
    return ctx.db.childSessions
      .filter((item) => item.departmentId === department.id)
      .sort((a, b) => b.date.localeCompare(a.date))
      .map((item) => sessionView(ctx, item));
  });

  r.post("/api/church/departments/:id/children/sessions", (ctx) => {
    const department = departmentOf(ctx, ctx.params.id);
    const body = ctx.body ?? {};
    const groupName = body.groupName ?? null;
    const session = {
      id: newId("cs"),
      departmentId: department.id,
      date: body.date ? new Date(body.date.length === 10 ? `${body.date}T10:00:00` : body.date).toISOString() : ctx.now.toISOString(),
      groupName,
      createdAt: ctx.now.toISOString(),
      attendances: ctx.db.children
        .filter((child) => child.departmentId === department.id && child.isActive && (!groupName || child.groupName === groupName))
        .map((child) => ({ id: newId("csa"), childProfileId: child.id, status: "PENDING" as const })),
    };
    ctx.db.childSessions.push(session);
    return sessionView(ctx, session);
  });

  r.patch("/api/church/departments/:departmentId/children/sessions/:sessionId/attendance/:childId", (ctx) => {
    const session = findOr(ctx.db.childSessions, (item) => item.id === ctx.params.sessionId, "Aula não encontrada");
    let attendance = session.attendances.find((item) => item.childProfileId === ctx.params.childId);
    if (!attendance) {
      attendance = { id: newId("csa"), childProfileId: ctx.params.childId!, status: "PENDING" };
      session.attendances.push(attendance);
    }
    attendance.status = ctx.body?.status === "ABSENT" ? "ABSENT" : "PRESENT";
    const view = sessionView(ctx, session).attendances.find((item) => item.id === attendance!.id);
    return view;
  });

  r.get("/api/church/departments/:id/children/materials", (ctx) => {
    const department = departmentOf(ctx, ctx.params.id);
    return ctx.db.mediaItems
      .filter((item) => item.departmentId === department.id && item.category === "ACTIVITY")
      .sort((a, b) => a.title.localeCompare(b.title, "pt-BR"))
      .flatMap((item) => {
        const metadata = (item.metadata ?? {}) as { notes?: string | null; pdf?: { fileName: string; mimeType: string; size: number } };
        if (!metadata.pdf) return [];
        return [{
          id: item.id,
          title: item.title,
          category: "ACTIVITY",
          notes: metadata.notes ?? null,
          pdf: { fileName: metadata.pdf.fileName, mimeType: metadata.pdf.mimeType, size: metadata.pdf.size },
        }];
      });
  });

  r.get("/api/church/departments/:departmentId/children/materials/:resourceId/pdf", (ctx) => {
    departmentOf(ctx, ctx.params.departmentId);
    return rawResponse(SAMPLE_PDF, "application/pdf");
  });
});
