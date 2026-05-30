import { Department } from "../../../domain/entities/Departament";
import { IDepartamentRepository } from "../../../domain/repositories/IDepartamentRepository";

export class CreateDepartmentUseCase {
  constructor(private repository: IDepartamentRepository) {}

  async execute(department: Department): Promise<{ id: string }> {
    const result = await this.repository.createDepartment(department);
    return result;
  }
}
