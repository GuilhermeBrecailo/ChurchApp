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
    const { email, name, phone, password } = request.body as {
      email?: string;
      name?: string;
      phone?: string;
      password?: string;
    };

    if (!name?.trim()) {
      throw new DomainError("Nome é obrigatório");
    }

    if (!email?.trim()) {
      throw new DomainError("Email é obrigatório");
    }

    if (!phone?.trim()) {
      throw new DomainError("Telefone é obrigatório");
    }

    if (!password || password.length < 6) {
      throw new DomainError("Senha deve ter pelo menos 6 caracteres");
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = name.trim();
    const normalizedPhone = phone.trim();

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
      normalizedName,
      password,
    );

    try {
      const userEntity = User.create({
        id: keycloakId,
        name: normalizedName,
        email: normalizedEmail,
        phone: normalizedPhone,
        role: "PASTOR",
      });

      return await createUserUseCase.execute(userEntity);
    } catch (error) {
      await identityProvider.deleteUser(keycloakId).catch(() => undefined);
      throw error;
    }
  }

  async getMe(request: FastifyRequest) {
    const userId = getAuthUserId(request);

    const user = await $prismaClient.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        crunch: true,
        churchRole: { select: { id: true, name: true, permissions: true } },
      },
    });

    if (!user) {
      throw new DomainError("Usuário não encontrado");
    }

    const church = user.crunch
      ? {
          id: user.crunch.id,
          name: user.crunch.name,
          city: user.crunch.city,
          road: user.crunch.road,
          number: user.crunch.number,
          localZipCode: user.crunch.localZipCode,
          state: user.crunch.state,
          complement: user.crunch.complement,
          document: user.crunch.document,
          logo: user.crunch.logo,
          isActive: user.crunch.isActive,
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
      mustChangePassword: user.mustChangePassword,
      church,
      hasChurch: Boolean(user.crunchId),
      isTitularPastor: user.role === "PASTOR" && church?.userMainId === user.id,
      churchRole: user.churchRole
        ? {
            id: user.churchRole.id,
            name: user.churchRole.name,
            permissions: user.churchRole.permissions,
          }
        : null,
      permissions: user.churchRole?.permissions ?? [],
      isDemoUser: user.isDemoUser,
    };
  }

  async getMyProfile(request: FastifyRequest) {
    const userId = getAuthUserId(request);

    const user = await $prismaClient.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        departmentMemberships: {
          where: {
            isPrimary: true,
          },
          include: {
            department: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
          take: 1,
        },
        unavailableDates: {
          orderBy: {
            date: "asc",
          },
        },
      },
    });

    if (!user) {
      throw new DomainError("Usuário não encontrado");
    }

    const primaryMembership = user.departmentMemberships[0] || null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      profileSuggestion: user.profileSuggestion,
      mustChangePassword: user.mustChangePassword,
      primaryDepartmentId: primaryMembership?.departmentId || null,
      ministryFunction: primaryMembership?.function || "",
      primaryDepartment: primaryMembership?.department || null,
      unavailableDates: user.unavailableDates.map((item) =>
        item.date.toISOString().slice(0, 10),
      ),
    };
  }

  async updateMyProfile(request: FastifyRequest) {
    const userId = getAuthUserId(request);
    const body = request.body as {
      phone?: string;
      profileSuggestion?: string;
      primaryDepartmentId?: string | null;
      ministryFunction?: string;
      unavailableDates?: string[];
    };

    const user = await $prismaClient.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new DomainError("Usuário não encontrado");
    }

    if (!user.crunchId) {
      throw new DomainError("Usuário não possui igreja vinculada");
    }

    if (body.primaryDepartmentId) {
      const department = await $prismaClient.department.findFirst({
        where: {
          id: body.primaryDepartmentId,
          crunchId: user.crunchId,
        },
      });

      if (!department) {
        throw new DomainError("Ministério não encontrado nesta igreja");
      }
    }

    const unavailableDates = Array.isArray(body.unavailableDates)
      ? [...new Set(body.unavailableDates)]
      : [];

    const normalizedUnavailableDates = unavailableDates.map((date) => {
      const parsedDate = new Date(`${date}T00:00:00.000`);

      if (Number.isNaN(parsedDate.getTime())) {
        throw new DomainError("Data de indisponibilidade inválida");
      }

      return parsedDate;
    });

    await $prismaClient.$transaction(async (tx) => {
      await tx.user.update({
        where: {
          id: user.id,
        },
        data: {
          phone: body.phone?.trim() || null,
          profileSuggestion: body.profileSuggestion?.trim() || null,
        },
      });

      await tx.userDepartmentMembership.deleteMany({
        where: {
          userId: user.id,
          isPrimary: true,
        },
      });

      if (body.primaryDepartmentId) {
        await tx.userDepartmentMembership.create({
          data: {
            id: crypto.randomUUID(),
            userId: user.id,
            departmentId: body.primaryDepartmentId,
            function: body.ministryFunction?.trim() || null,
            isPrimary: true,
          },
        });
      }

      await tx.userUnavailableDate.deleteMany({
        where: {
          userId: user.id,
        },
      });

      if (normalizedUnavailableDates.length > 0) {
        await tx.userUnavailableDate.createMany({
          data: normalizedUnavailableDates.map((date) => ({
            id: crypto.randomUUID(),
            userId: user.id,
            date,
          })),
        });
      }
    });

    return await this.getMyProfile(request);
  }

  async updateMyPassword(request: FastifyRequest) {
    const userId = getAuthUserId(request);
    const body = request.body as {
      password?: string;
      passwordConfirmation?: string;
    };

    if (!body.password || body.password.length < 6) {
      throw new DomainError("A nova senha deve ter pelo menos 6 caracteres");
    }

    if (
      body.passwordConfirmation !== undefined &&
      body.passwordConfirmation !== body.password
    ) {
      throw new DomainError("A confirmação da senha não confere");
    }

    const user = await $prismaClient.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        isDemoUser: true,
      },
    });

    if (!user) {
      throw new DomainError("Usuário não encontrado");
    }

    if (user.isDemoUser) {
      throw new DomainError("Não é possível alterar a senha do usuário demo");
    }

    const identityProvider = new KeycloakProvider();
    await identityProvider.updatePassword(user.id, body.password);

    await $prismaClient.user.update({
      where: {
        id: user.id,
      },
      data: {
        mustChangePassword: false,
      },
    });

    return { success: true };
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

  async updateOwnChurch(request: FastifyRequest) {
    const userId = getAuthUserId(request);
    const body = request.body as {
      name?: string;
      city?: string;
      road?: string;
      number?: string | null;
      localZipCode?: string;
      state?: string;
      complement?: string | null;
      document?: string | null;
      logo?: string | null;
      isActive?: boolean;
    };

    const user = await $prismaClient.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        crunch: true,
      },
    });

    if (!user || !user.crunchId || !user.crunch) {
      throw new DomainError("Usuario nao possui igreja vinculada");
    }

    const canEditChurch =
      user.role === "PASTOR" ||
      user.role === "ADMIN" ||
      user.role === "SUPER_ADMIN";

    if (!canEditChurch) {
      throw new DomainError("Apenas pastores ou admins podem editar a igreja");
    }

    if (body.name !== undefined && !body.name.trim()) {
      throw new DomainError("Nome da igreja e obrigatorio");
    }

    const updatedChurch = await $prismaClient.crunch.update({
      where: {
        id: user.crunchId,
      },
      data: {
        ...(body.name !== undefined ? { name: body.name.trim() } : {}),
        ...(body.city !== undefined ? { city: body.city.trim() } : {}),
        ...(body.road !== undefined ? { road: body.road.trim() } : {}),
        ...(body.number !== undefined ? { number: body.number?.trim() || null } : {}),
        ...(body.localZipCode !== undefined
          ? { localZipCode: body.localZipCode.trim() }
          : {}),
        ...(body.state !== undefined ? { state: body.state.trim() } : {}),
        ...(body.complement !== undefined
          ? { complement: body.complement?.trim() || null }
          : {}),
        ...(body.document !== undefined
          ? { document: body.document?.trim() || null }
          : {}),
        ...(body.logo !== undefined ? { logo: body.logo?.trim() || null } : {}),
        ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
      },
      select: {
        id: true,
        name: true,
        city: true,
        road: true,
        number: true,
        localZipCode: true,
        state: true,
        complement: true,
        document: true,
        logo: true,
        isActive: true,
        userMainId: true,
      },
    });

    return updatedChurch;
  }

  private async getChurchMemberManager(userId: string) {
    const user = await $prismaClient.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        crunch: true,
        churchRole: true,
      },
    });

    if (!user) {
      throw new DomainError("Usuário não encontrado");
    }

    if (!user.crunchId || !user.crunch) {
      throw new DomainError("Usuário não possui igreja vinculada");
    }

    const isPlatformAdmin =
      user.role === "ADMIN" || user.role === "SUPER_ADMIN";
    if (
      !isPlatformAdmin &&
      user.role !== "PASTOR" &&
      !user.canManageMembers
    ) {
      throw new DomainError("Usuário não possui permissão para gerenciar membros");
    }

    return user;
  }

  private async getMemberPermissionManager(userId: string) {
    const user = await this.getChurchMemberManager(userId);
    const canEditPermissions =
      user.role === "PASTOR" ||
      user.role === "ADMIN" ||
      user.role === "SUPER_ADMIN";

    if (!canEditPermissions) {
      throw new DomainError("Apenas pastores ou admins podem alterar permissões");
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
        churchRoleId: true,
        churchRole: { select: { id: true, name: true, permissions: true } },
        unavailableDates: {
          select: {
            date: true,
          },
        },
      },
    });

    return members.map((member) => ({
      ...member,
      unavailableDates: member.unavailableDates.map((item) =>
        item.date.toISOString().slice(0, 10),
      ),
    }));
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
          mustChangePassword: true,
          crunchId: manager.crunchId,
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          canManageMembers: true,
          mustChangePassword: true,
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
    const manager = await this.getMemberPermissionManager(userId);
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

    if (!member || member.crunchId !== manager.crunchId) {
      throw new DomainError("Membro não encontrado nesta igreja");
    }

    if (member.crunch?.userMainId === member.id) {
      throw new DomainError("Não é possível alterar as permissões do pastor titular");
    }

    if (member.role === "SUPER_ADMIN" && manager.role !== "SUPER_ADMIN") {
      throw new DomainError("Nao e possivel alterar um usuario super admin");
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

  async updateChurchMember(request: FastifyRequest) {
    const userId = getAuthUserId(request);
    const manager = await this.getChurchMemberManager(userId);
    const { id } = request.params as { id?: string };
    const body = request.body as {
      name?: string;
      email?: string;
      phone?: string | null;
      role?: string;
    };

    if (!id) {
      throw new DomainError("Membro nao informado");
    }

    const member = await $prismaClient.user.findFirst({
      where: {
        id,
        crunchId: manager.crunchId,
      },
      include: {
        crunch: true,
      },
    });

    if (!member) {
      throw new DomainError("Membro nao encontrado nesta igreja");
    }

    if (member.crunch?.userMainId === member.id) {
      throw new DomainError("Nao e possivel editar o pastor titular por este fluxo");
    }

    if (member.role === "SUPER_ADMIN" && manager.role !== "SUPER_ADMIN") {
      throw new DomainError("Nao e possivel editar um usuario super admin");
    }

    if (body.name !== undefined && !body.name.trim()) {
      throw new DomainError("Nome do membro e obrigatorio");
    }

    if (body.email !== undefined && !body.email.trim()) {
      throw new DomainError("Email do membro e obrigatorio");
    }

    if (
      body.role !== undefined &&
      manager.role !== "PASTOR" &&
      manager.role !== "ADMIN" &&
      manager.role !== "SUPER_ADMIN"
    ) {
      throw new DomainError("Apenas pastores ou admins podem alterar cargos");
    }

    if (
      body.role !== undefined &&
      !["MEMBER", "PASTOR"].includes(body.role.trim() || "MEMBER")
    ) {
      throw new DomainError("Cargo invalido");
    }

    const normalizedEmail = body.email?.trim().toLowerCase();

    if (normalizedEmail && normalizedEmail !== member.email) {
      const existingUser = await $prismaClient.user.findUnique({
        where: {
          email: normalizedEmail,
        },
      });

      if (existingUser) {
        throw new DomainError("Ja existe um usuario com esse email");
      }
    }

    return await $prismaClient.user.update({
      where: {
        id: member.id,
      },
      data: {
        ...(body.name !== undefined ? { name: body.name.trim() } : {}),
        ...(normalizedEmail !== undefined ? { email: normalizedEmail } : {}),
        ...(body.phone !== undefined ? { phone: body.phone?.trim() || null } : {}),
        ...(body.role !== undefined ? { role: body.role.trim() || "MEMBER" } : {}),
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
  }

  async deleteChurchMember(request: FastifyRequest) {
    const userId = getAuthUserId(request);
    const manager = await this.getChurchMemberManager(userId);
    const { id } = request.params as { id?: string };

    if (!id) {
      throw new DomainError("Membro nao informado");
    }

    const member = await $prismaClient.user.findFirst({
      where: {
        id,
        crunchId: manager.crunchId,
      },
      include: {
        crunch: true,
      },
    });

    if (!member) {
      throw new DomainError("Membro nao encontrado nesta igreja");
    }

    if (member.crunch?.userMainId === member.id) {
      throw new DomainError("Nao e possivel remover o pastor titular");
    }

    if (member.role === "SUPER_ADMIN" && manager.role !== "SUPER_ADMIN") {
      throw new DomainError("Nao e possivel remover um usuario super admin");
    }

    await $prismaClient.user.delete({
      where: {
        id: member.id,
      },
    });

    await new KeycloakProvider().deleteUser(member.id).catch(() => undefined);

    return { success: true };
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
