import {
  DEPARTMENT_MODULES,
  normalizeDepartmentModules,
  parseDepartmentModules,
} from "../src/application/Services/Department/DepartmentModules";

const fail = (message: string): never => {
  throw new Error(message);
};

describe("normalizeDepartmentModules", () => {
  it("treats an empty list as every module enabled", () => {
    expect(normalizeDepartmentModules([])).toEqual([...DEPARTMENT_MODULES]);
    expect(normalizeDepartmentModules(null)).toEqual([...DEPARTMENT_MODULES]);
    expect(normalizeDepartmentModules(undefined)).toEqual([...DEPARTMENT_MODULES]);
  });

  it("keeps only known modules, in canonical order", () => {
    expect(normalizeDepartmentModules(["SONGS", "SCHEDULES", "UNKNOWN"])).toEqual([
      "SCHEDULES",
      "SONGS",
    ]);
  });
});

describe("parseDepartmentModules", () => {
  it("returns undefined when the field was not sent", () => {
    expect(parseDepartmentModules(undefined, fail)).toBeUndefined();
  });

  it("filters unknown values", () => {
    expect(parseDepartmentModules(["TASKS", "NOPE"], fail)).toEqual(["TASKS"]);
  });

  it("rejects a non-array payload", () => {
    expect(() => parseDepartmentModules("SONGS", fail)).toThrow(
      "Modulos do ministerio invalidos",
    );
  });

  it("rejects an empty selection", () => {
    expect(() => parseDepartmentModules([], fail)).toThrow(
      "Selecione ao menos um modulo para o ministerio",
    );
    expect(() => parseDepartmentModules(["NOPE"], fail)).toThrow(
      "Selecione ao menos um modulo para o ministerio",
    );
  });
});
