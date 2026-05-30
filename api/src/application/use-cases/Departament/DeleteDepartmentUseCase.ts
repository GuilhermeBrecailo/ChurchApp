import { IDepartamentRepository } from "../../../domain/repositories/IDepartamentRepository";

export class DeleteDepartmentUseCase {
  constructor(private repository: IDepartamentRepository) {}

  async execute(id: string): Promise<void> {
    const result = await this.repository.deleteDepartment(id);
    return result;
  }
}
