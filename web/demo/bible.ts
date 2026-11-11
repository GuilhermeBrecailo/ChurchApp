// Bíblia offline da demo: responde as chamadas de useBible.ts para bolls.life
// e bible-api.com com alguns capítulos (texto de domínio público, tradução de
// João Ferreira de Almeida). Outros capítulos mostram um aviso curto.

const GENESIS_1 = [
  "No princípio criou Deus os céus e a terra.",
  "E a terra era sem forma e vazia; e havia trevas sobre a face do abismo; e o Espírito de Deus se movia sobre a face das águas.",
  "E disse Deus: Haja luz; e houve luz.",
  "E viu Deus que era boa a luz; e fez Deus separação entre a luz e as trevas.",
  "E Deus chamou à luz Dia; e às trevas chamou Noite. E foi a tarde e a manhã, o dia primeiro.",
  "E disse Deus: Haja uma expansão no meio das águas, e haja separação entre águas e águas.",
  "E fez Deus a expansão, e fez separação entre as águas que estavam debaixo da expansão e as águas que estavam sobre a expansão; e assim foi.",
  "E chamou Deus à expansão Céus, e foi a tarde e a manhã, o dia segundo.",
  "E disse Deus: Ajuntem-se as águas debaixo dos céus num lugar; e apareça a porção seca; e assim foi.",
  "E chamou Deus à porção seca Terra; e ao ajuntamento das águas chamou Mares; e viu Deus que era bom.",
  "E disse Deus: Produza a terra erva verde, erva que dê semente, árvore frutífera que dê fruto segundo a sua espécie, cuja semente está nela sobre a terra; e assim foi.",
  "E a terra produziu erva, erva dando semente conforme a sua espécie, e a árvore frutífera, cuja semente está nela conforme a sua espécie; e viu Deus que era bom.",
  "E foi a tarde e a manhã, o dia terceiro.",
  "E disse Deus: Haja luminares na expansão dos céus, para haver separação entre o dia e a noite; e sejam eles para sinais e para tempos determinados e para dias e anos.",
  "E sejam para luminares na expansão dos céus, para iluminar a terra; e assim foi.",
  "E fez Deus os dois grandes luminares: o luminar maior para governar o dia, e o luminar menor para governar a noite; e fez as estrelas.",
  "E Deus os pôs na expansão dos céus para iluminar a terra,",
  "E para governar o dia e a noite, e para fazer separação entre a luz e as trevas; e viu Deus que era bom.",
  "E foi a tarde e a manhã, o dia quarto.",
  "E disse Deus: Produzam as águas abundantemente répteis de alma vivente; e voem as aves sobre a face da expansão dos céus.",
  "E Deus criou as grandes baleias, e todo o réptil de alma vivente que as águas abundantemente produziram conforme as suas espécies; e toda a ave de asas conforme a sua espécie; e viu Deus que era bom.",
  "E Deus os abençoou, dizendo: Frutificai e multiplicai-vos, e enchei as águas nos mares; e as aves se multipliquem na terra.",
  "E foi a tarde e a manhã, o dia quinto.",
  "E disse Deus: Produza a terra alma vivente conforme a sua espécie; gado, e répteis e feras da terra conforme a sua espécie; e assim foi.",
  "E fez Deus as feras da terra conforme a sua espécie, e o gado conforme a sua espécie, e todo o réptil da terra conforme a sua espécie; e viu Deus que era bom.",
  "E disse Deus: Façamos o homem à nossa imagem, conforme a nossa semelhança; e domine sobre os peixes do mar, e sobre as aves dos céus, e sobre o gado, e sobre toda a terra, e sobre todo o réptil que se move sobre a terra.",
  "E criou Deus o homem à sua imagem: à imagem de Deus o criou; homem e mulher os criou.",
  "E Deus os abençoou, e Deus lhes disse: Frutificai e multiplicai-vos, e enchei a terra, e sujeitai-a; e dominai sobre os peixes do mar e sobre as aves dos céus, e sobre todo o animal que se move sobre a terra.",
  "E disse Deus: Eis que vos tenho dado toda a erva que dá semente, que está sobre a face de toda a terra; e toda a árvore, em que há fruto que dá semente, ser-vos-á para mantimento.",
  "E a todo o animal da terra, e a toda a ave dos céus, e a todo o réptil da terra, em que há alma vivente, toda a erva verde será para mantimento; e assim foi.",
  "E viu Deus tudo quanto tinha feito, e eis que era muito bom; e foi a tarde e a manhã, o dia sexto.",
];

const PSALM_23 = [
  "O Senhor é o meu pastor, nada me faltará.",
  "Deitar-me faz em verdes pastos, guia-me mansamente a águas tranquilas.",
  "Refrigera a minha alma; guia-me pelas veredas da justiça, por amor do seu nome.",
  "Ainda que eu andasse pelo vale da sombra da morte, não temeria mal algum, porque tu estás comigo; a tua vara e o teu cajado me consolam.",
  "Preparas uma mesa perante mim na presença dos meus inimigos, unges a minha cabeça com óleo, o meu cálice transborda.",
  "Certamente que a bondade e a misericórdia me seguirão todos os dias da minha vida; e habitarei na casa do Senhor por longos dias.",
];

const JOHN_3_EXCERPT: [number, string][] = [
  [16, "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna."],
  [17, "Porque Deus enviou o seu Filho ao mundo, não para que condenasse o mundo, mas para que o mundo fosse salvo por ele."],
];

/** [livro (1 = Gênesis), capítulo] -> versículos */
const CHAPTERS: Record<string, [number, string][]> = {
  "1:1": GENESIS_1.map((text, index) => [index + 1, text]),
  "19:23": PSALM_23.map((text, index) => [index + 1, text]),
  "43:3": JOHN_3_EXCERPT,
};

const PLACEHOLDER: [number, string][] = [
  [1, "Este capítulo não está disponível no modo demonstração (sem internet)."],
  [2, "Experimente Gênesis 1, Salmos 23 ou João 3 — eles funcionam offline."],
];

function versesFor(book: number, chapter: number) {
  return CHAPTERS[`${book}:${chapter}`] ?? PLACEHOLDER;
}

const API_BOOK_INDEX: Record<string, number> = { genesis: 1, psalms: 19, john: 43 };

/** Devolve o JSON que a API externa devolveria, ou null se a URL não for de Bíblia. */
export function demoBibleResponse(url: string): unknown | null {
  const bolls = /^https:\/\/bolls\.life\/get-chapter\/[^/]+\/(\d+)\/(\d+)\/?/.exec(url);
  if (bolls) {
    return versesFor(Number(bolls[1]), Number(bolls[2])).map(([verse, text], index) => ({
      pk: index + 1,
      verse,
      text,
    }));
  }
  const bibleApi = /^https:\/\/bible-api\.com\/([^+?]+)\+(\d+)/.exec(url);
  if (bibleApi) {
    const bookKey = decodeURIComponent(bibleApi[1]!).toLowerCase();
    const chapter = Number(bibleApi[2]);
    const book = API_BOOK_INDEX[bookKey] ?? 0;
    return {
      verses: versesFor(book, chapter).map(([verse, text]) => ({
        book_id: bookKey,
        book_name: bookKey,
        chapter,
        verse,
        text,
      })),
    };
  }
  return null;
}
