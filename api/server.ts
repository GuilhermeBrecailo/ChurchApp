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

await server.listen({ port, host: "0.0.0.0" });

console.log(`Server running on http://localhost:${port}`);
