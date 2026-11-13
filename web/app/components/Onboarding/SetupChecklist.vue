<template>
  <section
    v-if="visibility === 'checklist'"
    class="setup-card app-surface"
    aria-labelledby="setup-checklist-title"
  >
    <header class="setup-header">
      <div class="setup-heading">
        <h2 id="setup-checklist-title" class="setup-title">
          Configure sua igreja <span class="setup-count">· {{ summary.done }} de {{ summary.total }}</span>
        </h2>
        <p class="setup-subtitle">Cada passo abre a tela de verdade. Leva poucos minutos.</p>
      </div>
      <button type="button" class="setup-hide" @click="handleHide">Ocultar</button>
    </header>

    <div
      class="setup-progress"
      role="progressbar"
      :aria-valuenow="summary.done"
      aria-valuemin="0"
      :aria-valuemax="summary.total"
      :aria-label="`${summary.done} de ${summary.total} passos feitos`"
    >
      <span :style="{ width: `${(summary.done / summary.total) * 100}%` }" />
    </div>

    <ol class="setup-steps">
      <li
        v-for="step in steps"
        :key="step.key"
        class="setup-step"
        :class="{
          'is-done': step.done,
          'is-locked': step.locked && !step.done,
          'is-open': expandedKey === step.key,
        }"
      >
        <button
          type="button"
          class="setup-step__row"
          :aria-expanded="isExpandable(step) ? expandedKey === step.key : undefined"
          :disabled="!isExpandable(step)"
          @click="toggle(step)"
        >
          <span class="setup-step__status" aria-hidden="true">
            <Check v-if="step.done" :size="16" :stroke-width="3" />
            <Lock v-else-if="step.locked" :size="14" />
            <span v-else class="setup-step__dot" />
          </span>
          <span class="setup-step__title">
            {{ step.title }}
            <span v-if="step.done" class="sr-only">(feito)</span>
          </span>
          <span v-if="step.locked && !step.done" class="setup-step__hint">{{ step.lockedHint }}</span>
          <ChevronDown
            v-else-if="isExpandable(step)"
            :size="18"
            class="setup-step__chevron"
            aria-hidden="true"
          />
        </button>

        <div v-if="expandedKey === step.key && !step.done" class="setup-step__body">
          <p>{{ step.description }}</p>
          <div class="setup-step__actions">
            <v-btn
              v-if="step.action"
              color="primary"
              variant="flat"
              rounded="lg"
              class="setup-step__btn"
              :to="step.action.kind === 'link' ? step.action.to : undefined"
              @click="step.action.kind === 'sheet' ? openSheet(step.action.sheet) : undefined"
            >
              {{ step.actionLabel }}
            </v-btn>
            <v-btn
              v-if="step.secondaryAction && step.secondaryAction.kind === 'link'"
              variant="text"
              rounded="lg"
              class="setup-step__btn"
              :to="step.secondaryAction.to"
            >
              {{ step.secondaryLabel }}
            </v-btn>
          </div>
        </div>
      </li>
    </ol>

    <OnboardingServiceTimesQuickSheet v-model="serviceTimesOpen" @saved="refresh" />
    <OnboardingInviteSheet v-model="inviteOpen" />
  </section>

  <section
    v-else-if="visibility === 'celebration'"
    class="setup-card setup-card--done app-surface"
    aria-live="polite"
  >
    <span class="setup-done-icon accent-avatar" aria-hidden="true"><PartyPopper :size="22" /></span>
    <div class="setup-heading">
      <h2 class="setup-title">Tudo pronto! 🎉</h2>
      <p class="setup-subtitle">
        Sua igreja está configurada. Agora é acompanhar as escalas e cuidar das pessoas.
      </p>
    </div>
    <v-btn variant="text" rounded="lg" class="setup-step__btn" @click="finishCelebration">
      Fechar
    </v-btn>
  </section>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { Check, ChevronDown, Lock, PartyPopper } from "lucide-vue-next";
import type { SetupStep, SetupStepKey } from "../../utils/churchSetupChecklist";
import { useChurchSetupStatus } from "../../../composables/useChurchSetupStatus";
import { useFirstRunPrompts } from "../../../composables/useFirstRunPrompts";

const { steps, summary, visibility, load, refresh, hide, markCelebrated, finishCelebration } =
  useChurchSetupStatus();
const prompts = useFirstRunPrompts();
const toast = useAppToast();

const expandedKey = ref<SetupStepKey | null>(null);
const serviceTimesOpen = ref(false);
const inviteOpen = ref(false);

// Só o próximo passo fica aberto; muda sozinho quando um passo é concluído.
watch(
  () => summary.value.nextKey,
  (next) => {
    expandedKey.value = next;
  },
  { immediate: true },
);

const isExpandable = (step: SetupStep) => !step.done && !step.locked && Boolean(step.action);

const toggle = (step: SetupStep) => {
  if (!isExpandable(step)) return;
  expandedKey.value = expandedKey.value === step.key ? null : step.key;
};

const openSheet = (sheet: "service-times" | "invite") => {
  if (sheet === "service-times") serviceTimesOpen.value = true;
  else inviteOpen.value = true;
};

const handleHide = () => {
  hide();
  toast.info("Checklist oculto. Tudo isso continua disponível na aba Gestão.");
};

// Enquanto o checklist está na tela, avisos menos importantes (instalar o
// app) esperam (app/utils/promptGate.ts).
watch(
  visibility,
  (value) => {
    prompts.setActive("setup-checklist", value === "checklist");
    if (value === "celebration") markCelebrated();
  },
  { immediate: true },
);

// O convite não muda o checklist na hora (precisa alguém aceitar), mas
// fechar a janela é um bom momento para conferir de novo.
watch(inviteOpen, (open, wasOpen) => {
  if (wasOpen && !open) void refresh();
});

onMounted(() => {
  void load();
});

onBeforeUnmount(() => {
  prompts.setActive("setup-checklist", false);
});
</script>

<style scoped>
.setup-card {
  display: grid;
  gap: 14px;
  margin-bottom: 20px;
  padding: 18px;
}

.setup-card--done {
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
}

.setup-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.setup-heading {
  min-width: 0;
}

.setup-title {
  margin: 0;
  color: var(--app-color-text);
  font-size: 1.12rem;
  font-weight: 800;
  line-height: 1.3;
}

.setup-count {
  color: var(--app-color-accent);
  white-space: nowrap;
}

.setup-subtitle {
  margin: 4px 0 0;
  color: var(--app-color-text-muted);
  font-size: 0.95rem;
  line-height: 1.45;
}

.setup-hide {
  flex: 0 0 auto;
  min-height: 44px;
  margin: -8px -8px 0 0;
  padding: 0 10px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: var(--app-color-text-muted);
  font-size: 0.92rem;
  font-weight: 700;
  cursor: pointer;
}

.setup-hide:hover {
  color: var(--app-color-text);
}

.setup-progress {
  height: 6px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--app-color-border-subtle);
}

.setup-progress span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--app-color-accent);
  transition: width var(--app-motion-duration-slow) var(--app-motion-ease-emphasized);
}

.setup-steps {
  display: grid;
  margin: 0;
  padding: 0;
  list-style: none;
}

.setup-step + .setup-step {
  border-top: 1px solid var(--app-color-border-subtle);
}

.setup-step__row {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 52px;
  padding: 6px 2px;
  border: 0;
  background: transparent;
  color: var(--app-color-text);
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.setup-step__row:disabled {
  cursor: default;
}

.setup-step__row:focus-visible {
  border-radius: 10px;
  outline: 3px solid color-mix(in srgb, var(--app-color-accent) 34%, transparent);
  outline-offset: 0;
}

.setup-step__status {
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  width: 26px;
  height: 26px;
  border: 2px solid var(--app-color-border-strong);
  border-radius: 50%;
  color: var(--app-color-text-muted);
}

.setup-step__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: transparent;
}

.setup-step.is-open .setup-step__status {
  border-color: var(--app-color-accent);
}

.setup-step.is-open .setup-step__dot {
  background: var(--app-color-accent);
}

.setup-step.is-done .setup-step__status {
  border-color: var(--app-color-success);
  background: var(--app-color-success);
  color: var(--app-color-surface);
}

.setup-step.is-locked .setup-step__status {
  border-style: dashed;
}

.setup-step__title {
  flex: 1 1 auto;
  min-width: 0;
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.3;
}

.setup-step.is-done .setup-step__title,
.setup-step.is-locked .setup-step__title {
  color: var(--app-color-text-muted);
  font-weight: 600;
}

.setup-step__hint {
  flex: 0 1 auto;
  color: var(--app-color-text-muted);
  font-size: 0.85rem;
  text-align: right;
}

.setup-step__chevron {
  flex: 0 0 auto;
  color: var(--app-color-text-muted);
  transition: transform var(--app-motion-duration-fast) ease;
}

.setup-step.is-open .setup-step__chevron {
  transform: rotate(180deg);
}

.setup-step__body {
  display: grid;
  gap: 12px;
  padding: 0 0 14px 38px;
}

.setup-step__body p {
  margin: 0;
  color: var(--app-color-text-soft);
  font-size: 0.98rem;
  line-height: 1.5;
}

.setup-step__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.setup-step__btn {
  min-height: 44px;
  font-weight: 750;
  letter-spacing: 0;
  text-transform: none;
}

.setup-done-icon {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

@media (max-width: 600px) {
  .setup-card {
    padding: 16px 14px;
  }

  .setup-card--done {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .setup-card--done > .v-btn {
    grid-column: 1 / -1;
    justify-self: end;
  }

  .setup-step__body {
    padding-left: 38px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .setup-progress span,
  .setup-step__chevron {
    transition: none;
  }
}
</style>
