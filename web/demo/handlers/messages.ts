// Mensagens automáticas (modelos, regras, histórico, envio), conexão do
// WhatsApp (simulada) e aniversariantes.

import { DemoError, defineHandlers, findOr, newId, removeWhere, type DemoContext } from "../lib";

// QR code de mentira (SVG) - só para a tela de conexão ter o que mostrar.
const FAKE_QR =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 21 21" shape-rendering="crispEdges"><rect width="21" height="21" fill="#fff"/>${Array.from(
      { length: 120 },
      (_, index) => {
        const x = (index * 7) % 21;
        const y = Math.floor((index * 7) / 21) % 21;
        return `<rect x="${x}" y="${y}" width="1" height="1"/>`;
      },
    ).join("")}<rect x="0" y="0" width="7" height="7" fill="none" stroke="#000"/><rect x="14" y="0" width="7" height="7" fill="none" stroke="#000"/><rect x="0" y="14" width="7" height="7" fill="none" stroke="#000"/></svg>`,
  );

function templateView(item: DemoContext["db"]["messageTemplates"][number]) {
  return {
    id: item.id,
    name: item.name,
    body: item.body,
    suggestionKey: item.suggestionKey,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

function ruleView(ctx: DemoContext, rule: DemoContext["db"]["messageRules"][number]) {
  const serviceTime = ctx.db.serviceTimes.find((item) => item.id === rule.serviceTimeId);
  const template = ctx.db.messageTemplates.find((item) => item.id === rule.templateId);
  return {
    id: rule.id,
    audience: rule.audience,
    offsetMinutes: rule.offsetMinutes,
    isActive: rule.isActive,
    lastFiredAt: rule.lastFiredAt,
    serviceTimeId: rule.serviceTimeId,
    templateId: rule.templateId,
    serviceTime: serviceTime
      ? { id: serviceTime.id, label: serviceTime.label, weekday: serviceTime.weekday, time: serviceTime.time }
      : undefined,
    template: template ? { id: template.id, name: template.name } : undefined,
  };
}

function logView(ctx: DemoContext, log: DemoContext["db"]["messageLogs"][number]) {
  const template = log.templateId ? ctx.db.messageTemplates.find((item) => item.id === log.templateId) : null;
  return {
    id: log.id,
    audience: log.audience,
    status: log.status,
    totalCount: log.totalCount,
    successCount: log.successCount,
    failedCount: log.failedCount,
    createdAt: log.createdAt,
    finishedAt: log.finishedAt,
    ruleId: log.ruleId,
    templateId: log.templateId,
    template: template ? { name: template.name } : null,
  };
}

function assertManager(ctx: DemoContext) {
  ctx.requireChurch();
  if (!ctx.isPrivileged) throw new DemoError("Apenas o pastor pode configurar mensagens");
}

/** Visitante só recebe mensagem se autorizou contato (LGPD). */
function canReceiveMessage(ctx: DemoContext, person: { id: string; status: string; contactConsent?: boolean }) {
  if (person.status !== "VISITOR") return true;
  const followUp = ctx.db.followUps.find((item) => item.rosterMemberId === person.id);
  return followUp ? followUp.consentToContact : person.contactConsent === true;
}

function audienceOf(ctx: DemoContext, audience: string, recipientIds: string[] = []) {
  const church = ctx.requireChurch();
  return ctx.db.roster.filter(
    (item) =>
      item.churchId === church.id &&
      (audience === "ALL"
        ? item.status !== "FORMER"
        : audience === "SELECTED"
          ? recipientIds.includes(item.id)
          : item.status === audience),
  );
}

function birthdaysIn(ctx: DemoContext, range: string) {
  const church = ctx.requireChurch();
  const today = new Date(ctx.now);
  today.setHours(0, 0, 0, 0);
  const limit = range === "month" ? 31 : range === "week" ? 7 : 0;
  return ctx.db.roster
    .filter((item) => item.churchId === church.id && item.status !== "FORMER" && item.birthDate)
    .flatMap((item) => {
      const [year, month, day] = item.birthDate!.slice(0, 10).split("-").map(Number);
      let next = new Date(today.getFullYear(), month! - 1, day!);
      if (next < today) next = new Date(today.getFullYear() + 1, month! - 1, day!);
      const daysUntil = Math.round((next.getTime() - today.getTime()) / (24 * 3600 * 1000));
      if (daysUntil > limit) return [];
      return [{
        id: item.id,
        name: item.name,
        phone: item.phone,
        birthDate: item.birthDate!,
        status: item.status,
        canReceiveMessage: canReceiveMessage(ctx, item),
        turningAge: next.getFullYear() - year!,
        daysUntil,
      }];
    })
    .sort((a, b) => a.daysUntil - b.daysUntil);
}

export default defineHandlers((r) => {
  // ---- modelos -----------------------------------------------------------
  r.get("/api/church/messages/templates", (ctx) => {
    const church = ctx.requireChurch();
    return ctx.db.messageTemplates.filter((item) => item.churchId === church.id).map(templateView);
  });

  r.post("/api/church/messages/templates", (ctx) => {
    assertManager(ctx);
    const body = ctx.body ?? {};
    if (!body.name?.trim() || !body.body?.trim()) throw new DemoError("Nome e texto são obrigatórios");
    const item = {
      id: newId("mt"),
      churchId: ctx.requireChurch().id,
      name: body.name.trim(),
      body: body.body.trim(),
      suggestionKey: body.suggestionKey ?? null,
      createdAt: ctx.now.toISOString(),
      updatedAt: ctx.now.toISOString(),
    };
    ctx.db.messageTemplates.push(item);
    return templateView(item);
  });

  r.patch("/api/church/messages/templates/:id", (ctx) => {
    assertManager(ctx);
    const item = findOr(ctx.db.messageTemplates, (entry) => entry.id === ctx.params.id, "Modelo não encontrado");
    if (ctx.body?.name !== undefined) item.name = ctx.body.name;
    if (ctx.body?.body !== undefined) item.body = ctx.body.body;
    item.updatedAt = ctx.now.toISOString();
    return templateView(item);
  });

  r.delete("/api/church/messages/templates/:id", (ctx) => {
    assertManager(ctx);
    if (ctx.db.messageRules.some((item) => item.templateId === ctx.params.id)) {
      throw new DemoError("Este modelo está em uso por uma mensagem automática");
    }
    removeWhere(ctx.db.messageTemplates, (item) => item.id === ctx.params.id);
    return { success: true };
  });

  // ---- regras automáticas -------------------------------------------------
  r.get("/api/church/messages/rules", (ctx) => {
    const church = ctx.requireChurch();
    return ctx.db.messageRules.filter((item) => item.churchId === church.id).map((item) => ruleView(ctx, item));
  });

  r.post("/api/church/messages/rules", (ctx) => {
    assertManager(ctx);
    const body = ctx.body ?? {};
    const rule = {
      id: newId("mr"),
      churchId: ctx.requireChurch().id,
      audience: body.audience ?? "VISITOR",
      offsetMinutes: Number(body.offsetMinutes ?? 120),
      isActive: body.isActive ?? true,
      lastFiredAt: null,
      serviceTimeId: body.serviceTimeId,
      templateId: body.templateId,
    };
    ctx.db.messageRules.push(rule);
    return ruleView(ctx, rule);
  });

  r.patch("/api/church/messages/rules/:id", (ctx) => {
    assertManager(ctx);
    const rule = findOr(ctx.db.messageRules, (entry) => entry.id === ctx.params.id, "Mensagem automática não encontrada");
    for (const field of ["audience", "offsetMinutes", "isActive", "serviceTimeId", "templateId"] as const) {
      if (ctx.body?.[field] !== undefined) (rule as unknown as Record<string, unknown>)[field] = ctx.body[field];
    }
    return ruleView(ctx, rule);
  });

  r.delete("/api/church/messages/rules/:id", (ctx) => {
    assertManager(ctx);
    removeWhere(ctx.db.messageRules, (item) => item.id === ctx.params.id);
    return { success: true };
  });

  r.get("/api/church/messages/logs", (ctx) => {
    const church = ctx.requireChurch();
    return ctx.db.messageLogs
      .filter((item) => item.churchId === church.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((item) => logView(ctx, item));
  });

  r.post("/api/church/messages/send", (ctx) => {
    assertManager(ctx);
    if (!ctx.db.meta.whatsappConnected) throw new DemoError("Conecte o WhatsApp da igreja antes de enviar mensagens");
    const church = ctx.requireChurch();
    const audience = ctx.body?.audience ?? "ALL";
    const people = audienceOf(ctx, audience, ctx.body?.recipientIds ?? []).filter(
      (item) => item.phone && canReceiveMessage(ctx, item),
    );
    const log = {
      id: newId("ml"),
      churchId: church.id,
      audience,
      status: "DONE" as const,
      totalCount: people.length,
      successCount: people.length,
      failedCount: 0,
      createdAt: ctx.now.toISOString(),
      finishedAt: ctx.now.toISOString(),
      ruleId: null,
      templateId: ctx.body?.templateId ?? null,
    };
    ctx.db.messageLogs.push(log);
    return logView(ctx, log);
  });

  r.post("/api/church/messages/preview", (ctx) => {
    assertManager(ctx);
    const audience = ctx.body?.audience ?? "ALL";
    const ids: string[] = ctx.body?.recipientIds ?? [];
    if (audience === "SELECTED" && !ids.length) return { recipients: 0, excludedWithoutConsent: 0, withoutPhone: 0 };
    const people = audienceOf(ctx, audience, ids);
    const allowed = people.filter((item) => canReceiveMessage(ctx, item));
    return {
      recipients: allowed.length,
      excludedWithoutConsent: people.length - allowed.length,
      withoutPhone: allowed.filter((item) => !item.phone).length,
    };
  });

  // ---- WhatsApp ------------------------------------------------------------------
  r.get("/api/church/whatsapp/status", (ctx) =>
    ctx.db.meta.whatsappConnected ? { connected: true, phone: "5541999998888" } : { connected: false },
  );

  r.post("/api/church/whatsapp/connect", (ctx) => {
    assertManager(ctx);
    // Na demo, "ler o QR" conecta na hora.
    ctx.db.meta.whatsappConnected = true;
    return { qr: FAKE_QR };
  });

  r.post("/api/church/whatsapp/disconnect", (ctx) => {
    ctx.db.meta.whatsappConnected = false;
    return { success: true };
  });

  // ---- aniversários --------------------------------------------------------------
  r.get("/api/church/birthdays", (ctx) => birthdaysIn(ctx, ctx.query.range ?? "today"));

  const settingOf = (ctx: DemoContext) => {
    const church = ctx.requireChurch();
    let setting = ctx.db.birthdaySettings.find((item) => item.crunchId === church.id);
    if (!setting) {
      setting = { id: null, crunchId: church.id, isActive: false, templateId: null, lastNotifiedAt: null, notifyTime: "08:00" };
    }
    return setting;
  };

  r.get("/api/church/birthdays/setting", (ctx) => settingOf(ctx));

  r.patch("/api/church/birthdays/setting", (ctx) => {
    assertManager(ctx);
    const setting = settingOf(ctx);
    if (!setting.id) {
      setting.id = newId("bs");
      ctx.db.birthdaySettings.push(setting);
    }
    if (ctx.body?.isActive !== undefined) setting.isActive = Boolean(ctx.body.isActive);
    if (ctx.body?.templateId !== undefined) setting.templateId = ctx.body.templateId;
    if (ctx.body?.notifyTime !== undefined) setting.notifyTime = ctx.body.notifyTime;
    return setting;
  });

  r.post("/api/church/birthdays/send", (ctx) => {
    assertManager(ctx);
    if (!ctx.db.meta.whatsappConnected) throw new DemoError("Conecte o WhatsApp da igreja antes de enviar mensagens");
    const people = birthdaysIn(ctx, "today");
    const setting = settingOf(ctx);
    const log = {
      id: newId("ml"),
      churchId: ctx.requireChurch().id,
      audience: "SELECTED",
      status: "DONE" as const,
      totalCount: people.length,
      successCount: people.length,
      failedCount: 0,
      createdAt: ctx.now.toISOString(),
      finishedAt: ctx.now.toISOString(),
      ruleId: null,
      templateId: setting.templateId,
    };
    ctx.db.messageLogs.push(log);
    setting.lastNotifiedAt = ctx.now.toISOString();
    return logView(ctx, log);
  });
});
