import { $prismaClient } from "../../../../config/database";
import { User } from "../../../domain/entities/User";
import { IClientDbRepository } from "../../../domain/repositories/Auth/IClientDbRepository";

export class ClientAuthRepositoryDB implements IClientDbRepository {
  async saveUser(user: User): Promise<void> {
    try {
      await $prismaClient.user.create({
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          ...(user.crunchId && {
            crunch: { connect: { id: user.crunchId } },
          }),
          role: user.role,
        },
      });

      await $prismaClient.userAuth.create({
        data: {
          id: user.id,
          UserId: user.id,
        },
      });
    } catch (error) {
      throw new Error(`Error saving user: ${error}`);
    }
  }
}
