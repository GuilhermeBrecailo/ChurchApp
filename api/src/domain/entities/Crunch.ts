import { DomainError } from "../value-objects/utils/DomainError";
import { UserDto } from "./User";

export class Crunch {
  private id?: string;
  private name: string = "";
  private slug: string = "";
  private isActive: boolean = false;

  private createdAt?: Date = new Date();

  private users: UserDto[] = [];
  private departaments: string[] = [];

  constructor(props: ChurchDto) {
    if (!props.name?.trim()) {
      throw new DomainError("Nome é obrigatorio");
    }

    if (!props.id?.trim()) {
      throw new DomainError("Id não é valido");
    }

    if (props.id) this.id = props.id;
    this.setName(props.name);
    this.setSlug(props.slug);
    this.setIsActive(props.isActive);
    this.users = props.users || [];
    this.departaments = props.departaments || [];
    this.createdAt = props.createdAt;
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

  public getSlug(): string {
    return this.slug;
  }

  public getIsActive(): boolean {
    return this.isActive;
  }

  public getUsers(): UserDto[] {
    return this.users;
  }

  public getDepartaments(): string[] {
    return this.departaments;
  }

  public getCreatedAt(): Date | undefined {
    return this.createdAt;
  }

  public setName(name: string): void {
    if (!name?.trim()) {
      throw new DomainError("Nome é obrigatorio");
    }
    this.name = name;
  }

  public setSlug(slug: string): void {
    if (!slug?.trim()) {
      throw new DomainError("Slug é obrigatorio");
    }
    this.slug = slug;
  }

  public setIsActive(isActive: boolean): void {
    this.isActive = isActive;
  }
}

export interface ChurchDto {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: Date;

  users?: UserDto[];
  departaments?: string[];
}
