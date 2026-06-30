import { FastifyInstance } from "fastify";
import { controllerHandler } from "../controllers/Handler";
import { ReportAdapters } from "../adapters/reportAdapters";

export async function ReportRoutes(app: FastifyInstance) {
  const adapters = new ReportAdapters();

  app.get(
    "/api/church/reports/confirmations",
    controllerHandler(adapters.getConfirmationReport.bind(adapters)),
  );

  app.get(
    "/api/church/reports/attendance",
    controllerHandler(adapters.getAttendanceReport.bind(adapters)),
  );

  app.get(
    "/api/church/reports/members",
    controllerHandler(adapters.getMembersReport.bind(adapters)),
  );
}
