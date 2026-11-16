import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applySongChangeToSchedules,
  emptyScheduleCache,
  setScheduleList,
  storeSchedules,
} from "../app/utils/scheduleCache";
import type { ApiSchedule } from "../app/utils/scheduleView";

const schedule = (id: string, songIds: string[]): ApiSchedule =>
  ({
    id,
    date: "2026-11-22T10:00:00.000Z",
    description: "Culto",
    departmentId: "department-1",
    assignments: [],
    mediaItems: songIds.map((songId, index) => ({
      id: `${id}-item-${index}`,
      mediaItemId: songId,
      mediaItem: {
        id: songId,
        title: `Antiga ${songId}`,
        category: "MUSIC",
        metadata: { lyrics: "letra antiga", chords: "cifra antiga" },
      },
    })),
  }) as unknown as ApiSchedule;

const cacheWith = (...schedules: ApiSchedule[]) =>
  setScheduleList(
    storeSchedules(emptyScheduleCache(), schedules, { full: true }),
    "all",
    schedules.map((item) => item.id),
    null,
    { now: 1 },
  );

describe("música editada no repertório", () => {
  it("atualiza a música em toda escala que a usa", () => {
    const state = applySongChangeToSchedules(
      cacheWith(schedule("s1", ["song-1", "song-2"]), schedule("s2", ["song-1"]), schedule("s3", ["song-2"])),
      "song-1",
      { id: "song-1", title: "Nova", metadata: { lyrics: "letra nova", chords: "cifra nova" } },
    );

    for (const id of ["s1", "s2"]) {
      const item = state.byId[id].mediaItems!.find((entry) => entry.mediaItem.id === "song-1")!;
      assert.equal(item.mediaItem.title, "Nova");
      assert.deepEqual(item.mediaItem.metadata, { lyrics: "letra nova", chords: "cifra nova" });
      assert.equal(state.full[id], undefined, "força buscar a escala completa de novo");
    }

    assert.equal(state.byId.s1.mediaItems![1].mediaItem.title, "Antiga song-2");
    assert.equal(state.full.s3, true, "escala sem a música continua igual");
    assert.equal(state.lists.all.stale, true);
  });

  it("tira a música apagada das escalas", () => {
    const state = applySongChangeToSchedules(cacheWith(schedule("s1", ["song-1", "song-2"])), "song-1", null);

    assert.deepEqual(
      state.byId.s1.mediaItems!.map((item) => item.mediaItem.id),
      ["song-2"],
    );
  });

  it("não perde a letra nova quando a lista leve chega depois", () => {
    const updated = applySongChangeToSchedules(cacheWith(schedule("s1", ["song-1"])), "song-1", {
      id: "song-1",
      title: "Nova",
      metadata: { lyrics: "letra nova" },
    });
    const light = schedule("s1", ["song-1"]);
    light.mediaItems![0].mediaItem.title = "Nova";
    light.mediaItems![0].mediaItem.metadata = { key: "D" };

    const state = storeSchedules(updated, [light]);

    assert.equal(state.byId.s1.mediaItems![0].mediaItem.title, "Nova");
    assert.notEqual(
      (state.byId.s1.mediaItems![0].mediaItem.metadata as { lyrics?: string }).lyrics,
      "letra antiga",
    );
  });
});
