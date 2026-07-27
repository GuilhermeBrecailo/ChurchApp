import { GetCrunchByIdUseCase } from "../../use-cases/Crunch/GetCrunchByIdUseCase";
import { UpdateCrunchUseCase } from "../../use-cases/Crunch/UpdateCrunchUseCase";
import { User } from "../../../domain/entities/User";
import { Address } from "../../../domain/value-objects/Address";
import { Document } from "../../../domain/value-objects/Document";
import { Department } from "../../../domain/entities/Departament";

interface UpdateCrunchProps {
  id: string;
  name: string;
  slug: string;
  accentColor?: string | null;
  userMainId: string;
  logo: string;
  isActive: boolean;
}

export class UpdateCrunchService {
  constructor(
    private getCrunchByIdUseCase: GetCrunchByIdUseCase,
    private updateCrunchUseCase: UpdateCrunchUseCase,
  ) {}

  async handle(
    props: UpdateCrunchProps,
    users: User[],
    address: Address,
    document: Document,
    departaments: Department[],
  ) {
    // 1. Busca a entidade existente no banco
    const crunch = await this.getCrunchByIdUseCase.execute(props.id);

    if (!crunch || !crunch.id) {
      throw new Error("Não existe nenhuma Igreja (Crunch) com este ID");
    }

    crunch.name = props.name;
    crunch.slug = props.slug;
    crunch.accentColor = props.accentColor;
    crunch.userMainId = props.userMainId;
    crunch.logo = props.logo;
    crunch.isActive = props.isActive;

    crunch.address = address;
    crunch.document = document;

    crunch.users = users;
    crunch.departaments = departaments;

    await this.updateCrunchUseCase.execute(crunch);
  }
}
