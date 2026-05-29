import { $prismaClient } from "../../../config/database";
import { User } from "../../domain/entities/User";
import { IUserRespository } from "../../domain/repositories/IUserRepository";
import { DomainError } from "../../domain/value-objects/utils/DomainError";

export class UserRepository implements IUserRespository {
  public async createUser(user: User): Promise<{ id: string }> {
    try {
      const result = await $prismaClient.user.create({
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          crunchId: user.crunchId ?? null,
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
  public async updateUser(user: User): Promise<void> {
    try {
      const result = await $prismaClient.user.update({
        where: {
          id: user.id,
        },
        data: {
          name: user.name,
          email: user.email,
          phone: user.phone,
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

  public async deleteUser(id: string): Promise<void> {
    try {
      const result = await $prismaClient.user.delete({
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

  public async getUserbyId(id: string): Promise<User> {
    try {
      const result = await $prismaClient.user.findFirst({
        where: { id },
      });

      if (!result || !result.id) {
        throw new DomainError("Usuario não encontrado");
      }

      return User.restore({
        id: result.id,
        name: result.name,
        email: result.email,
        phone: result.phone ?? "",
        crunchId: result.crunchId ?? undefined,
        role: result.role,
        createdAt: result.createdAt,
      });
    } catch (error) {
      throw new DomainError(
        "Erro ao buscar usuario por ID: " + (error as Error).message,
      );
    }
  }

  public async getAllUsers(): Promise<User[]> {
    try {
      const results = await $prismaClient.user.findMany({
        orderBy: {
          createdAt: "desc",
        },
      });

      return results.map((user) => {
        if (!user.id) {
          throw new DomainError("Usuario sem ID encontrado");
        }

        return User.restore({
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone ?? "",
          crunchId: user.crunchId ?? undefined,
          role: user.role,
          createdAt: user.createdAt,
        });
      });
    } catch (error) {
      throw new DomainError(
        "Erro ao buscar todos os usuarios: " + (error as Error).message,
      );
    }
  }
}
