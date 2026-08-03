// Fontes curadas para a identidade visual da pagina publica. Lista fechada
// (nao aceita fonte arbitraria) para nao depender de rede externa nao
// carregada nem quebrar o CSP - todas ja vem no <link> de fontes do app.
export interface FontOption {
  key: string;
  label: string;
  /** valor aplicado em --church-display na pagina publica */
  cssValue: string;
}

export const FONT_OPTIONS: FontOption[] = [
  { key: "EDITORIAL", label: "Editorial (Fraunces)", cssValue: '"Fraunces", serif' },
  { key: "ELEGANTE", label: "Elegante (Playfair Display)", cssValue: '"Playfair Display", serif' },
  { key: "MODERNA", label: "Moderna (Space Grotesk)", cssValue: '"Space Grotesk", sans-serif' },
  { key: "SUAVE", label: "Suave (Inter)", cssValue: '"Inter", sans-serif' },
];

export const DEFAULT_FONT_KEY = "EDITORIAL";

const FONT_BY_KEY = new Map(FONT_OPTIONS.map((option) => [option.key, option]));

export function fontCssValue(key?: string | null): string {
  return FONT_BY_KEY.get(key ?? "")?.cssValue ?? FONT_BY_KEY.get(DEFAULT_FONT_KEY)!.cssValue;
}
