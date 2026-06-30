import { ref, watch } from "vue";

export interface BibleVerse {
  book_id: string;
  book_name: string;
  chapter: number;
  verse: number;
  text: string;
}

export interface BibleChapterResponse {
  reference: string;
  verses: BibleVerse[];
  text: string;
  translation_id: string;
  translation_name: string;
}

export const BIBLE_VERSIONS = [
  { label: "ACF", value: "almeida" },
  { label: "NVI", value: "nvi" },
  { label: "ARA", value: "almeida" },
  { label: "KJV", value: "kjv" },
] as const;

export const BIBLE_BOOKS = [
  { pt: "Gênesis", en: "genesis", chapters: 50 },
  { pt: "Êxodo", en: "exodus", chapters: 40 },
  { pt: "Levítico", en: "leviticus", chapters: 27 },
  { pt: "Números", en: "numbers", chapters: 36 },
  { pt: "Deuteronômio", en: "deuteronomy", chapters: 34 },
  { pt: "Josué", en: "joshua", chapters: 24 },
  { pt: "Juízes", en: "judges", chapters: 21 },
  { pt: "Rute", en: "ruth", chapters: 4 },
  { pt: "1 Samuel", en: "1samuel", chapters: 31 },
  { pt: "2 Samuel", en: "2samuel", chapters: 24 },
  { pt: "1 Reis", en: "1kings", chapters: 22 },
  { pt: "2 Reis", en: "2kings", chapters: 25 },
  { pt: "1 Crônicas", en: "1chronicles", chapters: 29 },
  { pt: "2 Crônicas", en: "2chronicles", chapters: 36 },
  { pt: "Esdras", en: "ezra", chapters: 10 },
  { pt: "Neemias", en: "nehemiah", chapters: 13 },
  { pt: "Ester", en: "esther", chapters: 10 },
  { pt: "Jó", en: "job", chapters: 42 },
  { pt: "Salmos", en: "psalms", chapters: 150 },
  { pt: "Provérbios", en: "proverbs", chapters: 31 },
  { pt: "Eclesiastes", en: "ecclesiastes", chapters: 12 },
  { pt: "Cantares", en: "song+of+solomon", chapters: 8 },
  { pt: "Isaías", en: "isaiah", chapters: 66 },
  { pt: "Jeremias", en: "jeremiah", chapters: 52 },
  { pt: "Lamentações", en: "lamentations", chapters: 5 },
  { pt: "Ezequiel", en: "ezekiel", chapters: 48 },
  { pt: "Daniel", en: "daniel", chapters: 12 },
  { pt: "Oséias", en: "hosea", chapters: 14 },
  { pt: "Joel", en: "joel", chapters: 3 },
  { pt: "Amós", en: "amos", chapters: 9 },
  { pt: "Obadias", en: "obadiah", chapters: 1 },
  { pt: "Jonas", en: "jonah", chapters: 4 },
  { pt: "Miquéias", en: "micah", chapters: 7 },
  { pt: "Naum", en: "nahum", chapters: 3 },
  { pt: "Habacuque", en: "habakkuk", chapters: 3 },
  { pt: "Sofonias", en: "zephaniah", chapters: 3 },
  { pt: "Ageu", en: "haggai", chapters: 2 },
  { pt: "Zacarias", en: "zechariah", chapters: 14 },
  { pt: "Malaquias", en: "malachi", chapters: 4 },
  { pt: "Mateus", en: "matthew", chapters: 28 },
  { pt: "Marcos", en: "mark", chapters: 16 },
  { pt: "Lucas", en: "luke", chapters: 24 },
  { pt: "João", en: "john", chapters: 21 },
  { pt: "Atos", en: "acts", chapters: 28 },
  { pt: "Romanos", en: "romans", chapters: 16 },
  { pt: "1 Coríntios", en: "1corinthians", chapters: 16 },
  { pt: "2 Coríntios", en: "2corinthians", chapters: 13 },
  { pt: "Gálatas", en: "galatians", chapters: 6 },
  { pt: "Efésios", en: "ephesians", chapters: 6 },
  { pt: "Filipenses", en: "philippians", chapters: 4 },
  { pt: "Colossenses", en: "colossians", chapters: 4 },
  { pt: "1 Tessalonicenses", en: "1thessalonians", chapters: 5 },
  { pt: "2 Tessalonicenses", en: "2thessalonians", chapters: 3 },
  { pt: "1 Timóteo", en: "1timothy", chapters: 6 },
  { pt: "2 Timóteo", en: "2timothy", chapters: 4 },
  { pt: "Tito", en: "titus", chapters: 3 },
  { pt: "Filemom", en: "philemon", chapters: 1 },
  { pt: "Hebreus", en: "hebrews", chapters: 13 },
  { pt: "Tiago", en: "james", chapters: 5 },
  { pt: "1 Pedro", en: "1peter", chapters: 5 },
  { pt: "2 Pedro", en: "2peter", chapters: 3 },
  { pt: "1 João", en: "1john", chapters: 5 },
  { pt: "2 João", en: "2john", chapters: 1 },
  { pt: "3 João", en: "3john", chapters: 1 },
  { pt: "Judas", en: "jude", chapters: 1 },
  { pt: "Apocalipse", en: "revelation", chapters: 22 },
];

const STORAGE_KEY = "bible_reader_state";

export function useBible() {
  const selectedVersion = ref("almeida");
  const selectedBookIndex = ref(0);
  const selectedChapter = ref(1);
  const verses = ref<BibleVerse[]>([]);
  const loading = ref(false);
  const error = ref("");

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

    try {
      const url = `https://bible-api.com/${book.en}+${selectedChapter.value}?translation=${selectedVersion.value}`;
      const response = await $fetch<BibleChapterResponse>(url);
      verses.value = response.verses ?? [];
      saveState();
    } catch {
      error.value = "Não foi possível carregar os versículos agora. Tente novamente.";
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
    restoreState,
    fetchChapter,
    currentBook,
    hasPrevChapter,
    hasNextChapter,
    prevChapter,
    nextChapter,
  };
}
