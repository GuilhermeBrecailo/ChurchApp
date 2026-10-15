export type MessageTemplateSuggestionKey =
  | "visitor_welcome"
  | "post_service_thanks"
  | "service_notice"
  | "birthday";

export interface MessageTemplateSuggestion {
  key: MessageTemplateSuggestionKey;
  name: string;
  description: string;
  body: string;
}

export const MESSAGE_TEMPLATE_SUGGESTIONS = [
  {
    key: "visitor_welcome",
    name: "Boas-vindas a visitantes",
    description: "Receba quem participou pela primeira vez.",
    body: "Olá, {nome}! Que alegria receber você em nossa igreja. Esperamos que tenha se sentido acolhido. Será muito bom ter você conosco novamente!",
  },
  {
    key: "post_service_thanks",
    name: "Agradecimento pós-culto",
    description: "Agradeça pela presença após o culto.",
    body: "Olá, {nome}! Obrigado por estar conosco no culto. Foi muito bom compartilhar esse momento com você. Que Deus abençoe sua semana!",
  },
  {
    key: "service_notice",
    name: "Aviso de culto",
    description: "Lembre a igreja do próximo encontro.",
    body: "Olá, {nome}! Passando para lembrar do nosso culto. Esperamos você para estarmos juntos em comunhão e adoração. Até lá!",
  },
  {
    key: "birthday",
    name: "Aniversário",
    description: "Envie uma mensagem de carinho no aniversário.",
    body: "Olá, {nome}! Feliz aniversário! Que Deus abençoe este novo ciclo com alegria, saúde e muitos momentos especiais. Receba o carinho da nossa igreja!",
  },
] as const satisfies readonly MessageTemplateSuggestion[];

export type SuggestedTemplateState<T> = "AVAILABLE" | T;

export function getSuggestedTemplateState<
  T extends { suggestionKey?: string | null },
>(
  suggestion: MessageTemplateSuggestion,
  templates: readonly T[],
): SuggestedTemplateState<T> {
  return templates.find((template) => template.suggestionKey === suggestion.key) ?? "AVAILABLE";
}

export type SuggestedTemplateAction<T> =
  | { type: "CREATE"; suggestion: MessageTemplateSuggestion }
  | { type: "EDIT"; template: T };

export function getSuggestedTemplateActionLabel<T>(
  action: SuggestedTemplateAction<T>,
): "Usar sugestão" | "Editar modelo" {
  return action.type === "CREATE" ? "Usar sugestão" : "Editar modelo";
}

export function getSuggestedTemplateAction<
  T extends { suggestionKey?: string | null },
>(
  suggestion: MessageTemplateSuggestion,
  templates: readonly T[],
): SuggestedTemplateAction<T> {
  const state = getSuggestedTemplateState(suggestion, templates);
  return state === "AVAILABLE"
    ? { type: "CREATE", suggestion }
    : { type: "EDIT", template: state };
}
