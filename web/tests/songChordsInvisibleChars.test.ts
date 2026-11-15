import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { stripInvisibleChars, transposeChordText } from "../composables/useSongChords";

const ZWSP = "\u200b";

describe("cifra salva com zero-width space", () => {
  it("remove os caracteres invisíveis", () => {
    assert.equal(stripInvisibleChars(`${ZWSP}[Refrão]\n${ZWSP}Am  F`), "[Refrão]\nAm  F");
  });

  it("transpõe as linhas de acorde que começam com zero-width space", () => {
    assert.equal(
      transposeChordText(`${ZWSP}Am      F\n${ZWSP}Um caminho`, 2),
      "Bm      G\nUm caminho",
    );
  });
});
