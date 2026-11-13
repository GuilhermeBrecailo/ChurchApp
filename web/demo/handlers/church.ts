// Igreja: criar/editar, foto, horários de culto, convite, página pública e
// cargos (papéis customizados).

import { getDepartmentSchedulePreset } from "../../app/utils/departmentScheduleConfig";
import {
  DemoError,
  defineHandlers,
  findOr,
  formatChurch,
  newId,
  removeWhere,
  rolesForMembership,
  upcomingServiceDates,
  uploadedFile,
  userName,
  type DemoContext,
} from "../lib";
import type { DemoChurch } from "../types";

const INITIAL_MODULES: Record<string, string[]> = {
  WORSHIP: ["SCHEDULES", "TASKS", "RESOURCES", "SONGS"],
  KIDS: ["SCHEDULES", "TASKS", "RESOURCES", "CLASSES"],
};

const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50) || "igreja";

const randomCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();

const UPDATABLE_FIELDS: (keyof DemoChurch)[] = [
  "name", "city", "road", "number", "localZipCode", "state", "complement", "document", "logo",
  "isActive", "accentColor", "textColor", "fontFamily", "phone", "whatsapp", "email", "instagram",
  "facebook", "youtube", "website",
];

function serviceTimeView(item: { id: string; label: string; weekday: number; time: string; isActive: boolean }) {
  return { id: item.id, label: item.label, weekday: item.weekday, time: item.time, isActive: item.isActive };
}

function assertCanManageChurch(ctx: DemoContext) {
  if (!ctx.isPrivileged) throw new DemoError("Apenas o pastor pode alterar os dados da igreja");
}

function roleView(ctx: DemoContext, roleId: string) {
  const role = ctx.db.churchRoles.find((item) => item.id === roleId)!;
  const department = role.departmentId ? ctx.db.departments.find((item) => item.id === role.departmentId) : null;
  return {
    id: role.id,
    name: role.name,
    description: role.description,
    scope: role.scope,
    departmentId: role.departmentId,
    department: department ? { id: department.id, name: department.name } : null,
    permissions: role.permissions,
    userCount: ctx.db.memberships.filter((item) => item.isActive && item.roleIds.includes(role.id)).length,
  };
}

function publicChurchPayload(ctx: DemoContext, church: DemoChurch) {
  const { db } = ctx;
  const serviceTimes = db.serviceTimes
    .filter((item) => item.churchId === church.id && item.isActive)
    .map(serviceTimeView);
  const authorOf = (id: string | null) => (id ? { id, name: userName(db, id) } : null);
  const now = ctx.now.getTime();
  return {
    church: {
      id: church.id,
      name: church.name,
      logo: church.logo,
      accentColor: church.accentColor,
      textColor: church.textColor,
      fontFamily: church.fontFamily,
      isActive: church.isActive,
      city: church.city,
      state: church.state,
      welcomeMessage: church.welcomeMessage,
    },
    serviceTimes,
    upcomingServices: {
      week: upcomingServiceDates(serviceTimes, 7, ctx.now),
      month: upcomingServiceDates(serviceTimes, 30, ctx.now),
    },
    publicContent: db.announcements
      .filter((item) => item.churchId === church.id && item.isPublic && (!item.expiresAt || new Date(item.expiresAt).getTime() > now))
      .map((item) => ({
        id: item.id,
        title: item.title,
        body: item.body,
        pinned: item.pinned,
        publishedAt: item.publishedAt,
        expiresAt: item.expiresAt,
        kind: item.kind,
        imageUrl: item.imageUrl,
        videoUrl: item.videoUrl,
      })),
    publicVerses: db.dailyVerses
      .filter((item) => item.churchId === church.id && item.isPublic)
      .map((item) => ({
        id: item.id,
        text: item.text,
        reference: item.reference,
        commentary: item.commentary,
        videoUrl: item.videoUrl,
        imageUrl: item.imageUrl,
        publishedAt: item.publishedAt,
        author: authorOf(item.authorId),
      })),
    publicDevotionals: db.devotionals
      .filter((item) => item.churchId === church.id && item.isPublic)
      .map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        videoUrl: item.videoUrl,
        imageUrl: item.imageUrl,
        publishedAt: item.publishedAt,
        author: authorOf(item.authorId),
        chapters: item.chapters,
      })),
    publicPosts: db.posts
      .filter((item) => item.churchId === church.id && item.isPublic)
      .map((item) => ({
        id: item.id,
        title: item.title,
        body: item.body,
        imageUrl: item.imageUrl,
        videoUrl: item.videoUrl,
        pinned: item.pinned,
        publishedAt: item.publishedAt,
        author: authorOf(item.authorId),
      })),
    footer: {
      address: {
        road: church.road,
        number: church.number,
        complement: church.complement,
        city: church.city,
        state: church.state,
        zipCode: church.localZipCode,
      },
      contacts: { phone: church.phone, whatsapp: church.whatsapp, email: church.email },
      social: Object.fromEntries(
        (["instagram", "facebook", "youtube", "website"] as const)
          .filter((key) => church[key])
          .map((key) => [key, church[key] as string]),
      ),
    },
  };
}

export default defineHandlers((r) => {
  // ---- igreja -----------------------------------------------------------
  r.post("/api/church/create-own", (ctx) => {
    const user = ctx.me();
    const body = ctx.body ?? {};
    if (!body.name?.trim()) throw new DemoError("Nome da igreja é obrigatório");
    const { db } = ctx;
    let slug = slugify(body.slug || body.name);
    while (db.churches.some((item) => item.slug === slug)) slug = `${slug}-${Math.floor(Math.random() * 90 + 10)}`;
    const church: DemoChurch = {
      id: newId("c"),
      name: body.name.trim(),
      slug,
      city: body.city ?? "",
      road: body.road ?? "",
      number: body.number ?? "",
      localZipCode: body.localZipCode ?? "",
      state: body.state ?? "",
      complement: body.complement ?? "",
      document: body.document ?? "",
      logo: body.logo ?? "",
      accentColor: body.accentColor?.trim() || null,
      textColor: null,
      fontFamily: null,
      isActive: true,
      userMainId: user.id,
      phone: null,
      whatsapp: null,
      email: null,
      instagram: null,
      facebook: null,
      youtube: null,
      website: null,
      welcomeMessage: null,
      plan: "PRO",
      subscriptionStatus: "TRIALING",
      trialEndsAt: new Date(ctx.now.getTime() + 90 * 24 * 3600 * 1000).toISOString(),
      pastDueSince: null,
      inviteCode: randomCode(),
      createdAt: ctx.now.toISOString(),
    };
    db.churches.push(church);
    db.memberships.push({
      id: newId("m"),
      userId: user.id,
      churchId: church.id,
      role: "PASTOR",
      canManageMembers: true,
      isPrimary: !db.memberships.some((item) => item.userId === user.id && item.isActive),
      isActive: true,
      roleIds: [],
      createdAt: ctx.now.toISOString(),
    });
    db.roster.push({
      id: newId("r"),
      churchId: church.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      birthDate: null,
      notes: null,
      status: "MEMBER",
      joinedAt: ctx.now.toISOString(),
      leftAt: null,
      createdAt: ctx.now.toISOString(),
      userId: user.id,
      contactConsent: true,
    });
    const initialDepartments: { name: string; type: string }[] =
      body.setupMode === "later" ? [] : Array.isArray(body.initialDepartments) ? body.initialDepartments : [];
    initialDepartments.forEach((draft, index) => {
      const id = newId("d");
      db.departments.push({
        id,
        churchId: church.id,
        name: draft.name,
        type: draft.type,
        isActive: true,
        modules: INITIAL_MODULES[draft.type] ?? ["SCHEDULES", "TASKS", "RESOURCES"],
        scheduleConfig: getDepartmentSchedulePreset(draft.type),
        leaderId: user.id,
        createdAt: ctx.now.toISOString(),
      });
      db.departmentMembers.push({ id: newId("dm"), departmentId: id, userId: user.id, function: null, isPrimary: index === 0 });
    });
    return { id: church.id, name: church.name, userMainId: church.userMainId, slug: church.slug, accentColor: church.accentColor };
  });

  r.patch("/api/church", (ctx) => {
    assertCanManageChurch(ctx);
    const church = ctx.requireChurch();
    const body = ctx.body ?? {};
    for (const field of UPDATABLE_FIELDS) {
      if (body[field] !== undefined) (church as unknown as Record<string, unknown>)[field] = body[field];
    }
    if (body.slug !== undefined && body.slug) {
      const slug = slugify(body.slug);
      if (ctx.db.churches.some((item) => item.slug === slug && item.id !== church.id)) {
        throw new DemoError("Esse endereço já está em uso por outra igreja");
      }
      church.slug = slug;
    }
    return formatChurch(church);
  });

  r.post("/api/church/uploads/photo", async (ctx) => {
    assertCanManageChurch(ctx);
    const church = ctx.requireChurch();
    const file = await uploadedFile(ctx.body);
    church.logo = file.url;
    return { url: file.url, key: file.key, mimeType: file.mimeType, size: file.size };
  });

  // ---- horários de culto ------------------------------------------------
  r.get("/api/church/service-times", (ctx) => {
    const church = ctx.requireChurch();
    return ctx.db.serviceTimes
      .filter((item) => item.churchId === church.id)
      .sort((a, b) => a.weekday - b.weekday || a.time.localeCompare(b.time))
      .map(serviceTimeView);
  });

  r.post("/api/church/service-times", (ctx) => {
    const church = ctx.requireChurch();
    ctx.assertCan("ANNOUNCEMENT_PUBLISH", undefined, "Sem permissão para gerenciar horários de culto");
    const body = ctx.body ?? {};
    if (!body.label?.trim()) throw new DemoError("Informe o nome do culto");
    if (!/^\d{2}:\d{2}$/.test(body.time ?? "")) throw new DemoError("Horário inválido");
    const item = {
      id: newId("st"),
      churchId: church.id,
      label: body.label.trim(),
      weekday: Number(body.weekday ?? 0),
      time: body.time,
      isActive: body.isActive ?? true,
    };
    ctx.db.serviceTimes.push(item);
    return serviceTimeView(item);
  });

  r.patch("/api/church/service-times/:id", (ctx) => {
    ctx.assertCan("ANNOUNCEMENT_PUBLISH", undefined, "Sem permissão para gerenciar horários de culto");
    const item = findOr(ctx.db.serviceTimes, (entry) => entry.id === ctx.params.id, "Horário não encontrado");
    const body = ctx.body ?? {};
    if (body.label !== undefined) item.label = body.label;
    if (body.weekday !== undefined) item.weekday = Number(body.weekday);
    if (body.time !== undefined) item.time = body.time;
    if (body.isActive !== undefined) item.isActive = Boolean(body.isActive);
    return serviceTimeView(item);
  });

  r.delete("/api/church/service-times/:id", (ctx) => {
    ctx.assertCan("ANNOUNCEMENT_PUBLISH", undefined, "Sem permissão para gerenciar horários de culto");
    removeWhere(ctx.db.serviceTimes, (item) => item.id === ctx.params.id);
    return { success: true };
  });

  // ---- convite ----------------------------------------------------------
  r.get("/api/church/invite-code", (ctx) => {
    const church = ctx.requireChurch();
    return { inviteCode: church.inviteCode };
  });

  r.post("/api/church/invite-code/regenerate", (ctx) => {
    const church = ctx.requireChurch();
    church.inviteCode = randomCode();
    return { inviteCode: church.inviteCode };
  });

  r.post("/api/church/join", (ctx) => {
    const user = ctx.me();
    const code = String(ctx.body?.inviteCode ?? "").trim().toUpperCase();
    const church = ctx.db.churches.find((item) => item.inviteCode === code);
    if (!church) throw new DemoError("Código de convite inválido");
    const existing = ctx.db.memberships.find((item) => item.userId === user.id && item.churchId === church.id);
    if (existing?.isActive) throw new DemoError("Você já faz parte desta igreja");
    if (!existing) {
      ctx.db.memberships.push({
        id: newId("m"),
        userId: user.id,
        churchId: church.id,
        role: "MEMBER",
        canManageMembers: false,
        isPrimary: true,
        isActive: false,
        roleIds: [],
        createdAt: ctx.now.toISOString(),
      });
    }
    const membership = ctx.db.memberships.find((item) => item.userId === user.id && item.churchId === church.id);
    return {
      success: true,
      churchId: church.id,
      churchName: church.name,
      churchSlug: church.slug,
      membershipId: membership?.id ?? null,
      alreadyMember: Boolean(existing),
      pending: true,
    };
  });

  r.get("/public/church/invite/:code", (ctx) => {
    const code = ctx.params.code!.trim().toUpperCase();
    const church = findOr(ctx.db.churches, (item) => item.inviteCode === code, "Convite inválido ou expirado");
    return { name: church.name, logo: church.logo, slug: church.slug };
  });

  r.post("/public/church/invite/:code/register", (ctx) => {
    const code = ctx.params.code!.trim().toUpperCase();
    const church = findOr(ctx.db.churches, (item) => item.inviteCode === code, "Convite inválido ou expirado");
    const body = ctx.body ?? {};
    if (!body.name || !body.email) throw new DemoError("Preencha nome e e-mail");
    const userId = newId("u");
    ctx.db.users.push({
      id: userId,
      name: body.name,
      email: body.email,
      phone: body.phone ?? null,
      avatarUrl: null,
      birthDate: null,
      mustChangePassword: false,
      profileSuggestion: null,
      unavailableDates: [],
      navPreviewRole: null,
      createdAt: ctx.now.toISOString(),
    });
    ctx.db.memberships.push({
      id: newId("m"),
      userId,
      churchId: church.id,
      role: "MEMBER",
      canManageMembers: false,
      isPrimary: true,
      isActive: false,
      roleIds: [],
      createdAt: ctx.now.toISOString(),
    });
    return { success: true, churchName: church.name };
  });

  // ---- página pública ---------------------------------------------------
  r.get("/public/church/:slug", (ctx) => {
    const church = findOr(ctx.db.churches, (item) => item.slug === ctx.params.slug, "Igreja nao encontrada");
    return publicChurchPayload(ctx, church);
  });

  r.get("/public/church/:slug/service-times", (ctx) => {
    const church = findOr(ctx.db.churches, (item) => item.slug === ctx.params.slug, "Igreja nao encontrada");
    const serviceTimes = ctx.db.serviceTimes
      .filter((item) => item.churchId === church.id && item.isActive)
      .map(serviceTimeView);
    return {
      serviceTimes,
      upcomingServices: {
        week: upcomingServiceDates(serviceTimes, 7, ctx.now),
        month: upcomingServiceDates(serviceTimes, 30, ctx.now),
      },
    };
  });

  r.post("/public/church/:slug/notifications/subscribe", () => ({ success: true }));
  r.delete("/public/church/:slug/notifications/subscribe", () => ({ success: true }));
  r.get("/public/churches/sitemap", (ctx) => ctx.db.churches.map((item) => ({ slug: item.slug, updatedAt: item.createdAt })));

  // ---- cargos -------------------------------------------------------------
  r.get("/api/church/roles", (ctx) => {
    const church = ctx.requireChurch();
    return ctx.db.churchRoles
      .filter((item) => item.churchId === church.id)
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
      .map((item) => roleView(ctx, item.id));
  });

  r.post("/api/church/roles", (ctx) => {
    const church = ctx.requireChurch();
    if (!ctx.isPrivileged) throw new DemoError("Apenas o pastor pode criar cargos");
    const body = ctx.body ?? {};
    if (!body.name?.trim()) throw new DemoError("Informe o nome do cargo");
    if (body.scope === "MINISTRY" && !body.departmentId) throw new DemoError("Escolha o ministério do cargo");
    const role = {
      id: newId("cr"),
      churchId: church.id,
      name: body.name.trim(),
      description: body.description ?? null,
      scope: body.scope === "MINISTRY" ? ("MINISTRY" as const) : ("CHURCH" as const),
      departmentId: body.scope === "MINISTRY" ? body.departmentId : null,
      permissions: Array.isArray(body.permissions) ? body.permissions : [],
    };
    ctx.db.churchRoles.push(role);
    return roleView(ctx, role.id);
  });

  r.patch("/api/church/roles/:id", (ctx) => {
    if (!ctx.isPrivileged) throw new DemoError("Apenas o pastor pode editar cargos");
    const role = findOr(ctx.db.churchRoles, (item) => item.id === ctx.params.id, "Cargo não encontrado");
    const body = ctx.body ?? {};
    if (body.name !== undefined) role.name = body.name;
    if (body.description !== undefined) role.description = body.description;
    if (body.scope !== undefined) role.scope = body.scope;
    if (body.departmentId !== undefined) role.departmentId = body.departmentId;
    if (Array.isArray(body.permissions)) role.permissions = body.permissions;
    return roleView(ctx, role.id);
  });

  r.delete("/api/church/roles/:id", (ctx) => {
    if (!ctx.isPrivileged) throw new DemoError("Apenas o pastor pode apagar cargos");
    removeWhere(ctx.db.churchRoles, (item) => item.id === ctx.params.id);
    for (const membership of ctx.db.memberships) {
      membership.roleIds = membership.roleIds.filter((id) => id !== ctx.params.id);
    }
    return { success: true };
  });

  const memberRoleResponse = (ctx: DemoContext, userId: string) => {
    const church = ctx.requireChurch();
    const membership = findOr(
      ctx.db.memberships,
      (item) => item.userId === userId && item.churchId === church.id,
      "Membro não encontrado",
    );
    return { membershipId: membership.id, membership, roles: rolesForMembership(ctx.db, membership) };
  };

  r.post("/api/church/members/:id/roles", (ctx) => {
    if (!ctx.isPrivileged) throw new DemoError("Apenas o pastor pode atribuir cargos");
    const { membership } = memberRoleResponse(ctx, ctx.params.id!);
    const roleId = ctx.body?.churchRoleId;
    findOr(ctx.db.churchRoles, (item) => item.id === roleId, "Cargo não encontrado");
    if (!membership.roleIds.includes(roleId)) membership.roleIds.push(roleId);
    const { membershipId, roles } = memberRoleResponse(ctx, ctx.params.id!);
    return { membershipId, roles };
  });

  r.delete("/api/church/members/:id/roles/:roleId", (ctx) => {
    if (!ctx.isPrivileged) throw new DemoError("Apenas o pastor pode remover cargos");
    const { membership } = memberRoleResponse(ctx, ctx.params.id!);
    membership.roleIds = membership.roleIds.filter((id) => id !== ctx.params.roleId);
    const { membershipId, roles } = memberRoleResponse(ctx, ctx.params.id!);
    return { membershipId, roles };
  });
});
