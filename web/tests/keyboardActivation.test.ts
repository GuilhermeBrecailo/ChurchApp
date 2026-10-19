import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { shouldActivateKeyboardCard } from "../app/utils/keyboardActivation";

describe("atalhos de teclado do cartão de música", () => {
  it("não abre a cifra quando o espaço vem de um campo filho", () => {
    const card = {};
    const textarea = {};

    assert.equal(
      shouldActivateKeyboardCard({ key: " ", target: textarea, currentTarget: card }),
      false,
    );
  });

  it("abre a cifra quando o espaço é acionado no próprio cartão", () => {
    const card = {};

    assert.equal(
      shouldActivateKeyboardCard({ key: " ", target: card, currentTarget: card }),
      true,
    );
  });
});
