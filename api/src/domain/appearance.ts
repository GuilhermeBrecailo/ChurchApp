// Chaves de fonte permitidas para a pagina publica da igreja. Espelha
// FONT_OPTIONS do frontend (web/composables/useChurchAppearance.ts) - fonte
// arbitraria fora desta lista e rejeitada.
export const ALLOWED_FONT_KEYS = ["EDITORIAL", "ELEGANTE", "MODERNA", "SUAVE"] as const;

export type FontKey = (typeof ALLOWED_FONT_KEYS)[number];

export function isValidFontKey(value: unknown): value is FontKey {
  return typeof value === "string" && (ALLOWED_FONT_KEYS as readonly string[]).includes(value);
}
