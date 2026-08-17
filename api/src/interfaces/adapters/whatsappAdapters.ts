import { FastifyRequest } from "fastify";
import { $prismaClient } from "../../../config/database";
import { DomainError } from "../../domain/value-objects/utils/DomainError";
import { resolveActiveChurchContext, RoleContext } from "../utils/churchContext";
import { isPrivilegedRole } from "../../application/Services/Auth/AuthorizationService";
import { WhatsAppServiceClient } from "../../infrastructure/whatsapp/WhatsAppServiceClient";

type CurrentUser = {
  id: string;
  crunchId: string;
  role: string;
  roles: RoleContext[];
};

function getAuthUserId(request: FastifyRequest) {
  const authHeader = request.headers.authorization;
  const token = authHeader?.replace("Bearer ", "");
  if (!token) throw new DomainError("Token não fornecido");
  const [, payload] = token.split(".");
  if (!payload) throw new DomainError("Token inválido");
  const decoded = JSON.parse(Buffer.from(payload, "base64url").toString());
  if (!decoded?.sub) throw new DomainError("Token sem usuário");
  return decoded.sub as string;
}

export class WhatsAppAdapters {
  private async getCurrentUser(request: FastifyRequest): Promise<CurrentUser> {
    const userId = getAuthUserId(request);
    const context = request.churchContext ?? (await resolveActiveChurchContext(request, userId));
    if (!context.activeChurchId) throw new DomainError("Usuário não possui igreja vinculada");

    return {
      id: userId,
      crunchId: context.activeChurchId,
      role: context.role,
      roles: context.roles,
    };
  }

  // Conectar/desconectar o WhatsApp da igreja e sensivel - quem controla essa
  // sessao consegue mandar mensagem em nome da igreja pra qualquer contato.
  // Restrito aos papeis privilegiados, igual outras acoes de risco do Admin.
  private assertCanManageWhatsApp(user: CurrentUser) {
    if (isPrivilegedRole(user)) return;
    throw new DomainError("Apenas pastores ou administradores podem gerenciar a conexão do WhatsApp");
  }

  async status(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    const connected = await WhatsAppServiceClient.isConnected(user.crunchId);
    return { connected };
  }

  async connect(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    this.assertCanManageWhatsApp(user);

    const church = await $prismaClient.crunch.findUnique({
      where: { id: user.crunchId },
      select: { name: true },
    });
    if (!church) throw new DomainError("Igreja não encontrada");

    return await WhatsAppServiceClient.connect(user.crunchId, church.name);
  }

  async disconnect(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    this.assertCanManageWhatsApp(user);

    await WhatsAppServiceClient.disconnect(user.crunchId);
    return { success: true };
  }
}
