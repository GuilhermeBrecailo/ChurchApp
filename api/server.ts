process.env.TZ = process.env.TZ || "America/Sao_Paulo";

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
import { PostRoutes } from "./src/interfaces/routes/PostRoutes.ts";
import { HelpVideoRoutes } from "./src/interfaces/routes/HelpVideoRoutes.ts";
import { BillingRoutes } from "./src/interfaces/routes/BillingRoutes.ts";
import { BibleNoteRoutes } from "./src/interfaces/routes/BibleNoteRoutes.ts";
import { WhatsAppRoutes } from "./src/interfaces/routes/WhatsAppRoutes.ts";
import { RosterRoutes } from "./src/interfaces/routes/RosterRoutes.ts";
import { MessageRoutes } from "./src/interfaces/routes/MessageRoutes.ts";
import { BirthdayRoutes } from "./src/interfaces/routes/BirthdayRoutes.ts";
import { AttendanceRoutes } from "./src/interfaces/routes/AttendanceRoutes.ts";
import TenantHandler from "./src/interfaces/plugins/TenantHandler.ts";
import { startMessageRuleScheduler } from "./src/infrastructure/whatsapp/messageRuleScheduler.ts";
import { startBirthdayScheduler } from "./src/infrastructure/whatsapp/birthdayScheduler.ts";

const port = Number(process.env.API_PORT || 8000);

const server = fastify({
  trustProxy: true,
  logger: true,
});
const uploadsRoot = path.join(process.cwd(), "uploads");

await mkdir(uploadsRoot, { recursive: true });

await server.register(cors, {
  origin: true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  exposedHeaders: ["Content-Range", "Accept-Ranges", "Content-Length", "Content-Type"],
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
  acceptRanges: true,
  setHeaders(response) {
    response.setHeader("Accept-Ranges", "bytes");
  },
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
await server.register(PostRoutes, { prefix: "/" });
await server.register(HelpVideoRoutes, { prefix: "/" });
await server.register(BillingRoutes, { prefix: "/" });
await server.register(BibleNoteRoutes, { prefix: "/" });
await server.register(WhatsAppRoutes, { prefix: "/" });
await server.register(RosterRoutes, { prefix: "/" });
await server.register(MessageRoutes, { prefix: "/" });
await server.register(BirthdayRoutes, { prefix: "/" });
await server.register(AttendanceRoutes, { prefix: "/" });

await server.listen({ port, host: "0.0.0.0" });

startMessageRuleScheduler();
startBirthdayScheduler();

console.log(`Server running on http://localhost:${port}`);

