import { DomainError } from "../value-objects/utils/DomainError";

export class User {
  private id: string | undefined = undefined;
  private name: string = "";
  private email: string = "";
  private phone: string = "";
  private crunchId?: string;
  private role?: string;

  private createdAt?: Date = new Date();

  constructor(props: UserDto) {
    if (!props.id?.trim()) {
      throw new DomainError("Id não é valido");
    }

    if (props.id) this.id = props.id;
    this.setPhone(props.phone);
    this.createdAt = props.createdAt;
    this.setName(props.name);
    this.setEmail(props.email);
  }

  public getId(): string {
    if (!this.id?.trim()) {
      throw new DomainError(
        "Esse id ainda não foi definido para nenhum contratante",
      );
    }
    return this.id;
  }

  public getName(): string {
    return this.name;
  }

  public getEmail(): string {
    return this.email;
  }

  public getPhone(): string {
    return this.phone;
  }

  public getCrunchId(): string | undefined {
    return this.crunchId;
  }

  public getCreatedAt(): Date | undefined {
    return this.createdAt;
  }

  getRole(): string | undefined {
    return this.role;
  }

  public setName(name: string): void {
    if (!name?.trim()) {
      throw new DomainError("Nome é obrigatorio");
    }
    this.name = name;
  }

  public setEmail(email: string): void {
    if (!email?.trim()) {
      throw new DomainError("Email é obrigatorio");
    }
    this.email = email;
  }

  public setPhone(phone: string) {
    if (!phone?.trim()) {
      throw new DomainError("Telefone é obrigatorio");
    }
    this.phone = phone;
  }

  public setCrunchId(crunchId: string | undefined) {
    if (!crunchId?.trim()) {
      throw new DomainError("Igreja é obrigatorio");
    }
    this.crunchId = crunchId;
  }

  public setRole(role: string | undefined) {
    if (!role?.trim()) {
      throw new DomainError("Cargo é obrigatorio");
    }
    this.role = role;
  }
}

export interface UserDto {
  id?: string;
  name: string;
  email: string;
  phone: string;
  createdAt?: Date;
  Crunch?: string;
  role?: string;
}
