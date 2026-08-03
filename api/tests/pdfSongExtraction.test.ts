import { extractSongsFromPages } from "../src/application/Services/Department/PdfSongExtraction";

describe("extractSongsFromPages", () => {
  it("treats each page as one song (uma musica por pagina)", () => {
    const pages = [
      "Grande e o Senhor\nVerso 1 linha 1\nVerso 1 linha 2",
      "Digno e o Cordeiro\nRefrao linha 1\nRefrao linha 2",
      "Reina em Mim\nPonte linha 1",
    ];

    const songs = extractSongsFromPages(pages);

    expect(songs).toHaveLength(3);
    expect(songs[0]).toEqual({
      title: "Grande e o Senhor",
      lyrics: "Verso 1 linha 1\nVerso 1 linha 2",
    });
    expect(songs[1].title).toBe("Digno e o Cordeiro");
    expect(songs[2].title).toBe("Reina em Mim");
  });

  it("splits multiple songs within a single page by blank lines", () => {
    const pages = [
      [
        "Musica Um",
        "Letra da musica um",
        "",
        "",
        "Musica Dois",
        "Letra da musica dois",
      ].join("\n"),
    ];

    const songs = extractSongsFromPages(pages);

    expect(songs).toHaveLength(2);
    expect(songs[0].title).toBe("Musica Um");
    expect(songs[1].title).toBe("Musica Dois");
  });

  it("keeps a single-song page as one song, not split by single blank lines", () => {
    const pages = [
      [
        "Uma Musica So",
        "Verso 1",
        "",
        "Verso 2",
        "",
        "Refrao",
      ].join("\n"),
    ];

    const songs = extractSongsFromPages(pages);

    expect(songs).toHaveLength(1);
    expect(songs[0].title).toBe("Uma Musica So");
    expect(songs[0].lyrics).toBe("Verso 1\n\nVerso 2\n\nRefrao");
  });

  it("ignores blank pages", () => {
    const pages = ["Musica Valida\nLetra", "   \n\n  ", "Outra Musica\nLetra 2"];

    const songs = extractSongsFromPages(pages);

    expect(songs).toHaveLength(2);
    expect(songs.map((s) => s.title)).toEqual(["Musica Valida", "Outra Musica"]);
  });

  it("returns an empty list when there is no extractable text (scanned PDF)", () => {
    const pages = ["", "  ", "\n\n"];

    const songs = extractSongsFromPages(pages);

    expect(songs).toHaveLength(0);
  });

  it("truncates an unusually long first line to a sane title length", () => {
    const longLine = "A".repeat(120);
    const pages = [`${longLine}\nresto da letra`];

    const songs = extractSongsFromPages(pages);

    expect(songs).toHaveLength(1);
    expect(songs[0].title.length).toBeLessThanOrEqual(60);
  });
});
