import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applyCommunionToggle,
  buildEditorRows,
  buildSchedulePayload,
  buildUnavailableProfileUpdate,
  composeDeclineReason,
  draftFromSchedule,
  personBadges,
  rowsToAssignmentsPayload,
  suggestScheduleTitle,
  validateDraft,
} from "../app/utils/scheduleEditor.ts";
import type { DepartmentScheduleConfig } from "../app/utils/departmentScheduleConfig.ts";

const config: DepartmentScheduleConfig = {
  version: 1,
  fields: { arrival: true, rehearsal: true, songs: true, materials: false, roles: true, checklist: true },
  roles: ["Ministro", "Teclado", "Vocal"],
  checklistItems: [],
  communion: { enabled: true, roles: ["Ceia: pão", "Teclado"], checklistItems: [] },
};

describe("linhas da equipe", () => {
  it("começa com as funções do modelo", () => {
    const rows = buildEditorRows(config, false);
    assert.deepEqual(rows.map((row) => row.role), ["Ministro", "Teclado", "Vocal"]);
    assert.ok(rows.every((row) => !row.userId));
  });

  it("Santa Ceia acrescenta só as funções próprias dela e tira ao desligar", () => {
    const rows = applyCommunionToggle(buildEditorRows(config, false), config, true);
    assert.deepEqual(rows.map((row) => row.role), ["Ministro", "Teclado", "Vocal", "Ceia: pão"]);
    assert.deepEqual(applyCommunionToggle(rows, config, false).map((row) => row.role), ["Ministro", "Teclado", "Vocal"]);
  });

  it("encaixa quem já está na escala; o formato antigo 'A · B' vira duas linhas", () => {
    const rows = buildEditorRows(config, false, [
      { id: "a1", userId: "ana", role: "Teclado · Vocal" },
      { id: "a2", userId: "bia", role: "Baixo" },
    ]);
    const filled = rows.filter((row) => row.userId);
    assert.deepEqual(
      filled.map((row) => [row.role, row.userId, row.assignmentId ?? null]),
      [
        ["Teclado", "ana", "a1"],
        ["Vocal", "ana", null],
        ["Baixo", "bia", "a2"],
      ],
    );
  });

  it("payload: uma linha por função, sem pessoa vazia nem repetição", () => {
    const rows = buildEditorRows(config, false, [{ id: "a1", userId: "ana", role: "Teclado" }]);
    rows[2].userId = "ana"; // Vocal também
    rows.push({ ...rows[2], key: "dup" });
    assert.deepEqual(rowsToAssignmentsPayload(rows), [
      { id: "a1", userId: "ana", role: "Teclado" },
      { userId: "ana", role: "Vocal" },
    ]);
  });
});

describe("avisos que não bloqueiam", () => {
  it("indisponível e já em outro ministério no mesmo culto", () => {
    const badges = personBadges("ana", {
      conflicts: [
        { userId: "ana", departmentName: "Mídia", role: "Projeção" },
        { userId: "ana", departmentName: "Mídia", role: "Som" },
      ],
      unavailableUserIds: ["ana"],
    });
    assert.deepEqual(badges.map((badge) => badge.text), ["Indisponível nesta data", "Já está no Mídia neste culto"]);
    assert.deepEqual(personBadges("bia", { conflicts: [], unavailableUserIds: [] }), []);
  });
});

describe("rascunho e envio", () => {
  const source = {
    id: "s1",
    date: "2026-11-15T19:00:00",
    arrivalAt: "2026-11-15T18:15:00",
    rehearsalAt: "2026-11-13T20:00:00",
    rehearsalNotes: "Trazer cabo",
    description: "Culto · Louvor",
    departmentId: "louvor",
    serviceOccurrenceId: "occ-1",
    isCommunionService: false,
    assignments: [{ id: "a1", userId: "ana", role: "Teclado", user: { id: "ana", name: "Ana" } }],
    mediaItems: [
      { id: "m2", mediaItemId: "song-2", order: 1, mediaItem: { id: "song-2", title: "B", category: "MUSIC" } },
      { id: "m1", mediaItemId: "song-1", order: 0, mediaItem: { id: "song-1", title: "A", category: "MUSIC" } },
    ],
  };

  it("editar mantém ids; copiar não leva data, culto nem ids", () => {
    const edit = draftFromSchedule(source, config, "edit");
    assert.equal(edit.date, "2026-11-15");
    assert.equal(edit.arrivalTime, "18:15");
    assert.deepEqual(edit.songIds, ["song-1", "song-2"]);
    assert.equal(edit.rows.find((row) => row.userId === "ana")?.assignmentId, "a1");

    const copy = draftFromSchedule(source, config, "copy");
    assert.equal(copy.date, "");
    assert.equal(copy.serviceOccurrenceId, "");
    assert.equal(copy.rows.find((row) => row.userId === "ana")?.assignmentId, undefined);
  });

  it("salvar manda a equipe junto, numa chamada", () => {
    const draft = draftFromSchedule(source, config, "edit");
    const payload = buildSchedulePayload(draft, config);
    assert.deepEqual(payload.assignments, [{ id: "a1", userId: "ana", role: "Teclado" }]);
    assert.equal(payload.serviceOccurrenceId, "occ-1");
    assert.equal(payload.rehearsalTime, "20:00");
    assert.equal("resourceIds" in payload, false);
    assert.equal(payload.isCommunionService, false);
  });

  it("validação mínima", () => {
    const draft = draftFromSchedule(source, config, "copy");
    assert.equal(validateDraft(draft), "Escolha o culto ou a data.");
    assert.equal(validateDraft({ ...draft, date: "2026-11-22" }), "");
  });

  it("título sugerido", () => {
    assert.equal(suggestScheduleTitle({ serviceLabel: "Culto da Família", departmentName: "Louvor" }), "Culto da Família · Louvor");
    assert.equal(suggestScheduleTitle({ departmentName: "Mídia" }), "Escala Mídia");
  });
});

describe("Não posso", () => {
  it("motivo com chip e texto", () => {
    assert.equal(composeDeclineReason("Trabalho", " plantão "), "Trabalho: plantão");
    assert.equal(composeDeclineReason(null, "x"), "x");
    assert.equal(composeDeclineReason("Saúde", ""), "Saúde");
  });

  it("marcar a data como indisponível reenvia o perfil como está", () => {
    assert.deepEqual(
      buildUnavailableProfileUpdate(
        { phone: "41999", profileSuggestion: null, primaryDepartmentId: "louvor", ministryFunction: "Teclado", unavailableDates: ["2026-12-25"] },
        "2026-11-15",
      ),
      {
        phone: "41999",
        profileSuggestion: "",
        primaryDepartmentId: "louvor",
        ministryFunction: "Teclado",
        unavailableDates: ["2026-11-15", "2026-12-25"],
      },
    );
  });
});
