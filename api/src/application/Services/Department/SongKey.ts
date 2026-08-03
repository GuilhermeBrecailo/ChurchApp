const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const FLAT_TO_SHARP: Record<string, string> = {
  Db: "C#",
  Eb: "D#",
  Fb: "E",
  Gb: "F#",
  Ab: "G#",
  Bb: "A#",
  Cb: "B",
};

/**
 * Aceita so os 12 tons maiores e os 12 menores. Devolve a forma canonica em
 * sustenido ("bb" -> "A#m") ou null quando o valor nao e um tom.
 *
 * O campo era texto livre: chegava "sol", "G maior", "72" e ate BPM no lugar
 * do tom, e a transposicao no app nao tinha como funcionar em cima disso.
 */
export function normalizeSongKey(rawKey: string) {
  const match = rawKey.trim().match(/^([A-Ga-g])([#b]?)(.*)$/);

  if (!match) return null;

  const root = `${match[1].toUpperCase()}${match[2] || ""}`;
  const normalizedRoot = FLAT_TO_SHARP[root] || root;
  const index = NOTE_NAMES.indexOf(normalizedRoot);

  if (index === -1) return null;

  const suffix = (match[3] || "").trim();

  if (!suffix) return NOTE_NAMES[index];
  if (/^m(in)?$/i.test(suffix)) return `${NOTE_NAMES[index]}m`;

  return null;
}

export function isValidSongKey(rawKey: string) {
  return normalizeSongKey(rawKey) !== null;
}
