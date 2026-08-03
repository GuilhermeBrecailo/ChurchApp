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
  lyrics: string;
};

const MAX_TITLE_LENGTH = 60;
const FOOTER_MARKERS = [/^Composi[cç][aã]o de:/i, /^Tom:/i, /^Afina[cç][aã]o:/i];

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
  const lyrics = lines
    .slice(firstContentIndex + 1)
    .join("\n")
    .trim();

  if (!title) return null;

  return { title, lyrics };
}

type PageSongMetadata = {
  title: string;
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

  const nearbyFooter = lines
    .slice(compositionIndex, Math.min(lines.length, compositionIndex + 5))
    .some((line) => /^Tom:/i.test(line) || /^Afina[cç][aã]o:/i.test(line));

  if (!nearbyFooter) return null;

  return {
    title: lines[compositionIndex - 2].slice(0, MAX_TITLE_LENGTH).trim(),
    footerStartIndex: compositionIndex - 2,
  };
}

function cleanPageLyrics(pageText: string): { lyrics: string; metadata: PageSongMetadata | null } {
  const lines = normalizeLines(pageText);
  const metadata = findCifraClubMetadata(lines);
  const lyricLines = metadata ? lines.slice(0, metadata.footerStartIndex) : lines;

  return {
    lyrics: lyricLines.filter((line) => !looksLikeFooterLine(line)).join("\n").trim(),
    metadata,
  };
}

function pushCurrentSong(songs: ExtractedSong[], current: ExtractedSong | null) {
  if (!current) return;

  const title = current.title.trim();
  const lyrics = current.lyrics.trim();
  if (title) songs.push({ title, lyrics });
}

export function extractSongsFromPages(pages: string[]): ExtractedSong[] {
  const songs: ExtractedSong[] = [];
  let currentSong: ExtractedSong | null = null;
  let foundCifraClubMetadata = false;

  for (const page of pages) {
    const { lyrics, metadata } = cleanPageLyrics(page);

    if (metadata) {
      foundCifraClubMetadata = true;
      pushCurrentSong(songs, currentSong);
      currentSong = { title: metadata.title, lyrics };
      continue;
    }

    if (currentSong) {
      currentSong.lyrics = [currentSong.lyrics, lyrics].filter(Boolean).join("\n");
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
