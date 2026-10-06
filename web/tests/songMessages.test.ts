import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { duplicateSongTitleMessage } from "../app/utils/songMessages";

describe("mensagem de música duplicada", () => {
  it("identifica o título que já existe no ministério", () => {
    assert.equal(
      duplicateSongTitleMessage("Grande e o Senhor"),
      'Já existe uma música com o nome "Grande e o Senhor" neste ministério.',
    );
  });

  it("remove espaços externos do título na mensagem", () => {
    assert.equal(
      duplicateSongTitleMessage("  Grande e o Senhor  "),
      'Já existe uma música com o nome "Grande e o Senhor" neste ministério.',
    );
  });
});
