/**
 * Tema do app: Claro, Escuro ou "Sistema" (segue o aparelho).
 *
 * O cookie guarda a escolha da pessoa ("light" | "dark" | "system"). No
 * servidor não dá para saber o tema do aparelho, então "system" é renderizado
 * claro e o cliente corrige com matchMedia logo que monta.
 */
export type ThemeMode = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export const THEME_MODES: ThemeMode[] = ["light", "dark", "system"];

export const THEME_MODE_LABELS: Record<ThemeMode, string> = {
  light: "Claro",
  dark: "Escuro",
  system: "Igual ao aparelho",
};

export function normalizeThemeMode(value: unknown): ThemeMode {
  return value === "dark" || value === "system" ? value : "light";
}

/**
 * Tema que de fato aparece na tela. `prefersDark` é null quando ainda não
 * se sabe (servidor ou antes de montar): nesse caso "system" fica claro.
 */
export function resolveThemeMode(mode: unknown, prefersDark: boolean | null): ResolvedTheme {
  const normalized = normalizeThemeMode(mode);
  if (normalized === "system") return prefersDark === true ? "dark" : "light";
  return normalized;
}

/** O botão sol/lua do topo troca para o oposto do que está na tela. */
export function toggledThemeMode(mode: unknown, prefersDark: boolean | null): ThemeMode {
  return resolveThemeMode(mode, prefersDark) === "dark" ? "light" : "dark";
}
