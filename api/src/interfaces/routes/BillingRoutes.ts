import { FastifyInstance } from "fastify";
import { controllerHandler } from "../controllers/Handler";
import { BillingAdapters } from "../adapters/billingAdapters";

export async function BillingRoutes(app: FastifyInstance) {
  const adapters = new BillingAdapters();

  app.post(
    "/api/church/subscription/checkout",
    controllerHandler(adapters.createSubscriptionCheckout.bind(adapters)),
  );

  app.post(
    "/public/mercadopago/webhook",
    adapters.handleMercadoPagoWebhook.bind(adapters),
  );
}
