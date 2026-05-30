import { FastifyRequest } from "fastify/types/request";

import { Department } from "../../domain/entities/Departament";
import { DepartmentRepository } from "../../infrastructure/repositories/DepartamentRepository";
import { CreateDepartmentUseCase } from "../../application/use-cases/Departament/CreateDepartmentUseCase";
import { DeleteDepartmentUseCase } from "../../application/use-cases/Departament/DeleteDepartmentUseCase";
import { GetDepartmentByIdUseCase } from "../../application/use-cases/Departament/GetDepartmentByIdUseCase";
import { GetAllDepartmentsUseCase } from "../../application/use-cases/Departament/GetAllDepartmentsUseCase";
import { GetDepartmentsByCrunchIdUseCase } from "../../application/use-cases/Departament/GetDepartmentsByCrunchIdUseCase";
import { UpdateDepartmentUseCase } from "../../application/use-cases/Departament/UpdateDepartmentUseCase";
import { UpdateDepartmentService } from "../../application/Services/Departament/UpdateDepartamentService";

const departmentRepository = new DepartmentRepository();
const createDepartmentUseCase = new CreateDepartmentUseCase(
  departmentRepository,
);
const deleteDepartmentUseCase = new DeleteDepartmentUseCase(
  departmentRepository,
);
const getDepartmentByIdUseCase = new GetDepartmentByIdUseCase(
  departmentRepository,
);
const getAllDepartmentsUseCase = new GetAllDepartmentsUseCase(
  departmentRepository,
);
const getDepartmentsByCrunchIdUseCase = new GetDepartmentsByCrunchIdUseCase(
  departmentRepository,
);
const updateDepartmentUseCase = new UpdateDepartmentUseCase(
  departmentRepository,
);

const updateDepartmentService = new UpdateDepartmentService(
  getDepartmentByIdUseCase,
  updateDepartmentUseCase,
);

export interface CreateDepartmentHttpBody {
  id?: string;
  crunchId: string;
  name: string;
  leaderId: string;
  isActive?: boolean;
}

export class DepartmentAdapters {
  async createDepartment(request: FastifyRequest): Promise<{ id: string }> {
    const bodyData = request.body as CreateDepartmentHttpBody;

    if (!bodyData.crunchId || !bodyData.name || !bodyData.leaderId) {
      throw new Error(
        "crunchId, name e leaderId são obrigatórios para criar um departamento.",
      );
    }

    const novoId = crypto.randomUUID();

    const departmentEntity = new Department({
      id: novoId,
      crunchId: bodyData.crunchId,
      name: bodyData.name,
      leaderId: bodyData.leaderId,
      isActive: bodyData.isActive ?? true,
    });

    return await createDepartmentUseCase.execute(departmentEntity);
  }

  async deleteDepartment(request: FastifyRequest): Promise<void> {
    const { id } = request.body as { id: string };

    if (!id) {
      throw new Error(
        "O ID do Departamento não foi enviado no corpo da requisição.",
      );
    }

    await deleteDepartmentUseCase.execute(id);
  }

  async getAllDepartments(): Promise<Department[]> {
    const departments = await getAllDepartmentsUseCase.execute();

    if (!departments) {
      throw new Error("Nenhum registro encontrado.");
    }

    return departments;
  }

  async getDepartmentById(request: FastifyRequest): Promise<Department | null> {
    const { id } = request.body as { id: string };

    if (!id) {
      throw new Error("O ID não foi enviado no corpo da requisição.");
    }

    const department = await getDepartmentByIdUseCase.execute(id);

    if (!department) {
      throw new Error("Registro não encontrado.");
    }

    return department;
  }

  async getDepartmentsByCrunchId(
    request: FastifyRequest,
  ): Promise<Department[]> {
    const { crunchId } = request.body as { crunchId: string };

    if (!crunchId) {
      throw new Error("O crunchId não foi enviado no corpo da requisição.");
    }

    const departments = await getDepartmentsByCrunchIdUseCase.execute(crunchId);

    if (!departments) {
      throw new Error("Nenhum departamento encontrado para esta igreja.");
    }

    return departments;
  }

  async updateDepartment(request: FastifyRequest): Promise<void> {
    const bodyData = request.body as CreateDepartmentHttpBody;

    if (!bodyData.id) {
      throw new Error("O ID é obrigatório para realizar a atualização.");
    }

    const props = {
      id: bodyData.id,
      crunchId: bodyData.crunchId,
      name: bodyData.name,
      leaderId: bodyData.leaderId,
      isActive: bodyData.isActive ?? true,
    };

    await updateDepartmentService.handle(props);
  }
}
