// Administração da plataforma (super admin). Nenhuma persona da demo é admin
// da plataforma; estes handlers só evitam erro se alguém abrir a tela.

import { defineHandlers, findOr, type DemoContext } from "../lib";

function churchSummary(ctx: DemoContext, church: DemoContext["db"]["churches"][number]) {
  return {
    id: church.id,
    name: church.name,
    city: church.city,
    state: church.state,
    document: church.document,
    logo: church.logo,
    isActive: church.isActive,
    createdAt: church.createdAt,
    userMainId: church.userMainId,
    plan: church.plan,
    subscriptionStatus: church.subscriptionStatus,
    trialEndsAt: church.trialEndsAt,
    membersCount: ctx.db.memberships.filter((item) => item.churchId === church.id && item.isActive).length,
    departmentsCount: ctx.db.departments.filter((item) => item.churchId === church.id).length,
    pastorHistoryCount: 1,
  };
}

export default defineHandlers((r) => {
  r.get("/api/admin/churches", (ctx) => ctx.db.churches.map((church) => churchSummary(ctx, church)));

  r.get("/api/admin/churches/:id", (ctx) => {
    const church = findOr(ctx.db.churches, (item) => item.id === ctx.params.id, "Igreja não encontrada");
    return {
      ...churchSummary(ctx, church),
      road: church.road,
      number: church.number,
      complement: church.complement,
      localZipCode: church.localZipCode,
      users: [],
      departments: [],
      schedules: [],
      pastorHistory: [],
    };
  });

  r.patch("/api/admin/churches/:id", (ctx) => churchSummary(ctx, findOr(ctx.db.churches, (item) => item.id === ctx.params.id, "Igreja não encontrada")));
  r.patch("/api/admin/churches/:id/plan", (ctx) => churchSummary(ctx, findOr(ctx.db.churches, (item) => item.id === ctx.params.id, "Igreja não encontrada")));
  r.patch("/api/admin/churches/:churchId/users/:userId", () => ({ success: true }));
  r.post("/api/admin/churches/:churchId/users/:userId/reset-password", () => ({ success: true }));
  r.get("/api/admin/departments", () => []);
  r.get("/api/admin/commercial-leads", () => []);
  r.post("/api/admin/commercial-leads", () => null);
  r.get("/api/admin/commercial-leads/:id", () => null);
  r.patch("/api/admin/commercial-leads/:id", () => null);
  r.patch("/api/admin/commercial-leads/:id/stage", () => null);
});
