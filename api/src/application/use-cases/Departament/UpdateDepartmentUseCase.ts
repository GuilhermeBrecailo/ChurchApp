import { Department } from "../../../domain/entities/Departament";
import { IDepartamentRepository } from "../../../domain/repositories/IDepartamentRepository";

export class UpdateDepartmentUseCase {
  constructor(private repository: IDepartamentRepository) {}

  async execute(department: Department): Promise<void> {
    const result = await this.repository.updateDepartment(department);
    return result;
  }
}
