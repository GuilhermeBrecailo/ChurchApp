import { FastifyInstance } from "fastify";
import { controllerHandler } from "../controllers/Handler";
import { BirthdayAdapters } from "../adapters/birthdayAdapters";

export async function BirthdayRoutes(app: FastifyInstance) {
  const adapters = new BirthdayAdapters();

  app.get("/api/church/birthdays", controllerHandler(adapters.listBirthdays.bind(adapters)));
  app.get("/api/church/birthdays/setting", controllerHandler(adapters.getSetting.bind(adapters)));
  app.patch("/api/church/birthdays/setting", controllerHandler(adapters.updateSetting.bind(adapters)));
  app.post("/api/church/birthdays/send", controllerHandler(adapters.sendNow.bind(adapters)));
}
