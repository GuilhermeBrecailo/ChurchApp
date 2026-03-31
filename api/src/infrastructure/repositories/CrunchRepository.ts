import { ICrunchRepository } from "../../domain/repositories/ICrunchRepository";
import { $prismaClient } from "../../../config/database";
import { DomainError } from "../../domain/value-objects/utils/DomainError";
import { Crunch } from "../../domain/entities/Crunch";

export class CrunchRepository implements ICrunchRepository {
  public async createCrunch(crunch: Crunch): Promise<{ id: string }> {
    try {
      const crunchData = crunch as unknown as {
        name: string;
        id: string;
        slug: string;
        isActive: boolean;
        createdAt: Date;
      };

      const result = await $prismaClient.crunch.create({
        data: {
          id: crunchData.id,
          name: crunchData.name,
          slug: crunchData.slug,
          isActive: crunchData.isActive,
        },
      });
      if (!result) {
        throw new DomainError("Falha ao tentar salvar um usuario");
      }

      return {
        id: result.id,
      };
    } catch (error) {
      console.log("Falha ao tentar criar um usuario", error);
      throw error;
    }
  }
  public async updateCrunch(crunch: Crunch): Promise<void> {
    try {
      const crunchData = crunch as unknown as {
        name: string;
        id: string;
        slug: string;
        isActive: boolean;
        createdAt: Date;
      };

      const result = await $prismaClient.crunch.update({
        where: {
          id: crunchData.id,
        },
        data: {
          name: crunchData.name,
          slug: crunchData.slug,
          isActive: crunchData.isActive,
        },
      });
      if (!result) {
        throw new DomainError("Algo deu errado ao tentar atualizar o usuario");
      }
    } catch (err) {
      console.log("Falha ao tentar atualizar o usuario: ", err);
      throw new DomainError("Falha ao tentar atualizar o usuario");
    }
  }
  public async deleteCrunch(id: string): Promise<void> {
    try {
      const result = await $prismaClient.crunch.delete({
        where: {
          id: id,
        },
      });
      if (!result) {
        throw new DomainError("Algo deu errado ao deletar o usuario");
      }
    } catch (err) {
      console.error("Falha ao deletar usuario", err);
      throw new DomainError("Falha ao deletar usuario");
    }
  }
  public async getAllCrunchs(): Promise<Crunch[]> {
    try {
      const result = await $prismaClient.crunch.findMany({
        where: {},
        orderBy: {
          createdAt: "desc",
        },
        include: {
          users: true,
          departments: true,
        },
      });

      if (!result) {
        return [];
      }

      return result.map(
        (crunch) =>
          new Crunch({
            id: crunch.id,
            name: crunch.name,
            slug: crunch.slug,
            isActive: crunch.isActive,
            createdAt: crunch.createdAt,
            users: crunch.users,
            departaments: crunch.departments.map((dept) => dept.id),
          }),
      );
    } catch (error) {
      console.error("Falha ao tentar buscar usuarios", error);
      throw new DomainError("Falha ao tentar buscar usuarios");
    }
  }
  public async getCrunchById(id: string): Promise<Crunch> {
    try {
      const result = await $prismaClient.crunch.findUnique({
        where: {
          id: id,
        },
        include: {
          users: true,
          departments: true,
        },
      });
      if (!result) {
        throw new DomainError("Crunch não encontrado");
      }
      return result as unknown as Crunch;
    } catch (error) {
      console.error("Falha ao tentar buscar crunch", error);
      throw new DomainError("Falha ao tentar buscar crunch");
    }
  }
}
