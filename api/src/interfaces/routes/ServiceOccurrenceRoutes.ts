import { FastifyInstance } from "fastify";
import { controllerHandler } from "../controllers/Handler";
import { ServiceOccurrenceAdapters } from "../adapters/serviceOccurrenceAdapters";

export async function ServiceOccurrenceRoutes(app: FastifyInstance) {
  const adapters = new ServiceOccurrenceAdapters();

  app.get("/api/church/service-occurrences", controllerHandler(adapters.list.bind(adapters)));
  app.post(
    "/api/church/service-occurrences",
    controllerHandler(adapters.resolveOrCreate.bind(adapters)),
  );
  app.get(
    "/api/church/service-occurrences/:id",
    controllerHandler(adapters.getById.bind(adapters)),
  );
  app.patch(
    "/api/church/service-occurrences/:id",
    controllerHandler(adapters.update.bind(adapters)),
  );
  app.delete(
    "/api/church/service-occurrences/:id",
    controllerHandler(adapters.remove.bind(adapters)),
  );
  app.post(
    "/api/church/service-occurrences/:id/attendees",
    controllerHandler(adapters.addAttendee.bind(adapters)),
  );
  app.delete(
    "/api/church/service-occurrences/:id/attendees/:rosterMemberId",
    controllerHandler(adapters.removeAttendee.bind(adapters)),
  );
}
