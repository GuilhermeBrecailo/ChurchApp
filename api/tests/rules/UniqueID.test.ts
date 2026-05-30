import { UniqueID as DomainUniqueID } from "../../src/domain/value-objects/UniqueID";
import { UniqueID as UtilsUniqueID } from "../../src/domain/value-objects/utils/UniqueID";

describe("UniqueID Value Object", () => {
  it("Deve criar um UniqueID válido do domínio", () => {
    const uniqueId = new DomainUniqueID("abc-123");

    expect(uniqueId.getValue()).toBe("abc-123");
  });

  it("Deve lançar erro se UniqueID do domínio estiver vazio", () => {
    expect(() => {
      new DomainUniqueID("");
    }).toThrow("ID unico invalido");
  });

  it("Deve criar um UniqueID válido de utils", () => {
    const uniqueId = new UtilsUniqueID("xyz-789");

    expect(uniqueId.getValue()).toBe("xyz-789");
  });

  it("Deve lançar erro se UniqueID de utils estiver vazio", () => {
    expect(() => {
      new UtilsUniqueID("");
    }).toThrow("ID unico invalido");
  });
});
