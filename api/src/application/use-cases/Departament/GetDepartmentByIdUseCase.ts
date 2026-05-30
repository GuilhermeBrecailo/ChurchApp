import { Department } from "../../../domain/entities/Departament";
import { IDepartamentRepository } from "../../../domain/repositories/IDepartamentRepository";

export class GetDepartmentByIdUseCase {
  constructor(private repository: IDepartamentRepository) {}

  async execute(id: string): Promise<Department | null> {
    return await this.repository.getDepartmentById(id);
  }
}
