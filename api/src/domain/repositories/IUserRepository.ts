import { User, UserDto } from "../entities/User";

export interface IUserRespository {
  createUser(user: User): Promise<{ id: string }>;
  updateUser(user: User): Promise<void>;
  deleteUser(id: string): Promise<void>;
  getAllUsers(): Promise<User[]>;
  getUserbyId(id: string): Promise<User>;
}
