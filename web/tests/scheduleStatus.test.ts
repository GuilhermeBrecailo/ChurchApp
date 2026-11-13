import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  normalizeScheduleStatus,
  scheduleStatusInfo,
  summarizeStatuses,
} from "../app/utils/scheduleStatus";

describe("status de escala", () => {
  it("Talvez é Talvez em todo lugar (não vira Pendente)", () => {
    assert.equal(scheduleStatusInfo("MAYBE").label, "Talvez");
  });

  it("usa os rótulos combinados", () => {
    assert.equal(scheduleStatusInfo("DECLINED").label, "Não posso");
    assert.equal(scheduleStatusInfo("SWAP_REQUESTED").label, "Pediu troca");
    assert.equal(scheduleStatusInfo("CONFIRMED").label, "Confirmado");
  });

  it("status desconhecido ou vazio vira Pendente", () => {
    assert.equal(normalizeScheduleStatus(undefined), "PENDING");
    assert.equal(normalizeScheduleStatus("qualquer"), "PENDING");
    assert.equal(normalizeScheduleStatus("accepted"), "CONFIRMED");
  });

  it("várias funções: mostra o que pede atenção primeiro", () => {
    assert.equal(summarizeStatuses(["CONFIRMED", "DECLINED"]), "DECLINED");
    assert.equal(summarizeStatuses(["CONFIRMED", "CONFIRMED"]), "CONFIRMED");
    assert.equal(summarizeStatuses([]), "PENDING");
  });
});
