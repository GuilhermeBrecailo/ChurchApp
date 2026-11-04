import { ref, type Ref } from "vue";
import {
  useDepartments,
  type DepartmentSong,
  type PdfSongSuggestion,
} from "../useDepartments";

/**
 * Importar músicas de um PDF de repertório (aba "Músicas" de
 * pages/ministery/[id].vue): enviar o PDF, revisar as músicas que o sistema
 * identificou e confirmar. As músicas importadas entram em `songs`.
 */
export function usePdfSongImport(departmentId: string, songs: Ref<DepartmentSong[]>) {
  const { previewSongsFromPdf, importSongsFromPdf } = useDepartments();

  const isPdfImportDialogOpen = ref(false);
  const pdfImportStep = ref<"upload" | "review">("upload");
  const pdfImportFileInput = ref<HTMLInputElement | null>(null);
  const pdfImportSongs = ref<PdfSongSuggestion[]>([]);
  const pdfImportError = ref("");
  const isExtractingPdfSongs = ref(false);
  const isConfirmingPdfImport = ref(false);

  const openPdfImportDialog = () => {
    pdfImportStep.value = "upload";
    pdfImportSongs.value = [];
    pdfImportError.value = "";
    isPdfImportDialogOpen.value = true;
  };

  const closePdfImportDialog = () => {
    isPdfImportDialogOpen.value = false;
    if (pdfImportFileInput.value) pdfImportFileInput.value.value = "";
  };

  const onPdfImportFileChange = async (event: Event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    pdfImportError.value = "";
    isExtractingPdfSongs.value = true;
    try {
      const { data, error } = await previewSongsFromPdf(departmentId, file);
      if (error || !data) {
        pdfImportError.value = error || "Não foi possível ler o PDF.";
        return;
      }
      pdfImportSongs.value = data.songs;
      pdfImportStep.value = "review";
    } finally {
      isExtractingPdfSongs.value = false;
      if (pdfImportFileInput.value) pdfImportFileInput.value.value = "";
    }
  };

  const removePdfImportSong = (index: number) => {
    pdfImportSongs.value = pdfImportSongs.value.filter((_, i) => i !== index);
  };

  const confirmPdfImport = async () => {
    pdfImportError.value = "";
    if (!pdfImportSongs.value.length) return;
    isConfirmingPdfImport.value = true;
    try {
      const { data, error } = await importSongsFromPdf(departmentId, pdfImportSongs.value);
      if (error || !data) {
        pdfImportError.value = error || "Não foi possível importar as músicas.";
        return;
      }
      songs.value = [...songs.value, ...data.songs];
      closePdfImportDialog();
    } finally {
      isConfirmingPdfImport.value = false;
    }
  };

  return {
    isPdfImportDialogOpen,
    pdfImportStep,
    pdfImportFileInput,
    pdfImportSongs,
    pdfImportError,
    isExtractingPdfSongs,
    isConfirmingPdfImport,
    openPdfImportDialog,
    closePdfImportDialog,
    onPdfImportFileChange,
    removePdfImportSong,
    confirmPdfImport,
  };
}
