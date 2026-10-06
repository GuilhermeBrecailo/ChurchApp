import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatScheduleAssignmentConflict,
  getDepartmentAssignmentRoleOptions,
  getScheduleCopySelection,
} from "../app/utils/scaleSchedule";
import {
  getScheduleChecklistDueState,
  getScheduleChecklistSummary,
} from "../app/utils/diaconateChecklist";

describe("apoio para escalas do Diaconato", () => {
  it("sugere responsabilidades típicas sem bloquear função personalizada", () => {
    assert.deepEqual(getDepartmentAssignmentRoleOptions("DEACONATE"), [
      "Dízimo",
      "Recepção",
      "Apoio",
    ]);
    assert.deepEqual(getDepartmentAssignmentRoleOptions("OTHER"), ["Voluntário"]);
  });

  it("copia pessoas e funções sem copiar estado, IDs ou culto original", () => {
    const selection = getScheduleCopySelection({
      id: "source",
      date: "2026-10-11T18:00:00.000Z",
      description: "Culto",
      departmentId: "dept-1",
      isCommunionService: true,
      serviceOccurrenceId: "old-occurrence",
      serviceOccurrence: { id: "old-occurrence", serviceTimeId: "service-time-1" },
      assignments: [{
        id: "old-assignment",
        userId: "user-1",
        role: "Dízimo",
        viewedAt: "2026-10-01T00:00:00.000Z",
        confirmationStatus: "CONFIRMED",
        attendanceStatus: "PRESENT",
        user: { id: "user-1", name: "Ana", email: "ana@example.test" },
      }],
      mediaItems: [],
    });

    assert.deepEqual(selection.assignments, [{ userId: "user-1", name: "Ana", role: "Dízimo" }]);
    assert.equal(selection.isCommunionService, true);
    assert.equal("occurrenceId" in selection, false);
  });

  it("explica o conflito de forma curta e não bloqueante", () => {
    assert.equal(
      formatScheduleAssignmentConflict({
        userId: "user-1",
        userName: "Ana Souza",
        departmentName: "Diaconato",
        role: "Dízimo",
        scheduleId: "schedule-2",
        scheduleDescription: "Culto da noite",
      }),
      "Ana Souza também está no Diaconato como Dízimo — Culto da noite.",
    );
  });

  it("resume somente os lembretes aplicáveis e diferencia o que está pendente", () => {
    assert.deepEqual(getScheduleChecklistSummary([
      { isApplicable: true, isComplete: true },
      { isApplicable: true, isComplete: false },
      { isApplicable: false, isComplete: true },
    ]), { completed: 1, total: 2, pending: 1 });
  });

  it("destaca atraso e prazo próximo sem marcar itens sem prazo", () => {
    const now = new Date("2026-10-05T12:00:00.000Z");
    assert.equal(getScheduleChecklistDueState("2026-10-04T12:00:00.000Z", now), "OVERDUE");
    assert.equal(getScheduleChecklistDueState("2026-10-06T12:00:00.000Z", now), "DUE_SOON");
    assert.equal(getScheduleChecklistDueState("2026-10-08T12:00:00.000Z", now), "ON_TIME");
    assert.equal(getScheduleChecklistDueState(null, now), "NO_DUE");
    assert.equal(getScheduleChecklistDueState("2026-10-04T12:00:00.000Z", now, true), "COMPLETE");
  });
});
