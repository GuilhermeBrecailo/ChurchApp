import fp from "fastify-plugin";
import { FastifyPluginAsync, FastifyRequest, FastifyReply } from "fastify";
import { JwtValidationUseCase } from "../../application/use-cases/Auth/JwtValidationUseCase";
import { resolveActiveChurchContext } from "../utils/churchContext";
import { $prismaClient } from "../../../config/database";

const jwtValidationService = new JwtValidationUseCase();

const publicRoutes = new Set([
  "/status",
  "/api/pastor/signup",
  "/public/auth/login",
  "/public/auth/refresh-token",
  "/public/auth/logout",
]);

function getRoutePath(request: FastifyRequest) {
  return (request.raw.url || request.routeOptions?.url || "").split("?")[0];
}

function isPublicRequest(request: FastifyRequest) {
  const path = getRoutePath(request);

  return (
    request.method === "OPTIONS" ||
    !path ||
    path.startsWith("/public") ||
    path.startsWith("/uploads/") ||
    publicRoutes.has(path)
  );
}

async function isProtectedKidsUpload(request: FastifyRequest) {
  let requestPath = getRoutePath(request);
  try {
    requestPath = decodeURIComponent(requestPath);
  } catch {
    // O static plugin recusará caminhos inválidos; caminhos que não podemos
    // interpretar não devem ser tratados como upload público conhecido.
    return false;
  }

  const segments = requestPath.split("/").filter(Boolean);
  if (
    segments.length < 6 ||
    segments[0] !== "uploads" ||
    segments[1] !== "church" ||
    segments[3] !== "departments" ||
    segments.slice(5).some((segment) => segment === "." || segment === "..")
  ) {
    return false;
  }

  try {
    const department = await $prismaClient.department.findFirst({
      where: { id: segments[4], crunchId: segments[2] },
      select: { type: true },
    });
    // Arquivos de diretórios sem ministério correspondente também ficam
    // fechados: não há base segura para classificá-los como públicos.
    return !department || department.type === "KIDS";
  } catch {
    // Falha de banco nunca transforma arquivo potencialmente protegido em
    // arquivo público.
    return true;
  }
}

const TenantHandler: FastifyPluginAsync = async (fastify) => {
  fastify.addHook(
    "preHandler",
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (await isProtectedKidsUpload(request)) {
        return reply.code(404).send({ error: "Arquivo não encontrado", status: 404 });
      }

      if (isPublicRequest(request)) {
        return;
      }

      const authHeader = request.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        return reply
          .code(401)
          .send({ error: "Token não fornecido", status: 401 });
      }

      const token = authHeader.replace("Bearer ", "");

      try {
        const payload = await jwtValidationService.execute(token);
        const churchContext = await resolveActiveChurchContext(request, payload.sub);

        request.user = payload;
        request.churchContext = churchContext;

        if (churchContext.activeChurchId) {
          request.user.tenant_id = churchContext.activeChurchId;
          request.user.role = churchContext.role;
        }
      } catch (error) {
        const message =
          error instanceof Error && error.message
            ? error.message
            : "Token inválido";

        return reply.code(403).send({ error: message, status: 403 });
      }
    },
  );
};

export default fp(TenantHandler);
