import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildChurchAgenda, splitSchedulesByDate } from "../app/utils/dashboardSchedules";

describe("separação das escalas na tela inicial", () => {
  it("mantém hoje e o futuro em próximos e ordena o histórico do mais recente", () => {
    const schedules = [
      { id: "past-old", date: "2026-09-20T19:00:00-03:00" },
      { id: "future-late", date: "2026-10-05T19:00:00-03:00" },
      { id: "today", date: "2026-10-02T08:00:00-03:00" },
      { id: "past-recent", date: "2026-09-27T19:00:00-03:00" },
      { id: "future-soon", date: "2026-10-03T19:00:00-03:00" },
    ];

    const sections = splitSchedulesByDate(schedules, new Date("2026-10-02T12:00:00-03:00"));

    assert.deepEqual(sections.upcoming.map(({ id }) => id), ["today", "future-soon", "future-late"]);
    assert.deepEqual(sections.recent.map(({ id }) => id), ["past-recent", "past-old"]);
  });

  it("não repete no histórico uma escala que acontece hoje", () => {
    const sections = splitSchedulesByDate(
      [{ id: "today", date: "2026-10-02T19:00:00-03:00" }],
      new Date("2026-10-02T08:00:00-03:00"),
    );

    assert.equal(sections.upcoming.length, 1);
    assert.equal(sections.recent.length, 0);
  });
});

describe("Hoje na igreja (buildChurchAgenda)", () => {
  const now = new Date(2026, 10, 12, 9, 0);
  const at = (day: number, hour: number) => new Date(2026, 10, day, hour, 0).toISOString();

  it("mostra o que tem hoje, juntando ministérios do mesmo culto e marcando 'você serve'", () => {
    const agenda = buildChurchAgenda(
      [
        {
          id: "louvor",
          date: at(12, 19),
          description: "Culto de oração",
          serviceOccurrenceId: "occ1",
          department: { name: "Louvor" },
          assignments: [
            { userId: "me", confirmationStatus: "CONFIRMED" },
            { userId: "me", confirmationStatus: "PENDING" },
            { userId: "ana", confirmationStatus: "CONFIRMED" },
          ],
        },
        {
          id: "midia",
          date: at(12, 19),
          description: "Culto de oração",
          serviceOccurrenceId: "occ1",
          department: { name: "Mídia" },
          assignments: [{ userId: "bia", confirmationStatus: "CONFIRMED" }],
        },
        { id: "next", date: at(15, 10), description: "Culto de domingo", assignments: [] },
      ],
      { userId: "me", now },
    );

    assert.equal(agenda.mode, "today");
    assert.equal(agenda.items.length, 1);
    const [item] = agenda.items;
    assert.deepEqual(item?.departments, ["Louvor", "Mídia"]);
    assert.equal(item?.iServe, true);
    assert.equal(item?.scheduleId, "louvor");
    // "me" tem uma linha pendente: não conta como confirmado.
    assert.equal(item?.confirmed, 2);
    assert.equal(item?.total, 3);
  });

  it("sem nada hoje, mostra os próximos 7 dias", () => {
    const agenda = buildChurchAgenda(
      [
        { id: "a", date: at(15, 10), description: "Culto de domingo" },
        { id: "far", date: at(25, 10), description: "Longe" },
        { id: "past", date: at(10, 10), description: "Passado" },
      ],
      { userId: "me", now },
    );
    assert.equal(agenda.mode, "week");
    assert.deepEqual(agenda.items.map((item) => item.scheduleId), ["a"]);
  });

  it("ensaio de hoje aparece só para quem serve", () => {
    const schedules = [
      {
        id: "s",
        date: at(15, 10),
        rehearsalAt: at(12, 20),
        description: "Culto de domingo",
        assignments: [{ userId: "me", confirmationStatus: "CONFIRMED" }],
      },
    ];
    assert.equal(buildChurchAgenda(schedules, { userId: "me", now }).items[0]?.isRehearsal, true);
    assert.equal(buildChurchAgenda(schedules, { userId: "other", now }).mode, "week");
  });

  it("vazio quando não há nada na semana", () => {
    assert.deepEqual(buildChurchAgenda([], { now }), { mode: "empty", items: [] });
  });
});
