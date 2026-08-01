import { ref, watch } from "vue";

export interface BibleVerse {
  book_id: string;
  book_name: string;
  chapter: number;
  verse: number;
  text: string;
}

interface BibliaDigitalVerse {
  number: number;
  text: string;
}

interface BibliaDigitalChapterResponse {
  book: {
    name: string;
    abbrev: {
      pt: string;
      en: string;
    };
  };
  chapter: {
    number: number;
    verses: number;
  };
  verses: BibliaDigitalVerse[];
}

interface BibleApiChapterResponse {
  verses: BibleVerse[];
}

export const BIBLE_VERSIONS = [
  { label: "NVI", value: "nvi" },
  { label: "ACF", value: "acf" },
  { label: "ARA", value: "ra" },
  { label: "NVT", value: "nvt" },
] as const;

export const BIBLE_BOOKS = [
  { pt: "Gênesis", abbrev: "gn", chapters: 50 },
  { pt: "Êxodo", abbrev: "ex", chapters: 40 },
  { pt: "Levítico", abbrev: "lv", chapters: 27 },
  { pt: "Números", abbrev: "nm", chapters: 36 },
  { pt: "Deuteronômio", abbrev: "dt", chapters: 34 },
  { pt: "Josué", abbrev: "js", chapters: 24 },
  { pt: "Juízes", abbrev: "jz", chapters: 21 },
  { pt: "Rute", abbrev: "rt", chapters: 4 },
  { pt: "1 Samuel", abbrev: "1sm", chapters: 31 },
  { pt: "2 Samuel", abbrev: "2sm", chapters: 24 },
  { pt: "1 Reis", abbrev: "1rs", chapters: 22 },
  { pt: "2 Reis", abbrev: "2rs", chapters: 25 },
  { pt: "1 Crônicas", abbrev: "1cr", chapters: 29 },
  { pt: "2 Crônicas", abbrev: "2cr", chapters: 36 },
  { pt: "Esdras", abbrev: "ed", chapters: 10 },
  { pt: "Neemias", abbrev: "ne", chapters: 13 },
  { pt: "Ester", abbrev: "et", chapters: 10 },
  { pt: "Jó", abbrev: "jó", chapters: 42 },
  { pt: "Salmos", abbrev: "sl", chapters: 150 },
  { pt: "Provérbios", abbrev: "pv", chapters: 31 },
  { pt: "Eclesiastes", abbrev: "ec", chapters: 12 },
  { pt: "Cantares", abbrev: "ct", chapters: 8 },
  { pt: "Isaías", abbrev: "is", chapters: 66 },
  { pt: "Jeremias", abbrev: "jr", chapters: 52 },
  { pt: "Lamentações", abbrev: "lm", chapters: 5 },
  { pt: "Ezequiel", abbrev: "ez", chapters: 48 },
  { pt: "Daniel", abbrev: "dn", chapters: 12 },
  { pt: "Oséias", abbrev: "os", chapters: 14 },
  { pt: "Joel", abbrev: "jl", chapters: 3 },
  { pt: "Amós", abbrev: "am", chapters: 9 },
  { pt: "Obadias", abbrev: "ob", chapters: 1 },
  { pt: "Jonas", abbrev: "jn", chapters: 4 },
  { pt: "Miquéias", abbrev: "mq", chapters: 7 },
  { pt: "Naum", abbrev: "na", chapters: 3 },
  { pt: "Habacuque", abbrev: "hc", chapters: 3 },
  { pt: "Sofonias", abbrev: "sf", chapters: 3 },
  { pt: "Ageu", abbrev: "ag", chapters: 2 },
  { pt: "Zacarias", abbrev: "zc", chapters: 14 },
  { pt: "Malaquias", abbrev: "ml", chapters: 4 },
  { pt: "Mateus", abbrev: "mt", chapters: 28 },
  { pt: "Marcos", abbrev: "mc", chapters: 16 },
  { pt: "Lucas", abbrev: "lc", chapters: 24 },
  { pt: "João", abbrev: "jo", chapters: 21 },
  { pt: "Atos", abbrev: "at", chapters: 28 },
  { pt: "Romanos", abbrev: "rm", chapters: 16 },
  { pt: "1 Coríntios", abbrev: "1co", chapters: 16 },
  { pt: "2 Coríntios", abbrev: "2co", chapters: 13 },
  { pt: "Gálatas", abbrev: "gl", chapters: 6 },
  { pt: "Efésios", abbrev: "ef", chapters: 6 },
  { pt: "Filipenses", abbrev: "fp", chapters: 4 },
  { pt: "Colossenses", abbrev: "cl", chapters: 4 },
  { pt: "1 Tessalonicenses", abbrev: "1ts", chapters: 5 },
  { pt: "2 Tessalonicenses", abbrev: "2ts", chapters: 3 },
  { pt: "1 Timóteo", abbrev: "1tm", chapters: 6 },
  { pt: "2 Timóteo", abbrev: "2tm", chapters: 4 },
  { pt: "Tito", abbrev: "tt", chapters: 3 },
  { pt: "Filemom", abbrev: "fm", chapters: 1 },
  { pt: "Hebreus", abbrev: "hb", chapters: 13 },
  { pt: "Tiago", abbrev: "tg", chapters: 5 },
  { pt: "1 Pedro", abbrev: "1pe", chapters: 5 },
  { pt: "2 Pedro", abbrev: "2pe", chapters: 3 },
  { pt: "1 João", abbrev: "1jo", chapters: 5 },
  { pt: "2 João", abbrev: "2jo", chapters: 1 },
  { pt: "3 João", abbrev: "3jo", chapters: 1 },
  { pt: "Judas", abbrev: "jd", chapters: 1 },
  { pt: "Apocalipse", abbrev: "ap", chapters: 22 },
];

const STORAGE_KEY = "bible_reader_state";

const BIBLE_API_BOOKS: Record<string, string> = {
  gn: "genesis",
  ex: "exodus",
  lv: "leviticus",
  nm: "numbers",
  dt: "deuteronomy",
  js: "joshua",
  jz: "judges",
  rt: "ruth",
  "1sm": "1samuel",
  "2sm": "2samuel",
  "1rs": "1kings",
  "2rs": "2kings",
  "1cr": "1chronicles",
  "2cr": "2chronicles",
  ed: "ezra",
  ne: "nehemiah",
  et: "esther",
  "jó": "job",
  sl: "psalms",
  pv: "proverbs",
  ec: "ecclesiastes",
  ct: "song+of+solomon",
  is: "isaiah",
  jr: "jeremiah",
  lm: "lamentations",
  ez: "ezekiel",
  dn: "daniel",
  os: "hosea",
  jl: "joel",
  am: "amos",
  ob: "obadiah",
  jn: "jonah",
  mq: "micah",
  na: "nahum",
  hc: "habakkuk",
  sf: "zephaniah",
  ag: "haggai",
  zc: "zechariah",
  ml: "malachi",
  mt: "matthew",
  mc: "mark",
  lc: "luke",
  jo: "john",
  at: "acts",
  rm: "romans",
  "1co": "1corinthians",
  "2co": "2corinthians",
  gl: "galatians",
  ef: "ephesians",
  fp: "philippians",
  cl: "colossians",
  "1ts": "1thessalonians",
  "2ts": "2thessalonians",
  "1tm": "1timothy",
  "2tm": "2timothy",
  tt: "titus",
  fm: "philemon",
  hb: "hebrews",
  tg: "james",
  "1pe": "1peter",
  "2pe": "2peter",
  "1jo": "1john",
  "2jo": "2john",
  "3jo": "3john",
  jd: "jude",
  ap: "revelation",
};

export function useBible() {
  const selectedVersion = ref("nvi");
  const selectedBookIndex = ref(0);
  const selectedChapter = ref(1);
  const verses = ref<BibleVerse[]>([]);
  const loading = ref(false);
  const error = ref("");
  // A API principal (abibliadigital.com.br) e uma API gratuita/comunitaria
  // que cai com frequencia (erro 500 do lado dela). Quando isso acontece,
  // caimos num fallback que so tem a versao Almeida - sem esta flag, a tela
  // mostrava o texto Almeida com o chip da versao que o usuario escolheu
  // (ex.: "NVI"), passando a versao errada como se fosse a certa.
  const usedFallback = ref(false);

  const restoreState = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (saved.version) selectedVersion.value = saved.version;
      if (typeof saved.bookIndex === "number") selectedBookIndex.value = saved.bookIndex;
      if (typeof saved.chapter === "number") selectedChapter.value = saved.chapter;
    } catch {
      // ignore parse errors
    }
  };

  const saveState = () => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          version: selectedVersion.value,
          bookIndex: selectedBookIndex.value,
          chapter: selectedChapter.value,
        }),
      );
    } catch {
      // ignore storage errors
    }
  };

  const fetchChapter = async () => {
    const book = BIBLE_BOOKS[selectedBookIndex.value];
    if (!book) return;

    loading.value = true;
    error.value = "";
    verses.value = [];
    usedFallback.value = false;

    try {
      const url = `https://www.abibliadigital.com.br/api/verses/${selectedVersion.value}/${encodeURIComponent(book.abbrev)}/${selectedChapter.value}`;
      const response = await $fetch<BibliaDigitalChapterResponse>(url);
      verses.value = (response.verses ?? []).map((verse) => ({
        book_id: book.abbrev,
        book_name: book.pt,
        chapter: selectedChapter.value,
        verse: verse.number,
        text: verse.text,
      }));
      saveState();
    } catch {
      try {
        const fallbackBook = BIBLE_API_BOOKS[book.abbrev];
        if (!fallbackBook) throw new Error("Livro sem fallback");
        const fallbackUrl = `https://bible-api.com/${fallbackBook}+${selectedChapter.value}?translation=almeida`;
        const response = await $fetch<BibleApiChapterResponse>(fallbackUrl);
        verses.value = response.verses ?? [];
        usedFallback.value = true;
        saveState();
      } catch {
        error.value = "Não foi possível carregar os versículos agora. Tente novamente.";
      }
    } finally {
      loading.value = false;
    }
  };

  const currentBook = () => BIBLE_BOOKS[selectedBookIndex.value];

  const hasPrevChapter = () =>
    selectedChapter.value > 1 || selectedBookIndex.value > 0;

  const hasNextChapter = () =>
    selectedChapter.value < currentBook().chapters ||
    selectedBookIndex.value < BIBLE_BOOKS.length - 1;

  const prevChapter = () => {
    if (selectedChapter.value > 1) {
      selectedChapter.value -= 1;
    } else if (selectedBookIndex.value > 0) {
      selectedBookIndex.value -= 1;
      selectedChapter.value = BIBLE_BOOKS[selectedBookIndex.value].chapters;
    }
    fetchChapter();
  };

  const nextChapter = () => {
    if (selectedChapter.value < currentBook().chapters) {
      selectedChapter.value += 1;
    } else if (selectedBookIndex.value < BIBLE_BOOKS.length - 1) {
      selectedBookIndex.value += 1;
      selectedChapter.value = 1;
    }
    fetchChapter();
  };

  return {
    selectedVersion,
    selectedBookIndex,
    selectedChapter,
    verses,
    loading,
    error,
    usedFallback,
    restoreState,
    fetchChapter,
    currentBook,
    hasPrevChapter,
    hasNextChapter,
    prevChapter,
    nextChapter,
  };
}
