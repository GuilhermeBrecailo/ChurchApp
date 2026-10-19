import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { DepartmentSong } from "../composables/useDepartments";
import {
  getSongCreationPrefill,
  mergeCreatedSongIntoSelection,
} from "../app/utils/songPicker";

const song = (id: string, title: string): DepartmentSong => ({
  id,
  title,
  url: "",
  category: "MUSIC",
  departmentId: "department-1",
  metadata: { artist: "Artista" },
});

describe("fluxo de cadastro de música na escala", () => {
  it("pré-preenche o título com o termo pesquisado", () => {
    assert.deepEqual(getSongCreationPrefill("  Música nova  "), {
      title: "Música nova",
      artist: "",
    });
  });

  it("adiciona e seleciona a música criada sem duplicar a lista", () => {
    const result = mergeCreatedSongIntoSelection(
      [song("song-1", "Existente")],
      ["song-1"],
      song("song-2", "Nova música"),
    );

    assert.deepEqual(result.songs.map((item) => item.id), ["song-1", "song-2"]);
    assert.deepEqual(result.selectedIds, ["song-1", "song-2"]);
  });
});
