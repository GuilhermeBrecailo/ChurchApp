export function normalizeListText(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
}

export function compareListText(left: unknown, right: unknown): number {
  return String(left ?? "").localeCompare(String(right ?? ""), "pt-BR", {
    numeric: true,
    sensitivity: "base",
  });
}
