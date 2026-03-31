import { fastify } from "fastify";
import cors from "@fastify/cors";
import { UserRoutes } from "./src/interfaces/routes/UserRoutes.ts";
import { CrunchRoutes } from "./src/interfaces/routes/CrunchRoutes.ts";

const server = fastify({
  trustProxy: true,
});

await server.register(cors, {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
});

server.get("/status", async () => {
  return { success: true };
});

await server.register(UserRoutes, { prefix: "/" });
await server.register(CrunchRoutes, { prefix: "/" });

await server.listen({ port: 3000, host: "0.0.0.0" });

console.log("🚀 Server running on http://localhost:3000");
