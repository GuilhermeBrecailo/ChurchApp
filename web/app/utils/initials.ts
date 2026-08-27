/**
 * Extrai até 2 iniciais maiúsculas de um nome (primeira + última parte).
 * Ignora tokens sem nenhuma letra (ex.: um "-" solto em "Quadrangular -
 * Catedral" viraria uma "parte" própria e geraria iniciais tipo "Q-").
 */
export function getInitials(name: string | null | undefined, fallback = "U"): string {
  const parts = (name ?? "")
    .trim()
    .split(/\s+/)
    .filter((part) => /\p{L}/u.test(part));

  if (parts.length === 0) return fallback;
  if (parts.length === 1) return parts[0][0].toUpperCase();

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
