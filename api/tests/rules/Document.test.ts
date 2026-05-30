import { Document } from "../../src/domain/value-objects/Document";

describe("Document Value Object", () => {
  it("Deve criar um CPF válido removendo máscara", () => {
    const document = new Document("529.982.247-25");

    expect(document.documento).toBe("52998224725");
  });

  it("Deve criar um CNPJ válido removendo máscara", () => {
    const document = new Document("04.252.011/0001-10");

    expect(document.documento).toBe("04252011000110");
  });

  it("Deve lançar erro se documento estiver vazio", () => {
    expect(() => {
      new Document("   ");
    }).toThrow("Documento não é válido");
  });

  it("Deve lançar erro se documento não tiver 11 ou 14 dígitos", () => {
    expect(() => {
      new Document("123456789");
    }).toThrow("Documento deve conter 11 ou 14 dígitos");
  });

  it("Deve lançar erro se CPF tiver todos os dígitos iguais", () => {
    expect(() => {
      new Document("111.111.111-11");
    }).toThrow("CPF inválido");
  });

  it("Deve lançar erro se CPF tiver dígitos verificadores inválidos", () => {
    expect(() => {
      new Document("529.982.247-24");
    }).toThrow("CPF inválido");
  });

  it("Deve lançar erro se CNPJ tiver todos os dígitos iguais", () => {
    expect(() => {
      new Document("11.111.111/1111-11");
    }).toThrow("CNPJ inválido");
  });

  it("Deve lançar erro se CNPJ tiver dígitos verificadores inválidos", () => {
    expect(() => {
      new Document("04.252.011/0001-11");
    }).toThrow("CNPJ inválido");
  });
});
