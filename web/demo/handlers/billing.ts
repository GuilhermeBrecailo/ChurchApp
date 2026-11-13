// Plano e cobrança. A igreja da demo está no teste grátis do Pro; "assinar"
// ativa o plano na hora (sem Mercado Pago).

import { DemoError, defineHandlers } from "../lib";

export default defineHandlers((r) => {
  r.post("/api/church/subscription/checkout", (ctx) => {
    const church = ctx.requireChurch();
    if (!ctx.isPrivileged) throw new DemoError("Apenas o pastor pode assinar o plano");
    church.plan = "PRO";
    church.subscriptionStatus = "ACTIVE";
    church.trialEndsAt = null;
    // Na demo não existe checkout externo: recarrega a tela atual (funciona
    // também quando o site estático está numa subpasta, onde o backUrl
    // "origin/plans" do front não existiria).
    const checkoutUrl =
      typeof location !== "undefined"
        ? `${location.origin}${location.pathname}?assinatura-demo=${Date.now()}${location.hash}`
        : String(ctx.body?.backUrl ?? "/plans");
    return { checkoutUrl, mpSubscriptionId: "demo-assinatura" };
  });

  r.post("/api/church/subscription/cancel", (ctx) => {
    const church = ctx.requireChurch();
    if (!ctx.isPrivileged) throw new DemoError("Apenas o pastor pode cancelar o plano");
    church.plan = "FREE";
    church.subscriptionStatus = "CANCELED";
    church.trialEndsAt = null;
    return { id: church.id, plan: church.plan, subscriptionStatus: church.subscriptionStatus, trialEndsAt: null };
  });
});
