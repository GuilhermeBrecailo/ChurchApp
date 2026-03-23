import { $prismaClient } from "../../../config/database";
import { User, UserDto } from "../../domain/entities/User";
import { IUserRespository } from "../../domain/repositories/IUserRepository";
import { DomainError } from "../../domain/value-objects/utils/DomainError";

export class UserRepository implements IUserRespository {
  public async createUser(user: User): Promise<{ id: string }> {
    try {
      const result = await $prismaClient.user.create({
        data: {
          name: user.getName(),
          email: user.getEmail(),
          phone: user.getPhone(),
          crunchId: user.getCrunchId() ?? "",
          role: user.getRole() ?? "",
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
          id: user.getId(),
        },
        data: {
          name: user.getName(),
          email: user.getEmail(),
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
        where: {
          id: id,
        },
      });

      if (!result) {
        throw new DomainError("Nenhum usuario encontrado");
      }

      return new User({
        id: result.id,
        name: result.name,
        email: result.email,
        phone: result.phone,
        createdAt: result.createdAt,
      });
    } catch (err) {
      console.log("Erro ao procurar usuario pelo id:", err);
      throw new DomainError("Erro ao buscar usuario");
    }
  }
  public async getAllUsers(): Promise<User[]> {
    try {
      const result = await $prismaClient.user.findMany({
        where: {},
        orderBy: {
          createdAt: "desc",
        },
      });

      if (!result) {
        return [];
      }

      return result.map(
        (user) =>
          new User({
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            createdAt: user.createdAt,
          }),
      );
    } catch (err) {
      console.error("Falha ao buscar todos os usuarios:", err);
      throw new DomainError("Falha ao buscar todos os usuarioss");
    }
  }
}
