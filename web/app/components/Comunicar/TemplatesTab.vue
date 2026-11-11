<template>
  <div>
    <UtilsSectionHeader
      title="Suas mensagens"
      description="Textos de WhatsApp prontos para usar no “Novo comunicado” e nos automáticos."
      :count="templates.length || null"
    >
      <template #action>
        <v-btn color="primary" variant="tonal" class="text-none font-weight-bold" min-height="44" @click="emit('open', null, null)">
          <Plus size="16" class="mr-1" aria-hidden="true" /> Nova
        </v-btn>
      </template>
    </UtilsSectionHeader>

    <div v-if="loading && !templates.length" class="d-flex justify-center pa-6">
      <v-progress-circular indeterminate size="28" color="primary" />
    </div>
    <UtilsEmptyState
      v-else-if="!templates.length"
      compact
      :icon="MessageSquareText"
      title="Nenhuma mensagem salva"
      description="Comece por uma das sugestões abaixo e ajuste do seu jeito."
    />
    <ul v-else class="template-list app-surface">
      <li v-for="template in sortedTemplates" :key="template.id">
        <button type="button" class="template-row" @click="emit('open', template, null)">
          <span class="template-name">{{ template.name }}</span>
          <span class="template-body">{{ template.body }}</span>
        </button>
      </li>
    </ul>

    <UtilsSectionHeader
      v-if="pendingSuggestions.length"
      class="mt-8"
      title="Sugestões"
      description="Escolha uma para começar. Nada é enviado ao escolher."
    />
    <ul v-if="pendingSuggestions.length" class="template-list app-surface">
      <li v-for="suggestion in pendingSuggestions" :key="suggestion.key">
        <button type="button" class="template-row" @click="emit('open', null, suggestion)">
          <span class="template-name">{{ suggestion.name }}</span>
          <span class="template-body">{{ suggestion.description }}</span>
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
/** "Modelos": mensagens de WhatsApp salvas + sugestões ainda não usadas. */
import { computed } from "vue";
import { MessageSquareText, Plus } from "lucide-vue-next";
import type { MessageTemplate } from "../../../composables/useMessages";
import {
  getSuggestedTemplateAction,
  MESSAGE_TEMPLATE_SUGGESTIONS,
  type MessageTemplateSuggestion,
} from "../../utils/messageTemplateSuggestions";
import { compareListText } from "../../utils/listOrdering";

const props = defineProps<{ templates: MessageTemplate[]; loading?: boolean }>();
const emit = defineEmits<{
  open: [template: MessageTemplate | null, suggestion: MessageTemplateSuggestion | null];
}>();

const sortedTemplates = computed(() => [...props.templates].sort((a, b) => compareListText(a.name, b.name)));

// Sugestão já salva vira uma mensagem da lista de cima; aqui só as que faltam.
const pendingSuggestions = computed(() =>
  MESSAGE_TEMPLATE_SUGGESTIONS.filter(
    (suggestion) => getSuggestedTemplateAction(suggestion, props.templates).type === "CREATE",
  ),
);
</script>

<style scoped>
.template-list {
  list-style: none;
  margin: 0;
  padding: 0;
  border: 1px solid var(--app-color-border);
  border-radius: var(--app-radius-card, 14px);
  overflow: hidden;
}

.template-list li + li {
  border-top: 1px solid var(--app-color-border-subtle);
}

.template-row {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 64px;
  padding: 12px 16px;
  border: 0;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.template-row:hover {
  background: var(--app-color-surface-soft);
}

.template-row:focus-visible {
  outline: 3px solid var(--app-color-accent-soft);
  outline-offset: -3px;
}

.template-name {
  font-size: 1rem;
  font-weight: 600;
  color: var(--app-color-text);
}

.template-body {
  font-size: 0.875rem;
  color: var(--app-color-text-muted);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
