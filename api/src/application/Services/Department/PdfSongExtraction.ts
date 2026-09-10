// pdf-parse tipa a opcao pagerender de forma generica (any); redeclaramos a
// assinatura real do pageData do pdf.js que ele repassa, para tipar o
// pagerender proprio abaixo sem perder seguranca de tipos no resto do modulo.
type PdfParse = (
  data: Buffer,
  options?: {
    pagerender?: (pageData: PdfPageData) => Promise<string>;
  },
) => Promise<{ text: string; numpages: number }>;

// Tipagem minima do pdf.js PageData usada pelo pagerender do pdf-parse.
export type PdfTextItem = {
  str: string;
  transform: number[];
  width?: number;
};
type PdfPageData = {
  getTextContent: (options: {
    normalizeWhitespace: boolean;
    disableCombineTextItems: boolean;
  }) => Promise<{ items: PdfTextItem[] }>;
};

export type ExtractedSong = {
  title: string;
  artist: string;
  key: string;
  lyrics: string;
  chords: string;
};

const MAX_TITLE_LENGTH = 60;
const FOOTER_MARKERS = [/^Composi[cç][aã]o de:/i, /^Tom:/i, /^Afina[cç][aã]o:/i];
const METADATA_LOOKBACK_LINES = 8;
const METADATA_LOOKAHEAD_LINES = 12;

// Casa um token de cifra isolado (acorde), ex: Em7, C9/E, D4(7), G#, Am.
// Raiz A-G obrigatoria (maiuscula) e o resto e sufixo/extensao/baixo -
// e o que separa um acorde de uma palavra comum que comece com a mesma
// letra (ex: "Deus" comeca com D mas nao casa porque sobra "eus").
const CHORD_TOKEN_RE =
  /^\(?[A-G](?:#|b)?[mMiajndugsb0-9+#()-]*(?:\/[A-G](?:#|b)?)?\)?$/;

const SECTION_TAG_PREFIX_RE = /^(\[[^\]]*\])\s*(.*)$/;

function normalizeMetadataLabel(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function isCompositionLine(line: string): boolean {
  return normalizeMetadataLabel(line).startsWith("composicao de:");
}

function isTomLine(line: string): boolean {
  return normalizeMetadataLabel(line).startsWith("tom:");
}

function isTuningLine(line: string): boolean {
  const tokens = line.trim().split(/\s+/).filter(Boolean);
  return tokens.length === 6 && tokens.every((token) => /^[A-G](?:#|b)?$/i.test(token));
}

function isRhythmLine(line: string): boolean {
  const normalized = normalizeMetadataLabel(line);
  return /^\[ritmo padrao\]/.test(normalized) || /^\d{2,4}(?:\s*bpm)?$/.test(normalized);
}

function isMetadataNoiseLine(line: string): boolean {
  return isCompositionLine(line) || isTomLine(line) || isTuningLine(line) || isRhythmLine(line);
}

function isChordToken(token: string): boolean {
  if (token === "(" || token === ")" || CHORD_TOKEN_RE.test(token)) return true;
  // extracao de PDF de duas colunas as vezes cola acordes vizinhos sem
  // espaco (ex "BmD" == "Bm D", "AF#mED" == "A F#m E D") - se o token
  // inteiro decompoe limpo numa sequencia de 2+ acordes validos, e cifra.
  return splitGluedChordTokens(token) !== null;
}

// Uma linha e "so cifra" quando TODOS os tokens dela sao acordes (ou
// parenteses de progressao, ex: "( Em7 C9 G D )"). Uma linha com uma unica
// palavra que bata com o regex de acorde nao basta - ela precisa estar
// isolada ou acompanhada só de outros acordes.
function isChordLine(line: string): boolean {
  const tokens = line.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return false;
  return tokens.every(isChordToken);
}

const PDF_LINE_Y_TOLERANCE = 1.5;
const PDF_COLUMN_SPLIT_X = 270;
const PDF_MIN_COLUMN_ROWS = 2;

type PdfTextRow = {
  y: number;
  items: PdfTextItem[];
};

function estimateTextWidth(item: PdfTextItem, fontSize: number): number {
  return item.width ?? item.str.length * fontSize * 0.5;
}

function groupPdfItemsIntoRows(items: PdfTextItem[]): PdfTextRow[] {
  const rows: PdfTextRow[] = [];

  for (const item of items) {
    if (!item.str) continue;

    const y = item.transform[5] ?? 0;
    const row = rows.find((candidate) => Math.abs(candidate.y - y) <= PDF_LINE_Y_TOLERANCE);

    if (row) {
      row.items.push(item);
    } else {
      rows.push({ y, items: [item] });
    }
  }

  return rows.sort((left, right) => right.y - left.y);
}

function hasVisiblePdfText(row: PdfTextRow): boolean {
  return row.items.some((item) => item.str.trim().length > 0);
}

function median(values: number[]): number {
  if (values.length === 0) return 0;

  const ordered = [...values].sort((left, right) => left - right);
  const middle = Math.floor(ordered.length / 2);

  return ordered.length % 2 === 0
    ? (ordered[middle - 1] + ordered[middle]) / 2
    : ordered[middle];
}

function inferPdfCharWidth(items: PdfTextItem[]): number {
  const singleCharacterWidths = items
    .filter((item) => item.str.trim().length === 1)
    .map((item) => {
      const fontSize = Math.abs(item.transform[0] ?? item.transform[3] ?? 0) || 10;
      return estimateTextWidth(item, fontSize);
    })
    .filter((width) => width > 0);

  if (singleCharacterWidths.length > 0) {
    return median(singleCharacterWidths);
  }

  const textWidths = items
    .filter((item) => item.str.trim().length > 0)
    .map((item) => {
      const fontSize = Math.abs(item.transform[0] ?? item.transform[3] ?? 0) || 10;
      return estimateTextWidth(item, fontSize) / item.str.length;
    })
    .filter((width) => width > 0);

  return median(textWidths) || 1;
}

function getColumnItems(rows: PdfTextRow[], isRightColumn: boolean): PdfTextItem[] {
  return rows.flatMap((row) =>
    row.items.filter((item) => {
      const x = item.transform[4] ?? 0;
      return isRightColumn ? x >= PDF_COLUMN_SPLIT_X : x < PDF_COLUMN_SPLIT_X;
    }),
  );
}

function getMinimumX(items: PdfTextItem[]): number {
  return items.length > 0 ? Math.min(...items.map((item) => item.transform[4] ?? 0)) : 0;
}

function renderPdfRow(
  items: PdfTextItem[],
  options?: { baseX?: number; charWidth?: number },
): string {
  const orderedItems = items
    .filter((item) => item.str.length > 0)
    .sort((left, right) => {
      const xDelta = (left.transform[4] ?? 0) - (right.transform[4] ?? 0);
      if (xDelta !== 0) return xDelta;

      const leftIsWhitespace = /^\s+$/.test(left.str);
      const rightIsWhitespace = /^\s+$/.test(right.str);
      return Number(leftIsWhitespace) - Number(rightIsWhitespace);
    });

  const visibleItems = orderedItems.filter((item) => item.str.trim().length > 0);
  const baseX = options?.baseX ?? getMinimumX(visibleItems);
  const charWidth = options?.charWidth ?? inferPdfCharWidth(orderedItems);
  const firstVisibleIndex = orderedItems.findIndex((item) => item.str.trim().length > 0);

  if (firstVisibleIndex === -1) return "";

  const firstVisibleItem = orderedItems[firstVisibleIndex];
  const firstVisibleX = firstVisibleItem.transform[4] ?? 0;
  const leadingColumns = Math.max(0, Math.round((firstVisibleX - baseX) / charWidth));
  let text = " ".repeat(leadingColumns);
  let previousXEnd: number | undefined;

  for (const item of orderedItems.slice(firstVisibleIndex)) {
    const value = item.str;
    const x = item.transform[4] ?? 0;
    const fontSize = Math.abs(item.transform[0] ?? item.transform[3] ?? 0) || 10;

    if (
      previousXEnd !== undefined &&
      x - previousXEnd > Math.max(1.5, fontSize * 0.12) &&
      !/\s$/.test(text) &&
      !/^\s/.test(value)
    ) {
      const gapColumns = Math.max(1, Math.round((x - previousXEnd) / charWidth));
      text += " ".repeat(gapColumns);
    }

    text += value;
    previousXEnd = Math.max(previousXEnd ?? 0, x + estimateTextWidth(item, fontSize));
  }

  return text;
}

function renderPdfColumn(rows: PdfTextRow[], isRightColumn: boolean): string[] {
  const columnItems = getColumnItems(rows, isRightColumn);
  const baseX = getMinimumX(columnItems);
  const charWidth = inferPdfCharWidth(columnItems);

  return rows
    .map((row) => ({
      ...row,
      items: row.items.filter((item) => {
        const x = item.transform[4] ?? 0;
        return isRightColumn ? x >= PDF_COLUMN_SPLIT_X : x < PDF_COLUMN_SPLIT_X;
      }),
    }))
    .filter(hasVisiblePdfText)
    .map((row) => renderPdfRow(row.items, { baseX, charWidth }));
}

// O pdf.js entrega itens na ordem interna do arquivo, que nem sempre e a
// ordem visual. Em PDFs do Cifra Club a letra vem primeiro, os acordes depois
// e paginas longas usam duas colunas. Agrupamos por Y, reconstruimos cada
// linha por X e so depois juntamos a coluna esquerda com a direita.
export function renderPdfTextItems(items: PdfTextItem[]): string {
  const rows = groupPdfItemsIntoRows(items).filter(hasVisiblePdfText);
  const leftRows = renderPdfColumn(rows, false);
  const rightRows = renderPdfColumn(rows, true);
  const hasTwoColumns =
    leftRows.length >= PDF_MIN_COLUMN_ROWS && rightRows.length >= PDF_MIN_COLUMN_ROWS;

  if (hasTwoColumns) return [...leftRows, ...rightRows].join("\n");

  const baseX = getMinimumX(items);
  const charWidth = inferPdfCharWidth(items);

  return rows.map((row) => renderPdfRow(row.items, { baseX, charWidth })).join("\n");
}

function renderPageText(pageData: PdfPageData): Promise<string> {
  return pageData
    .getTextContent({ normalizeWhitespace: false, disableCombineTextItems: true })
    .then((textContent) => renderPdfTextItems(textContent.items));
}

// Extrai o texto de cada pagina do PDF separadamente. Manter as paginas
// isoladas e essencial: a forma mais comum de setlist de igreja e uma
// musica por pagina, entao a pagina e o sinal de separacao mais confiavel
// que existe - muito mais que tentar adivinhar titulo por heuristica de
// texto corrido.
export async function extractPdfPages(buffer: Buffer): Promise<string[]> {
  const pdfParseImport = await import("pdf-parse/lib/pdf-parse.js");
  const pdfParse = pdfParseImport.default as PdfParse;
  const pages: string[] = [];
  await pdfParse(buffer, {
    pagerender: async (pageData) => {
      const text = await renderPageText(pageData);
      pages.push(text);
      return text;
    },
  });
  return pages;
}

// Separa letra de cifra a partir das linhas de conteudo de uma musica.
// "chords" e o texto original completo (acorde + letra intercalados, como
// no PDF) - e o que um instrumentista usa para tocar. "lyrics" e o mesmo
// conteudo com as linhas que sao só acorde removidas - o que sobra e a
// letra pura, pronta pra cantar. Marcadores de secao ("[Refrão]") entram
// nos dois; quando vem colado com acordes na mesma linha (ex: "[Solo] Am
// G/B D Em Am"), so o marcador vai pra letra e a linha inteira vai pra
// cifra.
function splitLyricsFromChords(lines: string[]): { lyricLines: string[]; chordLines: string[] } {
  const chordLines = lines;
  const lyricLines: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (line === "") {
      lyricLines.push(rawLine);
      continue;
    }

    const sectionMatch = line.match(SECTION_TAG_PREFIX_RE);
    if (sectionMatch) {
      const [, tag, rest] = sectionMatch;
      lyricLines.push(rest && isChordLine(rest) ? tag : line);
      continue;
    }

    if (isChordLine(line)) {
      continue;
    }

    lyricLines.push(line);
  }

  return { lyricLines, chordLines };
}

function splitIntoBlocks(text: string): string[] {
  return text
    .split(/\n\s*\n\s*\n+/g) // 2+ linhas em branco separam blocos
    .map((block) => block.trim())
    .filter(Boolean);
}

function blockToSong(block: string): ExtractedSong | null {
  const lines = block
    .split("\n")
    .map((line) => line.trim())
    .filter((line, index, arr) => !(line === "" && (index === 0 || index === arr.length - 1)));

  const firstContentIndex = lines.findIndex((line) => line.length > 0);
  if (firstContentIndex === -1) return null;

  const title = lines[firstContentIndex].slice(0, MAX_TITLE_LENGTH).trim();
  if (!title) return null;

  const bodyLines = lines.slice(firstContentIndex + 1);
  const { lyricLines, chordLines } = splitLyricsFromChords(bodyLines);

  return {
    title,
    artist: "",
    key: "",
    lyrics: lyricLines.join("\n").trim(),
    chords: chordLines.join("\n").trimEnd(),
  };
}

type PageSongMetadata = {
  title: string;
  artist: string;
  key: string;
  footerStartIndex: number;
  // Layoutos em que o rodape aparece no topo da pagina (ordem visual do PDF)
  // usam o corpo que vem depois dos metadados, em vez do corpo anterior ao
  // rodape usado pelos PDFs mesclados antigos.
  bodyStartIndex?: number;
  bodyEndIndex?: number;
  // So preenchido no Padrao 2 (PDF mesclado): indice, em `lines`, de onde
  // comeca o bloco de cifra solta que sobra apos "Composicao de:" (o
  // primeiro token dele e o proprio valor do tom). Esse bloco fica fora do
  // corpo letra+cifra normal (ele vem DEPOIS do rodape, nao antes), entao
  // precisa ser recolhido a parte e anexado so ao campo de cifra.
  chordAppendixStartIndex?: number;
};

// Casa um UNICO acorde a partir do inicio da string (sem ancora no fim), pra
// ser usado em decomposicao sequencial - ver splitGluedChordTokens.
const CHORD_SEGMENT_RE =
  /^[A-G][#b]?(?:m|min|maj|dim|aug|sus[24]?|add)?\d{0,2}(?:\(\d{1,2}M?\))?(?:\/[A-G][#b]?)?/;

// Extracao de PDF de duas colunas as vezes cola acordes vizinhos sem espaco
// (ex "AEF#mD" == "A E F#m D"). Tenta decompor a string inteira numa
// sequencia de 2+ acordes validos, de trasa pra frente; se sobrar qualquer
// caractere que nao fecha um acorde, desiste (retorna null) - mais seguro
// deixar a linha como veio do que arriscar destruir letra de verdade.
function splitGluedChordTokens(token: string): string[] | null {
  const segments: string[] = [];
  let rest = token;

  while (rest.length > 0) {
    const match = rest.match(CHORD_SEGMENT_RE);
    if (!match || match[0].length === 0) return null;
    segments.push(match[0]);
    rest = rest.slice(match[0].length);
  }

  return segments.length > 1 ? segments : null;
}

// Normaliza uma linha do apendice de cifra: marcador de secao e parenteses
// de progressao ficam intactos; um token colado que decompoe 100% em
// acordes validos vira acordes separados por espaco; qualquer outra coisa
// (inclusive uma linha que nao decompoe limpo) volta como veio - sem
// tentativa de "adivinhar", pra nao inventar acorde errado.
function expandGluedChords(line: string): string {
  const trimmed = line.trim();
  if (!trimmed) return line;

  const leadingWhitespace = line.slice(0, line.length - line.trimStart().length);

  const sectionMatch = trimmed.match(/^(\[[^\]]*\])(\s*)(.*)$/);
  if (sectionMatch) {
    const [, tag, separator, rest] = sectionMatch;
    if (!rest || !isChordLine(rest)) return line;

    return `${leadingWhitespace}${tag}${separator}${normalizeChordSequence(rest)}`;
  }

  if (!isChordLine(trimmed)) return line;

  return `${leadingWhitespace}${normalizeChordSequence(trimmed)}`;
}

function normalizeChordSequence(line: string): string {
  return line.replace(/\S+/g, (token) => {
    const segments = splitGluedChordTokens(token);
    return segments ? segments.join(" ") : token;
  });
}

function normalizeReadableLine(line: string): string {
  return line.replace(/[ \t]+$/g, "");
}

function normalizeLines(text: string): string[] {
  return text
    .split("\n")
    .map(normalizeReadableLine)
    .filter((line) => line.trim().length > 0);
}

function looksLikeFooterLine(line: string): boolean {
  const normalized = line.trim();
  return isMetadataNoiseLine(normalized) || FOOTER_MARKERS.some((marker) => marker.test(normalized));
}

function findCifraClubMetadataLegacy(lines: string[]): PageSongMetadata | null {
  const compositionIndex = lines.findIndex(isCompositionLine);
  if (compositionIndex < 2) return null;

  // Padrao 1: rodape "impresso" classico do Cifra Club - titulo, artista,
  // "Composicao de:" e, logo depois, "Tom: X" (ou "Afinacao: X") ja com o
  // valor colado na mesma linha.
  const footerWindow = lines.slice(compositionIndex, Math.min(lines.length, compositionIndex + 6));
  const hasTomOrAfinacaoAfter = footerWindow.some(
    (line) => isTomLine(line) || /^Afina[cç][aã]o:/i.test(line.trim()),
  );

  if (hasTomOrAfinacaoAfter) {
    const tomLine = footerWindow.find(isTomLine);
    const key = tomLine ? tomLine.trim().replace(/^Tom:\s*/i, "").trim() : "";

    return {
      title: lines[compositionIndex - 2].slice(0, MAX_TITLE_LENGTH).trim(),
      artist: lines[compositionIndex - 1].trim(),
      key,
      footerStartIndex: compositionIndex - 2,
    };
  }

  // Padrao 2: PDF mesclado (varias musicas do Cifra Club unidas num so
  // arquivo, ex: "ilovepdf_merged"). A extracao de texto do PDF nao segue a
  // ordem visual: um rotulo "Tom:" VAZIO sai 3 linhas antes do titulo, e o
  // valor do tom sobra como a linha logo apos "Composicao de:" (antes do
  // bloco de cifra solta que vem em seguida). Ex real:
  //   ...letra...\nTom: \nQuebrantado\nVineyard\nComposicao de: Jeremy Riddle\nA\n...
  const bareTomIndex = compositionIndex - 3;
  const hasBareTomBefore =
    bareTomIndex >= 0 && /^Tom:\s*$/i.test((lines[bareTomIndex] ?? "").trim());

  if (hasBareTomBefore) {
    const candidateKey = (lines[compositionIndex + 1] ?? "").trim();
    const key = CHORD_TOKEN_RE.test(candidateKey) ? candidateKey : "";

    return {
      title: lines[compositionIndex - 2].slice(0, MAX_TITLE_LENGTH).trim(),
      artist: lines[compositionIndex - 1].trim(),
      key,
      footerStartIndex: bareTomIndex,
      chordAppendixStartIndex: compositionIndex + 1,
    };
  }

  return null;
}

function findCifraClubMetadata(lines: string[]): PageSongMetadata | null {
  const legacyMetadata = findCifraClubMetadataLegacy(lines);
  const compositionIndex = lines.findIndex(isCompositionLine);
  if (compositionIndex < 2) return legacyMetadata;

  const titleIndex = compositionIndex - 2;
  const artistIndex = compositionIndex - 1;
  const title = lines[titleIndex]?.trim() ?? "";
  const artist = lines[artistIndex]?.trim() ?? "";

  if (!title || !artist || isMetadataNoiseLine(title) || isMetadataNoiseLine(artist)) {
    return legacyMetadata;
  }

  let preTitleTomIndex = -1;
  const lookbackStart = Math.max(0, compositionIndex - METADATA_LOOKBACK_LINES);
  for (let index = compositionIndex - 1; index >= lookbackStart; index -= 1) {
    if (isTomLine(lines[index] ?? "")) {
      preTitleTomIndex = index;
      break;
    }
  }

  let explicitTomKey = "";
  const lookaheadEnd = Math.min(lines.length, compositionIndex + METADATA_LOOKAHEAD_LINES);
  for (let index = compositionIndex + 1; index < lookaheadEnd; index += 1) {
    const match = lines[index]?.trim().match(/^Tom:\s*(.*)$/i);
    if (match) {
      explicitTomKey = match[1]?.trim() ?? "";
      break;
    }
  }

  let keyAfterComposition = "";
  let keyAfterCompositionIndex = -1;
  for (let index = compositionIndex + 1; index < lookaheadEnd; index += 1) {
    const candidate = lines[index]?.trim() ?? "";
    if (!candidate || isMetadataNoiseLine(candidate)) continue;

    const tomMatch = candidate.match(/^Tom:\s*(.*)$/i);
    const possibleKey = tomMatch?.[1]?.trim() || candidate;
    if (CHORD_TOKEN_RE.test(possibleKey)) {
      keyAfterComposition = possibleKey;
      keyAfterCompositionIndex = index;
      break;
    }
  }

  const isMergedLayout = preTitleTomIndex !== -1 && preTitleTomIndex < titleIndex;
  const key = explicitTomKey || (isMergedLayout ? keyAfterComposition : "");

  let bodyStartIndex: number | undefined;
  let bodyEndIndex: number | undefined;
  const hasBodyAfterMetadata = lines.slice(compositionIndex + 1).some(
    (line) => !isMetadataNoiseLine(line) && !FOOTER_MARKERS.some((marker) => marker.test(line.trim())),
  );

  if (!isMergedLayout && hasBodyAfterMetadata) {
    bodyStartIndex = compositionIndex + 1;
    while (
      bodyStartIndex < lines.length &&
      isMetadataNoiseLine(lines[bodyStartIndex] ?? "")
    ) {
      bodyStartIndex += 1;
    }

    if (!explicitTomKey && CHORD_TOKEN_RE.test(lines[bodyStartIndex]?.trim() ?? "")) {
      bodyStartIndex += 1;
    }

    bodyEndIndex = lines.length;
  }

  return {
    title: title.slice(0, MAX_TITLE_LENGTH),
    artist,
    key,
    footerStartIndex: isMergedLayout ? preTitleTomIndex : titleIndex,
    ...(bodyStartIndex !== undefined
      ? { bodyStartIndex, bodyEndIndex }
      : {}),
    ...(isMergedLayout
      ? {
          chordAppendixStartIndex:
            keyAfterCompositionIndex !== -1
              ? keyAfterCompositionIndex + 1
              : compositionIndex + 1,
        }
      : {}),
  };
}

function cleanPageLyrics(
  pageText: string,
): { lyrics: string; chords: string; metadata: PageSongMetadata | null } {
  const lines = normalizeLines(pageText);
  const metadata = findCifraClubMetadata(lines);
  const bodyStartIndex = metadata?.bodyStartIndex ?? 0;
  const bodyEndIndex = metadata?.bodyEndIndex ?? metadata?.footerStartIndex ?? lines.length;
  const bodyLines = lines
    .slice(bodyStartIndex, bodyEndIndex)
    .filter((line) => !looksLikeFooterLine(line));
  const { lyricLines, chordLines } = splitLyricsFromChords(bodyLines);

  const chordAppendix =
    metadata?.chordAppendixStartIndex !== undefined
      ? lines
          .slice(metadata.chordAppendixStartIndex)
          .filter((line) => !isMetadataNoiseLine(line))
          .map(expandGluedChords)
      : [];

  return {
    lyrics: lyricLines.join("\n").trim(),
    chords: [...chordLines.map(expandGluedChords), ...chordAppendix].join("\n").trimEnd(),
    metadata,
  };
}

function pushCurrentSong(songs: ExtractedSong[], current: ExtractedSong | null) {
  if (!current) return;

  const title = current.title.trim();
  const lyrics = current.lyrics.trim();
  const chords = current.chords.trimEnd();
  if (title) songs.push({ ...current, title, lyrics, chords });
}

export function extractSongsFromPages(pages: string[]): ExtractedSong[] {
  const songs: ExtractedSong[] = [];
  let currentSong: ExtractedSong | null = null;
  let foundCifraClubMetadata = false;

  for (const page of pages) {
    const { lyrics, chords, metadata } = cleanPageLyrics(page);

    if (metadata) {
      foundCifraClubMetadata = true;
      pushCurrentSong(songs, currentSong);
      currentSong = {
        title: metadata.title,
        artist: metadata.artist,
        key: metadata.key,
        lyrics,
        chords,
      };
      continue;
    }

    if (currentSong) {
      currentSong.lyrics = [currentSong.lyrics, lyrics].filter(Boolean).join("\n");
      currentSong.chords = [currentSong.chords, chords].filter(Boolean).join("\n");
    }
  }

  pushCurrentSong(songs, currentSong);

  if (foundCifraClubMetadata) {
    return songs;
  }

  return pages
    .flatMap((page) => splitIntoBlocks(page))
    .map((block) => blockToSong(block))
    .filter((song): song is ExtractedSong => song !== null);
}
