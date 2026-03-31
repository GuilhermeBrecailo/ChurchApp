import { UpdateCrunchService } from "../../application/Services/User/UpdateCrunchService";
import { CreateCrunchUseCase } from "../../application/use-cases/Crunch/CreateCrunchUseCase";
import { DeleteCrunchUseCase } from "../../application/use-cases/Crunch/DeleteCrunchUseCase";
import { GetAllCrunchUseCase } from "../../application/use-cases/Crunch/GetAllCrunchUseCase";
import { GetCrunchByIdUseCase } from "../../application/use-cases/Crunch/GetCrunchByIdUseCase";
import { UpdateCrunchUseCase } from "../../application/use-cases/Crunch/UpdateCrunchUseCase";
import { CrunchRepository } from "../../infrastructure/repositories/CrunchRepository";
import { CrunchController } from "../controllers/CrunchController";

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

const crunchController = new CrunchController(
  createCrunchUseCase,
  deleteCrunchUseCase,
  getAllCrunchUseCase,
  getCrunchByIdUseCase,
  updateCrunchService,
);

export class CrunchAdapters {
  constructor() {}

  async createCrunch() {
    return crunchController.create;
  }
  async deleteCrunch() {
    return crunchController.delete;
  }
  async getCrunchById() {
    return crunchController.get;
  }
  async getAllCrunchs() {
    return crunchController.getAll;
  }
  async updateCrunch() {
    return crunchController.update;
  }
}
