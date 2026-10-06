import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getScheduleCopySelection,
  getScheduleCultSelection,
  getScheduleCultOptions,
  getScheduleCultResolution,
  getScheduleAssignmentKey,
} from "../app/utils/scaleSchedule";

describe("seleção do culto na edição da escala", () => {
  it("preserva o culto manual já vinculado pela ocorrência", () => {
    assert.deepEqual(
      getScheduleCultSelection({
        serviceOccurrenceId: "occurrence-1",
        serviceOccurrence: { id: "occurrence-1", serviceTimeId: null },
      }),
      { occurrenceId: "occurrence-1", serviceTimeId: "" },
    );
  });

  it("preenche o horário do culto quando a ocorrência usa um horário recorrente", () => {
    assert.deepEqual(
      getScheduleCultSelection({
        serviceOccurrenceId: "occurrence-2",
        serviceOccurrence: { id: "occurrence-2", serviceTimeId: "service-time-1" },
      }),
      { occurrenceId: "", serviceTimeId: "service-time-1" },
    );
  });
});

describe("opções de culto para uma escala", () => {
  const upcoming = [
    {
      serviceTimeId: null,
      label: "Culto especial",
      weekday: 0,
      time: "18:30",
      date: "2026-10-11",
      occurrenceId: "occurrence-manual",
      scheduleCount: 0,
    },
    {
      serviceTimeId: "service-time-existing",
      label: "Culto de domingo",
      weekday: 0,
      time: "19:00",
      date: "2026-10-11",
      occurrenceId: "occurrence-existing",
      scheduleCount: 0,
    },
    {
      serviceTimeId: "service-time-generated",
      label: "Culto de quarta",
      weekday: 3,
      time: "19:30",
      date: "2026-10-14",
      occurrenceId: null,
      scheduleCount: 0,
    },
    {
      serviceTimeId: null,
      label: "Culto sem vínculo",
      weekday: 0,
      time: "20:00",
      date: "2026-10-18",
      occurrenceId: null,
      scheduleCount: 0,
    },
  ];

  it("mostra nome, data e horário em opções manuais e recorrentes", () => {
    const options = getScheduleCultOptions(upcoming);

    assert.equal(options.length, 3);
    assert.equal(options[0].value, "occurrence:occurrence-manual");
    assert.match(options[0].label, /Culto especial/);
    assert.match(options[0].label, /11/);
    assert.match(options[0].label, /2026/);
    assert.match(options[0].label, /18:30/);
    assert.equal(options[0].date, "2026-10-11");
    assert.equal(options[0].time, "18:30");
    assert.equal(options[2].value, "service-time:service-time-generated:2026-10-14");
  });

  it("resolve ocorrência manual existente pelo ID", () => {
    const [manual] = getScheduleCultOptions(upcoming);

    assert.deepEqual(getScheduleCultResolution(manual, "2026-10-11"), {
      kind: "existing",
      occurrenceId: "occurrence-manual",
    });
  });

  it("resolve recorrência ainda não materializada pela data escolhida", () => {
    const generated = getScheduleCultOptions(upcoming)[2];

    assert.deepEqual(getScheduleCultResolution(generated, "2026-10-14"), {
      kind: "resolve",
      serviceTimeId: "service-time-generated",
      date: "2026-10-14",
    });
  });

  it("não mantém vínculo para opção vazia, escala antiga sem culto ou data diferente", () => {
    const generated = getScheduleCultOptions(upcoming)[2];

    assert.deepEqual(getScheduleCultResolution(null, "2026-10-14"), { kind: "none" });
    assert.deepEqual(getScheduleCultResolution(undefined, "2026-10-14"), { kind: "none" });
    assert.deepEqual(getScheduleCultResolution(generated, "2026-10-15"), { kind: "none" });
  });
});

describe("identidade das atribuições de uma escala", () => {
  it("normaliza espaços e caixa da função sem confundir funções diferentes", () => {
    assert.equal(
      getScheduleAssignmentKey("user-1", "  Teclado "),
      getScheduleAssignmentKey("user-1", "teclado"),
    );
    assert.notEqual(
      getScheduleAssignmentKey("user-1", "Teclado"),
      getScheduleAssignmentKey("user-1", "Vocal"),
    );
    assert.equal(
      getScheduleAssignmentKey("user-1", ""),
      getScheduleAssignmentKey("user-1", "Voluntário"),
    );
  });
});

describe("cópia de escala", () => {
  it("copia músicas, recursos, voluntários e horário recorrente sem reutilizar o culto original", () => {
    assert.deepEqual(
      getScheduleCopySelection({
        id: "schedule-1",
        date: "2026-09-13T19:30:00.000Z",
        description: "Culto de domingo",
        departmentId: "department-1",
        serviceOccurrenceId: "occurrence-1",
        serviceOccurrence: { id: "occurrence-1", serviceTimeId: "service-time-1" },
        mediaItems: [
          {
            id: "media-1",
            mediaItemId: "song-1",
            mediaItem: { id: "song-1", category: "MUSIC" },
          },
          {
            id: "media-2",
            mediaItemId: "resource-1",
            mediaItem: { id: "resource-1", category: "RESOURCE" },
          },
        ],
        assignments: [
          {
            id: "assignment-1",
            userId: "user-1",
            role: "Teclado",
            user: { id: "user-1", name: "Ana", email: "ana@example.com" },
          },
          {
            id: "assignment-2",
            userId: "user-1",
            role: "Vocal",
            user: { id: "user-1", name: "Ana", email: "ana@example.com" },
          },
        ],
      }),
      {
        serviceTimeId: "service-time-1",
        isCommunionService: false,
        songIds: ["song-1"],
        resourceIds: ["resource-1"],
        assignments: [
          { userId: "user-1", name: "Ana", role: "Teclado" },
          { userId: "user-1", name: "Ana", role: "Vocal" },
        ],
      },
    );
  });
});
