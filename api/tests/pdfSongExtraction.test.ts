import {
  extractSongsFromPages,
  renderPdfTextItems,
} from "../src/application/Services/Department/PdfSongExtraction";

describe("extractSongsFromPages", () => {
  it("reconstroi linhas do PDF preservando espacos entre blocos de texto", () => {
    const item = (str: string, x: number, y: number, width: number) => ({
      str,
      transform: [10, 0, 0, 10, x, y],
      width,
    });

    expect(
      renderPdfTextItems([
        item("Em7", 40, 500, 20),
        item("C9/E", 64, 500, 26),
        item("Água", 40, 486, 24),
        item("em", 70, 486.4, 12),
        item("vinho", 88, 486, 28),
        item("tornou", 122, 486, 34),
      ]),
    ).toBe("Em7 C9/E\nÁgua em vinho tornou");
  });

  it("mantem a posicao horizontal do acorde mesmo quando o PDF nao traz espacos iniciais", () => {
    const item = (str: string, x: number, y: number, width: number) => ({
      str,
      transform: [10, 0, 0, 10, x, y],
      width,
    });

    expect(
      renderPdfTextItems([
        item("Eu olho para cruz", 28, 80, 90),
        item("A", 78, 100, 7),
      ]),
    ).toBe("       A\nEu olho para cruz");
  });

  it("reordena acordes espaciais para a linha visual correta antes de anexar a segunda coluna", () => {
    const item = (str: string, x: number, y: number, width: number) => ({
      str,
      transform: [10, 0, 0, 10, x, y],
      width,
    });

    const rendered = renderPdfTextItems([
      item("[Intro]", 28, 100, 42),
      item("Eu olho para cruz", 28, 80, 90),
      item("Sem palavras", 303, 100, 70),
      item("Quebrantado", 303, 80, 70),
      item("A", 78, 100, 7),
      item("E", 96, 100, 7),
    ]);

    expect(rendered.split("\n")).toEqual([
      "[Intro] A  E",
      "Eu olho para cruz",
      "Sem palavras",
      "Quebrantado",
    ]);
  });

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

  it("detecta rodape mesclado quando o bloco de ritmo fica entre Tom e o titulo", () => {
    const page = [
      "[Primeira Parte]",
      "Letra da Vitoria no deserto",
      "Tom:",
      "[Ritmo Padrao]141 bpm",
      "Vitoria No Deserto",
      "Aline Barros",
      "Composicao de: Luciano Moreira",
      "G",
      "1234",
      "GDEmC",
    ].join("\n");

    const songs = extractSongsFromPages([page]);

    expect(songs).toHaveLength(1);
    expect(songs[0]).toMatchObject({
      title: "Vitoria No Deserto",
      artist: "Aline Barros",
      key: "G",
    });
    expect(songs[0].lyrics).toContain("Letra da Vitoria no deserto");
    expect(songs[0].lyrics).not.toContain("Ritmo Padrao");
    expect(songs[0].chords).toContain("G D Em C");
    expect(songs[0].chords).not.toContain("1234");
  });

  it("detecta documento do Cifra Club com Afinacao antes do titulo e Composicao sem espaco", () => {
    const page = [
      "[Intro]",
      "Letra de Quem E Esse",
      "Tom:",
      "Afinacao:",
      "Quem E Esse?",
      "Julliany Souza",
      "Composicao de:Leo Brandao",
      "Em",
      "E A D G B E",
      "CD2Em7Bm7",
    ].join("\n");

    const songs = extractSongsFromPages([page]);

    expect(songs).toHaveLength(1);
    expect(songs[0]).toMatchObject({
      title: "Quem E Esse?",
      artist: "Julliany Souza",
      key: "Em",
    });
    expect(songs[0].lyrics).toContain("Letra de Quem E Esse");
    expect(songs[0].chords).not.toContain("E A D G B E");
    expect(songs[0].chords).toContain("C D2 Em7 Bm7");
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

  it("preserva o espacamento visual das linhas de cifra sem mexer na letra", () => {
    const page = [
      "G             C9        Em7",
      "G7M             A",
      "Há uma nova canção",
      "[Intro]    G       C9",
      "Titulo da Musica",
      "Banda Exemplo",
      "Composição de: Compositor",
      "Tom: G",
    ].join("\n");

    const [song] = extractSongsFromPages([page]);

    expect(song.chords.split("\n").slice(0, 4)).toEqual([
      "G             C9        Em7",
      "G7M             A",
      "Há uma nova canção",
      "[Intro]    G       C9",
    ]);
    expect(song.lyrics).toBe("Há uma nova canção\n[Intro]");
  });

  it("preserva a posição horizontal dos acordes entre as frases", () => {
    const page = [
      "                    G                         C9",
      "Há uma nova canção em meus lábios",
      "                              Em7             D",
      "É uma que eu ainda estou aprendendo a cantar",
      "Titulo da Musica",
      "Banda Exemplo",
      "Composição de: Compositor",
      "Tom: G",
    ].join("\n");

    const [song] = extractSongsFromPages([page]);

    expect(song.chords.split("\n").slice(0, 4)).toEqual([
      "                    G                         C9",
      "Há uma nova canção em meus lábios",
      "                              Em7             D",
      "É uma que eu ainda estou aprendendo a cantar",
    ]);
    expect(song.lyrics).toBe(
      "Há uma nova canção em meus lábios\nÉ uma que eu ainda estou aprendendo a cantar",
    );
  });

  it("extrai letra e cifra quando os metadados aparecem antes do corpo da musica", () => {
    const page = [
      "Quebrantado",
      "Vineyard",
      "Composição de: Jeremy Riddle",
      "Tom: A",
      "[Intro] A E F#m D",
      "A E F#m D",
      "[Primeira Parte]",
      "A",
      "Eu olho para cruz",
      "E",
      "E para cruz eu vou",
    ].join("\n");

    const [song] = extractSongsFromPages([page]);

    expect(song.title).toBe("Quebrantado");
    expect(song.key).toBe("A");
    expect(song.lyrics).toContain("[Intro]");
    expect(song.lyrics).toContain("Eu olho para cruz");
    expect(song.chords).toContain("[Intro] A E F#m D");
    expect(song.chords).toContain("Eu olho para cruz");
  });
});
