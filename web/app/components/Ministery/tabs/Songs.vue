<template>
  <section aria-label="Repertório">
    <div v-if="songs.isLoading.value && !songs.songs.value.length" class="py-2">
      <v-skeleton-loader type="list-item-two-line@3" />
    </div>

    <MinisterySongsTab
      v-else
      :songs="songs.songs.value"
      :songs-error="songs.loadError.value"
      :can-manage-songs="capabilities.canManageSongs"
      @create="songs.openCreate"
      @import-pdf="songs.openPdfImport"
      @create-mix="songs.isMixOpen.value = true"
      @open-viewer="viewer.open"
      @edit="songs.openEdit"
      @delete="pendingDelete = $event"
    />

    <MinisterySongFormDialog
      v-model="songs.isFormOpen.value"
      v-model:song-pdf-file="songs.pdfFile.value"
      v-model:song-form-tab="songs.formTab.value"
      :is-dark="isDark"
      :editing-song-id="songs.editingId.value"
      :song-form="songs.form"
      :song-key-options="songs.songKeyOptions as never"
      :song-key-hint="songs.keyHint.value"
      :song-category-options="songs.songCategoryOptions"
      :cifra-club-import-message="songs.cifraClubMessage.value"
      :create-song-error="songs.formError.value"
      :is-creating-song="songs.isSaving.value"
      :is-importing-cifra-club-song="songs.isImportingCifraClub.value"
      @close="songs.closeForm"
      @submit="saveSong"
      @switch-to-pdf-import="switchToPdfImport"
      @song-key-change="songs.changeFormKey"
      @cifra-club-paste="songs.handleCifraClubPaste"
      @import-cifra-club="songs.importCifraClub"
      @remove-pdf="songs.removePdf"
    />

    <MinisterySongPdfImportDialog
      v-model="songs.pdfImport.isOpen"
      v-model:pdf-import-step="songs.pdfImport.step"
      :pdf-import-songs="songs.pdfImport.songs"
      :pdf-import-error="songs.pdfImport.error"
      :is-extracting-pdf-songs="songs.pdfImport.isExtracting"
      :is-confirming-pdf-import="songs.pdfImport.isConfirming"
      :song-key-options="songs.songKeyOptions as never"
      @close="songs.closePdfImport"
      @file-change="songs.onPdfImportFileChange"
      @remove-song="songs.removePdfImportSong"
      @confirm="confirmPdfImport"
    />

    <MinisterySongViewerDialog
      v-model="viewer.isOpen.value"
      v-model:song-viewer-tab="viewer.tab.value"
      :song="viewer.song.value"
      :personal-song-form="viewer.personal"
      :song-key-options="songs.songKeyOptions as never"
      :is-loading-song-preference="viewer.isLoading.value"
      :is-saving-song-preference="viewer.isSaving.value"
      :song-preference-error="viewer.error.value"
      @close="viewer.close"
      @personal-key-change="viewer.changePersonalKey"
      @use-official-chords="viewer.useOfficialChords"
      @save-preference="savePreference"
    />

    <MinisteryMixSongDialog
      v-model="songs.isMixOpen.value"
      :songs="songs.songs.value"
      :is-creating-mix="songs.isCreatingMix.value"
      :create-mix-error="songs.mixError.value"
      @close="songs.isMixOpen.value = false"
      @submit="createMix"
    />

    <UtilsConfirmDialog
      :model-value="Boolean(pendingDelete)"
      title="Excluir música"
      :message="pendingDelete ? `${pendingDelete.title} sai do repertório e das escalas em que estava. Isso não pode ser desfeito.` : ''"
      confirm-text="Excluir música"
      :loading="isDeleting"
      @update:model-value="!$event && (pendingDelete = null)"
      @cancel="pendingDelete = null"
      @confirm="confirmDelete"
    />
  </section>
</template>

<script setup lang="ts">
/** Aba Repertório: músicas, cadastro, importar de PDF, mix e leitura. */
import { onMounted, ref } from "vue";
import type { ChurchDepartment, DepartmentSong } from "../../../../composables/useDepartments";
import { useMinistrySongs, useSongViewer } from "../../../../composables/ministry/useMinistrySongs";
import type { MinistryCapabilities } from "../../../utils/ministryCapabilities";

const props = defineProps<{
  department: ChurchDepartment;
  capabilities: MinistryCapabilities;
}>();

const emit = defineEmits<{ "songs-changed": [count: number] }>();

const { isDark } = useThemeMode();
const toast = useAppToast();
const songs = useMinistrySongs(props.department.id);
const viewer = useSongViewer();
const pendingDelete = ref<DepartmentSong | null>(null);
const isDeleting = ref(false);

const notify = () => emit("songs-changed", songs.songs.value.length);

const saveSong = async () => {
  const wasEditing = Boolean(songs.editingId.value);
  if (await songs.save()) {
    toast.success(wasEditing ? "Música salva." : "Música adicionada ao repertório.");
    notify();
  }
};

const switchToPdfImport = () => {
  songs.closeForm();
  songs.openPdfImport();
};

const confirmPdfImport = async () => {
  const count = await songs.confirmPdfImport();
  if (count) {
    toast.success(count === 1 ? "1 música importada." : `${count} músicas importadas.`);
    notify();
  }
};

const createMix = async (payload: { title: string; primaryMediaItemId: string; secondaryMediaItemId: string }) => {
  if (await songs.createMix(payload)) {
    toast.success("Mix criado.");
    notify();
  }
};

const savePreference = async () => {
  if (await viewer.savePreference()) toast.success("Sua cifra foi salva.");
};

const confirmDelete = async () => {
  const song = pendingDelete.value;
  if (!song) return;
  isDeleting.value = true;
  try {
    const error = await songs.remove(song);
    if (error) {
      toast.error(error);
      return;
    }
    pendingDelete.value = null;
    toast.success(`${song.title} foi excluída.`);
    notify();
  } finally {
    isDeleting.value = false;
  }
};

onMounted(songs.load);
</script>
