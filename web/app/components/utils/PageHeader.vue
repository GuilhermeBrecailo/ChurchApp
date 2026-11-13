<template>
  <header class="app-page-header ui-page-header" :class="{ 'ui-page-header--compact': compact }">
    <v-btn
      v-if="back"
      icon
      variant="text"
      size="small"
      class="ui-page-header-back"
      :aria-label="backLabel"
      @click="goBack"
    >
      <ChevronLeft size="22" aria-hidden="true" />
    </v-btn>

    <div class="app-page-header-copy">
      <p v-if="kicker" class="app-page-kicker mb-1">{{ kicker }}</p>
      <h1 class="app-page-title ui-page-header-title">{{ title }}</h1>
      <p v-if="subtitle" class="app-section-copy ui-page-header-subtitle mb-0">{{ subtitle }}</p>
      <slot name="below-title" />
    </div>

    <div v-if="$slots.actions || helpTitle" class="ui-page-header-actions">
      <UtilsPageHelpButton v-if="helpTitle" :title="helpTitle" />
      <slot name="actions" />
    </div>
  </header>
</template>

<script setup lang="ts">
/**
 * Cabeçalho padrão de página: voltar (para a tela-mãe), título, subtítulo,
 * ajuda e a ação principal (slot #actions).
 *
 * `back` recebe a rota da tela-mãe, e não "voltar no histórico": quem abriu
 * a tela por um link (push, WhatsApp) não tem histórico e o botão o tiraria
 * do app. Telas raiz de aba não têm botão de voltar.
 */
import { ChevronLeft } from "lucide-vue-next";

const props = withDefaults(
  defineProps<{
    title: string;
    subtitle?: string;
    kicker?: string;
    /** Rota da tela-mãe. */
    back?: string;
    backLabel?: string;
    /** Título da ajuda desta tela (abre UtilsPageHelpButton). */
    helpTitle?: string;
    compact?: boolean;
  }>(),
  { backLabel: "Voltar", compact: false },
);

const router = useRouter();

const goBack = () => {
  if (props.back) router.push(props.back);
};
</script>

<style scoped>
.ui-page-header {
  align-items: center;
}

.ui-page-header-back {
  flex: 0 0 auto;
  margin-left: -8px;
  color: var(--app-color-text);
}

.ui-page-header-title {
  margin: 0;
  font-size: clamp(1.45rem, 1.1rem + 1.6vw, 1.9rem);
  line-height: 1.2;
  color: var(--app-color-text);
}

.ui-page-header--compact .ui-page-header-title {
  font-size: clamp(1.25rem, 1.05rem + 1vw, 1.5rem);
}

.ui-page-header-subtitle {
  margin-top: 4px;
  font-size: 0.92rem;
}

.ui-page-header-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

@media (max-width: 600px) {
  .ui-page-header-actions {
    width: 100%;
    justify-content: flex-start;
  }

  .ui-page-header-back + .app-page-header-copy {
    min-width: 0;
    flex: 1 1 0;
  }
}
</style>
