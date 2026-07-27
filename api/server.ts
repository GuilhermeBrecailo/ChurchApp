import { fastify } from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import path from "node:path";
import { mkdir } from "node:fs/promises";
import { AuthRoutes } from "./src/interfaces/routes/AuthRoutes.ts";
import { UserRoutes } from "./src/interfaces/routes/UserRoutes.ts";
import { ChurchDepartmentRoutes } from "./src/interfaces/routes/ChurchDepartmentRoutes.ts";
import { AdminRoutes } from "./src/interfaces/routes/AdminRoutes.ts";
import { NotificationRoutes } from "./src/interfaces/routes/NotificationRoutes.ts";
import { ChurchRoleRoutes } from "./src/interfaces/routes/ChurchRoleRoutes.ts";
import { DailyVerseRoutes } from "./src/interfaces/routes/DailyVerseRoutes.ts";
import { AnnouncementRoutes } from "./src/interfaces/routes/AnnouncementRoutes.ts";
import { ReportRoutes } from "./src/interfaces/routes/ReportRoutes.ts";
import { DevotionalRoutes } from "./src/interfaces/routes/DevotionalRoutes.ts";
import { PrayerRoutes } from "./src/interfaces/routes/PrayerRoutes.ts";
import { ChurchInviteRoutes } from "./src/interfaces/routes/ChurchInviteRoutes.ts";
import { PublicChurchRoutes } from "./src/interfaces/routes/PublicChurchRoutes.ts";
import { ServiceTimeRoutes } from "./src/interfaces/routes/ServiceTimeRoutes.ts";
import TenantHandler from "./src/interfaces/plugins/TenantHandler.ts";

const port = Number(process.env.API_PORT || 8000);

const server = fastify({
  trustProxy: true,
});
const uploadsRoot = path.join(process.cwd(), "uploads");

await mkdir(uploadsRoot, { recursive: true });

await server.register(cors, {
  origin: true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
});

await server.register(multipart, {
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 1,
  },
});

await server.register(fastifyStatic, {
  root: uploadsRoot,
  prefix: "/uploads/",
});

server.get("/status", async () => {
  return { success: true };
});

await server.register(TenantHandler);
await server.register(AuthRoutes, { prefix: "/" });
await server.register(UserRoutes, { prefix: "/" });
await server.register(ChurchDepartmentRoutes, { prefix: "/" });
await server.register(AdminRoutes, { prefix: "/" });
await server.register(NotificationRoutes, { prefix: "/" });
await server.register(ChurchRoleRoutes, { prefix: "/" });
await server.register(DailyVerseRoutes, { prefix: "/" });
await server.register(AnnouncementRoutes, { prefix: "/" });
await server.register(ReportRoutes, { prefix: "/" });
await server.register(DevotionalRoutes, { prefix: "/" });
await server.register(PrayerRoutes, { prefix: "/" });
await server.register(ChurchInviteRoutes, { prefix: "/" });
await server.register(PublicChurchRoutes, { prefix: "/" });
await server.register(ServiceTimeRoutes, { prefix: "/" });

await server.listen({ port, host: "0.0.0.0" });

console.log(`Server running on http://localhost:${port}`);
