import { fastify } from "fastify";
import cors from "@fastify/cors";
import { AuthRoutes } from "./src/interfaces/routes/AuthRoutes.ts";
import { UserRoutes } from "./src/interfaces/routes/UserRoutes.ts";
import { ChurchDepartmentRoutes } from "./src/interfaces/routes/ChurchDepartmentRoutes.ts";
import TenantHandler from "./src/interfaces/plugins/TenantHandler.ts";

const port = Number(process.env.API_PORT || 8000);

const server = fastify({
  trustProxy: true,
});

await server.register(cors, {
  origin: true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
});

server.get("/status", async () => {
  return { success: true };
});

await server.register(TenantHandler);
await server.register(AuthRoutes, { prefix: "/" });
await server.register(UserRoutes, { prefix: "/" });
await server.register(ChurchDepartmentRoutes, { prefix: "/" });

await server.listen({ port, host: "0.0.0.0" });

console.log(`Server running on http://localhost:${port}`);
