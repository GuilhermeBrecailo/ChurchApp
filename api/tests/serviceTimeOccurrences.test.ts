import { calculateUpcomingServiceOccurrences } from "../src/application/Services/ServiceTime/ServiceTimeOccurrences";

describe("calculateUpcomingServiceOccurrences", () => {
  it("returns an empty list when there are no service times", () => {
    const result = calculateUpcomingServiceOccurrences([], {
      from: new Date("2026-07-27T12:00:00.000Z"),
      daysAhead: 7,
    });

    expect(result).toEqual([]);
  });

  it("orders multiple service times chronologically", () => {
    const result = calculateUpcomingServiceOccurrences(
      [
        { id: "wednesday", label: "Culto de oracao", weekday: 3, time: "19:30" },
        { id: "sunday", label: "Culto de celebracao", weekday: 0, time: "09:00" },
      ],
      { from: new Date("2026-07-27T12:00:00.000Z"), daysAhead: 7 },
    );

    expect(result.map((item) => item.id)).toEqual(["wednesday", "sunday"]);
  });

  it("includes occurrences across week and month boundaries", () => {
    const result = calculateUpcomingServiceOccurrences(
      [{ id: "sunday", label: "Culto", weekday: 0, time: "10:00" }],
      { from: new Date("2026-07-31T12:00:00.000Z"), daysAhead: 30 },
    );

    expect(result.length).toBeGreaterThan(0);
    expect(result[0].startsAt.startsWith("2026-08-02T")).toBe(true);
    expect(result.every((item) => new Date(item.startsAt).getDay() === 0)).toBe(true);
  });
});