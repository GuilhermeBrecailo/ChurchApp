import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { MessageTemplate } from "../composables/useMessages.ts";

const modulePath = "../app/utils/messageTemplateSuggestions.ts";

async function loadSuggestionModule() {
  try {
    return await import(modulePath);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ERR_MODULE_NOT_FOUND" || code === "MODULE_NOT_FOUND") return null;
    throw error;
  }
}

function savedTemplate(
  overrides: Partial<MessageTemplate> = {},
): MessageTemplate {
  return {
    id: "saved-template",
    name: "Nome que a igreja editou",
    body: "Conteúdo revisado manualmente.",
    suggestionKey: "visitor_welcome",
    createdAt: "2026-10-01T12:00:00.000Z",
    updatedAt: "2026-10-02T12:00:00.000Z",
    ...overrides,
  };
}

describe("suggested message templates", () => {
  it("contains exactly the four approved stable keys", async () => {
    const module = await loadSuggestionModule();
    const keys = module?.MESSAGE_TEMPLATE_SUGGESTIONS?.map(
      (suggestion: { key: string }) => suggestion.key,
    );

    assert.deepEqual(keys, [
      "visitor_welcome",
      "post_service_thanks",
      "service_notice",
      "birthday",
    ]);
  });

  it("finds the saved copy by key after the church changes its name and body", async () => {
    const module = await loadSuggestionModule();
    const suggestion = module?.MESSAGE_TEMPLATE_SUGGESTIONS?.find(
      (item: { key: string }) => item.key === "visitor_welcome",
    );
    const edited = savedTemplate({
      name: "Boas-vindas da Comunidade",
      body: "Nossa mensagem personalizada.",
    });

    assert.equal(module?.getSuggestedTemplateState?.(suggestion, [edited]), edited);
  });

  it("marks a suggestion available when the church has no saved copy", async () => {
    const module = await loadSuggestionModule();
    const suggestion = module?.MESSAGE_TEMPLATE_SUGGESTIONS?.find(
      (item: { key: string }) => item.key === "birthday",
    );

    assert.equal(module?.getSuggestedTemplateState?.(suggestion, []), "AVAILABLE");
  });

  it("shows the create and edit label that matches the saved-copy state", async () => {
    const module = await loadSuggestionModule();
    const suggestion = module?.MESSAGE_TEMPLATE_SUGGESTIONS?.find(
      (item: { key: string }) => item.key === "birthday",
    );
    const saved = savedTemplate({ suggestionKey: "birthday" });

    assert.equal(
      module?.getSuggestedTemplateActionLabel?.({ type: "CREATE", suggestion }),
      "Usar sugestão",
    );
    assert.equal(
      module?.getSuggestedTemplateActionLabel?.({ type: "EDIT", template: saved }),
      "Editar modelo",
    );
  });

  it("resolves selection only to create or edit, without a send or rule action", async () => {
    const module = await loadSuggestionModule();
    const suggestion = module?.MESSAGE_TEMPLATE_SUGGESTIONS?.find(
      (item: { key: string }) => item.key === "service_notice",
    );
    const saved = savedTemplate({ suggestionKey: "service_notice" });

    assert.deepEqual(
      module?.getSuggestedTemplateAction?.(suggestion, []),
      { type: "CREATE", suggestion },
    );
    assert.deepEqual(
      module?.getSuggestedTemplateAction?.(suggestion, [saved]),
      { type: "EDIT", template: saved },
    );
    assert.equal("sendNow" in (module?.getSuggestedTemplateAction?.(suggestion, []) ?? {}), false);
    assert.equal("createRule" in (module?.getSuggestedTemplateAction?.(suggestion, []) ?? {}), false);
  });
});
