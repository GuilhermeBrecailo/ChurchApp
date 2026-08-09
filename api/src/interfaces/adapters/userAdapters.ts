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
import { resolveActiveChurchContext } from "../utils/churchContext";
import { assertChurchSlugAvailable, ensureUniqueChurchSlug } from "../utils/churchSlug";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { isValidFontKey } from "../../domain/appearance";
import { hasPermission } from "../../application/Services/Auth/AuthorizationService";
import { PermissionKey } from "../../domain/permissions";

const TRIAL_PERIOD_DAYS = 90;

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

const CHURCH_PHOTO_MAX_SIZE_BYTES = 5 * 1024 * 1024;
const CHURCH_PHOTO_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"];

function formatChurch(church: {
  id: string;
  name: string;
  slug: string;
  city: string;
  road: string;
  number: string | null;
  localZipCode: string;
  state: string;
  complement: string | null;
  document: string | null;
  logo: string | null;
  accentColor: string | null;
  textColor?: string | null;
  fontFamily?: string | null;
  isActive: boolean;
  userMainId: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  youtube?: string | null;
  website?: string | null;
}) {
  return {
    id: church.id,
    name: church.name,
    slug: church.slug,
    city: church.city,
    road: church.road,
    number: church.number,
    localZipCode: church.localZipCode,
    state: church.state,
    complement: church.complement,
    document: church.document,
    logo: church.logo,
    accentColor: church.accentColor,
    textColor: church.textColor ?? null,
    fontFamily: church.fontFamily ?? null,
    isActive: church.isActive,
    userMainId: church.userMainId,
    phone: church.phone ?? null,
    whatsapp: church.whatsapp ?? null,
    email: church.email ?? null,
    instagram: church.instagram ?? null,
    facebook: church.facebook ?? null,
    youtube: church.youtube ?? null,
    website: church.website ?? null,
  };
}

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
        churchMemberships: {
          where: { isActive: true },
          orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
          include: {
            crunch: true,
            membershipRoles: {
              include: {
                churchRole: {
                  select: {
                    id: true,
                    name: true,
                    scope: true,
                    departmentId: true,
                    permissions: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new DomainError("Usuário não encontrado");
    }

    const context =
      request.churchContext ?? (await resolveActiveChurchContext(request, user.id));
    const activeMembership =
      user.churchMemberships.find(
        (membership) => membership.crunchId === context.activeChurchId,
      ) ?? user.churchMemberships[0] ?? null;
    const activeChurch = activeMembership?.crunch ?? user.crunch ?? null;
    const memberships = user.churchMemberships.map((membership) => ({
      id: membership.id,
      role: membership.role,
      canManageMembers: membership.canManageMembers,
      isPrimary: membership.isPrimary,
      isActive: membership.isActive,
      roles: membership.membershipRoles.map((mr) => ({
        id: mr.churchRole.id,
        name: mr.churchRole.name,
        scope: mr.churchRole.scope,
        departmentId: mr.churchRole.departmentId,
        permissions: mr.churchRole.permissions,
      })),
      church: formatChurch(membership.crunch),
    }));
    const church = activeChurch ? formatChurch(activeChurch) : null;
    // Uniao chata das permissoes ativas - atalho para checagens de igreja no
    // front. A checagem por ministerio usa `roles` (que carrega o departmentId).
    const permissions = [
      ...new Set(context.roles.flatMap((role) => role.permissions)),
    ];

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: context.role,
      crunchId: context.activeChurchId,
      activeChurchId: context.activeChurchId,
      canManageMembers: context.canManageMembers,
      mustChangePassword: user.mustChangePassword,
      church,
      activeChurch: church,
      memberships,
      hasChurch: Boolean(context.activeChurchId || memberships.length),
      isTitularPastor: context.role === "PASTOR" && church?.userMainId === user.id,
      roles: context.roles,
      permissions,
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
      slug?: string;
      accentColor?: string | null;
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

    const slug = await ensureUniqueChurchSlug(body.slug?.trim() || body.name.trim());

    const church = await $prismaClient.$transaction(async (tx) => {
      const createdChurch = await tx.crunch.create({
        data: {
          name: body.name!.trim(),
          slug,
          userMainId: user.id,
          logo: body.logo ?? "",
          accentColor: body.accentColor?.trim() || null,
          city: body.city ?? "",
          road: body.road ?? "",
          localZipCode: body.localZipCode ?? "",
          state: body.state ?? "",
          number: body.number ?? "",
          complement: body.complement ?? "",
          document: body.document ?? "",
          isActive: true,
          plan: "PRO",
          subscriptionStatus: "TRIALING",
          trialEndsAt: new Date(Date.now() + TRIAL_PERIOD_DAYS * 24 * 60 * 60 * 1000),
        },
      });

      await tx.user.update({
        where: {
          id: user.id,
        },
        data: {
          ...(user.crunchId ? {} : { crunchId: createdChurch.id }),
        },
      });

      await tx.churchMembership.upsert({
        where: {
          userId_crunchId: {
            userId: user.id,
            crunchId: createdChurch.id,
          },
        },
        update: {
          role: "PASTOR",
          canManageMembers: true,
          isActive: true,
        },
        create: {
          userId: user.id,
          crunchId: createdChurch.id,
          role: "PASTOR",
          canManageMembers: true,
          isPrimary: !user.crunchId,
        },
      });

      return createdChurch;
    });

    return {
      id: church.id,
      name: church.name,
      userMainId: church.userMainId,
      slug: church.slug,
      accentColor: church.accentColor,
    };
  }

  // Foto/logo da igreja. Mesmo contrato do upload de PDF dos ministerios: o
  // binario vai pro disco em uploads/ e o banco guarda so a URL.
  async uploadChurchPhoto(request: FastifyRequest) {
    const userId = getAuthUserId(request);
    const context =
      request.churchContext ?? (await resolveActiveChurchContext(request, userId));

    if (!context.activeChurchId) {
      throw new DomainError("Usuario nao possui igreja vinculada");
    }

    if (
      context.role !== "PASTOR" &&
      context.role !== "ADMIN" &&
      context.role !== "SUPER_ADMIN"
    ) {
      throw new DomainError("Apenas pastores ou admins podem alterar a foto da igreja");
    }

    const multipartRequest = request as FastifyRequest & {
      file: (options?: unknown) => Promise<{
        filename: string;
        mimetype: string;
        toBuffer: () => Promise<Buffer>;
      } | undefined>;
    };
    const file = await multipartRequest.file({
      limits: {
        fileSize: CHURCH_PHOTO_MAX_SIZE_BYTES,
        files: 1,
      },
    });

    if (!file) {
      throw new DomainError("Imagem nao enviada");
    }

    if (!CHURCH_PHOTO_MIME_TYPES.includes(file.mimetype)) {
      throw new DomainError("Envie uma imagem PNG, JPG ou WEBP");
    }

    const buffer = await file.toBuffer();

    if (buffer.byteLength > CHURCH_PHOTO_MAX_SIZE_BYTES) {
      throw new DomainError("A imagem deve ter no maximo 5 MB");
    }

    const extension =
      {
        "image/png": "png",
        "image/jpeg": "jpg",
        "image/webp": "webp",
      }[file.mimetype] || "png";
    const key = path.posix.join(
      "church",
      context.activeChurchId,
      "photos",
      `${crypto.randomUUID()}.${extension}`,
    );
    const targetPath = path.join(process.cwd(), "uploads", key);

    await mkdir(path.dirname(targetPath), { recursive: true });
    await writeFile(targetPath, buffer);

    const host = request.headers.host || `localhost:${process.env.API_PORT || 8000}`;
    const baseUrl = process.env.URL_BACKEND || `http://${host}`;
    const url = `${baseUrl.replace(/\/$/, "")}/uploads/${key}`;

    await $prismaClient.crunch.update({
      where: { id: context.activeChurchId },
      data: { logo: url },
    });

    return {
      url,
      key,
      mimeType: file.mimetype,
      size: buffer.byteLength,
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
      slug?: string;
      accentColor?: string | null;
      textColor?: string | null;
      fontFamily?: string | null;
      phone?: string | null;
      whatsapp?: string | null;
      email?: string | null;
      instagram?: string | null;
      facebook?: string | null;
      youtube?: string | null;
      website?: string | null;
    };

    // Rodape: contatos como texto; redes/site viram link (assume https:// se
    // vier sem esquema). So aplica os campos que o corpo enviou.
    const cleanText = (value?: string | null) =>
      typeof value === "string" && value.trim() ? value.trim() : null;
    const cleanLink = (value?: string | null) => {
      const trimmed = cleanText(value);
      if (!trimmed) return null;
      return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    };
    const footerData = {
      ...(body.phone !== undefined ? { phone: cleanText(body.phone) } : {}),
      ...(body.whatsapp !== undefined ? { whatsapp: cleanText(body.whatsapp) } : {}),
      ...(body.email !== undefined ? { email: cleanText(body.email) } : {}),
      ...(body.instagram !== undefined ? { instagram: cleanLink(body.instagram) } : {}),
      ...(body.facebook !== undefined ? { facebook: cleanLink(body.facebook) } : {}),
      ...(body.youtube !== undefined ? { youtube: cleanLink(body.youtube) } : {}),
      ...(body.website !== undefined ? { website: cleanLink(body.website) } : {}),
    };
    const footerSelect = {
      phone: true,
      whatsapp: true,
      email: true,
      instagram: true,
      facebook: true,
      youtube: true,
      website: true,
    } as const;

    // Aparencia: cor do texto livre (hex/nome CSS); fonte precisa bater com a
    // lista curada (ALLOWED_FONT_KEYS) - fora dela, o valor e ignorado.
    if (body.fontFamily !== undefined && body.fontFamily !== null && !isValidFontKey(body.fontFamily)) {
      throw new DomainError("Estilo de fonte invalido");
    }
    const appearanceData = {
      ...(body.textColor !== undefined ? { textColor: cleanText(body.textColor) } : {}),
      ...(body.fontFamily !== undefined ? { fontFamily: body.fontFamily || null } : {}),
    };
    const appearanceSelect = {
      textColor: true,
      fontFamily: true,
    } as const;

    const user = await $prismaClient.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        crunch: true,
      },
    });

    if (!user || !user.crunchId || !user.crunch) {
      const context =
        request.churchContext ?? (await resolveActiveChurchContext(request, userId));

      if (!context.activeChurchId) {
        throw new DomainError("Usuario nao possui igreja vinculada");
      }

      const canEditChurch =
        context.role === "PASTOR" ||
        context.role === "ADMIN" ||
        context.role === "SUPER_ADMIN";

      if (!canEditChurch) {
        throw new DomainError("Apenas pastores ou admins podem editar a igreja");
      }

      if (body.name !== undefined && !body.name.trim()) {
        throw new DomainError("Nome da igreja e obrigatorio");
      }

      const slug = body.slug !== undefined
        ? await assertChurchSlugAvailable(body.slug, context.activeChurchId)
        : undefined;

      return await $prismaClient.crunch.update({
        where: {
          id: context.activeChurchId,
        },
        data: {
          ...(body.name !== undefined ? { name: body.name.trim() } : {}),
          ...(slug !== undefined ? { slug } : {}),
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
          ...(body.accentColor !== undefined ? { accentColor: body.accentColor?.trim() || null } : {}),
          ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
          ...footerData,
          ...appearanceData,
        },
        select: {
          id: true,
          name: true,
          slug: true,
          city: true,
          road: true,
          number: true,
          localZipCode: true,
          state: true,
          complement: true,
          document: true,
          logo: true,
          accentColor: true,
          isActive: true,
          userMainId: true,
          ...footerSelect,
          ...appearanceSelect,
        },
      });
    }

    const context =
      request.churchContext ?? (await resolveActiveChurchContext(request, userId));

    if (!context.activeChurchId) {
      throw new DomainError("Usuario nao possui igreja vinculada");
    }

    const canEditChurch =
      context.role === "PASTOR" ||
      context.role === "ADMIN" ||
      context.role === "SUPER_ADMIN";

    if (!canEditChurch) {
      throw new DomainError("Apenas pastores ou admins podem editar a igreja");
    }

    if (body.name !== undefined && !body.name.trim()) {
      throw new DomainError("Nome da igreja e obrigatorio");
    }

    const slug = body.slug !== undefined
      ? await assertChurchSlugAvailable(body.slug, context.activeChurchId)
      : undefined;

    const updatedChurch = await $prismaClient.crunch.update({
      where: {
        id: context.activeChurchId,
      },
      data: {
        ...(body.name !== undefined ? { name: body.name.trim() } : {}),
        ...(slug !== undefined ? { slug } : {}),
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
        ...(body.accentColor !== undefined ? { accentColor: body.accentColor?.trim() || null } : {}),
        ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
        ...footerData,
        ...appearanceData,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        city: true,
        road: true,
        number: true,
        localZipCode: true,
        state: true,
        complement: true,
        document: true,
        logo: true,
        accentColor: true,
        isActive: true,
        userMainId: true,
        ...footerSelect,
        ...appearanceSelect,
      },
    });

    return updatedChurch;
  }

  // Cargo de igreja com MEMBER_CREATE/MEMBER_EDIT/MEMBER_DELETE tambem da
  // acesso, alem do flag legado canManageMembers e de pastor/admin/super
  // (estes ja cobertos por hasPermission via isPrivilegedRole). Sem uma acao
  // especifica, basta ter qualquer uma das tres (ex: listar membros).
  private async getChurchMemberManager(
    request: FastifyRequest,
    permission?: PermissionKey,
  ) {
    const userId = getAuthUserId(request);
    const context =
      request.churchContext ?? (await resolveActiveChurchContext(request, userId));
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

    if (!context.activeChurchId) {
      throw new DomainError("Usuário não possui igreja vinculada");
    }

    const permissionsToCheck: PermissionKey[] = permission
      ? [permission]
      : ["MEMBER_CREATE", "MEMBER_EDIT", "MEMBER_DELETE"];
    const canManage =
      context.canManageMembers ||
      permissionsToCheck.some((key) => hasPermission(context, key));

    if (!canManage) {
      throw new DomainError("Usuário não possui permissão para gerenciar membros");
    }

    return {
      ...user,
      crunchId: context.activeChurchId,
      role: context.role,
      canManageMembers: context.canManageMembers,
      roles: context.roles,
    };
  }

  private async getMemberPermissionManager(request: FastifyRequest) {
    const user = await this.getChurchMemberManager(request);
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
    const manager = await this.getChurchMemberManager(request);

    const memberships = await $prismaClient.churchMembership.findMany({
      where: {
        crunchId: manager.crunchId,
        isActive: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        role: true,
        canManageMembers: true,
        createdAt: true,
        membershipRoles: {
          include: {
            churchRole: {
              select: {
                id: true,
                name: true,
                scope: true,
                departmentId: true,
                permissions: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            unavailableDates: {
              select: {
                date: true,
              },
            },
          },
        },
      },
    });

    return memberships.map((membership) => ({
      id: membership.user.id,
      name: membership.user.name,
      email: membership.user.email,
      phone: membership.user.phone,
      role: membership.role,
      canManageMembers: membership.canManageMembers,
      createdAt: membership.createdAt,
      roles: membership.membershipRoles.map((mr) => ({
        id: mr.churchRole.id,
        name: mr.churchRole.name,
        scope: mr.churchRole.scope,
        departmentId: mr.churchRole.departmentId,
        permissions: mr.churchRole.permissions,
      })),
      unavailableDates: membership.user.unavailableDates.map((item) =>
        item.date.toISOString().slice(0, 10),
      ),
    }));
  }

  async createChurchMember(request: FastifyRequest) {
    const manager = await this.getChurchMemberManager(request, "MEMBER_CREATE");
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
          churchMemberships: {
            create: {
              crunchId: manager.crunchId!,
              role: "MEMBER",
              canManageMembers: false,
              isPrimary: true,
            },
          },
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
    const manager = await this.getMemberPermissionManager(request);
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

    const membership = await $prismaClient.churchMembership.findUnique({
      where: {
        userId_crunchId: {
          userId: id,
          crunchId: manager.crunchId!,
        },
      },
      include: {
        user: true,
        crunch: true,
      },
    });

    if (!membership) {
      throw new DomainError("Membro não encontrado nesta igreja");
    }

    if (membership.crunch?.userMainId === membership.userId) {
      throw new DomainError("Não é possível alterar as permissões do pastor titular");
    }

    if (membership.role === "SUPER_ADMIN" && manager.role !== "SUPER_ADMIN") {
      throw new DomainError("Nao e possivel alterar um usuario super admin");
    }

    const updatedMembership = await $prismaClient.churchMembership.update({
      where: {
        id: membership.id,
      },
      data: {
        canManageMembers: body.canManageMembers,
      },
      select: {
        role: true,
        canManageMembers: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (membership.user.crunchId === manager.crunchId) {
      await $prismaClient.user.update({
        where: { id: membership.userId },
        data: { canManageMembers: body.canManageMembers },
      });
    }

    return {
      id: updatedMembership.user.id,
      name: updatedMembership.user.name,
      email: updatedMembership.user.email,
      phone: updatedMembership.user.phone,
      role: updatedMembership.role,
      canManageMembers: updatedMembership.canManageMembers,
      createdAt: updatedMembership.createdAt,
    };
  }

  async updateChurchMember(request: FastifyRequest) {
    const manager = await this.getChurchMemberManager(request, "MEMBER_EDIT");
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

    const membership = await $prismaClient.churchMembership.findUnique({
      where: {
        userId_crunchId: {
          userId: id,
          crunchId: manager.crunchId!,
        },
      },
      include: {
        user: true,
        crunch: true,
      },
    });

    if (!membership) {
      throw new DomainError("Membro nao encontrado nesta igreja");
    }

    const member = membership.user;

    if (membership.crunch?.userMainId === member.id) {
      throw new DomainError("Nao e possivel editar o pastor titular por este fluxo");
    }

    if (membership.role === "SUPER_ADMIN" && manager.role !== "SUPER_ADMIN") {
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

    const updated = await $prismaClient.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: {
          id: member.id,
        },
        data: {
          ...(body.name !== undefined ? { name: body.name.trim() } : {}),
          ...(normalizedEmail !== undefined ? { email: normalizedEmail } : {}),
          ...(body.phone !== undefined ? { phone: body.phone?.trim() || null } : {}),
          ...(body.role !== undefined && member.crunchId === manager.crunchId
            ? { role: body.role.trim() || "MEMBER" }
            : {}),
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          createdAt: true,
        },
      });

      const updatedMembership = await tx.churchMembership.update({
        where: { id: membership.id },
        data: {
          ...(body.role !== undefined
            ? { role: body.role.trim() || "MEMBER" }
            : {}),
        },
        select: {
          role: true,
          canManageMembers: true,
        },
      });

      return { updatedUser, updatedMembership };
    });

    return {
      ...updated.updatedUser,
      role: updated.updatedMembership.role,
      canManageMembers: updated.updatedMembership.canManageMembers,
    };
  }

  async deleteChurchMember(request: FastifyRequest) {
    const manager = await this.getChurchMemberManager(request, "MEMBER_DELETE");
    const { id } = request.params as { id?: string };

    if (!id) {
      throw new DomainError("Membro nao informado");
    }

    const membership = await $prismaClient.churchMembership.findUnique({
      where: {
        userId_crunchId: {
          userId: id,
          crunchId: manager.crunchId!,
        },
      },
      include: {
        user: true,
        crunch: true,
      },
    });

    if (!membership) {
      throw new DomainError("Membro nao encontrado nesta igreja");
    }

    if (membership.crunch?.userMainId === membership.userId) {
      throw new DomainError("Nao e possivel remover o pastor titular");
    }

    if (membership.role === "SUPER_ADMIN" && manager.role !== "SUPER_ADMIN") {
      throw new DomainError("Nao e possivel remover um usuario super admin");
    }

    await $prismaClient.$transaction(async (tx) => {
      await tx.churchMembership.delete({
        where: {
          id: membership.id,
        },
      });

      if (membership.user.crunchId === manager.crunchId) {
        const nextMembership = await tx.churchMembership.findFirst({
          where: {
            userId: membership.userId,
            isActive: true,
          },
          orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
        });

        await tx.user.update({
          where: { id: membership.userId },
          data: {
            crunchId: nextMembership?.crunchId ?? null,
            role: nextMembership?.role ?? "MEMBER",
            canManageMembers: nextMembership?.canManageMembers ?? false,
          },
        });
      }
    });

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
