import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { splitSchedulesByDate } from "../app/utils/dashboardSchedules";

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
