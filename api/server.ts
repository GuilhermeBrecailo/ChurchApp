import { fastify } from "fastify";
import cors from "@fastify/cors";
import AppInit from "./src/interfaces/plugins/AppInit";
import { UserRoutes } from "./src/interfaces/routes/UserRoutes.js";

const server = fastify({
  trustProxy: true,
});

await server.register(cors, {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
});

await server.register(AppInit); // 👈 ESSENCIAL (decorate acontece aqui)

server.get("/status", async () => {
  return { success: true };
});

await server.register(UserRoutes, { prefix: "/" });

await server.listen({ port: 3000, host: "0.0.0.0" });

console.log("🚀 Server running on http://localhost:3000");
