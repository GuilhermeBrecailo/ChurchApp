import { UpdateUserService } from "../../application/Services/User/UpdateUserService";
import { CreateUserUseCase } from "../../application/use-cases/User/CreateUserUseCase";
import { DeleteUserUseCase } from "../../application/use-cases/User/DeleteUserUseCase";
import { GetAllUserUseCase } from "../../application/use-cases/User/GetAllUserUseCase";
import { GetUserByIdUseCase } from "../../application/use-cases/User/GetUserByIdUseCase";
import { UpdateUserUseCase } from "../../application/use-cases/User/UpdateUserUseCase";
import { UserRepository } from "../../infrastructure/repositories/UserRepository";
import { FastifyRequest } from "fastify/types/request";
import crypto from "node:crypto";
import { User, UserDTO } from "../../domain/entities/User";
import { JwtDecoded } from "../../application/use-cases/Auth/JwtValidationUseCase";
import { KeycloakProvider } from "../../infrastructure/identity/KeycloakProvider";
import { $prismaClient } from "../../../config/database";
import { DomainError } from "../../domain/value-objects/utils/DomainError";

const userRepository = new UserRepository();
const createUserUseCase = new CreateUserUseCase(userRepository);
const deleteUserUseCase = new DeleteUserUseCase(userRepository);
const getUserByIdUseCase = new GetUserByIdUseCase(userRepository);
const getAllUserUseCase = new GetAllUserUseCase(userRepository);
const updateUserUseCase = new UpdateUserUseCase(userRepository);

const updateUserService = new UpdateUserService(
  getUserByIdUseCase,
  updateUserUseCase,
);

function getAuthUserId(request: FastifyRequest) {
  const authHeader = request.headers.authorization;
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    throw new DomainError("Token não fornecido");
  }

  const [, payload] = token.split(".");

  if (!payload) {
    throw new DomainError("Token inválido");
  }

  const decoded = JSON.parse(Buffer.from(payload, "base64url").toString());

  if (!decoded?.sub) {
    throw new DomainError("Token sem usuário");
  }

  return decoded.sub as string;
}

export class UserAdapters {
  async createPastor(request: FastifyRequest) {
    // Pegamos tudo do body.
    // Como é o Pastor, a role a gente fixa como 'ADMIN' ou 'PASTOR' por segurança.
    const { email, name, phone, password, role } = request.body as any;
    const normalizedRole = role === "MEMBER" ? "MEMBER" : "PASTOR";

    const identityProvider = new KeycloakProvider();

    // 1. Criar no Keycloak (Gera o ID oficial)
    const keycloakId = await identityProvider.createUser(email, name, password);

    // 2. Criar a Entidade de Domínio
    const userEntity = User.create({
      id: keycloakId,
      name,
      email,
      phone,
      role: normalizedRole,
    });

    // 3. Salva no seu banco (Prisma/UserRepository)
    return await createUserUseCase.execute(userEntity);
  }

  async getMe(request: FastifyRequest) {
    const userId = getAuthUserId(request);

    const user = await $prismaClient.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        crunch: true,
      },
    });

    if (!user) {
      throw new DomainError("Usuário não encontrado");
    }

    const church = user.crunch
      ? {
          id: user.crunch.id,
          name: user.crunch.name,
          userMainId: user.crunch.userMainId,
        }
      : null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      crunchId: user.crunchId,
      canManageMembers: user.canManageMembers,
      church,
      hasChurch: Boolean(user.crunchId),
      isTitularPastor: user.role === "PASTOR" && church?.userMainId === user.id,
    };
  }

  async createOwnChurch(request: FastifyRequest) {
    const userId = getAuthUserId(request);
    const body = request.body as {
      name?: string;
      city?: string;
      road?: string;
      number?: string;
      localZipCode?: string;
      state?: string;
      complement?: string;
      document?: string;
      logo?: string;
    };

    if (!body.name?.trim()) {
      throw new DomainError("Nome da igreja é obrigatório");
    }

    const user = await $prismaClient.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new DomainError("Usuário não encontrado");
    }

    if (user.role !== "PASTOR") {
      throw new DomainError("Apenas pastor pode criar uma igreja");
    }

    if (user.crunchId) {
      throw new DomainError("Usuário já possui igreja vinculada");
    }

    const church = await $prismaClient.$transaction(async (tx) => {
      const createdChurch = await tx.crunch.create({
        data: {
          name: body.name!.trim(),
          userMainId: user.id,
          logo: body.logo ?? "",
          city: body.city ?? "",
          road: body.road ?? "",
          localZipCode: body.localZipCode ?? "",
          state: body.state ?? "",
          number: body.number ?? "",
          complement: body.complement ?? "",
          document: body.document ?? "",
          isActive: true,
        },
      });

      await tx.user.update({
        where: {
          id: user.id,
        },
        data: {
          crunchId: createdChurch.id,
        },
      });

      return createdChurch;
    });

    return {
      id: church.id,
      name: church.name,
      userMainId: church.userMainId,
    };
  }

  private async getChurchMemberManager(userId: string) {
    const user = await $prismaClient.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        crunch: true,
      },
    });

    if (!user) {
      throw new DomainError("Usuário não encontrado");
    }

    if (!user.crunchId || !user.crunch) {
      throw new DomainError("Usuário não possui igreja vinculada");
    }

    const isTitularPastor =
      user.role === "PASTOR" && user.crunch.userMainId === user.id;

    if (!isTitularPastor && !user.canManageMembers) {
      throw new DomainError("Usuário não possui permissão para gerenciar membros");
    }

    return user;
  }

  private async getTitularPastor(userId: string) {
    const user = await this.getChurchMemberManager(userId);
    const isTitularPastor =
      user.role === "PASTOR" && user.crunch?.userMainId === user.id;

    if (!isTitularPastor) {
      throw new DomainError("Apenas o pastor titular pode alterar permissões");
    }

    return user;
  }

  async getChurchMembers(request: FastifyRequest) {
    const userId = getAuthUserId(request);
    const manager = await this.getChurchMemberManager(userId);

    const members = await $prismaClient.user.findMany({
      where: {
        crunchId: manager.crunchId,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        canManageMembers: true,
        createdAt: true,
      },
    });

    return members;
  }

  async createChurchMember(request: FastifyRequest) {
    const userId = getAuthUserId(request);
    const manager = await this.getChurchMemberManager(userId);
    const body = request.body as {
      name?: string;
      email?: string;
      phone?: string;
      password?: string;
    };

    if (!body.name?.trim()) {
      throw new DomainError("Nome do membro é obrigatório");
    }

    if (!body.email?.trim()) {
      throw new DomainError("Email do membro é obrigatório");
    }

    if (!body.phone?.trim()) {
      throw new DomainError("Telefone do membro é obrigatório");
    }

    if (!body.password || body.password.length < 6) {
      throw new DomainError("Senha temporária deve ter pelo menos 6 caracteres");
    }

    const normalizedEmail = body.email.trim().toLowerCase();
    const existingUser = await $prismaClient.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

    if (existingUser) {
      throw new DomainError("Já existe um usuário com esse email");
    }

    const identityProvider = new KeycloakProvider();
    const keycloakId = await identityProvider.createUser(
      normalizedEmail,
      body.name.trim(),
      body.password,
    );

    try {
      const createdUser = await $prismaClient.user.create({
        data: {
          id: keycloakId,
          name: body.name.trim(),
          email: normalizedEmail,
          phone: body.phone.trim(),
          role: "MEMBER",
          canManageMembers: false,
          crunchId: manager.crunchId,
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          canManageMembers: true,
          createdAt: true,
        },
      });

      return createdUser;
    } catch (error) {
      await identityProvider.deleteUser(keycloakId).catch(() => undefined);
      throw error;
    }
  }

  async updateChurchMemberPermissions(request: FastifyRequest) {
    const userId = getAuthUserId(request);
    const pastor = await this.getTitularPastor(userId);
    const { id } = request.params as { id?: string };
    const body = request.body as {
      canManageMembers?: boolean;
    };

    if (!id) {
      throw new DomainError("Membro não informado");
    }

    if (typeof body.canManageMembers !== "boolean") {
      throw new DomainError("Permissão inválida");
    }

    const member = await $prismaClient.user.findUnique({
      where: {
        id,
      },
      include: {
        crunch: true,
      },
    });

    if (!member || member.crunchId !== pastor.crunchId) {
      throw new DomainError("Membro não encontrado nesta igreja");
    }

    if (member.crunch?.userMainId === member.id) {
      throw new DomainError("Não é possível alterar as permissões do pastor titular");
    }

    const updatedMember = await $prismaClient.user.update({
      where: {
        id: member.id,
      },
      data: {
        canManageMembers: body.canManageMembers,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        canManageMembers: true,
        createdAt: true,
      },
    });

    return updatedMember;
  }

  async createUser(request: FastifyRequest): Promise<{ id: string }> {
    const bodyData = request.body as Omit<UserDTO, "id" | "created_at"> & {
      password?: string;
    };

    const identityProvider = new KeycloakProvider();
    const userId = bodyData.password
      ? await identityProvider.createUser(
          bodyData.email,
          bodyData.name,
          bodyData.password,
        )
      : crypto.randomUUID();

    const props = {
      ...bodyData,
      id: userId,
    };

    const userEntity = User.create(props);

    return await createUserUseCase.execute(userEntity);
  }

  async deleteUser(request: FastifyRequest): Promise<void> {
    const { id } = request.body as { id: string };

    if (!id) {
      throw new Error("O ID do usuário não foi enviado no corpo da requisição");
    }

    await deleteUserUseCase.execute(id);
  }

  async getAllUsers(): Promise<User[]> {
    const users = await getAllUserUseCase.execute();

    if (!users) {
      throw new Error("Nenhum usuário encontrado");
    }

    return users;
  }

  async getUserById(request: FastifyRequest): Promise<User> {
    const { id } = request.body as { id: string };

    if (!id) {
      throw new Error("O ID do usuário não foi enviado no corpo da requisição");
    }

    const user = await getUserByIdUseCase.execute(id);

    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    return user;
  }

  async updateUser(request: FastifyRequest): Promise<void> {
    const props = request.body as UserDTO;

    if (!props.id) {
      throw new Error("O ID do usuário é obrigatório para atualização.");
    }

    await updateUserService.handle(props);
  }
}
