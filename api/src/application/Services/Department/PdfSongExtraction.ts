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
type PdfTextItem = { str: string; transform: number[] };
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

// Casa um token de cifra isolado (acorde), ex: Em7, C9/E, D4(7), G#, Am.
// Raiz A-G obrigatoria (maiuscula) e o resto e sufixo/extensao/baixo -
// e o que separa um acorde de uma palavra comum que comece com a mesma
// letra (ex: "Deus" comeca com D mas nao casa porque sobra "eus").
const CHORD_TOKEN_RE =
  /^\(?[A-G][#b]?(?:m|min|maj|dim|aug|sus[24]?|add)?\d{0,2}(?:\(\d{1,2}\))?(?:\/[A-G][#b]?)?\)?$/;

const SECTION_TAG_PREFIX_RE = /^(\[[^\]]*\])\s*(.*)$/;

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

function renderPageText(pageData: PdfPageData): Promise<string> {
  return pageData
    .getTextContent({ normalizeWhitespace: false, disableCombineTextItems: false })
    .then((textContent) => {
      let text = "";
      let lastY: number | undefined;
      for (const item of textContent.items) {
        const y = item.transform[5];
        if (lastY === y || lastY === undefined) {
          text += item.str;
        } else {
          text += `\n${item.str}`;
        }
        lastY = y;
      }
      return text;
    });
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
    chords: chordLines.join("\n").trim(),
  };
}

type PageSongMetadata = {
  title: string;
  artist: string;
  key: string;
  footerStartIndex: number;
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
  if (SECTION_TAG_PREFIX_RE.test(trimmed)) return line;

  const compact = trimmed.replace(/\s+/g, "");
  if (compact === "(" || compact === ")" || compact === "()") return line;

  const segments = splitGluedChordTokens(compact);
  return segments ? segments.join(" ") : line;
}

function normalizeLines(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function looksLikeFooterLine(line: string): boolean {
  return FOOTER_MARKERS.some((marker) => marker.test(line));
}

function findCifraClubMetadata(lines: string[]): PageSongMetadata | null {
  const compositionIndex = lines.findIndex((line) => /^Composi[cç][aã]o de:/i.test(line));
  if (compositionIndex < 2) return null;

  // Padrao 1: rodape "impresso" classico do Cifra Club - titulo, artista,
  // "Composicao de:" e, logo depois, "Tom: X" (ou "Afinacao: X") ja com o
  // valor colado na mesma linha.
  const footerWindow = lines.slice(compositionIndex, Math.min(lines.length, compositionIndex + 6));
  const hasTomOrAfinacaoAfter = footerWindow.some(
    (line) => /^Tom:/i.test(line) || /^Afina[cç][aã]o:/i.test(line),
  );

  if (hasTomOrAfinacaoAfter) {
    const tomLine = footerWindow.find((line) => /^Tom:/i.test(line));
    const key = tomLine ? tomLine.replace(/^Tom:\s*/i, "").trim() : "";

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
  const hasBareTomBefore = bareTomIndex >= 0 && /^Tom:\s*$/i.test(lines[bareTomIndex] ?? "");

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

function cleanPageLyrics(
  pageText: string,
): { lyrics: string; chords: string; metadata: PageSongMetadata | null } {
  const lines = normalizeLines(pageText);
  const metadata = findCifraClubMetadata(lines);
  const bodyLines = (metadata ? lines.slice(0, metadata.footerStartIndex) : lines).filter(
    (line) => !looksLikeFooterLine(line),
  );
  const { lyricLines, chordLines } = splitLyricsFromChords(bodyLines);

  const chordAppendix =
    metadata?.chordAppendixStartIndex !== undefined
      ? lines.slice(metadata.chordAppendixStartIndex).map(expandGluedChords)
      : [];

  return {
    lyrics: lyricLines.join("\n").trim(),
    chords: [...chordLines.map(expandGluedChords), ...chordAppendix].join("\n").trim(),
    metadata,
  };
}

function pushCurrentSong(songs: ExtractedSong[], current: ExtractedSong | null) {
  if (!current) return;

  const title = current.title.trim();
  const lyrics = current.lyrics.trim();
  const chords = current.chords.trim();
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
