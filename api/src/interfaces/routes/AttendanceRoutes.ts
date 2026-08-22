import { FastifyInstance } from "fastify";
import { controllerHandler } from "../controllers/Handler";
import { AttendanceAdapters } from "../adapters/attendanceAdapters";

export async function AttendanceRoutes(app: FastifyInstance) {
  const adapters = new AttendanceAdapters();

  app.get("/api/church/attendance", controllerHandler(adapters.list.bind(adapters)));
  app.post("/api/church/attendance", controllerHandler(adapters.upsert.bind(adapters)));
  app.post(
    "/api/church/attendance/:serviceTimeId/finalize",
    controllerHandler(adapters.finalize.bind(adapters)),
  );
}
