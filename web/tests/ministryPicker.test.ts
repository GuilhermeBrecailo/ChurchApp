import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { pickerEmptyState } from "../app/utils/ministryPicker";

const noMinisterio = [
  { name: "Caio Souza", email: "caio@email.com" },
  { name: "Larissa Mendes", email: "larissa@email.com" },
  { name: "Heloá Bezerra", email: "helo@email.com" },
];

describe("pickerEmptyState (seletor 'Adicionar pessoas' do ministério)", () => {
  it("sem texto digitado: diz que quem tem conta já está aqui e aponta o convite", () => {
    const state = pickerEmptyState("", noMinisterio);
    assert.equal(state.kind, "all-added");
    assert.match(state.title, /Todas as pessoas com conta/);
    assert.equal(state.showInviteLink, true);
  });

  it("texto só com espaços conta como vazio", () => {
    assert.equal(pickerEmptyState("   ", noMinisterio).kind, "all-added");
  });

  it("nome de quem já está no ministério: diz isso, com o nome, sem mandar convidar", () => {
    const state = pickerEmptyState("Larissa", noMinisterio);
    assert.equal(state.kind, "already-in");
    assert.equal(state.title, "Larissa Mendes já está neste ministério.");
    assert.equal(state.showInviteLink, false);
  });

  it("ignora acento e maiúsculas ao achar quem já está", () => {
    assert.equal(pickerEmptyState("heloa", noMinisterio).title, "Heloá Bezerra já está neste ministério.");
    assert.equal(pickerEmptyState("CAIO", noMinisterio).kind, "already-in");
  });

  it("acha também pelo e-mail", () => {
    assert.equal(pickerEmptyState("larissa@email", noMinisterio).kind, "already-in");
  });

  it("várias pessoas do ministério com o mesmo texto: aviso no plural", () => {
    const state = pickerEmptyState("a", noMinisterio);
    assert.equal(state.kind, "already-in");
    assert.match(state.title, /já estão neste ministério/);
  });

  it("nome que não está em lugar nenhum: explica que falta conta e aponta o convite", () => {
    const state = pickerEmptyState("Zelinda", noMinisterio);
    assert.equal(state.kind, "no-account");
    assert.match(state.title, /Não achei “Zelinda” entre quem tem conta no app/);
    assert.match(state.hint ?? "", /Pessoas/);
    assert.equal(state.showInviteLink, true);
  });

  it("mostra o texto digitado sem espaços nas pontas", () => {
    assert.match(pickerEmptyState("  Zelinda  ", noMinisterio).title, /“Zelinda”/);
  });

  it("ministério vazio e nome digitado: cai em 'sem conta'", () => {
    assert.equal(pickerEmptyState("Larissa", []).kind, "no-account");
  });
});
