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
      artist: "",
      key: "",
      lyrics: "Verso 1 linha 1\nVerso 1 linha 2",
      chords: "Verso 1 linha 1\nVerso 1 linha 2",
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

  it("separates letra da cifra e extrai tom/artista em PDF exportado do Cifra Club", () => {
    const page = [
      "Em7 C9/E G",
      "Água em vinho tornou",
      " Am7",
      "Não há outro igual",
      "(Rifle)",
      "[Refrão]",
      "Em7",
      "Deus tu és grande",
      "( Em7 C9 G D )",
      "Nosso Deus",
      "Gui Rebustini",
      "Composição de: Chris Tonlin / Jonas Carl Gustaf Myrin",
      "Tom: G",
      "Afinação: E A D G B E",
    ].join("\n");

    const songs = extractSongsFromPages([page]);

    expect(songs).toHaveLength(1);
    const [song] = songs;

    expect(song.title).toBe("Nosso Deus");
    expect(song.artist).toBe("Gui Rebustini");
    expect(song.key).toBe("G");

    // cifra mantem tudo, igual ao PDF original (acorde + letra intercalados)
    expect(song.chords).toContain("Em7 C9/E G");
    expect(song.chords).toContain("Água em vinho tornou");
    expect(song.chords).toContain("( Em7 C9 G D )");

    // letra fica so com o que se canta: sem linhas so-de-acorde, com as
    // marcacoes de secao preservadas
    expect(song.lyrics).not.toContain("Em7");
    expect(song.lyrics).not.toContain("C9/E");
    expect(song.lyrics).not.toContain("( Em7 C9 G D )");
    expect(song.lyrics).toContain("Água em vinho tornou");
    expect(song.lyrics).toContain("Não há outro igual");
    expect(song.lyrics).toContain("[Refrão]");
    expect(song.lyrics).toContain("Deus tu és grande");
  });

  it("mantem o titulo de medley com '+' como veio do PDF (ex: João 20 + Pra Sempre)", () => {
    const page = [
      "C G/B",
      "Abri minha bíblia em João 20",
      "João 20 + Pra Sempre",
      "Vitor Santana",
      "Composição de: Brian Johnson / Gabriel Wilson",
      "Tom: C",
      "Afinação: E A D G B E",
    ].join("\n");

    const songs = extractSongsFromPages([page]);

    expect(songs).toHaveLength(1);
    expect(songs[0].title).toBe("João 20 + Pra Sempre");
    expect(songs[0].key).toBe("C");
  });

  it("detecta metadados de PDF mesclado onde 'Tom:' vem vazio ANTES do titulo/artista e o valor do tom sobra logo apos 'Composicao de:' (ex: ilovepdf_merged)", () => {
    // Reproduz a ordem de extracao real de um PDF do Cifra Club "impresso e
    // mesclado": ao contrario do rodape classico (titulo, artista,
    // "Composicao de:", "Tom: X"), aqui "Tom:" sai vazio 3 linhas antes do
    // titulo, e o valor do tom vira a linha seguinte a "Composicao de:".
    const page = [
      "[Primeira Parte]",
      "Verso da primeira musica",
      "Segunda linha do verso",
      "[Refrão]",
      "Refrao da primeira musica",
      "Tom: ",
      "Primeira Musica",
      "Banda Exemplo",
      "Composição de: Compositor Um",
      "A",
      "AEF#mD",
      "AEF#mD",
    ].join("\n");

    const songs = extractSongsFromPages([page]);

    expect(songs).toHaveLength(1);
    expect(songs[0].title).toBe("Primeira Musica");
    expect(songs[0].artist).toBe("Banda Exemplo");
    expect(songs[0].key).toBe("A");
    expect(songs[0].lyrics).toContain("Verso da primeira musica");
    expect(songs[0].lyrics).toContain("Refrao da primeira musica");
    // o bloco de cifra solta apos "Composicao de:" (formato desse PDF) nao
    // fica colado na letra
    expect(songs[0].lyrics).not.toContain("AEF#mD");
  });

  it("nao quebra em musicas fantasmas quando uma musica desse formato mesclado ocupa mais de uma pagina", () => {
    const page1 = [
      "[Intro]",
      "Verso 1 da primeira musica",
      "Tom: ",
      "Primeira Musica",
      "Banda Exemplo",
      "Composição de: Compositor Um",
      "A",
      "AEF#mD",
    ].join("\n");
    const page2 = [
      "Continuação da primeira musica",
      "Mais uma linha da letra",
      "[Ponte]",
      "Ultima linha",
    ].join("\n");
    const page3 = [
      "[Intro]",
      "Verso 1 da segunda musica",
      "Tom: ",
      "Segunda Musica",
      "Outra Banda",
      "Composição de: Compositor Dois",
      "Em",
      "CD2Em7Bm7",
    ].join("\n");

    const songs = extractSongsFromPages([page1, page2, page3]);

    expect(songs).toHaveLength(2);
    expect(songs[0].title).toBe("Primeira Musica");
    expect(songs[0].lyrics).toContain("Continuação da primeira musica");
    expect(songs[1].title).toBe("Segunda Musica");
    expect(songs[1].key).toBe("Em");
  });

  it("recupera acordes colados sem espaco (extracao de PDF de duas colunas) sem vazar pra letra", () => {
    // No formato mesclado (Padrao 2), o bloco de cifra solta apos
    // "Composicao de:" as vezes vem com acordes vizinhos colados (ex
    // "AEF#mD" == "A E F#m D") - precisa virar cifra legivel, e uma
    // pagina de continuacao com o mesmo problema (ex "BmD") nao pode
    // vazar como se fosse letra.
    const page1 = [
      "[Intro]",
      "Verso 1",
      "Tom: ",
      "Primeira Musica",
      "Banda Exemplo",
      "Composição de: Compositor Um",
      "A",
      "AEF#mD",
    ].join("\n");
    const page2 = ["[Final]", "Ultima linha da letra", "BmD", "AF#mED"].join("\n");

    const songs = extractSongsFromPages([page1, page2]);

    expect(songs).toHaveLength(1);
    expect(songs[0].lyrics).not.toContain("BmD");
    expect(songs[0].lyrics).not.toContain("AF#mED");
    expect(songs[0].lyrics).toContain("Ultima linha da letra");
    expect(songs[0].chords).toContain("A E F#m D");
    expect(songs[0].chords).toContain("Bm D");
    expect(songs[0].chords).toContain("A F#m E D");
  });

  it("separa uma linha de secao colada com acordes (ex: [Solo] C Dm Am F)", () => {
    const page = [
      "C",
      "O meu Deus sabe tudo",
      "[Solo] C Dm Am F",
      "Te Esperamos",
      "Salvaon",
      "Composição de: Felipe Andrade",
      "Tom: C",
      "Afinação: E A D G B E",
    ].join("\n");

    const songs = extractSongsFromPages([page]);

    expect(songs[0].lyrics).toContain("[Solo]");
    expect(songs[0].lyrics).not.toContain("[Solo] C Dm Am F");
    expect(songs[0].chords).toContain("[Solo] C Dm Am F");
  });
});
