import { Crunch, CrunchDTO } from "../src/domain/entities/Crunch";
import { User } from "../src/domain/entities/User";
import { Address } from "../src/domain/value-objects/Address";
import { Document } from "../src/domain/value-objects/Document";
import { Department } from "../src/domain/entities/Departament";

const mockUsers: User[] = [];
const mockAddress = {} as Address;
const mockDocument = {} as Document;
const mockDepartments: Department[] = [];

const makeValidCrunchProps = (): Omit<CrunchDTO, "createdAt"> => ({
  id: "any_id",
  name: "Igreja Central",
  userMainId: "user_123",
  logo: "https://minhalogo.com/logo.png",
  isActive: true,
});

describe("Crunch (Church) Entity - Casos atualizados com Zod e DDD", () => {
  describe("Success Cases", () => {
    it("should create a new instance with valid data using create factory", () => {
      const props = makeValidCrunchProps();
      const sut = Crunch.create(
        props,
        mockUsers,
        mockAddress,
        mockDocument,
        mockDepartments,
      );

      expect(sut.id).toBe(props.id);
      expect(sut.name).toBe(props.name);
      expect(sut.logo).toBe(props.logo);
      expect(sut.isActive).toBe(true);
      expect(sut.departaments).toEqual([]);
      expect(sut.createdAt).toBeInstanceOf(Date);
    });

    it("should allow updating properties via native setters", () => {
      const sut = Crunch.create(
        makeValidCrunchProps(),
        mockUsers,
        mockAddress,
        mockDocument,
        mockDepartments, // 5º argumento adicionado
      );

      sut.name = "Novo Nome";
      sut.logo = "https://nova-logo.com/img.png";
      sut.isActive = false;

      expect(sut.name).toBe("Novo Nome");
      expect(sut.logo).toBe("https://nova-logo.com/img.png");
      expect(sut.isActive).toBe(false);
    });

    it("should allow setting departments via setter", () => {
      const sut = Crunch.create(
        makeValidCrunchProps(),
        mockUsers,
        mockAddress,
        mockDocument,
        mockDepartments, // 5º argumento adicionado
      );
      const depMock = { name: "Louvor" } as Department;

      sut.departaments = [depMock];

      expect(sut.departaments).toHaveLength(1);
      expect(sut.departaments[0].name).toBe("Louvor");
    });
  });

  describe("Validation (Error) Cases", () => {
    it("should throw validation error if name is empty (trim check)", () => {
      const props = makeValidCrunchProps();
      props.name = "   ";

      expect(() =>
        Crunch.create(
          props,
          mockUsers,
          mockAddress,
          mockDocument,
          mockDepartments,
        ),
      ).toThrow(/Nome é obrigatório/);
    });

    it("should throw validation error if id is invalid", () => {
      const props = makeValidCrunchProps();
      props.id = "";

      expect(() =>
        Crunch.create(
          props,
          mockUsers,
          mockAddress,
          mockDocument,
          mockDepartments,
        ),
      ).toThrow(/Id não é válido/);
    });

    it("should throw validation error if userMainId is empty", () => {
      const props = makeValidCrunchProps();
      props.userMainId = "  ";

      expect(() =>
        Crunch.create(
          props,
          mockUsers,
          mockAddress,
          mockDocument,
          mockDepartments,
        ),
      ).toThrow(/Id do usuário principal é obrigatório/);
    });

    it("should throw error during restore if id is missing", () => {
      const props: Partial<Omit<CrunchDTO, "createdAt">> = makeValidCrunchProps();
      delete props.id;

      expect(() =>
        Crunch.restore(
          props as Omit<CrunchDTO, "createdAt">,
          mockUsers,
          mockAddress,
          mockDocument,
          mockDepartments,
        ),
      ).toThrow();
    });
  });
});
