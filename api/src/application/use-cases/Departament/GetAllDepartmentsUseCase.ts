import { Department } from "../../../domain/entities/Departament";
import { IDepartamentRepository } from "../../../domain/repositories/IDepartamentRepository";

export class GetAllDepartmentsUseCase {
  constructor(private repository: IDepartamentRepository) {}

  async execute(): Promise<Department[]> {
    const result = await this.repository.getAllDepartments();
    return result;
  }
}
