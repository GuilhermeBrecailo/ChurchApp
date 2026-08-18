import { FastifyInstance } from "fastify";
import { controllerHandler } from "../controllers/Handler";
import { MessageAdapters } from "../adapters/messageAdapters";

export async function MessageRoutes(app: FastifyInstance) {
  const adapters = new MessageAdapters();

  app.get("/api/church/messages/templates", controllerHandler(adapters.listTemplates.bind(adapters)));
  app.post("/api/church/messages/templates", controllerHandler(adapters.createTemplate.bind(adapters)));
  app.patch("/api/church/messages/templates/:id", controllerHandler(adapters.updateTemplate.bind(adapters)));
  app.delete("/api/church/messages/templates/:id", controllerHandler(adapters.deleteTemplate.bind(adapters)));

  app.get("/api/church/messages/rules", controllerHandler(adapters.listRules.bind(adapters)));
  app.post("/api/church/messages/rules", controllerHandler(adapters.createRule.bind(adapters)));
  app.patch("/api/church/messages/rules/:id", controllerHandler(adapters.updateRule.bind(adapters)));
  app.delete("/api/church/messages/rules/:id", controllerHandler(adapters.deleteRule.bind(adapters)));

  app.get("/api/church/messages/logs", controllerHandler(adapters.listLogs.bind(adapters)));
  app.post("/api/church/messages/send", controllerHandler(adapters.sendNow.bind(adapters)));
}
