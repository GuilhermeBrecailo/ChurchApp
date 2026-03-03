export class DomainToken extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DomainToken";
  }
}
