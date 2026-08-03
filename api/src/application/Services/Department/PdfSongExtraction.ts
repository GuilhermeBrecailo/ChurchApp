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

// Uma pagina pode conter mais de uma musica (setlist compacto); dentro da
// pagina, blocos separados por linha(s) em branco viram musicas separadas.
// Quando a pagina inteira e um bloco so, ela vira uma unica musica - e o
// caso comum de "uma musica por pagina".
function extractSongsFromPage(pageText: string): ExtractedSong[] {
  const blocks = splitIntoBlocks(pageText);
  return blocks
    .map((block) => blockToSong(block))
    .filter((song): song is ExtractedSong => song !== null);
}

export function extractSongsFromPages(pages: string[]): ExtractedSong[] {
  return pages.flatMap((page) => extractSongsFromPage(page));
}
