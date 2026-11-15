// O Cifra Club passou a colocar um zero-width space no comeco de cada linha
// da cifra (e ele vem junto quando o texto e copiado ou impresso em PDF).
// Invisivel na tela, mas faz a linha "Am  F  C" deixar de ser reconhecida
// como acorde e "[Refrão]" deixar de ser cabecalho de secao.
const INVISIBLE_CHARS_RE = /[\u200b-\u200d\u2060\ufeff]/g;

export function stripInvisibleChars(value: string): string {
  return value.replace(INVISIBLE_CHARS_RE, "");
}
