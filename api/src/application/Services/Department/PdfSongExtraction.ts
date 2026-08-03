import pdfParseImport from "pdf-parse/lib/pdf-parse.js";

// pdf-parse tipa a opcao pagerender de forma generica (any); redeclaramos a
// assinatura real do pageData do pdf.js que ele repassa, para tipar o
// pagerender proprio abaixo sem perder seguranca de tipos no resto do modulo.
const pdfParse = pdfParseImport as unknown as (
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
  return token === "(" || token === ")" || CHORD_TOKEN_RE.test(token);
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
};

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

  const footerWindow = lines.slice(compositionIndex, Math.min(lines.length, compositionIndex + 6));
  const hasTomOrAfinacao = footerWindow.some(
    (line) => /^Tom:/i.test(line) || /^Afina[cç][aã]o:/i.test(line),
  );

  if (!hasTomOrAfinacao) return null;

  const tomLine = footerWindow.find((line) => /^Tom:/i.test(line));
  const key = tomLine ? tomLine.replace(/^Tom:\s*/i, "").trim() : "";

  return {
    title: lines[compositionIndex - 2].slice(0, MAX_TITLE_LENGTH).trim(),
    artist: lines[compositionIndex - 1].trim(),
    key,
    footerStartIndex: compositionIndex - 2,
  };
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

  return {
    lyrics: lyricLines.join("\n").trim(),
    chords: chordLines.join("\n").trim(),
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
