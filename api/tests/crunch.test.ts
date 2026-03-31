import { ChurchDto, Crunch } from "../src/domain/entities/Crunch";
import { DomainError } from "../src/domain/value-objects/utils/DomainError";

const makeValidChurchProps = (): ChurchDto => ({
  id: "any_id",
  name: "Igreja Central",
  slug: "igreja-central",
  isActive: true,
  createdAt: new Date(),
  users: [],
  departaments: ["Jovens", "Música"],
});

describe("Crunch (Church) Entity", () => {
  describe("Success Cases", () => {
    it("should create a new instance with valid data", () => {
      const props = makeValidChurchProps();
      const sut = new Crunch(props);

      expect(sut.getId()).toBe(props.id);
      expect(sut.getName()).toBe(props.name);
      expect(sut.getIsActive()).toBe(true);
      expect(sut.getDepartaments()).toContain("Jovens");
    });

    it("should allow updating the name and slug via setters", () => {
      const sut = new Crunch(makeValidChurchProps());

      sut.setName("Novo Nome");
      sut.setSlug("novo-slug");

      expect(sut.getName()).toBe("Novo Nome");
      expect(sut.getSlug()).toBe("novo-slug");
    });
  });

  describe("Validation (Error) Cases", () => {
    it("should throw DomainError if name is empty in constructor", () => {
      const props = makeValidChurchProps();
      props.name = "   ";

      expect(() => new Crunch(props)).toThrow(
        new DomainError("Nome é obrigatorio"),
      );
    });

    it("should throw DomainError if id is invalid in constructor", () => {
      const props = makeValidChurchProps();
      props.id = "";

      expect(() => new Crunch(props)).toThrow(
        new DomainError("Id não é valido"),
      );
    });

    it("should throw DomainError when trying to set an empty name", () => {
      const sut = new Crunch(makeValidChurchProps());
      expect(() => sut.setName("")).toThrow("Nome é obrigatorio");
    });

    it("should throw DomainError when trying to set an empty slug", () => {
      const sut = new Crunch(makeValidChurchProps());
      expect(() => sut.setSlug("  ")).toThrow("Slug é obrigatorio");
    });

    it("should throw DomainError if getId is called but id is undefined", () => {
      const props = makeValidChurchProps();
      const sut = new Crunch(props);

      (sut as any).id = undefined;

      expect(() => sut.getId()).toThrow(
        "Esse id ainda não foi definido para nenhum contratante",
      );
    });
  });
});
