import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getScheduleCultSelection } from "../app/utils/scaleSchedule";

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
