import { User } from "../../entities/User";

export interface IClientDbRepository {
  saveUser(user: User): Promise<void>;
  getUserByEmail(email: string): Promise<User | null>;
  getAllUser(): Promise<User[]>;
  updateAuthUser(user: User): Promise<void>;
  managerUser(data: User): Promise<{ id: string }>;
}
