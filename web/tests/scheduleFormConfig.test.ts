import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { DepartmentScheduleConfig } from "../app/utils/departmentScheduleConfig.ts";

const modulePath = "../app/utils/scheduleFormConfig.ts";

async function loadScheduleFormConfigModule() {
  try {
    return await import(modulePath);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ERR_MODULE_NOT_FOUND" || code === "MODULE_NOT_FOUND") return null;
    throw error;
  }
}

function preset(type: string): DepartmentScheduleConfig {
  const base = {
    version: 1 as const,
    fields: {
      arrival: true,
      rehearsal: false,
      songs: false,
      materials: false,
      roles: true,
      checklist: true,
    },
    roles: ["Dízimo", "Recepção", "Apoio"],
    checklistItems: [{ templateKey: "WATER", title: "Conferir água e copos" }],
    communion: {
      enabled: true,
      roles: ["Separar elementos"],
      checklistItems: [{ templateKey: "COMMUNION", title: "Preparar a Santa Ceia" }],
    },
  };

  if (type === "WORSHIP") {
    return {
      ...base,
      fields: {
        arrival: false,
        rehearsal: true,
        songs: true,
        materials: true,
        roles: true,
        checklist: false,
      },
      roles: ["Ministro", "Teclado"],
      communion: { enabled: false, roles: [], checklistItems: [] },
    };
  }

  return base;
}

describe("schedule form configuration", () => {
  it("shows only the blocks enabled by the department model", async () => {
    const module = await loadScheduleFormConfigModule();
    const definition = module?.getScheduleFormDefinition?.(preset("OTHER"), false);

    assert.deepEqual(definition?.visibleFields, {
      arrival: true,
      rehearsal: false,
      songs: false,
      materials: false,
      roles: true,
      checklist: true,
    });
    assert.deepEqual(definition?.checklistItems, [
      { templateKey: "WATER", title: "Conferir água e copos" },
    ]);
  });

  it("keeps Diaconato arrival and hides rehearsal by default", async () => {
    const module = await loadScheduleFormConfigModule();
    const definition = module?.getScheduleFormDefinition?.(preset("DEACONATE"), false);

    assert.equal(definition?.visibleFields.arrival, true);
    assert.equal(definition?.visibleFields.rehearsal, false);
  });

  it("keeps the Louvor rehearsal, songs, materials and role suggestions", async () => {
    const module = await loadScheduleFormConfigModule();
    const definition = module?.getScheduleFormDefinition?.(preset("WORSHIP"), false);

    assert.deepEqual(definition?.visibleFields, {
      arrival: false,
      rehearsal: true,
      songs: true,
      materials: true,
      roles: true,
      checklist: false,
    });
    assert.deepEqual(definition?.roles, ["Ministro", "Teclado"]);
  });

  it("adds Santa Ceia roles and tasks only when enabled and selected", async () => {
    const module = await loadScheduleFormConfigModule();
    const config = preset("DEACONATE");
    const selected = module?.getScheduleFormDefinition?.(config, true);
    const notSelected = module?.getScheduleFormDefinition?.(config, false);
    const disabled = module?.getScheduleFormDefinition?.({
      ...config,
      communion: { ...config.communion, enabled: false },
    }, true);

    assert.deepEqual(selected?.roles, ["Dízimo", "Recepção", "Apoio", "Separar elementos"]);
    assert.ok(selected?.checklistItems.some((item: { templateKey: string }) => item.templateKey === "COMMUNION"));
    assert.deepEqual(notSelected?.roles, config.roles);
    assert.deepEqual(disabled?.roles, config.roles);
    assert.deepEqual(disabled?.checklistItems, config.checklistItems);
    assert.deepEqual(module?.createScheduleRoleDrafts?.(config, true), [
      { role: "Dízimo", userId: "", isCommunionRole: false },
      { role: "Recepção", userId: "", isCommunionRole: false },
      { role: "Apoio", userId: "", isCommunionRole: false },
      { role: "Separar elementos", userId: "", isCommunionRole: true },
    ]);
  });

  it("blocks saving retained role rows without a person", async () => {
    const module = await loadScheduleFormConfigModule();
    const missing = module?.validateScheduleRoleDrafts?.([
      { role: "Dízimo", userId: "" },
      { role: "Recepção", userId: "volunteer-1" },
      { role: "Apoio", userId: null },
    ]);

    assert.deepEqual(missing, ["Dízimo", "Apoio"]);
  });

  it("recognizes only Santa Ceia-only roles when editing an existing scale", async () => {
    const module = await loadScheduleFormConfigModule();
    const config = preset("DEACONATE");

    assert.equal(module?.isCommunionScheduleRole?.(config, " Separar elementos "), true);
    assert.equal(module?.isCommunionScheduleRole?.(config, "Dízimo"), false);
    assert.equal(module?.isCommunionScheduleRole?.({
      ...config,
      roles: [...config.roles, "Separar elementos"],
    }, "Separar elementos"), false);
    assert.equal(module?.isCommunionScheduleRole?.({
      ...config,
      communion: { ...config.communion, enabled: false },
    }, "Separar elementos"), false);
  });

  it("allows removing unused role rows before validating", async () => {
    const module = await loadScheduleFormConfigModule();
    const retained = [
      { role: "Dízimo", userId: "volunteer-1" },
      { role: "Recepção", userId: "" },
    ].filter((row) => row.role !== "Recepção");

    assert.deepEqual(module?.validateScheduleRoleDrafts?.(retained), []);
  });
});
