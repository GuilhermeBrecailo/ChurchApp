import {
  deriveLyricsFromChords,
  extractCifraClubText,
} from "../src/interfaces/adapters/churchDepartment/cifraClub";
import { extractSongsFromPages } from "../src/application/Services/Department/PdfSongExtraction";

const ZWSP = "\u200b";
const chord = (name: string) => `<b data-chord-name="${name}">${name}</b>`;

// Formato atual do <pre> do Cifra Club: cada linha comeca com um zero-width
// space e os blocos vem embrulhados em <div>.
const cifraClubHtml = [
  `<pre><div class="kvMV">${ZWSP}[Intro] ${chord("Bm")}  ${chord("G6")}  ${chord("D")}`,
  "",
  `${ZWSP}[Primeira Parte]`,
  "",
  `</div><div class="kvMV">${ZWSP}${chord("Bm")}`,
  `${ZWSP}Um caminho`,
  `${ZWSP}${chord("G")}            ${chord("D")}`,
  `${ZWSP}  Ele abriu no mar`,
  "",
  `${ZWSP}[Refrão]`,
  "",
  `${ZWSP}  ${chord("D")}`,
  `${ZWSP}Quem sou eu`,
  `</div></pre>`,
].join("\n");

describe("texto do Cifra Club", () => {
  it("remove os caracteres invisiveis do texto da cifra", () => {
    const chords = extractCifraClubText(cifraClubHtml);

    expect(chords).not.toMatch(/[\u200b-\u200d\u2060\ufeff]/);
    expect(chords.split("\n")[0]).toBe("[Intro] Bm  G6  D");
    expect(chords).toContain("\n[Refrão]\n");
  });

  it("gera a letra sem nenhuma linha de acorde", () => {
    const lyrics = deriveLyricsFromChords(extractCifraClubText(cifraClubHtml));

    expect(lyrics).toBe(
      ["[Intro]", "", "[Primeira Parte]", "", "Um caminho", "  Ele abriu no mar", "", "[Refrão]", "", "Quem sou eu"].join(
        "\n",
      ),
    );
  });

  it("reconhece setima maior na notacao brasileira", () => {
    expect(deriveLyricsFromChords("         D7M\nPra me amar tanto assim?\nC7M(9)  G/B\nE agora")).toBe(
      "Pra me amar tanto assim?\nE agora",
    );
  });

  it("limpa a letra mesmo quando a cifra salva ainda tem zero-width space", () => {
    expect(deriveLyricsFromChords(`${ZWSP}Am\n${ZWSP}Um caminho\n${ZWSP}[Refrão]`)).toBe(
      "Um caminho\n[Refrão]",
    );
  });
});

describe("PDF com caracteres invisiveis", () => {
  it("separa letra e cifra quando as linhas comecam com zero-width space", () => {
    const page = [
      `${ZWSP}Sou Grato Por Seu Amor`,
      `${ZWSP}Get Worship`,
      "",
      `${ZWSP}[Refrão]`,
      `${ZWSP}  D`,
      `${ZWSP}Quem sou eu`,
      `${ZWSP}      A    G`,
      `${ZWSP}Sou grato por Seu amor`,
    ].join("\n");

    const [song] = extractSongsFromPages([page]);

    expect(song.lyrics).not.toMatch(/[\u200b-\u200d\u2060\ufeff]/);
    expect(song.chords).not.toMatch(/[\u200b-\u200d\u2060\ufeff]/);
    expect(song.lyrics).not.toMatch(/^\s*[A-G]\s*$/m);
    expect(song.lyrics).toContain("Quem sou eu");
    expect(song.lyrics).toContain("[Refrão]");
    expect(song.chords).toContain("Sou grato por Seu amor");
  });
});
