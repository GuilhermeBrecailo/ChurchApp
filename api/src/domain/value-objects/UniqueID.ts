export class UniqueID {
  private readonly value: string;

  constructor(value: string) {
    if (!value || value == "") throw new Error("ID unico invalido");

    this.value = value;
  }

  getValue(): string {
    return this.value;
  }
}
