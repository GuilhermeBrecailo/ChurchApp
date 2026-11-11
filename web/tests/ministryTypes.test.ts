import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildCreateMinistryPayload,
  canonicalMinistryType,
  COMMON_MINISTRY_TYPES,
  MINISTRY_TYPES,
  ministryModuleLabel,
  ministryTypeInfo,
  resolveMinistryModules,
} from "../app/utils/ministryTypes";
import {
  departmentTypeLabel,
  getDepartmentSchedulePreset,
} from "../app/utils/departmentScheduleConfig";

describe("tipos de ministério", () => {
  it("cada tipo nasce só com as abas certas", () => {
    const modules = Object.fromEntries(
      MINISTRY_TYPES.map((type) => [type.value, type.defaultModules]),
    );
    assert.deepEqual(modules, {
      WORSHIP: ["SCHEDULES", "SONGS", "RESOURCES"],
      KIDS: ["SCHEDULES", "CLASSES"],
      RECEPTION: ["SCHEDULES"],
      MEDIA: ["SCHEDULES", "RESOURCES"],
      INTERCESSION: ["SCHEDULES"],
      DEACONATE: ["SCHEDULES"],
      OTHER: ["SCHEDULES", "TASKS"],
    });
  });

  it("usa o mesmo rótulo de departmentTypeLabel (Mídia, não Sonoplastia)", () => {
    for (const type of MINISTRY_TYPES) {
      assert.equal(type.label, departmentTypeLabel(type.value));
      assert.ok(type.description.length > 10, type.value);
      assert.ok(type.icon, type.value);
    }
    assert.equal(ministryTypeInfo("MEDIA").label, "Mídia");
  });

  it("trata MUSIC antigo como Louvor e tipo desconhecido como Outro", () => {
    assert.equal(canonicalMinistryType("MUSIC"), "WORSHIP");
    assert.equal(canonicalMinistryType("qualquer"), "OTHER");
    assert.equal(canonicalMinistryType(undefined), "OTHER");
    assert.equal(ministryTypeInfo("music").icon, "Music");
  });

  it("atalho dos mais comuns cria Louvor, Recepção e Infantil", () => {
    assert.deepEqual(
      COMMON_MINISTRY_TYPES.map((type) => ministryTypeInfo(type).suggestedName),
      ["Louvor", "Recepção", "Infantil"],
    );
  });

  it("ministério antigo sem abas salvas continua com tudo ligado, na ordem", () => {
    assert.deepEqual(resolveMinistryModules([]), ["SCHEDULES", "SONGS", "RESOURCES", "CLASSES", "TASKS"]);
    assert.deepEqual(resolveMinistryModules(null), resolveMinistryModules(undefined));
    assert.deepEqual(resolveMinistryModules(["TASKS", "SCHEDULES", "X"]), ["SCHEDULES", "TASKS"]);
    assert.equal(ministryModuleLabel("RESOURCES"), "Materiais");
    assert.equal(ministryModuleLabel("SONGS"), "Repertório");
  });
});

describe("buildCreateMinistryPayload", () => {
  it("usa nome sugerido, abas e modelo de escala do tipo", () => {
    const payload = buildCreateMinistryPayload({ type: "WORSHIP", leaderId: "user-1" });
    assert.deepEqual(payload, {
      name: "Louvor",
      type: "WORSHIP",
      leaderId: "user-1",
      modules: ["SCHEDULES", "SONGS", "RESOURCES"],
      scheduleConfig: getDepartmentSchedulePreset("WORSHIP"),
    });
  });

  it("respeita o nome digitado e as abas personalizadas", () => {
    const config = getDepartmentSchedulePreset("KIDS");
    config.roles = ["Tia"];
    const payload = buildCreateMinistryPayload({
      type: "KIDS",
      name: "  Kids Zone ",
      leaderId: "user-2",
      modules: ["TASKS", "SCHEDULES"],
      scheduleConfig: config,
    });
    assert.equal(payload.name, "Kids Zone");
    assert.deepEqual(payload.modules, ["SCHEDULES", "TASKS"]);
    assert.deepEqual(payload.scheduleConfig.roles, ["Tia"]);
  });

  it("Outro não tem nome sugerido: fica vazio para a pessoa digitar", () => {
    assert.equal(buildCreateMinistryPayload({ type: "OTHER", leaderId: "u" }).name, "");
  });
});
