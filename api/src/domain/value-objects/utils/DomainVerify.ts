export class DomainVerify extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DomainVerify";
  }
}
