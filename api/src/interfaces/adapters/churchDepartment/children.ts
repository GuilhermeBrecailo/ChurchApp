import { FastifyRequest } from "fastify/types/request";
import { FastifyReply } from "fastify";
import crypto from "node:crypto";
import path from "node:path";
import { readFile } from "node:fs/promises";
import { $prismaClient } from "../../../../config/database";
import { DomainError } from "../../../domain/value-objects/utils/DomainError";
import { DepartmentContext } from "./context";

type QueryArgs = Record<string, unknown>;
type ChildRecord = Record<string, unknown>;
type PersonInput = {
  rosterMemberId?: string;
  name?: string;
  email?: string | null;
  phone?: string | null;
  birthDate?: string | null;
};

type ChildTransaction = {
  rosterMember: {
    findFirst(args: QueryArgs): Promise<ChildRecord | null>;
    create(args: QueryArgs): Promise<ChildRecord>;
    update(args: QueryArgs): Promise<ChildRecord>;
  };
  ministryChildProfile: {
    findFirst(args: QueryArgs): Promise<ChildRecord | null>;
    findMany(args: QueryArgs): Promise<ChildRecord[]>;
    create(args: QueryArgs): Promise<ChildRecord>;
    update(args: QueryArgs): Promise<ChildRecord>;
  };
  ministryChildGuardian: {
    createMany(args: QueryArgs): Promise<{ count: number }>;
    deleteMany(args: QueryArgs): Promise<{ count: number }>;
  };
  ministryChildSession: {
    findFirst(args: QueryArgs): Promise<ChildRecord | null>;
    create(args: QueryArgs): Promise<ChildRecord>;
  };
  ministryChildAttendance: {
    createMany(args: QueryArgs): Promise<{ count: number }>;
  };
};

type ChildProfileModel = {
  findMany(args: QueryArgs): Promise<ChildRecord[]>;
  findFirst(args: QueryArgs): Promise<ChildRecord | null>;
};

type ChildSessionModel = {
  findMany(args: QueryArgs): Promise<ChildRecord[]>;
  findFirst(args: QueryArgs): Promise<ChildRecord | null>;
};

type ChildMediaItemModel = {
  findMany(args: QueryArgs): Promise<ChildRecord[]>;
  findFirst(args: QueryArgs): Promise<ChildRecord | null>;
};

type ChildAttendanceModel = {
  upsert(args: QueryArgs): Promise<ChildRecord>;
};

type ChildrenDatabase = {
  ministryChildProfile: ChildProfileModel;
  ministryChildSession: ChildSessionModel;
  ministryChildAttendance: ChildAttendanceModel;
  mediaItem: ChildMediaItemModel;
  $transaction<T>(callback: (tx: ChildTransaction) => Promise<T>): Promise<T>;
};

const childProfileSelect = {
  id: true,
  departmentId: true,
  groupName: true,
  isActive: true,
  createdAt: true,
  rosterMember: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      birthDate: true,
    },
  },
  guardians: {
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      guardianRosterMember: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  },
};

const childSessionSelect = {
  id: true,
  departmentId: true,
  date: true,
  groupName: true,
  createdAt: true,
  attendances: {
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      status: true,
      childProfile: {
        select: {
          id: true,
          groupName: true,
          rosterMember: { select: { id: true, name: true } },
        },
      },
    },
  },
};

function parseBirthDate(value: string | null | undefined) {
  if (!value?.trim()) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new DomainError("Data de nascimento inválida");
  }
  return date;
}

async function resolveRosterMember(
  tx: ChildTransaction,
  input: PersonInput,
  crunchId: string,
  kind: "Criança" | "Responsável",
) {
  const rosterMemberId = input.rosterMemberId?.trim();
  if (rosterMemberId) {
    const existing = await tx.rosterMember.findFirst({
      where: { id: rosterMemberId, crunchId },
      select: { id: true, crunchId: true },
    });
    if (!existing) {
      throw new DomainError(`${kind} não encontrado nesta igreja`);
    }
    return existing;
  }

  const name = input.name?.trim();
  if (!name) {
    throw new DomainError(`Nome da pessoa (${kind.toLowerCase()}) é obrigatório`);
  }

  const email = input.email?.trim().toLowerCase() || null;
  const phone = input.phone?.trim() || null;
  if (kind === "Responsável" && (email || phone)) {
    const contactMatches = [
      ...(email ? [{ email }] : []),
      ...(phone ? [{ phone }] : []),
    ];
    const existing = await tx.rosterMember.findFirst({
      where: { crunchId, OR: contactMatches },
      select: { id: true, crunchId: true },
    });
    if (existing) return existing;
  }

  return await tx.rosterMember.create({
    data: {
      id: crypto.randomUUID(),
      name,
      email,
      phone,
      birthDate: kind === "Criança" ? parseBirthDate(input.birthDate) : null,
      crunchId,
    },
    select: { id: true, crunchId: true },
  });
}

function normalizeGuardians(input: unknown): PersonInput[] {
  if (!Array.isArray(input)) {
    throw new DomainError("Lista de responsáveis inválida");
  }
  if (input.some((person) => !person || typeof person !== "object")) {
    throw new DomainError("Lista de responsáveis inválida");
  }
  return input as PersonInput[];
}

function recordValue(value: unknown): ChildRecord | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as ChildRecord
    : null;
}

function getUploadedPdf(metadata: unknown) {
  const pdf = recordValue(recordValue(metadata)?.pdf);
  const key = typeof pdf?.key === "string" ? pdf.key : "";
  if (!key) return null;

  return {
    key,
    fileName: typeof pdf?.fileName === "string" ? pdf.fileName : "material.pdf",
    mimeType: typeof pdf?.mimeType === "string" ? pdf.mimeType : "application/pdf",
    size: typeof pdf?.size === "number" ? pdf.size : 0,
  };
}

export class MinistryChildrenAdapters {
  private database = $prismaClient as unknown as ChildrenDatabase;

  constructor(private context: DepartmentContext) {}

  async getMinistryChildren(request: FastifyRequest) {
    const user = await this.context.getCurrentUser(request);
    const { id } = request.params as { id?: string };
    if (!id) throw new DomainError("Ministério não informado");

    await this.context.assertCanViewChildren(user, id);
    return await this.database.ministryChildProfile.findMany({
      where: { departmentId: id, isActive: true },
      orderBy: { rosterMember: { name: "asc" } },
      select: childProfileSelect,
    });
  }

  async createMinistryChild(request: FastifyRequest) {
    const user = await this.context.getCurrentUser(request);
    const { id: departmentId } = request.params as { id?: string };
    const body = (request.body ?? {}) as PersonInput & {
      groupName?: string | null;
      guardians?: unknown;
      guardianRosterMemberIds?: string[];
    };
    if (!departmentId) throw new DomainError("Ministério não informado");

    await this.context.assertCanViewChildren(user, departmentId);
    await this.context.assertCanManageDepartment(user, departmentId);

    const guardianInputs = body.guardians !== undefined
      ? normalizeGuardians(body.guardians)
      : (body.guardianRosterMemberIds ?? []).map((rosterMemberId) => ({ rosterMemberId }));

    return await this.database.$transaction(async (tx) => {
      const child = await resolveRosterMember(tx, body, user.crunchId!, "Criança");
      const uniqueGuardianInputs = new Map<string, PersonInput>();
      const newGuardianInputs: PersonInput[] = [];
      for (const guardianInput of guardianInputs) {
        const guardian = await resolveRosterMember(
          tx,
          guardianInput,
          user.crunchId!,
          "Responsável",
        );
        const guardianId = guardian.id as string;
        if (!uniqueGuardianInputs.has(guardianId)) {
          uniqueGuardianInputs.set(guardianId, { rosterMemberId: guardianId });
          newGuardianInputs.push({ rosterMemberId: guardianId });
        }
      }

      const profile = await tx.ministryChildProfile.create({
        data: {
          id: crypto.randomUUID(),
          departmentId,
          rosterMemberId: child.id as string,
          groupName: body.groupName?.trim() || null,
          isActive: true,
        },
        select: { id: true, departmentId: true, groupName: true, isActive: true, rosterMemberId: true },
      });

      if (newGuardianInputs.length) {
        await tx.ministryChildGuardian.createMany({
          data: newGuardianInputs.map(({ rosterMemberId }) => ({
            childProfileId: profile.id,
            guardianRosterMemberId: rosterMemberId,
          })),
          skipDuplicates: true,
        });
      }

      return await tx.ministryChildProfile.findFirst({
        where: { id: profile.id, departmentId },
        select: childProfileSelect,
      });
    });
  }

  async updateMinistryChild(request: FastifyRequest) {
    const user = await this.context.getCurrentUser(request);
    const { departmentId, childId } = request.params as {
      departmentId?: string;
      childId?: string;
    };
    const body = (request.body ?? {}) as {
      name?: string;
      birthDate?: string | null;
      groupName?: string | null;
      isActive?: boolean;
      guardians?: unknown;
      guardianRosterMemberIds?: string[];
    };
    if (!departmentId || !childId) {
      throw new DomainError("Criança não informada");
    }

    await this.context.assertCanViewChildren(user, departmentId);
    await this.context.assertCanManageDepartment(user, departmentId);

    const existingProfile = await this.database.ministryChildProfile.findFirst({
      where: {
        id: childId,
        departmentId,
        department: { crunchId: user.crunchId },
      },
      select: { id: true, rosterMemberId: true },
    });
    if (!existingProfile) {
      throw new DomainError("Criança não encontrada neste ministério");
    }

    const guardianInputs = body.guardians !== undefined
      ? normalizeGuardians(body.guardians)
      : body.guardianRosterMemberIds?.map((rosterMemberId) => ({ rosterMemberId }));
    const data: Record<string, unknown> = {};
    const rosterMemberData: Record<string, unknown> = {};
    if (body.name !== undefined) {
      if (!body.name.trim()) throw new DomainError("Nome da criança é obrigatório");
      rosterMemberData.name = body.name.trim();
    }
    if (body.birthDate !== undefined) {
      rosterMemberData.birthDate = parseBirthDate(body.birthDate);
    }
    if (body.groupName !== undefined) data.groupName = body.groupName?.trim() || null;
    if (body.isActive !== undefined) {
      if (typeof body.isActive !== "boolean") {
        throw new DomainError("Estado da criança inválido");
      }
      data.isActive = body.isActive;
    }
    if (
      !Object.keys(data).length &&
      !Object.keys(rosterMemberData).length &&
      guardianInputs === undefined
    ) {
      throw new DomainError("Nenhuma alteração informada");
    }

    return await this.database.$transaction(async (tx) => {
      if (Object.keys(rosterMemberData).length) {
        await tx.rosterMember.update({
          where: { id: existingProfile.rosterMemberId },
          data: rosterMemberData,
        });
      }

      if (guardianInputs !== undefined) {
        await tx.ministryChildGuardian.deleteMany({
          where: { childProfileId: childId },
        });
        const guardianIds = new Set<string>();
        for (const guardianInput of guardianInputs) {
          const guardian = await resolveRosterMember(
            tx,
            guardianInput,
            user.crunchId!,
            "Responsável",
          );
          guardianIds.add(guardian.id as string);
        }
        if (guardianIds.size) {
          await tx.ministryChildGuardian.createMany({
            data: [...guardianIds].map((guardianRosterMemberId) => ({
              childProfileId: childId,
              guardianRosterMemberId,
            })),
            skipDuplicates: true,
          });
        }
      }

      if (Object.keys(data).length) {
        await tx.ministryChildProfile.update({
          where: { id: childId },
          data,
        });
      }

      return await tx.ministryChildProfile.findFirst({
        where: { id: childId, departmentId },
        select: childProfileSelect,
      });
    });
  }

  async getMinistryChildSessions(request: FastifyRequest) {
    const user = await this.context.getCurrentUser(request);
    const { id } = request.params as { id?: string };
    if (!id) throw new DomainError("Ministério não informado");

    await this.context.assertCanViewChildren(user, id);
    return await this.database.ministryChildSession.findMany({
      where: { departmentId: id },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      select: childSessionSelect,
    });
  }

  async createMinistryChildSession(request: FastifyRequest) {
    const user = await this.context.getCurrentUser(request);
    const { id: departmentId } = request.params as { id?: string };
    const body = (request.body ?? {}) as { date?: string; groupName?: string | null };
    if (!departmentId) throw new DomainError("Ministério não informado");
    if (!body.date?.trim()) throw new DomainError("Data do encontro é obrigatória");
    const date = new Date(body.date);
    if (Number.isNaN(date.getTime())) throw new DomainError("Data do encontro inválida");

    await this.context.assertCanViewChildren(user, departmentId);
    await this.context.assertCanManageDepartment(user, departmentId);
    const groupName = body.groupName?.trim() || null;

    return await this.database.$transaction(async (tx) => {
      const session = await tx.ministryChildSession.create({
        data: {
          id: crypto.randomUUID(),
          departmentId,
          date,
          groupName,
        },
        select: { id: true, departmentId: true, date: true, groupName: true },
      });

      const children = await tx.ministryChildProfile.findMany({
        where: {
          departmentId,
          isActive: true,
          ...(groupName ? { groupName } : {}),
        },
        select: { id: true },
      });

      if (children.length) {
        await tx.ministryChildAttendance.createMany({
          data: children.map((child) => ({
            id: crypto.randomUUID(),
            sessionId: session.id,
            childProfileId: child.id,
            status: "PENDING",
          })),
          skipDuplicates: true,
        });
      }

      return await tx.ministryChildSession.findFirst({
        where: { id: session.id, departmentId },
        select: childSessionSelect,
      });
    });
  }

  async updateMinistryChildAttendance(request: FastifyRequest) {
    const user = await this.context.getCurrentUser(request);
    const { departmentId, sessionId, childId } = request.params as {
      departmentId?: string;
      sessionId?: string;
      childId?: string;
    };
    const body = (request.body ?? {}) as { status?: string };
    if (!departmentId || !sessionId || !childId) {
      throw new DomainError("Encontro ou criança não informado");
    }
    if (body.status !== "PRESENT" && body.status !== "ABSENT") {
      throw new DomainError("Status da chamada deve ser PRESENT ou ABSENT");
    }

    await this.context.assertCanViewChildren(user, departmentId);
    const session = await this.database.ministryChildSession.findFirst({
      where: {
        id: sessionId,
        departmentId,
        department: { crunchId: user.crunchId },
      },
      select: { id: true },
    });
    if (!session) throw new DomainError("Encontro não encontrado neste ministério");

    const child = await this.database.ministryChildProfile.findFirst({
      where: {
        id: childId,
        departmentId,
        department: { crunchId: user.crunchId },
      },
      select: { id: true },
    });
    if (!child) throw new DomainError("Criança não encontrada neste ministério");

    return await this.database.ministryChildAttendance.upsert({
      where: {
        sessionId_childProfileId: { sessionId, childProfileId: childId },
      },
      create: {
        id: crypto.randomUUID(),
        sessionId,
        childProfileId: childId,
        status: body.status,
      },
      update: { status: body.status },
      select: { id: true, sessionId: true, childProfileId: true, status: true, updatedAt: true },
    });
  }

  async getMinistryChildMaterials(request: FastifyRequest) {
    const user = await this.context.getCurrentUser(request);
    const { id: departmentId } = request.params as { id?: string };
    if (!departmentId) throw new DomainError("Ministério não informado");

    await this.context.assertCanViewChildren(user, departmentId);
    const resources = await this.database.mediaItem.findMany({
      where: {
        departmentId,
        category: "ACTIVITY",
        department: { crunchId: user.crunchId },
      },
      orderBy: { title: "asc" },
      select: { id: true, title: true, category: true, metadata: true },
    });

    return resources.flatMap((resource) => {
      const pdf = getUploadedPdf(resource.metadata);
      if (!pdf) return [];
      const metadata = recordValue(resource.metadata);
      return [{
        id: resource.id,
        title: resource.title,
        category: "ACTIVITY",
        notes: typeof metadata?.notes === "string" ? metadata.notes : null,
        pdf: {
          fileName: pdf.fileName,
          mimeType: pdf.mimeType,
          size: pdf.size,
        },
      }];
    });
  }

  async streamMinistryChildMaterialPdf(
    request: FastifyRequest,
    reply: FastifyReply,
  ) {
    const user = await this.context.getCurrentUser(request);
    const { departmentId, resourceId } = request.params as {
      departmentId?: string;
      resourceId?: string;
    };
    if (!departmentId || !resourceId) {
      throw new DomainError("Material não informado");
    }

    await this.context.assertCanViewChildren(user, departmentId);
    const resource = await this.context.getResourceFromCurrentChurch(
      resourceId,
      departmentId,
      user.crunchId!,
    );
    if (resource.category !== "ACTIVITY") {
      throw new DomainError("Material não encontrado no Ministério Infantil");
    }

    const pdf = getUploadedPdf(resource.metadata);
    if (!pdf || pdf.mimeType !== "application/pdf") {
      throw new DomainError("PDF não encontrado para esta atividade");
    }

    const expectedPrefix = `${path.posix.join(
      "church",
      user.crunchId!,
      "departments",
      departmentId,
    )}/`;
    if (
      pdf.key.includes("\\") ||
      pdf.key.includes("\0") ||
      !pdf.key.startsWith(expectedPrefix) ||
      pdf.key.split("/").some((segment) => !segment || segment === "." || segment === "..")
    ) {
      throw new DomainError("Caminho do PDF inválido");
    }

    const uploadRoot = path.resolve(process.cwd(), "uploads");
    const filePath = path.resolve(uploadRoot, ...pdf.key.split("/"));
    if (!filePath.startsWith(`${uploadRoot}${path.sep}`)) {
      throw new DomainError("Caminho do PDF inválido");
    }

    let contents: Buffer;
    try {
      contents = await readFile(filePath);
    } catch {
      throw new DomainError("Arquivo PDF não encontrado");
    }

    const safeFileName = pdf.fileName.replace(/[\r\n"\\]/g, "_") || "material.pdf";
    reply
      .type("application/pdf")
      .header("Content-Disposition", `inline; filename="${safeFileName}"`)
      .header("Cache-Control", "private, no-store");
    return reply.send(contents);
  }
}
