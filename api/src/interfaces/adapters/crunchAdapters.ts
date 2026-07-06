import { UpdateCrunchService } from "../../application/Services/Crunch/UpdateCrunchService";
import { CreateCrunchUseCase } from "../../application/use-cases/Crunch/CreateCrunchUseCase";
import { DeleteCrunchUseCase } from "../../application/use-cases/Crunch/DeleteCrunchUseCase";
import { GetAllCrunchUseCase } from "../../application/use-cases/Crunch/GetAllCrunchUseCase";
import { GetCrunchByIdUseCase } from "../../application/use-cases/Crunch/GetCrunchByIdUseCase";
import { UpdateCrunchUseCase } from "../../application/use-cases/Crunch/UpdateCrunchUseCase";
import { CrunchRepository } from "../../infrastructure/repositories/CrunchRepository";
import { FastifyRequest } from "fastify/types/request";

// Adicione os imports da sua Entidade e DTO referentes ao Crunch
import { Crunch } from "../../domain/entities/Crunch";

import { Address } from "../../domain/value-objects/Address";
import { Document } from "../../domain/value-objects/Document";
import { User } from "../../domain/entities/User";
import { Department } from "../../domain/entities/Departament";

const crunchRepository = new CrunchRepository();
const createCrunchUseCase = new CreateCrunchUseCase(crunchRepository);
const deleteCrunchUseCase = new DeleteCrunchUseCase(crunchRepository);
const getCrunchByIdUseCase = new GetCrunchByIdUseCase(crunchRepository);
const getAllCrunchUseCase = new GetAllCrunchUseCase(crunchRepository);
const updateCrunchUseCase = new UpdateCrunchUseCase(crunchRepository);

const updateCrunchService = new UpdateCrunchService(
  getCrunchByIdUseCase,
  updateCrunchUseCase,
);

export interface CreateCrunchHttpBody {
  id: string;
  name: string;
  userMainId: string;
  logo: string;
  isActive: boolean;

  city: string;
  road: string;
  number?: string;
  localZipCode: string;
  state: string;
  complement?: string;

  document: Document;

  departaments: {
    id: string;
    name: string;
    leaderId: string;
    isActive?: boolean;
  }[];

  users: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  }[];
}

export class CrunchAdapters {
  async createCrunch(request: FastifyRequest): Promise<{ id: string }> {
    const bodyData = request.body as CreateCrunchHttpBody;

    const novoId = crypto.randomUUID();
    const props = {
      ...bodyData,
      id: novoId,
    };

    const address = Address.create({
      city: bodyData.city ?? "",
      road: bodyData.road ?? "",
      number: bodyData.number ?? "",
      localZipCode: bodyData.localZipCode ?? "",
      state: bodyData.state ?? "",
      complement: bodyData.complement ?? "",
    });

    const document = bodyData.document;

    const users = bodyData.users.map((user) =>
      User.create({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone ?? "",
      }),
    );

    const departaments = bodyData.departaments.map(
      (dept) =>
        new Department({
          id: dept.id,
          name: dept.name,
          leaderId: dept.leaderId,
          isActive: dept.isActive ?? true,
          crunchId: novoId,
        }),
    );

    const crunchEntity = Crunch.create(
      props,
      users,
      address,
      document,
      departaments,
    );

    return await createCrunchUseCase.execute(crunchEntity);
  }

  async deleteCrunch(request: FastifyRequest): Promise<void> {
    const { id } = request.body as { id: string };

    if (!id) {
      throw new Error(
        "O ID da Igreja (Crunch) não foi enviado no corpo da requisição",
      );
    }

    await deleteCrunchUseCase.execute(id);
  }

  async getAllCrunchs(): Promise<Crunch[]> {
    const crunchs = await getAllCrunchUseCase.execute();

    if (!crunchs) {
      throw new Error("Nenhum registro encontrado");
    }

    return crunchs;
  }

  async getCrunchById(request: FastifyRequest): Promise<Crunch | null> {
    const { id } = request.body as { id: string };

    if (!id) {
      throw new Error("O ID não foi enviado no corpo da requisição");
    }

    const crunch = await getCrunchByIdUseCase.execute(id);

    if (!crunch) {
      throw new Error("Registro não encontrado");
    }

    return crunch;
  }

  async updateCrunch(request: FastifyRequest): Promise<void> {
    const bodyData = request.body as CreateCrunchHttpBody;

    if (!bodyData.id) {
      throw new Error("O ID é obrigatório para realizar a atualização.");
    }

    const props = {
      ...bodyData,
    };

    const address = Address.create({
      city: bodyData.city ?? "",
      road: bodyData.road ?? "",
      number: bodyData.number ?? "",
      localZipCode: bodyData.localZipCode ?? "",
      state: bodyData.state ?? "",
      complement: bodyData.complement ?? "",
    });

    const document = bodyData.document;

    const users = bodyData.users.map((user) =>
      User.create({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone ?? "",
      }),
    );

    const departaments = bodyData.departaments.map(
      (dept) =>
        new Department({
          id: dept.id,
          name: dept.name,
          leaderId: dept.leaderId,
          isActive: dept.isActive ?? true,
          crunchId: bodyData.id,
        }),
    );

    await updateCrunchService.handle(
      props,
      users,
      address,
      document,
      departaments,
    );
  }
}
