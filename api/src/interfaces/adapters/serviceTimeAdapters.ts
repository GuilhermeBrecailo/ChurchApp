import { FastifyRequest } from "fastify";
import { z } from "zod";
import { CreateServiceTimeUseCase } from "../../application/use-cases/ServiceTime/CreateServiceTimeUseCase";
import { ListServiceTimesByChurchUseCase } from "../../application/use-cases/ServiceTime/ListServiceTimesByChurchUseCase";
import { UpdateServiceTimeUseCase } from "../../application/use-cases/ServiceTime/UpdateServiceTimeUseCase";
import { DeleteServiceTimeUseCase } from "../../application/use-cases/ServiceTime/DeleteServiceTimeUseCase";
import { ServiceTimeRepository } from "../../infrastructure/repositories/ServiceTimeRepository";
import { DomainError } from "../../domain/value-objects/utils/DomainError";
import { resolveActiveChurchContext, RoleContext } from "../utils/churchContext";
import { hasPermission } from "../../application/Services/Auth/AuthorizationService";

const serviceTimeRepository = new ServiceTimeRepository();
const createServiceTimeUseCase = new CreateServiceTimeUseCase(serviceTimeRepository);
const listServiceTimesUseCase = new ListServiceTimesByChurchUseCase(serviceTimeRepository);
const updateServiceTimeUseCase = new UpdateServiceTimeUseCase(serviceTimeRepository);
const deleteServiceTimeUseCase = new DeleteServiceTimeUseCase(serviceTimeRepository);

const createServiceTimeSchema = z.object({
  label: z.string().trim().min(1, "Rotulo do culto e obrigatorio"),
  weekday: z.number().int().min(0, "Dia da semana invalido").max(6, "Dia da semana invalido"),
  time: z.string().trim().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Horario invalido"),
  isActive: z.boolean().optional(),
});

const updateServiceTimeSchema = createServiceTimeSchema.partial().extend({
  id: z.string().uuid("Horario de culto invalido"),
});

type CurrentUser = {
  id: string;
  crunchId: string;
  role: string;
  roles: RoleContext[];
};

function getAuthUserId(request: FastifyRequest) {
  const authHeader = request.headers.authorization;
  const token = authHeader?.replace("Bearer ", "");
  if (!token) throw new DomainError("Token nao fornecido");
  const [, payload] = token.split(".");
  if (!payload) throw new DomainError("Token invalido");
  const decoded = JSON.parse(Buffer.from(payload, "base64url").toString());
  if (!decoded?.sub) throw new DomainError("Token sem usuario");
  return decoded.sub as string;
}

export class ServiceTimeAdapters {
  private async getCurrentUser(request: FastifyRequest): Promise<CurrentUser> {
    const userId = getAuthUserId(request);
    const context = request.churchContext ?? (await resolveActiveChurchContext(request, userId));
    if (!context.activeChurchId) throw new DomainError("Usuario nao possui igreja vinculada");

    return {
      id: userId,
      crunchId: context.activeChurchId,
      role: context.role,
      roles: context.roles,
    };
  }

  private assertCanManageServiceTimes(user: CurrentUser) {
    if (hasPermission(user, "ANNOUNCEMENT_PUBLISH")) return;
    throw new DomainError("Apenas pastores ou usuarios com permissao de comunicacao podem gerenciar horarios de culto");
  }

  async list(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    return await listServiceTimesUseCase.execute(user.crunchId);
  }

  async create(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    this.assertCanManageServiceTimes(user);
    const body = createServiceTimeSchema.parse(request.body);

    return await createServiceTimeUseCase.execute({
      ...body,
      crunchId: user.crunchId,
    });
  }

  async update(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    this.assertCanManageServiceTimes(user);
    const body = updateServiceTimeSchema.parse({
      ...(request.body as object),
      id: (request.params as { id?: string }).id,
    });

    return await updateServiceTimeUseCase.execute({
      ...body,
      crunchId: user.crunchId,
    });
  }

  async remove(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    this.assertCanManageServiceTimes(user);
    const { id } = request.params as { id?: string };
    if (!id) throw new DomainError("Horario nao informado");

    return await deleteServiceTimeUseCase.execute({ id, crunchId: user.crunchId });
  }
}