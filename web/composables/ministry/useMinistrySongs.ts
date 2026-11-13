import { computed, reactive, ref } from "vue";
import {
  useDepartments,
  type DepartmentSong,
  type PdfSongSuggestion,
} from "../useDepartments";
import {
  SONG_KEY_OPTIONS,
  normalizeSongKey,
  songKeyDistance,
  songKeyLabel,
  transposeChordText,
} from "../useSongChords";
import { duplicateSongTitleMessage } from "../../app/utils/songMessages";

/**
 * Abrir uma música em tela cheia com "meu tom" e "minha cifra" (por
 * pessoa). Usado no Repertório e nas músicas de uma escala.
 */
export function useSongViewer() {
  const { getSongPreference, updateSongPreference } = useDepartments();

  const isOpen = ref(false);
  const song = ref<DepartmentSong | null>(null);
  const tab = ref<"lyrics" | "chords">("lyrics");
  const personal = reactive({ personalKey: "", chords: "", notes: "" });
  const isLoading = ref(false);
  const isSaving = ref(false);
  const error = ref("");
  const lastPersonalKey = ref("");

  const loadPreference = async (target: DepartmentSong) => {
    error.value = "";
    isLoading.value = true;
    personal.personalKey = "";
    personal.chords = target.metadata?.chords || "";
    personal.notes = "";
    try {
      const { data, error: loadError } = await getSongPreference(target.id);
      if (loadError) {
        error.value = loadError;
        return;
      }
      personal.personalKey = data?.personalKey || "";
      personal.chords = data?.chords || target.metadata?.chords || "";
      personal.notes = data?.notes || "";
      lastPersonalKey.value = normalizeSongKey(personal.personalKey || target.metadata?.key || "");
    } finally {
      isLoading.value = false;
    }
  };

  const open = (target: DepartmentSong) => {
    song.value = target;
    tab.value = target.metadata?.lyrics ? "lyrics" : "chords";
    isOpen.value = true;
    void loadPreference(target);
  };

  const close = () => {
    isOpen.value = false;
    song.value = null;
    error.value = "";
  };

  const useOfficialChords = () => {
    personal.personalKey = song.value?.metadata?.key || "";
    personal.chords = song.value?.metadata?.chords || "";
  };

  // Trocar "meu tom" transpõe a cifra pessoal a partir do tom que valia.
  const changePersonalKey = (nextKey: string | null) => {
    const previous = normalizeSongKey(lastPersonalKey.value || song.value?.metadata?.key || "");
    const target = normalizeSongKey(nextKey || "");
    lastPersonalKey.value = target;
    if (!previous || !target || previous === target || !personal.chords.trim()) return;
    personal.chords = transposeChordText(personal.chords, songKeyDistance(previous, target));
  };

  const savePreference = async () => {
    if (!song.value) return false;
    error.value = "";
    isSaving.value = true;
    try {
      const { data, error: saveError } = await updateSongPreference(song.value.id, { ...personal });
      if (saveError || !data) {
        error.value = saveError || "Não foi possível salvar sua cifra.";
        return false;
      }
      personal.personalKey = data.personalKey || "";
      personal.chords = data.chords || "";
      personal.notes = data.notes || "";
      return true;
    } finally {
      isSaving.value = false;
    }
  };

  return {
    isOpen,
    song,
    tab,
    personal,
    isLoading,
    isSaving,
    error,
    open,
    close,
    useOfficialChords,
    changePersonalKey,
    savePreference,
  };
}

/**
 * Repertório de um ministério: lista, cadastro (com Cifra Club e PDF da
 * música), mix e importar várias músicas de um PDF.
 */
export function useMinistrySongs(departmentId: string) {
  const {
    getDepartmentSongs,
    createDepartmentSong,
    updateDepartmentSong,
    deleteDepartmentSong,
    createSongMix,
    importCifraClubSong,
    uploadDepartmentPdf,
    previewSongsFromPdf,
    importSongsFromPdf,
  } = useDepartments();

  const songs = ref<DepartmentSong[]>([]);
  const isLoading = ref(false);
  const loadError = ref("");

  const sortSongs = (list: DepartmentSong[]) =>
    [...list].sort((first, second) => first.title.localeCompare(second.title, "pt-BR"));

  const load = async () => {
    isLoading.value = true;
    loadError.value = "";
    try {
      const { data, error } = await getDepartmentSongs(departmentId);
      if (error) {
        loadError.value = error;
        return;
      }
      songs.value = sortSongs(data ?? []);
    } finally {
      isLoading.value = false;
    }
  };

  // ---- Cadastro de música ----
  const isFormOpen = ref(false);
  const formTab = ref("info");
  const editingId = ref("");
  const formError = ref("");
  const isSaving = ref(false);
  const isImportingCifraClub = ref(false);
  const cifraClubMessage = ref("");
  const pdfFile = ref<File | File[] | null>(null);
  const lastFormKey = ref("");
  const form = reactive({
    title: "",
    artist: "",
    key: "",
    bpm: "",
    songCategory: "Louvor",
    url: "",
    notes: "",
    lyrics: "",
    chords: "",
    keyboardChords: "",
    mediaLink: "",
    pdfUrl: "",
    pdfKey: "",
    pdfFileName: "",
    pdfMimeType: "",
    pdfSize: 0,
    removePdf: false,
  });

  const keyHint = computed(() => {
    if (!form.key) return "Escolha o tom para liberar a transposição automática da cifra.";
    if (!form.chords.trim()) return `Tom ${songKeyLabel(form.key)}.`;
    return `Tom ${songKeyLabel(form.key)} — trocar o tom transpõe a cifra automaticamente.`;
  });

  const resetForm = () => {
    Object.assign(form, {
      title: "",
      artist: "",
      key: "",
      bpm: "",
      songCategory: "Louvor",
      url: "",
      notes: "",
      lyrics: "",
      chords: "",
      keyboardChords: "",
      mediaLink: "",
      pdfUrl: "",
      pdfKey: "",
      pdfFileName: "",
      pdfMimeType: "",
      pdfSize: 0,
      removePdf: false,
    });
    pdfFile.value = null;
    editingId.value = "";
    formTab.value = "info";
    lastFormKey.value = "";
    cifraClubMessage.value = "";
    formError.value = "";
  };

  const openCreate = () => {
    resetForm();
    isFormOpen.value = true;
  };

  const openEdit = (song: DepartmentSong) => {
    resetForm();
    editingId.value = song.id;
    Object.assign(form, {
      title: song.title,
      artist: song.metadata?.artist || "",
      key: normalizeSongKey(song.metadata?.key || ""),
      bpm: song.metadata?.bpm || "",
      songCategory: song.metadata?.songCategory || "Louvor",
      url: song.url || "",
      notes: song.metadata?.notes || "",
      lyrics: song.metadata?.lyrics || "",
      chords: song.metadata?.chords || "",
      keyboardChords: song.metadata?.keyboardChords || "",
      mediaLink: song.metadata?.mediaLink || "",
      pdfUrl: song.metadata?.pdf?.url || "",
      pdfKey: song.metadata?.pdf?.key || "",
      pdfFileName: song.metadata?.pdf?.fileName || "",
      pdfMimeType: song.metadata?.pdf?.mimeType || "",
      pdfSize: song.metadata?.pdf?.size || 0,
      removePdf: false,
    });
    lastFormKey.value = form.key;
    isFormOpen.value = true;
  };

  const closeForm = () => {
    isFormOpen.value = false;
    resetForm();
  };

  const removePdf = () => {
    Object.assign(form, {
      pdfUrl: "",
      pdfKey: "",
      pdfFileName: "",
      pdfMimeType: "",
      pdfSize: 0,
      removePdf: true,
    });
    pdfFile.value = null;
  };

  // Trocar o tom transpõe a cifra (violão e teclado) do tom anterior pro novo.
  const changeFormKey = (nextKey: string | null) => {
    const previous = normalizeSongKey(lastFormKey.value);
    const target = normalizeSongKey(nextKey || "");
    lastFormKey.value = target;
    if (!previous || !target || previous === target) return;
    const steps = songKeyDistance(previous, target);
    if (form.chords.trim()) form.chords = transposeChordText(form.chords, steps);
    if (form.keyboardChords.trim()) form.keyboardChords = transposeChordText(form.keyboardChords, steps);
  };

  // O link do Cifra Club prevalece sobre o que estava digitado.
  const importCifraClub = async () => {
    formError.value = "";
    cifraClubMessage.value = "";
    if (!form.url.trim() && (!form.title.trim() || !form.artist.trim())) {
      formError.value = "Informe o link do Cifra Club ou título e artista.";
      return;
    }
    isImportingCifraClub.value = true;
    try {
      const { data, error } = await importCifraClubSong(departmentId, {
        title: form.title,
        artist: form.artist,
        url: form.url,
      });
      if (error || !data) {
        formError.value = error || "Não foi possível buscar a cifra.";
        return;
      }
      form.title = data.title || form.title;
      form.artist = data.artist || form.artist;
      form.bpm = data.bpm || form.bpm;
      form.songCategory = data.songCategory || form.songCategory;
      form.url = data.url || form.url;
      form.notes = data.notes || form.notes;
      form.lyrics = data.lyrics || form.lyrics;
      form.chords = data.chords || form.chords;
      form.keyboardChords = data.keyboardChords || form.keyboardChords;
      const importedKey = normalizeSongKey(data.key || "");
      if (importedKey) {
        form.key = importedKey;
        lastFormKey.value = importedKey;
      }
      if (data.youtubeUrl && !form.mediaLink.trim()) form.mediaLink = data.youtubeUrl;
      cifraClubMessage.value = importedKey
        ? `Importado do Cifra Club em ${songKeyLabel(importedKey)}. Revise e salve.`
        : "Importado do Cifra Club. Revise e salve.";
    } catch (error: unknown) {
      formError.value = (error as Error)?.message || "Não foi possível buscar a cifra.";
    } finally {
      isImportingCifraClub.value = false;
    }
  };

  const handleCifraClubPaste = (event: ClipboardEvent) => {
    const pasted = event.clipboardData?.getData("text")?.trim();
    if (!pasted || !/cifraclub\.com\.br/i.test(pasted)) return;
    event.preventDefault();
    form.url = pasted;
    void importCifraClub();
  };

  const uploadPdf = async () => {
    const file = Array.isArray(pdfFile.value) ? pdfFile.value[0] || null : pdfFile.value;
    if (!file) return null;
    if (file.type !== "application/pdf") throw new Error("Selecione um arquivo PDF válido.");
    const { data, error } = await uploadDepartmentPdf(departmentId, file);
    if (error || !data) throw new Error(error || "Não foi possível enviar o PDF da música.");
    return data;
  };

  /** Devolve true quando salvou. */
  const save = async () => {
    formError.value = "";
    const title = form.title.trim();
    if (!title) {
      formError.value = "Informe o título da música.";
      return false;
    }
    const duplicate = songs.value.some(
      (song) => song.id !== editingId.value && song.title.trim().toLowerCase() === title.toLowerCase(),
    );
    if (duplicate) {
      formError.value = duplicateSongTitleMessage(title);
      return false;
    }

    isSaving.value = true;
    try {
      const uploaded = await uploadPdf();
      if (uploaded) {
        Object.assign(form, {
          pdfUrl: uploaded.url,
          pdfKey: uploaded.key,
          pdfFileName: uploaded.fileName,
          pdfMimeType: uploaded.mimeType,
          pdfSize: uploaded.size,
          removePdf: false,
        });
      }
      const payload = {
        title,
        artist: form.artist,
        key: form.key,
        bpm: form.bpm,
        songCategory: form.songCategory,
        url: form.url,
        notes: form.notes,
        lyrics: form.lyrics,
        chords: form.chords,
        keyboardChords: form.keyboardChords,
        mediaLink: form.mediaLink,
        ...(form.pdfUrl
          ? {
              pdfUrl: form.pdfUrl,
              pdfKey: form.pdfKey,
              pdfFileName: form.pdfFileName,
              pdfMimeType: form.pdfMimeType,
              pdfSize: form.pdfSize,
            }
          : {}),
        ...(form.removePdf ? { removePdf: true } : {}),
      };
      const wasEditing = Boolean(editingId.value);
      const { data, error } = wasEditing
        ? await updateDepartmentSong(departmentId, editingId.value, payload)
        : await createDepartmentSong(departmentId, payload);
      if (error || !data) {
        formError.value = error || "Não foi possível salvar a música.";
        return false;
      }
      songs.value = sortSongs(
        wasEditing ? songs.value.map((song) => (song.id === data.id ? data : song)) : [...songs.value, data],
      );
      closeForm();
      return true;
    } catch (error: unknown) {
      formError.value = (error as Error)?.message || "Não foi possível salvar a música.";
      return false;
    } finally {
      isSaving.value = false;
    }
  };

  const remove = async (song: DepartmentSong) => {
    const { error } = await deleteDepartmentSong(departmentId, song.id);
    if (error) return error;
    songs.value = songs.value.filter((item) => item.id !== song.id);
    return null;
  };

  // ---- Mix ----
  const isMixOpen = ref(false);
  const isCreatingMix = ref(false);
  const mixError = ref("");
  const createMix = async (payload: { title: string; primaryMediaItemId: string; secondaryMediaItemId: string }) => {
    mixError.value = "";
    isCreatingMix.value = true;
    try {
      const { data, error } = await createSongMix(departmentId, payload);
      if (error || !data) {
        mixError.value = error || "Não foi possível criar o mix.";
        return false;
      }
      songs.value = sortSongs([...songs.value, data]);
      isMixOpen.value = false;
      return true;
    } catch (error: unknown) {
      mixError.value = (error as Error)?.message || "Não foi possível criar o mix.";
      return false;
    } finally {
      isCreatingMix.value = false;
    }
  };

  // ---- Importar de PDF (várias músicas de uma vez) ----
  const pdfImport = reactive({
    isOpen: false,
    step: "upload" as "upload" | "review",
    songs: [] as PdfSongSuggestion[],
    error: "",
    isExtracting: false,
    isConfirming: false,
  });

  const openPdfImport = () => {
    pdfImport.step = "upload";
    pdfImport.songs = [];
    pdfImport.error = "";
    pdfImport.isOpen = true;
  };

  const closePdfImport = () => {
    pdfImport.isOpen = false;
  };

  const onPdfImportFileChange = async (event: Event) => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    pdfImport.error = "";
    pdfImport.isExtracting = true;
    try {
      const { data, error } = await previewSongsFromPdf(departmentId, file);
      if (error || !data) {
        pdfImport.error = error || "Não foi possível ler o PDF.";
        return;
      }
      pdfImport.songs = data.songs;
      pdfImport.step = "review";
    } finally {
      pdfImport.isExtracting = false;
      input.value = "";
    }
  };

  const removePdfImportSong = (index: number) => {
    pdfImport.songs = pdfImport.songs.filter((_, current) => current !== index);
  };

  /** Devolve quantas músicas entraram (0 = nada importado). */
  const confirmPdfImport = async () => {
    pdfImport.error = "";
    if (!pdfImport.songs.length) return 0;
    pdfImport.isConfirming = true;
    try {
      const { data, error } = await importSongsFromPdf(departmentId, pdfImport.songs);
      if (error || !data) {
        pdfImport.error = error || "Não foi possível importar as músicas.";
        return 0;
      }
      songs.value = sortSongs([...songs.value, ...data.songs]);
      closePdfImport();
      return data.songs.length;
    } finally {
      pdfImport.isConfirming = false;
    }
  };

  return {
    songs,
    isLoading,
    loadError,
    load,
    songKeyOptions: SONG_KEY_OPTIONS,
    songCategoryOptions: ["Louvor", "Adoração", "Hino", "Especial"],
    // cadastro
    isFormOpen,
    formTab,
    editingId,
    form,
    formError,
    isSaving,
    isImportingCifraClub,
    cifraClubMessage,
    pdfFile,
    keyHint,
    openCreate,
    openEdit,
    closeForm,
    removePdf,
    changeFormKey,
    importCifraClub,
    handleCifraClubPaste,
    save,
    remove,
    // mix
    isMixOpen,
    isCreatingMix,
    mixError,
    createMix,
    // pdf
    pdfImport,
    openPdfImport,
    closePdfImport,
    onPdfImportFileChange,
    removePdfImportSong,
    confirmPdfImport,
  };
}
