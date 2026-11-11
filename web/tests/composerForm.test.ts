import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  announcementPayload,
  composerFormFromEntity,
  devotionalPayload,
  emptyComposerForm,
  previewTemplateBody,
  validateComposerAudience,
  validateComposerContent,
} from "../app/utils/composerForm";

describe("Novo comunicado: formulário", () => {
  it("publicação nasce pública; aviso começa só no app", () => {
    assert.equal(emptyComposerForm("PUBLICACAO").isPublic, true);
    assert.equal(emptyComposerForm("AVISO").isPublic, false);
  });

  it("valida o passo O quê de cada tipo", () => {
    const form = emptyComposerForm("AVISO");
    assert.match(validateComposerContent("AVISO", form), /título e o texto/);
    form.title = "Retiro";
    form.body = "Inscrições abertas";
    assert.equal(validateComposerContent("AVISO", form), "");
    assert.match(validateComposerContent("WHATSAPP", form), /Escolha a mensagem/);
    assert.match(validateComposerContent("DEVOCIONAL", { ...form, chapters: [{ title: "", content: "x", bibleRef: "" }] }), /capítulo/);
  });

  it("WhatsApp para pessoas escolhidas exige ao menos uma", () => {
    const form = { ...emptyComposerForm("WHATSAPP"), audience: "SELECTED" as const };
    assert.match(validateComposerAudience("WHATSAPP", form), /ao menos uma pessoa/);
    assert.equal(validateComposerAudience("WHATSAPP", { ...form, recipientIds: ["r1"] }), "");
  });

  it("monta os payloads das antigas Publicações", () => {
    const form = { ...emptyComposerForm("AVISO"), title: " Culto ", body: " Domingo ", videoUrl: " " };
    assert.deepEqual(announcementPayload(form), {
      title: "Culto",
      body: "Domingo",
      pinned: false,
      expiresAt: null,
      isPublic: false,
      kind: "ANNOUNCEMENT",
      imageUrl: null,
      imageKey: null,
      videoUrl: null,
    });
    const devotional = {
      ...emptyComposerForm("DEVOCIONAL"),
      title: "21 dias",
      chapters: [
        { title: "Dia 1", content: "Texto", bibleRef: "" },
        { title: "", content: "", bibleRef: "" },
      ],
    };
    assert.deepEqual(devotionalPayload(devotional).chapters, [{ title: "Dia 1", content: "Texto", bibleRef: null }]);
  });

  it("edição preenche a partir do que foi publicado", () => {
    const form = composerFormFromEntity("AVISO", {
      id: "a1",
      title: "Retiro",
      body: "Texto",
      pinned: true,
      expiresAt: "2026-12-01T00:00:00.000Z",
      isPublic: true,
      kind: "PRAYER",
    });
    assert.equal(form.expiresAt, "2026-12-01");
    assert.equal(form.kind, "PRAYER");
    assert.equal(form.isPublic, true);
  });

  it("prévia troca {nome} por um nome de exemplo", () => {
    assert.equal(previewTemplateBody("Oi {nome}!"), "Oi Maria!");
  });
});
