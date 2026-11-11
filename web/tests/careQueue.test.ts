import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildCareQueue, careGroupFor, groupCareQueue } from "../app/utils/careQueue";
import { dateLabel, monthYearLabel } from "../app/utils/peopleSegments";

const NOW = new Date(2026, 10, 11, 12, 0, 0);

describe("fila de cuidado", () => {
  it("separa por data", () => {
    assert.equal(careGroupFor("2026-11-10", NOW), "atrasado");
    assert.equal(careGroupFor("2026-11-11", NOW), "hoje");
    assert.equal(careGroupFor("2026-11-18", NOW), "semana");
    assert.equal(careGroupFor("2026-11-30", NOW), "depois");
    assert.equal(careGroupFor(null, NOW), "sem-data");
  });

  it("junta visitas, visitantes e faltosos com uma ação cada", () => {
    const queue = buildCareQueue(
      {
        visits: [
          {
            id: "v1",
            reason: "Cirurgia da mãe",
            status: "SCHEDULED",
            scheduledAt: "2026-11-11T19:00:00.000Z",
            responsible: { name: "Pr. Carlos" },
            rosterMember: { id: "ana", name: "Ana" },
          },
          {
            id: "v2",
            reason: "Conversar",
            status: "OPEN",
            scheduledAt: null,
            rosterMember: { id: "rui", name: "Rui" },
          },
          {
            id: "v3",
            reason: "Feita",
            status: "DONE",
            scheduledAt: "2026-11-01T19:00:00.000Z",
            rosterMember: { id: "ana", name: "Ana" },
          },
        ],
        people: [
          { id: "bia", name: "Bia", status: "VISITOR", followUp: { stage: "CONTACTED", nextContactAt: "2026-11-09" } },
          { id: "caio", name: "Caio", status: "VISITOR", followUp: null },
          { id: "duda", name: "Duda", status: "VISITOR", followUp: { stage: "CONTACTED", nextContactAt: null } },
          { id: "eva", name: "Eva", status: "VISITOR", followUp: { stage: "CLOSED", nextContactAt: "2026-11-09" } },
          { id: "fabio", name: "Fábio", status: "MEMBER", care: { openVisits: 0, absent: true } },
          { id: "rui", name: "Rui", status: "MEMBER", care: { openVisits: 1, absent: true } },
        ],
      },
      NOW,
    );

    assert.deepEqual(
      queue.map((item) => [item.personName, item.group, item.action]),
      [
        ["Bia", "atrasado", "registrar-contato"],
        ["Ana", "hoje", "concluir-visita"],
        ["Fábio", "faltando", "agendar-visita"],
        ["Caio", "sem-data", "registrar-contato"],
        ["Rui", "sem-data", "agendar-visita"],
      ],
    );
    assert.equal(queue.find((item) => item.personName === "Ana")?.detail, "Cirurgia da mãe · Pr. Carlos");

    const groups = groupCareQueue(queue);
    assert.deepEqual(
      groups.map((group) => [group.label, group.items.length]),
      [
        ["Atrasados", 1],
        ["Hoje", 1],
        ["Faltando aos cultos", 1],
        ["Sem data marcada", 2],
      ],
    );
  });
});

describe("datas por extenso", () => {
  it("mês e ano, e data curta", () => {
    assert.equal(monthYearLabel("2025-03-02T00:00:00.000Z"), "março de 2025");
    assert.equal(dateLabel("2026-11-12", NOW), "amanhã");
    assert.equal(dateLabel("2026-10-01", NOW), "1 out");
    assert.equal(dateLabel("2025-10-01", NOW), "1 out 2025");
  });
});
