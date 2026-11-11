<template>
  <div class="content-fields">
    <!-- Aviso no app -->
    <template v-if="kind === 'AVISO'">
      <div>
        <p class="field-label">Tipo de aviso</p>
        <v-btn-toggle v-model="form.kind" mandatory color="primary" variant="outlined" divided class="kind-toggle">
          <v-btn value="ANNOUNCEMENT" class="text-none">Aviso</v-btn>
          <v-btn value="PASTOR_MESSAGE" class="text-none">Palavra do pastor</v-btn>
          <v-btn value="PRAYER" class="text-none">Oração</v-btn>
        </v-btn-toggle>
      </div>
      <v-text-field v-model="form.title" label="Título" variant="outlined" color="primary" hide-details="auto" />
      <v-textarea v-model="form.body" label="Texto" variant="outlined" color="primary" rows="4" auto-grow hide-details="auto" />
      <div class="inline-fields">
        <v-text-field
          v-model="form.expiresAt"
          label="Some do app em (opcional)"
          type="date"
          variant="outlined"
          color="primary"
          hide-details="auto"
        />
        <v-switch v-model="form.pinned" color="primary" hide-details label="Fixar no topo" />
      </div>
      <AdminMediaAttachmentFields
        v-model:image-url="form.imageUrl"
        v-model:image-key="form.imageKey"
        v-model:video-url="form.videoUrl"
      />
    </template>

    <!-- Versículo do dia -->
    <template v-else-if="kind === 'VERSICULO'">
      <v-textarea v-model="form.text" label="Versículo" variant="outlined" color="primary" rows="3" auto-grow hide-details="auto" />
      <v-text-field
        v-model="form.reference"
        label="Referência"
        placeholder="Ex.: Salmos 23:1"
        variant="outlined"
        color="primary"
        hide-details="auto"
      />
      <v-textarea
        v-model="form.commentary"
        label="Comentário (opcional)"
        variant="outlined"
        color="primary"
        rows="2"
        auto-grow
        hide-details="auto"
      />
      <AdminMediaAttachmentFields
        v-model:image-url="form.imageUrl"
        v-model:image-key="form.imageKey"
        v-model:video-url="form.videoUrl"
      />
    </template>

    <!-- Devocional -->
    <template v-else-if="kind === 'DEVOCIONAL'">
      <v-text-field v-model="form.title" label="Título do devocional" variant="outlined" color="primary" hide-details="auto" />
      <v-textarea
        v-model="form.description"
        label="Descrição (opcional)"
        variant="outlined"
        color="primary"
        rows="2"
        auto-grow
        hide-details="auto"
      />
      <div v-for="(chapter, index) in form.chapters" :key="index" class="chapter-box">
        <div class="d-flex align-center justify-space-between mb-2">
          <p class="field-label mb-0">Capítulo {{ index + 1 }}</p>
          <v-btn
            v-if="form.chapters.length > 1"
            variant="text"
            color="red-darken-2"
            size="small"
            class="text-none"
            @click="form.chapters.splice(index, 1)"
          >
            Remover
          </v-btn>
        </div>
        <div class="content-fields">
          <v-text-field v-model="chapter.title" label="Título do capítulo" variant="outlined" color="primary" hide-details="auto" />
          <v-text-field
            v-model="chapter.bibleRef"
            label="Referência bíblica (opcional)"
            variant="outlined"
            color="primary"
            hide-details="auto"
          />
          <v-textarea v-model="chapter.content" label="Texto" variant="outlined" color="primary" rows="4" auto-grow hide-details="auto" />
        </div>
      </div>
      <v-btn
        variant="tonal"
        color="primary"
        class="text-none align-self-start"
        min-height="44"
        @click="form.chapters.push({ title: '', content: '', bibleRef: '' })"
      >
        <Plus size="16" class="mr-1" aria-hidden="true" /> Adicionar capítulo
      </v-btn>
      <AdminMediaAttachmentFields
        v-model:image-url="form.imageUrl"
        v-model:image-key="form.imageKey"
        v-model:video-url="form.videoUrl"
      />
    </template>

    <!-- Publicação -->
    <template v-else-if="kind === 'PUBLICACAO'">
      <v-text-field v-model="form.title" label="Título" variant="outlined" color="primary" hide-details="auto" />
      <v-textarea v-model="form.body" label="Texto (opcional)" variant="outlined" color="primary" rows="3" auto-grow hide-details="auto" />
      <v-switch v-model="form.pinned" color="primary" hide-details label="Fixar no topo" />
      <AdminMediaAttachmentFields
        v-model:image-url="form.imageUrl"
        v-model:image-key="form.imageKey"
        v-model:video-url="form.videoUrl"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
/** Campos de cada tipo de conteúdo do app (os mesmos das antigas Publicações). */
import { Plus } from "lucide-vue-next";
import type { ComposerKind } from "../../utils/communication";
import type { ComposerForm } from "../../utils/composerForm";

defineProps<{ kind: ComposerKind; form: ComposerForm }>();
</script>

<style scoped>
.content-fields {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field-label {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--app-color-text);
  margin-bottom: 8px;
}

.kind-toggle {
  flex-wrap: wrap;
  height: auto !important;
}

.inline-fields {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
}

.chapter-box {
  padding: 12px;
  border: 1px solid var(--app-color-border-subtle);
  border-radius: 12px;
}

@media (max-width: 600px) {
  .inline-fields {
    grid-template-columns: 1fr;
  }
}
</style>
