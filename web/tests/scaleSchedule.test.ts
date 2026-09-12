import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getScheduleCopySelection,
  getScheduleCultSelection,
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
        ],
      }),
      {
        serviceTimeId: "service-time-1",
        songIds: ["song-1"],
        resourceIds: ["resource-1"],
        assignments: [{ userId: "user-1", name: "Ana", role: "Teclado" }],
      },
    );
  });
});
