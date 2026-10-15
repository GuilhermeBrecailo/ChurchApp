import assert from "node:assert/strict";
import { describe, it } from "node:test";

const configModulePath = "../app/utils/departmentScheduleConfig.ts";

async function loadScheduleConfigModule() {
  try {
    return await import(configModulePath);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ERR_MODULE_NOT_FOUND" || code === "MODULE_NOT_FOUND") return null;
    throw error;
  }
}

describe("department schedule presets", () => {
  it("provides a distinct known-block preset for every ministry type", async () => {
    const module = await loadScheduleConfigModule();
    const expectedFields = {
      WORSHIP: { arrival: false, rehearsal: true, songs: true, materials: true, roles: true, checklist: false },
      DEACONATE: { arrival: true, rehearsal: false, songs: false, materials: false, roles: true, checklist: true },
      KIDS: { arrival: true, rehearsal: false, songs: false, materials: true, roles: true, checklist: true },
      RECEPTION: { arrival: true, rehearsal: false, songs: false, materials: false, roles: true, checklist: true },
      MEDIA: { arrival: true, rehearsal: false, songs: false, materials: true, roles: true, checklist: false },
      INTERCESSION: { arrival: true, rehearsal: false, songs: false, materials: false, roles: true, checklist: true },
      OTHER: { arrival: true, rehearsal: true, songs: true, materials: true, roles: true, checklist: true },
    };

    for (const [type, fields] of Object.entries(expectedFields)) {
      assert.deepEqual(module?.getDepartmentSchedulePreset?.(type)?.fields, fields, type);
    }
  });

  it("keeps one Louvor preset while resolving legacy MUSIC identically", async () => {
    const module = await loadScheduleConfigModule();
    const worship = module?.getDepartmentSchedulePreset?.("WORSHIP");
    const music = module?.getDepartmentSchedulePreset?.("MUSIC");

    assert.deepEqual(worship?.roles, [
      "Ministro", "Cantor(a)", "Guitarra", "Baixo", "Violão", "Bateria", "Cajon", "Teclado",
    ]);
    assert.deepEqual(music, worship);
    assert.equal(module?.departmentTypeLabel?.("MUSIC"), "Louvor");
  });

  it("maps legacy MUSIC to the single Louvor option without changing stored data", async () => {
    const module = await loadScheduleConfigModule();

    assert.equal(module?.getDepartmentTypeOptionValue?.("MUSIC"), "WORSHIP");
    assert.equal(module?.getDepartmentTypeOptionValue?.("WORSHIP"), "WORSHIP");
  });

  it("offers one Louvor option, keeps Diaconato, and labels legacy MUSIC without duplicating it", async () => {
    const module = await loadScheduleConfigModule();
    const options = module?.DEPARTMENT_TYPE_OPTIONS ?? [];

    assert.equal(options.filter((option: { label: string }) => option.label === "Louvor").length, 1);
    assert.ok(options.some((option: { value: string }) => option.value === "WORSHIP"));
    assert.ok(options.some((option: { value: string }) => option.value === "DEACONATE"));
    assert.equal(options.some((option: { value: string }) => option.value === "MUSIC"), false);
  });

  it("preserves a customized model when reopening an existing ministry form", async () => {
    const module = await loadScheduleConfigModule();
    const saved = module?.getDepartmentSchedulePreset?.("DEACONATE");
    saved.roles[0] = "Equipe de apoio";
    saved.checklistItems[0].title = "Confirmar equipe";

    const reopened = module?.resolveDepartmentScheduleConfig?.(saved, "WORSHIP");

    assert.equal(reopened?.roles[0], "Equipe de apoio");
    assert.equal(reopened?.checklistItems[0].title, "Confirmar equipe");
    assert.notEqual(reopened, saved);
    assert.notEqual(reopened?.roles, saved.roles);
  });

  it("starts Diaconato with arrival, Dízimo/Recepção/Apoio and optional communion tasks", async () => {
    const module = await loadScheduleConfigModule();
    const config = module?.getDepartmentSchedulePreset?.("DEACONATE");

    assert.deepEqual(config?.roles, ["Dízimo", "Recepção", "Apoio"]);
    assert.equal(config?.fields.arrival, true);
    assert.equal(config?.fields.rehearsal, false);
    assert.equal(config?.communion.enabled, true);
    assert.deepEqual(config?.communion.checklistItems, [
      { templateKey: "COMMUNION_PREPARATION", title: "Preparar a Santa Ceia" },
    ]);
  });

  it("keeps Santa Ceia configuration visible when the regular checklist is disabled", async () => {
    const module = await loadScheduleConfigModule();
    const config = module?.getDepartmentSchedulePreset?.("DEACONATE");
    config.fields.checklist = false;

    assert.deepEqual(module?.getDepartmentScheduleConfigVisibility?.(config), {
      showCommunionSettings: true,
      showCommunionRoles: true,
      showCommunionChecklist: false,
    });
  });

  it("returns independent editable defaults and resolves missing legacy config by type", async () => {
    const module = await loadScheduleConfigModule();
    const first = module?.getDepartmentSchedulePreset?.("DEACONATE");
    first?.roles.push("Rascunho");

    assert.deepEqual(module?.resolveDepartmentScheduleConfig?.(null, "DEACONATE")?.roles, [
      "Dízimo", "Recepção", "Apoio",
    ]);
    assert.deepEqual(module?.resolveDepartmentScheduleConfig?.(undefined, "MUSIC"),
      module?.getDepartmentSchedulePreset?.("WORSHIP"));
  });
});
