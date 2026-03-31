import { GetCrunchByIdUseCase } from "../../use-cases/Crunch/GetCrunchByIdUseCase";
import { UpdateCrunchUseCase } from "../../use-cases/Crunch/UpdateCrunchUseCase";

export class UpdateCrunchService {
  constructor(
    private getCrunchByIdUseCase: GetCrunchByIdUseCase,
    private updateCrunchUseCase: UpdateCrunchUseCase,
  ) {}

  async handle(props: {
    id: string;
    name: string;
    slug: string;
    isActive: boolean;
  }) {
    const crunch = await this.getCrunchByIdUseCase.execute(props.id);
    if (!crunch || !crunch.id) {
      throw new Error("nao existe nenhum crunch com este ID");
    }

    crunch.name = props.name;
    crunch.slug = props.slug;
    crunch.isActive = props.isActive;

    await this.updateCrunchUseCase.execute(crunch);
  }
}
