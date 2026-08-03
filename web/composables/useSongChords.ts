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

const SHARP_TO_FLAT: Record<string, string> = {
  "C#": "Db",
  "D#": "Eb",
  "F#": "Gb",
  "G#": "Ab",
  "A#": "Bb",
};

const MAJOR_ROOTS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

/** Tons aceitos no cadastro: 12 maiores + 12 menores, com o enarmônico em bemol
 * no rótulo (o valor gravado é sempre a forma em sustenido). */
export const SONG_KEY_OPTIONS = [
  ...MAJOR_ROOTS.map((root) => ({
    value: root,
    title: SHARP_TO_FLAT[root] ? `${root} / ${SHARP_TO_FLAT[root]}` : root,
  })),
  ...MAJOR_ROOTS.map((root) => ({
    value: `${root}m`,
    title: SHARP_TO_FLAT[root] ? `${root}m / ${SHARP_TO_FLAT[root]}m` : `${root}m`,
  })),
];

const SONG_KEY_VALUES = new Set(SONG_KEY_OPTIONS.map((option) => option.value));

const parseKey = (key: string) => {
  const match = key?.trim().match(/^([A-Ga-g])([#b]?)(.*)$/);
  if (!match) return null;

  const root = `${match[1].toUpperCase()}${match[2] || ""}`;
  const normalizedRoot = FLAT_TO_SHARP[root] || root;
  const index = NOTE_NAMES.indexOf(normalizedRoot);

  if (index === -1) return null;

  return { index, suffix: match[3] || "" };
};

/** "bb" -> "A#m", "g" -> "G". Devolve "" quando não é um tom reconhecível. */
export const normalizeSongKey = (key?: string | null) => {
  const parsed = parseKey(key || "");
  if (!parsed) return "";

  const suffix = parsed.suffix.trim();
  const isMinor = /^m(in)?$/i.test(suffix);

  if (suffix && !isMinor) return "";

  return `${NOTE_NAMES[parsed.index]}${isMinor ? "m" : ""}`;
};

export const isValidSongKey = (key?: string | null) => {
  if (!key?.trim()) return true;
  return SONG_KEY_VALUES.has(normalizeSongKey(key));
};

export const transposeSongKey = (key: string, steps: number) => {
  const parsed = parseKey(key);
  if (!parsed || !steps) return key;

  const nextIndex = (parsed.index + (steps % 12) + 12) % 12;
  return `${NOTE_NAMES[nextIndex]}${parsed.suffix}`;
};

/** Distância em semitons entre dois tons. 0 quando algum deles é inválido. */
export const songKeyDistance = (fromKey?: string | null, toKey?: string | null) => {
  const from = parseKey(fromKey || "");
  const to = parseKey(toKey || "");

  if (!from || !to) return 0;

  return (to.index - from.index + 12) % 12;
};

const CHORD_TOKEN =
  /^[A-G](?:#|b)?(?:m|maj|min|dim|aug|sus|add|M)?[0-9]*(?:\((?:[^)]+)\))?(?:sus[0-9]|add[0-9]|[0-9])*(?:\/[A-G](?:#|b)?)?$/;

const CHORD_REPLACE =
  /\b([A-G](?:#|b)?)((?:m|maj|min|dim|aug|sus|add|M)?[0-9]*(?:\([^)]+\))?)(\/([A-G](?:#|b)?))?/g;

const isTabLine = (line: string) =>
  /^\s*[EADGB][|:]/.test(line) || /\|[-0-9hpsbr~/\\x]{3,}/.test(line);

/** Uma linha só é transposta quando é de fato uma linha de acordes. Sem isso a
 * letra vira lixo: "A vida" viraria "B vida" no primeiro clique de +1 tom. */
export const isChordLine = (line: string) => {
  const cleaned = line.trim();
  if (!cleaned || isTabLine(cleaned)) return false;

  const tokens = cleaned.split(/\s+/).filter(Boolean);
  if (!tokens.length) return false;

  return tokens.every((token) => {
    const bare = token.replace(/^[([{|]+/, "").replace(/[)\]}|,.;:]+$/, "");
    if (!bare) return true;
    return CHORD_TOKEN.test(bare);
  });
};

const transposeChordLine = (line: string, steps: number) =>
  line.replace(CHORD_REPLACE, (match, root, quality = "", _slash = "", bass = "") => {
    const nextRoot = transposeSongKey(root, steps);
    const nextBass = bass ? `/${transposeSongKey(bass, steps)}` : "";
    return `${nextRoot}${quality || ""}${nextBass}`;
  });

/** "Intro: G D/F# Em" — o rótulo fica intacto, só o que vem depois do ":" é
 * transposto. Sem isso um rótulo como "Base:" viraria acorde. */
const LABELED_CHORD_LINE = /^([^\s:]{1,24}:\s*)(.+)$/;

/** Transpõe acordes preservando a letra: linhas de acorde inteiras e acordes
 * inline entre colchetes ([G]) são convertidos, o resto do texto fica intacto. */
export const transposeChordText = (text: string, steps: number) => {
  if (!text || !steps) return text || "";

  return text
    .split("\n")
    .map((line) => {
      if (isChordLine(line)) return transposeChordLine(line, steps);

      const labeled = line.match(LABELED_CHORD_LINE);

      if (labeled && isChordLine(labeled[2])) {
        return `${labeled[1]}${transposeChordLine(labeled[2], steps)}`;
      }

      return line.replace(/\[([^\]]+)\]/g, (match, inner: string) =>
        isChordLine(inner) ? `[${transposeChordLine(inner, steps)}]` : match,
      );
    })
    .join("\n");
};

export const songKeyLabel = (key?: string | null) => {
  const normalized = normalizeSongKey(key);
  if (!normalized) return key?.trim() || "";

  const option = SONG_KEY_OPTIONS.find((item) => item.value === normalized);
  return option?.title || normalized;
};
