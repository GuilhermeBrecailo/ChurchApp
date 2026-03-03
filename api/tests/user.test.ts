import { User } from "../src/domain/entities/User";
import { DomainError } from "../src/domain/value-objects/utils/DomainError";

describe("User Entity - Casos adicionais", () => {
  const validProps = {
    id: "1",
    name: "Guilherme",
    email: "gui@email.com",
    phone: "11999999999",
  };

  it("Deve criar usuário válido", () => {
    const user = new User(validProps);

    expect(user.getId()).toBe("1");
    expect(user.getName()).toBe("Guilherme");
    expect(user.getEmail()).toBe("gui@email.com");
    expect(user.getPhone()).toBe("11999999999");
  });

  it("Deve lançar erro se phone for vazio no constructor", () => {
    expect(() => {
      new User({
        ...validProps,
        phone: "",
      });
    }).toThrow(DomainError);

    expect(() => {
      new User({
        ...validProps,
        phone: "",
      });
    }).toThrow("Telefone é obrigatorio");
  });

  it("Deve atualizar o nome com setName", () => {
    const user = new User(validProps);
    user.setName("Novo Nome");

    expect(user.getName()).toBe("Novo Nome");
  });

  it("Deve lançar erro ao atualizar nome vazio", () => {
    const user = new User(validProps);

    expect(() => user.setName("")).toThrow(DomainError);
    expect(() => user.setName("")).toThrow("Nome é obrigatorio");
  });

  it("Deve atualizar o email com setEmail", () => {
    const user = new User(validProps);
    user.setEmail("novo@email.com");

    expect(user.getEmail()).toBe("novo@email.com");
  });

  it("Deve lançar erro ao atualizar email vazio", () => {
    const user = new User(validProps);

    expect(() => user.setEmail("")).toThrow(DomainError);
    expect(() => user.setEmail("")).toThrow("Email é obrigatorio");
  });

  it("Deve atualizar o telefone com setPhone", () => {
    const user = new User(validProps);
    user.setPhone("11888888888");

    expect(user.getPhone()).toBe("11888888888");
  });

  it("Deve lançar erro ao atualizar telefone vazio", () => {
    const user = new User(validProps);

    expect(() => user.setPhone("")).toThrow(DomainError);
    expect(() => user.setPhone("")).toThrow("Telefone é obrigatorio");
  });

  it("Deve definir crunch corretamente", () => {
    const user = new User(validProps);
    user.setCrunch("Minha Igreja");

    expect(user.getCrunch()).toBe("Minha Igreja");
  });

  it("Deve lançar erro se crunch for vazio", () => {
    const user = new User(validProps);

    expect(() => user.setCrunch("")).toThrow(DomainError);
    expect(() => user.setCrunch("")).toThrow("Igreja é obrigatorio");
  });

  it("Deve manter createdAt quando informado", () => {
    const date = new Date("2024-01-01");
    const user = new User({
      ...validProps,
      createdAt: date,
    });

    expect(user.getCreatedAt()).toBe(date);
  });

  it("Deve permitir id com espaços ao redor mas não vazio", () => {
    const user = new User({
      id: " 123 ",
      name: "Teste",
      email: "teste@email.com",
      phone: "11999999999",
    });

    expect(user.getId()).toBe(" 123 ");
  });

  it("Deve lançar erro se id for apenas espaços", () => {
    expect(() => {
      new User({
        id: "   ",
        name: "Teste",
        email: "teste@email.com",
        phone: "11999999999",
      });
    }).toThrow("Id não é valido");
  });
});
