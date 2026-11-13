// Caixa de notificações do usuário. Push de verdade não existe na demo:
// public-key responde "não configurado" e o app esconde o botão de ativar.

import { defineHandlers, findOr, type DemoContext } from "../lib";

const mine = (ctx: DemoContext) => {
  const user = ctx.me();
  return ctx.db.notifications
    .filter((item) => item.userId === user.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
};

const view = (item: DemoContext["db"]["notifications"][number]) => ({
  id: item.id,
  title: item.title,
  body: item.body,
  url: item.url,
  type: item.type,
  scheduleId: item.scheduleId,
  readAt: item.readAt,
  createdAt: item.createdAt,
});

export default defineHandlers((r) => {
  r.get("/api/notifications", (ctx) => {
    const items = mine(ctx);
    return {
      notifications: items.slice(0, 30).map(view),
      unreadCount: items.filter((item) => !item.readAt).length,
    };
  });

  r.patch("/api/notifications/:id/read", (ctx) => {
    const user = ctx.me();
    const item = findOr(ctx.db.notifications, (entry) => entry.id === ctx.params.id && entry.userId === user.id, "Notificação não encontrada");
    item.readAt = item.readAt || ctx.now.toISOString();
    return view(item);
  });

  r.patch("/api/notifications/read-all", (ctx) => {
    const now = ctx.now.toISOString();
    for (const item of mine(ctx)) item.readAt = item.readAt || now;
    return { success: true };
  });

  r.get("/api/notifications/public-key", () => ({ publicKey: null, configured: false }));
  r.post("/api/notifications/subscribe", () => ({ success: true }));
  r.delete("/api/notifications/subscribe", () => ({ success: true }));
});
