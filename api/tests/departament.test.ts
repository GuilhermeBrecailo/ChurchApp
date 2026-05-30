import {
  Department,
  departmentSchema,
} from "../src/domain/entities/Departament";

const validDepartmentProps = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  crunchId: "550e8400-e29b-41d4-a716-446655440001",
  name: "Louvor",
  leaderId: "550e8400-e29b-41d4-a716-446655440002",
  isActive: true,
};

describe("Department Entity", () => {
  it("Deve criar um departamento válido", () => {
    const department = new Department(validDepartmentProps);

    expect(department.id).toBe(validDepartmentProps.id);
    expect(department.crunchId).toBe(validDepartmentProps.crunchId);
    expect(department.name).toBe("Louvor");
    expect(department.leaderId).toBe(validDepartmentProps.leaderId);
    expect(department.isActive).toBe(true);
  });

  it("Deve atualizar propriedades pelos setters nativos", () => {
    const department = new Department(validDepartmentProps);

    department.id = "550e8400-e29b-41d4-a716-446655440003";
    department.crunchId = "550e8400-e29b-41d4-a716-446655440004";
    department.name = "Recepção";
    department.leaderId = "550e8400-e29b-41d4-a716-446655440005";
    department.isActive = false;

    expect(department.id).toBe("550e8400-e29b-41d4-a716-446655440003");
    expect(department.crunchId).toBe("550e8400-e29b-41d4-a716-446655440004");
    expect(department.name).toBe("Recepção");
    expect(department.leaderId).toBe("550e8400-e29b-41d4-a716-446655440005");
    expect(department.isActive).toBe(false);
  });

  it("Deve validar dados pelo schema e aplicar isActive default", () => {
    const data = departmentSchema.parse({
      id: validDepartmentProps.id,
      crunchId: validDepartmentProps.crunchId,
      name: "  Intercessão  ",
      leaderId: validDepartmentProps.leaderId,
    });

    expect(data.name).toBe("Intercessão");
    expect(data.isActive).toBe(true);
  });

  it("Deve lançar erro se id for inválido", () => {
    expect(() => {
      departmentSchema.parse({
        ...validDepartmentProps,
        id: "id_invalido",
      });
    }).toThrow();
  });

  it("Deve lançar erro se crunchId for inválido", () => {
    expect(() => {
      departmentSchema.parse({
        ...validDepartmentProps,
        crunchId: "crunch_invalido",
      });
    }).toThrow();
  });

  it("Deve lançar erro se leaderId for inválido", () => {
    expect(() => {
      departmentSchema.parse({
        ...validDepartmentProps,
        leaderId: "lider_invalido",
      });
    }).toThrow();
  });

  it("Deve lançar erro se name for vazio", () => {
    expect(() => {
      departmentSchema.parse({
        ...validDepartmentProps,
        name: "   ",
      });
    }).toThrow(/Nome do ministério é obrigatório/);
  });
});
