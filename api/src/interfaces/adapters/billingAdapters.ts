import { FastifyReply, FastifyRequest } from "fastify";
import { $prismaClient } from "../../../config/database";
import { DomainError } from "../../domain/value-objects/utils/DomainError";
import { resolveActiveChurchContext } from "../utils/churchContext";
import {
  InvalidMercadoPagoWebhookSignatureError,
  MercadoPagoSubscriptionService,
  MercadoPagoWebhookPayload,
} from "../../infrastructure/billing/MercadoPagoSubscriptionService";

function getAuthUserId(request: FastifyRequest): string {
  const authHeader = request.headers.authorization;
  const token = authHeader?.replace("Bearer ", "");
  if (!token) throw new DomainError("Token nao fornecido");
  const [, payload] = token.split(".");
  if (!payload) throw new DomainError("Token invalido");
  const decoded = JSON.parse(Buffer.from(payload, "base64url").toString());
  if (!decoded?.sub) throw new DomainError("Token sem usuario");
  return decoded.sub as string;
}

function getHeaderValue(request: FastifyRequest, name: string) {
  const value = request.headers[name.toLowerCase()];
  if (Array.isArray(value)) return value[0];
  return value;
}

function getQueryDataId(request: FastifyRequest) {
  const query = request.query as
    | Record<string, string | string[] | undefined>
    | undefined;
  const direct = query?.["data.id"];
  if (Array.isArray(direct)) return direct[0];
  if (direct) return direct;

  const nested = (query as { data?: { id?: string } } | undefined)?.data?.id;
  return nested;
}

export class BillingAdapters {
  constructor(
    private readonly mercadoPagoService = new MercadoPagoSubscriptionService(),
  ) {}

  async createSubscriptionCheckout(request: FastifyRequest) {
    const userId = getAuthUserId(request);
    const body = request.body as { backUrl?: string } | undefined;
    const user = await $prismaClient.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });

    if (!user) throw new DomainError("Usuario nao encontrado");

    const context =
      request.churchContext ?? (await resolveActiveChurchContext(request, user.id));

    if (!context.activeChurchId) {
      throw new DomainError("Usuario nao possui igreja vinculada");
    }

    if (!["PASTOR", "ADMIN", "SUPER_ADMIN"].includes(context.role)) {
      throw new DomainError("Acesso restrito a pastores ou admins");
    }

    const church = await $prismaClient.crunch.findUnique({
      where: { id: context.activeChurchId },
      select: {
        id: true,
        name: true,
        isActive: true,
        mpSubscriptionId: true,
      },
    });

    if (!church || !church.isActive) {
      throw new DomainError("Igreja ativa nao encontrada");
    }

    if (church.mpSubscriptionId) {
      throw new DomainError("Igreja ja possui assinatura vinculada");
    }

    try {
      return await this.mercadoPagoService.createCheckout({
        churchId: church.id,
        churchName: church.name,
        payerEmail: user.email,
        backUrl: body?.backUrl,
      });
    } catch (error) {
      if (error instanceof DomainError && /variavel de ambiente/i.test(error.message)) {
        console.error("Mercado Pago checkout misconfigured:", error.message);
        throw new DomainError(
          "Pagamento indisponível no momento. Fale com o suporte da igreja.",
        );
      }
      throw error;
    }
  }

  async handleMercadoPagoWebhook(request: FastifyRequest, reply: FastifyReply) {
    try {
      const result = await this.mercadoPagoService.processWebhook({
        payload: (request.body || {}) as MercadoPagoWebhookPayload,
        queryDataId: getQueryDataId(request),
        requestId: getHeaderValue(request, "x-request-id"),
        signatureHeader: getHeaderValue(request, "x-signature"),
      });

      return reply.code(200).send({ received: true, ...result });
    } catch (error) {
      if (error instanceof InvalidMercadoPagoWebhookSignatureError) {
        return reply.code(401).send({ error: error.message, status: 401 });
      }

      console.error(error);
      return reply.code(500).send({ error: "Erro ao processar webhook", status: 500 });
    }
  }
}
