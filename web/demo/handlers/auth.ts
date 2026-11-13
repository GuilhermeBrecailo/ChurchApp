// Sessão (refresh-token/login/logout), /api/me e perfil do usuário.

import { DemoError, DemoForbidden, defineHandlers, formatChurch, rolesForMembership, uploadedFile, type DemoContext } from "../lib";
import { isLoggedOut, setLoggedOut } from "../store";

const base64Url = (value: unknown) => {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

/** JWT sem assinatura: o front só decodifica o payload (jwt-decode). */
export function demoAccessToken(ctx: DemoContext) {
  const user = ctx.me();
  return `${base64Url({ alg: "none", typ: "JWT" })}.${base64Url({
    sub: user.id,
    email: user.email,
    name: user.name,
    preferred_username: user.email,
    tenant_id: ctx.church?.id,
    role: ctx.role,
    is_admin: false,
    exp: 4102444800,
  })}.demo`;
}

export function formatMe(ctx: DemoContext) {
  const user = ctx.me();
  const { db } = ctx;
  const memberships = db.memberships
    .filter((item) => item.userId === user.id && item.isActive)
    .map((membership) => {
      const church = db.churches.find((item) => item.id === membership.churchId)!;
      return {
        id: membership.id,
        role: membership.role,
        canManageMembers: membership.canManageMembers,
        isPrimary: membership.isPrimary,
        isActive: membership.isActive,
        roles: rolesForMembership(db, membership),
        church: formatChurch(church),
      };
    });
  const church = ctx.church ? formatChurch(ctx.church) : null;
  const pendingChurches = db.memberships
    .filter((item) => item.userId === user.id && !item.isActive)
    .map((item) => db.churches.find((church) => church.id === item.churchId))
    .filter(Boolean)
    .map((item) => ({ id: item!.id, name: item!.name, slug: item!.slug }));

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    role: ctx.role,
    crunchId: ctx.church?.id ?? null,
    activeChurchId: ctx.church?.id ?? null,
    canManageMembers: ctx.membership?.canManageMembers ?? false,
    mustChangePassword: user.mustChangePassword,
    church,
    activeChurch: church,
    memberships,
    hasChurch: Boolean(ctx.church || memberships.length),
    isTitularPastor: ctx.role === "PASTOR" && ctx.church?.userMainId === user.id,
    roles: ctx.roles,
    permissions: [...new Set(ctx.roles.flatMap((role) => role.permissions))],
    is_admin: false,
    isDemoUser: false,
    pendingChurches,
    navPreviewRole: user.navPreviewRole,
  };
}

function profile(ctx: DemoContext) {
  const user = ctx.me();
  const primary = ctx.db.departmentMembers.find((item) => item.userId === user.id && item.isPrimary);
  const department = primary ? ctx.db.departments.find((item) => item.id === primary.departmentId) : null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    role: ctx.role,
    profileSuggestion: user.profileSuggestion,
    mustChangePassword: user.mustChangePassword,
    primaryDepartmentId: department?.id ?? null,
    ministryFunction: primary?.function ?? "",
    primaryDepartment: department ? { id: department.id, name: department.name, type: department.type } : null,
    unavailableDates: [...user.unavailableDates].sort(),
  };
}

export default defineHandlers((r) => {
  r.get("/public/auth/refresh-token", (ctx) => {
    if (isLoggedOut() || !ctx.user) throw new DemoForbidden("Sessão expirada");
    return { access_token: demoAccessToken(ctx) };
  });

  // Qualquer e-mail/senha entra como a persona escolhida na barra da demo.
  r.post("/public/auth/login", (ctx) => {
    setLoggedOut(false);
    return { access_token: demoAccessToken(ctx) };
  });

  r.get("/public/auth/logout", () => {
    setLoggedOut(true);
    return { success: true };
  });

  r.post("/api/pastor/signup", (ctx) => ({ id: ctx.user?.id ?? "u-semigreja" }));

  r.get("/api/me", (ctx) => formatMe(ctx));

  r.patch("/api/me/nav-preview-role", (ctx) => {
    const user = ctx.me();
    if (!ctx.isPrivileged) {
      throw new DemoError("Apenas pastor ou admin pode usar a pré-visualização de navegação");
    }
    user.navPreviewRole = ctx.body?.navPreviewRole ?? null;
    return { navPreviewRole: user.navPreviewRole };
  });

  r.post("/api/me/avatar", async (ctx) => {
    const user = ctx.me();
    const file = await uploadedFile(ctx.body);
    user.avatarUrl = file.url || null;
    return { url: file.url, key: file.key, mimeType: file.mimeType, size: file.size };
  });

  r.get("/api/me/profile", (ctx) => profile(ctx));

  r.patch("/api/me/profile", (ctx) => {
    const user = ctx.me();
    const body = ctx.body ?? {};
    if (body.phone !== undefined) user.phone = body.phone || null;
    if (body.profileSuggestion !== undefined) user.profileSuggestion = body.profileSuggestion || null;
    if (Array.isArray(body.unavailableDates)) {
      user.unavailableDates = [...new Set<string>(body.unavailableDates.map((date: string) => String(date).slice(0, 10)))];
    }
    if (body.primaryDepartmentId !== undefined || body.ministryFunction !== undefined) {
      const memberships = ctx.db.departmentMembers.filter((item) => item.userId === user.id);
      const targetId = body.primaryDepartmentId ?? memberships.find((item) => item.isPrimary)?.departmentId ?? null;
      for (const membership of memberships) membership.isPrimary = membership.departmentId === targetId;
      const target = memberships.find((item) => item.departmentId === targetId);
      if (target && body.ministryFunction !== undefined) target.function = body.ministryFunction || null;
    }
    return profile(ctx);
  });

  r.patch("/api/me/password", (ctx) => {
    const user = ctx.me();
    user.mustChangePassword = false;
    return { success: true };
  });

  // Vídeos de ajuda por página: a demo não tem nenhum cadastrado.
  r.get("/api/help-videos", () => []);
  r.put("/api/help-videos", (ctx) => ({ ...(ctx.body ?? {}), updatedAt: ctx.now.toISOString() }));
  r.delete("/api/help-videos", () => ({ success: true }));
  r.post("/api/help-videos/upload", async (ctx) => uploadedFile(ctx.body));
  r.post("/api/help-videos/upload-image", async (ctx) => uploadedFile(ctx.body));
});
