import { FastifyRequest } from "fastify";
import { CreateCrunchUseCase } from "../../application/use-cases/Crunch/CreateCrunchUseCase";
import { DeleteCrunchUseCase } from "../../application/use-cases/Crunch/DeleteCrunchUseCase";
import { GetAllCrunchUseCase } from "../../application/use-cases/Crunch/GetAllCrunchUseCase";
import { GetCrunchByIdUseCase } from "../../application/use-cases/Crunch/GetCrunchByIdUseCase";
import { UpdateCrunchUseCase } from "../../application/use-cases/Crunch/UpdateCrunchUseCase";
import { JwtDecoded } from "../plugins/FakeAuth";
import { User } from "../../domain/entities/User";
import { Crunch } from "../../domain/entities/Crunch";
import { UpdateCrunchService } from "../../application/Services/User/UpdateCrunchService";

export class CrunchController {
  constructor(
    private createCrunchUseCase: CreateCrunchUseCase,
    private deleteCrunchUseCase: DeleteCrunchUseCase,
    private getAllCrunchUseCase: GetAllCrunchUseCase,
    private getCrunchByIdUseCase: GetCrunchByIdUseCase,
    private updateCrunchService: UpdateCrunchService,
  ) {}

  async create(request: FastifyRequest): Promise<{ id: string }> {
    console.log("Request body:", request.body);
    const { id } = request.user as JwtDecoded;
    const { name, slug, isActive } = request.body as {
      name: string;
      slug: string;
      isActive: boolean;
    };
    const crunch = new Crunch({
      id,
      name,
      slug,
      isActive,
      createdAt: new Date(),
      users: [],
      departaments: [],
    });

    return await this.createCrunchUseCase.execute(crunch);
  }

  async delete(request: FastifyRequest): Promise<{ success: boolean }> {
    const { id } = request.body as { id: string };

    await this.deleteCrunchUseCase.execute(id);

    return { success: true };
  }

  async get(request: FastifyRequest): Promise<{
    id: string;
    name: string;
    slug: string;
    isActive: boolean;
    createdAt: Date;
    user?: User[];
    departaments?: any[];
  }> {
    const { id } = request.body as { id: string };

    return await this.getCrunchByIdUseCase.execute(id);
  }

  async getAll(): Promise<Crunch[]> {
    return await this.getAllCrunchUseCase.execute();
  }

  async update(request: FastifyRequest): Promise<void> {
    const { id } = request.body as { id: string };
    const { name, slug, isActive } = request.body as {
      name: string;
      slug: string;
      isActive: boolean;
    };

    await this.updateCrunchService.handle({
      id,
      name,
      slug,
      isActive,
    });
  }
}
