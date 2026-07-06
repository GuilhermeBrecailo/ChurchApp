import { User } from "../src/domain/entities/User";

describe("User Entity - Casos atualizados com Zod e DDD", () => {
  const validProps = {
    id: "1",
    name: "Guilherme",
    email: "gui@email.com",
    phone: "11999999999",
  };

  it("Deve criar usuário válido utilizando a factory create", () => {
    const user = User.create(validProps);

    expect(user.id).toBe("1");
    expect(user.name).toBe("Guilherme");
    expect(user.email).toBe("gui@email.com");
    expect(user.phone).toBe("11999999999");
    expect(user.createdAt).toBeInstanceOf(Date);
  });

  it("Deve restaurar usuário mantendo o createdAt usando a factory restore", () => {
    const date = new Date("2024-01-01");
    const user = User.restore({
      ...validProps,
      createdAt: date,
    });

    expect(user.createdAt).toBe(date);
  });

  it("Deve lançar erro de validação (Zod) se phone for vazio na criação", () => {
    expect(() => {
      User.create({
        ...validProps,
        phone: "",
      });
    }).toThrow(/Telefone é obrigatório/);
  });

  it("Deve lançar erro de validação (Zod) se nome for vazio ou contiver apenas espaços na criação", () => {
    expect(() => {
      User.create({
        ...validProps,
        name: "   ", // O .trim() do Zod limpará a string e fará o .min(1) falhar
      });
    }).toThrow(/Nome é obrigatório/);
  });

  it("Deve lançar erro de validação (Zod) se email for inválido na criação", () => {
    expect(() => {
      User.create({
        ...validProps,
        email: "email-invalido",
      });
    }).toThrow(/Email inválido/);
  });

  it("Deve atualizar o nome pelo setter nativo", () => {
    const user = User.create(validProps);
    user.name = "Novo Nome";

    expect(user.name).toBe("Novo Nome");
  });

  it("Deve atualizar o email pelo setter nativo (usando Value Object)", () => {
    const user = User.create(validProps);
    user.email = "novo@email.com";

    expect(user.email).toBe("novo@email.com");
  });

  it("Deve atualizar o telefone pelo setter nativo", () => {
    const user = User.create(validProps);
    user.phone = "11888888888";

    expect(user.phone).toBe("11888888888");
  });

  it("Deve definir a igreja (crunchId) corretamente pelo setter nativo", () => {
    const user = User.create(validProps);
    user.crunchId = "Minha Igreja";

    expect(user.crunchId).toBe("Minha Igreja");
  });

  it("Deve lançar erro se tentar criar sem ID (pois no schema atual é obrigatório)", () => {
    expect(() => {
      User.create({
        ...validProps,
        id: "",
      });
    }).toThrow(/Id não é válido/);
  });

  it("Deve permitir restaurar com id contendo espaços ao redor, mas preservar ou falhar de acordo com o Zod", () => {
    // Como no schema o ID não tem `.trim()`, ele aceita com espaços desde que não seja vazio.
    const user = User.restore({
      ...validProps,
      id: " 123 ",
    });

    expect(user.id).toBe(" 123 ");
  });
});
