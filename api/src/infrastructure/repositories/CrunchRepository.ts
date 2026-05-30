import { Prisma } from "@prisma/client";
import { $prismaClient } from "../../../config/database";
import { Crunch } from "../../domain/entities/Crunch";
import { Department } from "../../domain/entities/Departament";
import { User } from "../../domain/entities/User";
import { ICrunchRepository } from "../../domain/repositories/ICrunchRepository";
import { Address } from "../../domain/value-objects/Address";
import { Document } from "../../domain/value-objects/Document";
import { DomainError } from "../../domain/value-objects/utils/DomainError";

type CrunchWithRelations = Prisma.CrunchGetPayload<{
  include: {
    users: true;
    departments: true;
  };
}>;

export class CrunchRepository implements ICrunchRepository {
  public async createCrunch(crunch: Crunch): Promise<{ id: string }> {
    try {
      if (!crunch.address) {
        throw new DomainError("Endereço da igreja é obrigatório");
      }

      const result = await $prismaClient.crunch.create({
        data: {
          id: crunch.id,
          name: crunch.name,
          city: crunch.address.getCity(),
          road: crunch.address.getRoad(),
          localZipCode: crunch.address.getLocalZipCode(),
          state: crunch.address.getState(),
          complement: crunch.address.getComplement(),
          number: crunch.address.getNumber(),
          logo: crunch.logo,
          userMainId: crunch.userMainId,
          document: crunch.document?.documento,
          isActive: crunch.isActive,
        },
      });

      if (!result) {
        throw new DomainError("Falha ao tentar salvar a igreja");
      }

      return {
        id: result.id,
      };
    } catch (error) {
      console.error("Falha ao tentar criar uma igreja", error);
      throw error;
    }
  }

  public async updateCrunch(crunch: Crunch): Promise<void> {
    try {
      const data: Prisma.CrunchUpdateInput = {
        name: crunch.name,
        logo: crunch.logo,
        userMainId: crunch.userMainId,
        document: crunch.document?.documento,
        isActive: crunch.isActive,
      };

      if (crunch.address) {
        data.city = crunch.address.getCity();
        data.road = crunch.address.getRoad();
        data.localZipCode = crunch.address.getLocalZipCode();
        data.state = crunch.address.getState();
        data.complement = crunch.address.getComplement();
        data.number = crunch.address.getNumber();
      }

      const result = await $prismaClient.crunch.update({
        where: {
          id: crunch.id,
        },
        data,
      });

      if (!result) {
        throw new DomainError("Algo deu errado ao tentar atualizar a igreja");
      }
    } catch (error) {
      console.error("Falha ao tentar atualizar a igreja: ", error);
      throw new DomainError("Falha ao tentar atualizar a igreja");
    }
  }

  public async deleteCrunch(id: string): Promise<void> {
    try {
      const result = await $prismaClient.crunch.delete({
        where: {
          id,
        },
      });

      if (!result) {
        throw new DomainError("Algo deu errado ao deletar a igreja");
      }
    } catch (error) {
      console.error("Falha ao deletar igreja", error);
      throw new DomainError("Falha ao deletar igreja");
    }
  }

  public async getCrunchById(id: string): Promise<Crunch | null> {
    try {
      const result = await $prismaClient.crunch.findUnique({
        where: {
          id,
        },
        include: {
          users: true,
          departments: true,
        },
      });

      return result ? this.restoreCrunch(result) : null;
    } catch (error) {
      console.error("Falha ao tentar buscar igreja", error);
      throw new DomainError("Falha ao tentar buscar igreja");
    }
  }

  public async getAllCrunchs(): Promise<Crunch[]> {
    try {
      const results = await $prismaClient.crunch.findMany({
        orderBy: {
          createdAt: "desc",
        },
        include: {
          users: true,
          departments: true,
        },
      });

      return results.map((crunch) => this.restoreCrunch(crunch));
    } catch (error) {
      throw new DomainError(
        "Erro ao buscar todas as igrejas: " + (error as Error).message,
      );
    }
  }

  private restoreCrunch(crunch: CrunchWithRelations): Crunch {
    const users = crunch.users.map((user) =>
      User.restore({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone ?? "",
        crunchId: user.crunchId ?? undefined,
        role: user.role,
        createdAt: user.createdAt,
      }),
    );

    const address = Address.restore({
      city: crunch.city,
      road: crunch.road,
      number: crunch.number ?? "",
      localZipCode: crunch.localZipCode,
      state: crunch.state,
      complement: crunch.complement || undefined,
    });

    const document = crunch.document ? new Document(crunch.document) : undefined;

    const departments = crunch.departments.map(
      (department) =>
        new Department({
          id: department.id,
          name: department.name,
          leaderId: department.leaderId,
          isActive: department.isActive,
          crunchId: department.crunchId,
        }),
    );

    return Crunch.restore(
      {
        id: crunch.id,
        name: crunch.name,
        logo: crunch.logo ?? "",
        userMainId: crunch.userMainId ?? "",
        isActive: crunch.isActive,
        createdAt: crunch.createdAt,
      },
      users,
      address,
      document,
      departments,
    );
  }
}
