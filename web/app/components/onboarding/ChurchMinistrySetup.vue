<template>
  <section class="church-setup" aria-labelledby="church-setup-title">
    <div class="church-setup__heading">
      <div>
        <p class="church-setup__eyebrow">Configuração inicial · opcional</p>
        <h2 id="church-setup-title">Quer deixar os ministérios prontos?</h2>
        <p class="church-setup__description">
          Você pode começar com uma estrutura sugerida e ajustar tudo depois.
        </p>
      </div>
    </div>

    <div class="church-setup__choices" role="group" aria-label="Quando configurar os ministérios">
      <button
        type="button"
        class="church-setup__choice"
        :class="{ 'is-selected': modelValue.mode === 'now' }"
        :aria-pressed="modelValue.mode === 'now'"
        :disabled="disabled"
        @click="setMode('now')"
      >
        <span class="church-setup__choice-icon"><v-icon icon="mdi-auto-fix" /></span>
        <span class="church-setup__choice-copy">
          <strong>Configurar agora</strong>
          <small>Crie ministérios com módulos adequados para cada equipe.</small>
        </span>
        <v-icon
          class="church-setup__choice-check"
          :icon="modelValue.mode === 'now' ? 'mdi-check-circle' : 'mdi-circle-outline'"
          aria-hidden="true"
        />
      </button>

      <button
        type="button"
        class="church-setup__choice"
        :class="{ 'is-selected': modelValue.mode === 'later' }"
        :aria-pressed="modelValue.mode === 'later'"
        :disabled="disabled"
        @click="setMode('later')"
      >
        <span class="church-setup__choice-icon"><v-icon icon="mdi-clock-outline" /></span>
        <span class="church-setup__choice-copy">
          <strong>Configurar depois</strong>
          <small>Crie a igreja agora e monte os ministérios dentro do app.</small>
        </span>
        <v-icon
          class="church-setup__choice-check"
          :icon="modelValue.mode === 'later' ? 'mdi-check-circle' : 'mdi-circle-outline'"
          aria-hidden="true"
        />
      </button>
    </div>

    <div v-if="modelValue.mode === 'now'" class="church-setup__ministries">
      <div class="church-setup__list-heading">
        <div>
          <h3>Escolha os ministérios</h3>
          <p>As sugestões já vêm marcadas. Remova as que sua igreja não usa.</p>
        </div>
        <span class="church-setup__count">{{ modelValue.departments.length }} selecionados</span>
      </div>

      <div class="church-setup__grid">
        <button
          v-for="ministry in defaultMinistries"
          :key="`${ministry.type}-${ministry.name}`"
          type="button"
          class="church-setup__ministry"
          :class="{ 'is-selected': isSelected(ministry) }"
          role="checkbox"
          :aria-checked="isSelected(ministry)"
          :disabled="disabled"
          @click="toggleMinistry(ministry)"
        >
          <span class="church-setup__ministry-icon">
            <v-icon :icon="ministryIcon(ministry.type)" aria-hidden="true" />
          </span>
          <span class="church-setup__ministry-copy">
            <strong>{{ ministry.name }}</strong>
            <small>{{ moduleSummary(ministry.type) }}</small>
          </span>
          <v-icon
            class="church-setup__ministry-check"
            :icon="isSelected(ministry) ? 'mdi-check-circle' : 'mdi-plus-circle-outline'"
            aria-hidden="true"
          />
        </button>

        <button
          v-for="ministry in customMinistries"
          :key="`custom-${ministry.type}-${ministry.name}`"
          type="button"
          class="church-setup__ministry is-selected"
          role="checkbox"
          aria-checked="true"
          :disabled="disabled"
          @click="toggleMinistry(ministry)"
        >
          <span class="church-setup__ministry-icon">
            <v-icon :icon="ministryIcon(ministry.type)" aria-hidden="true" />
          </span>
          <span class="church-setup__ministry-copy">
            <strong>{{ ministry.name }}</strong>
            <small>{{ moduleSummary(ministry.type) }} · personalizado</small>
          </span>
          <v-icon class="church-setup__ministry-check" icon="mdi-close-circle-outline" aria-hidden="true" />
        </button>
      </div>

      <p v-if="modelValue.departments.length === 0" class="church-setup__empty-hint">
        Se não for configurar ministérios agora, escolha “Configurar depois”.
      </p>

      <div class="church-setup__custom">
        <v-text-field
          v-model="customName"
          label="Adicionar outro ministério"
          placeholder="Ex.: Comunicação"
          variant="outlined"
          density="comfortable"
          hide-details="auto"
          :disabled="disabled"
          :error-messages="customError ? [customError] : []"
          @keydown.enter.prevent="addCustomMinistry"
        />
        <v-select
          v-model="customType"
          label="Tipo"
          :items="CHURCH_DEPARTMENT_TYPE_OPTIONS"
          item-title="title"
          item-value="value"
          variant="outlined"
          density="comfortable"
          hide-details
          :disabled="disabled"
        />
        <v-btn
          type="button"
          color="primary"
          variant="tonal"
          class="church-setup__add-button text-none"
          aria-label="Adicionar ministério personalizado"
          :disabled="disabled || customName.trim().length < 2"
          @click="addCustomMinistry"
        >
          <v-icon icon="mdi-plus" class="mr-1" /> Adicionar
        </v-btn>
      </div>

      <p class="church-setup__note">
        Você será o responsável inicial pelos ministérios e poderá delegar a liderança depois.
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import {
  CHURCH_DEPARTMENT_TYPE_OPTIONS,
  DEFAULT_CHURCH_MINISTRIES,
  type ChurchSetupSelection,
  type InitialChurchDepartment,
  type InitialDepartmentType,
} from "../../../composables/churchOnboarding";

const props = withDefaults(
  defineProps<{
    modelValue: ChurchSetupSelection;
    disabled?: boolean;
  }>(),
  { disabled: false },
);

const emit = defineEmits<{
  (event: "update:modelValue", value: ChurchSetupSelection): void;
}>();

const customName = ref("");
const customType = ref<InitialDepartmentType>("OTHER");
const customError = ref("");

const defaultMinistries = DEFAULT_CHURCH_MINISTRIES;
const customMinistries = computed(() =>
  props.modelValue.departments.filter(
    (department) =>
      !defaultMinistries.some(
        (preset) => preset.type === department.type && preset.name === department.name,
      ),
  ),
);

const setMode = (mode: ChurchSetupSelection["mode"]) => {
  emit("update:modelValue", { ...props.modelValue, mode });
};

const isSelected = (department: InitialChurchDepartment) =>
  props.modelValue.departments.some(
    (selected) =>
      selected.type === department.type &&
      selected.name.toLocaleLowerCase("pt-BR") === department.name.toLocaleLowerCase("pt-BR"),
  );

const toggleMinistry = (department: InitialChurchDepartment) => {
  const departments = isSelected(department)
    ? props.modelValue.departments.filter(
        (selected) =>
          !(
            selected.type === department.type &&
            selected.name.toLocaleLowerCase("pt-BR") === department.name.toLocaleLowerCase("pt-BR")
          ),
      )
    : [...props.modelValue.departments, { ...department }];

  emit("update:modelValue", { ...props.modelValue, departments });
};

const addCustomMinistry = () => {
  customError.value = "";
  const name = customName.value.trim();

  if (name.length < 2) {
    customError.value = "Informe ao menos 2 caracteres.";
    return;
  }

  if (
    props.modelValue.departments.some(
      (department) =>
        department.name.toLocaleLowerCase("pt-BR") === name.toLocaleLowerCase("pt-BR"),
    )
  ) {
    customError.value = "Esse ministério já está selecionado.";
    return;
  }

  emit("update:modelValue", {
    ...props.modelValue,
    departments: [...props.modelValue.departments, { name, type: customType.value }],
  });
  customName.value = "";
};

const ministryIcon = (type: InitialDepartmentType) => {
  const icons: Record<InitialDepartmentType, string> = {
    WORSHIP: "mdi-music",
    DEACONATE: "mdi-hand-heart-outline",
    KIDS: "mdi-human-child",
    RECEPTION: "mdi-door-open",
    MEDIA: "mdi-monitor",
    INTERCESSION: "mdi-hands-pray",
    OTHER: "mdi-account-group-outline",
  };
  return icons[type];
};

const moduleSummary = (type: InitialDepartmentType) => {
  const summaries: Record<InitialDepartmentType, string> = {
    WORSHIP: "Escalas, músicas, tarefas e recursos",
    DEACONATE: "Escalas, tarefas e recursos",
    KIDS: "Escalas, tarefas, recursos e aulas",
    RECEPTION: "Escalas, tarefas e recursos",
    MEDIA: "Escalas, tarefas e recursos",
    INTERCESSION: "Escalas, tarefas e recursos",
    OTHER: "Escalas, tarefas e recursos",
  };
  return summaries[type];
};
</script>

<style scoped>
.church-setup {
  margin: 8px 0 20px;
  padding: 20px;
  border: 1px solid var(--app-color-border-subtle);
  border-radius: 16px;
  background: color-mix(in srgb, var(--app-color-surface) 92%, var(--app-color-background));
}

.church-setup__eyebrow {
  margin: 0 0 5px;
  color: var(--app-color-primary);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.church-setup__heading h2,
.church-setup__list-heading h3 {
  margin: 0;
  color: var(--app-color-text);
  font-size: 1rem;
  font-weight: 750;
}

.church-setup__description,
.church-setup__list-heading p {
  margin: 4px 0 0;
  color: var(--app-color-text-muted, #667085);
  font-size: 0.83rem;
  line-height: 1.45;
}

.church-setup__choices {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 16px;
}

.church-setup__choice,
.church-setup__ministry {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 11px;
  padding: 13px;
  border: 1px solid var(--app-color-border-subtle);
  border-radius: 12px;
  background: var(--app-color-surface);
  color: var(--app-color-text);
  text-align: left;
  transition: border-color 140ms ease, background-color 140ms ease, box-shadow 140ms ease;
}

.church-setup__choice {
  min-height: 78px;
  cursor: pointer;
}

.church-setup__choice:hover,
.church-setup__ministry:hover {
  border-color: var(--app-color-primary);
}

.church-setup__choice:focus-visible,
.church-setup__ministry:focus-visible {
  outline: 3px solid color-mix(in srgb, var(--app-color-primary) 35%, transparent);
  outline-offset: 2px;
}

.church-setup__choice.is-selected,
.church-setup__ministry.is-selected {
  border-color: var(--app-color-primary);
  background: color-mix(in srgb, var(--app-color-primary) 7%, var(--app-color-surface));
}

.church-setup__choice-icon,
.church-setup__ministry-icon {
  display: grid;
  width: 38px;
  height: 38px;
  flex: 0 0 38px;
  place-items: center;
  border-radius: 11px;
  background: color-mix(in srgb, var(--app-color-primary) 11%, var(--app-color-surface));
  color: var(--app-color-primary);
}

.church-setup__choice-copy,
.church-setup__ministry-copy {
  display: grid;
  min-width: 0;
  gap: 3px;
  flex: 1;
}

.church-setup__choice-copy strong,
.church-setup__ministry-copy strong {
  font-size: 0.85rem;
  line-height: 1.25;
}

.church-setup__choice-copy small,
.church-setup__ministry-copy small {
  color: var(--app-color-text-muted, #667085);
  font-size: 0.73rem;
  line-height: 1.35;
}

.church-setup__choice-check,
.church-setup__ministry-check {
  flex: 0 0 auto;
  color: var(--app-color-primary);
}

.church-setup__ministries {
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid var(--app-color-border-subtle);
}

.church-setup__list-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.church-setup__count {
  flex: 0 0 auto;
  padding: 4px 8px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--app-color-primary) 9%, var(--app-color-surface));
  color: var(--app-color-primary);
  font-size: 0.72rem;
  font-weight: 700;
}

.church-setup__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.church-setup__ministry {
  min-height: 67px;
  cursor: pointer;
}

.church-setup__ministry-icon {
  width: 34px;
  height: 34px;
  flex-basis: 34px;
  border-radius: 10px;
}

.church-setup__custom {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(150px, 0.9fr) auto;
  align-items: start;
  gap: 9px;
  margin-top: 13px;
}

.church-setup__add-button {
  min-height: 48px;
}

.church-setup__note {
  margin: 10px 0 0;
  color: var(--app-color-text-muted, #667085);
  font-size: 0.74rem;
  line-height: 1.45;
}

.church-setup__empty-hint {
  margin: 10px 0 0;
  color: var(--app-color-primary);
  font-size: 0.76rem;
  font-weight: 650;
}

@media (max-width: 600px) {
  .church-setup {
    padding: 15px;
  }

  .church-setup__choices,
  .church-setup__grid {
    grid-template-columns: 1fr;
  }

  .church-setup__custom {
    grid-template-columns: 1fr 1fr;
  }

  .church-setup__custom :deep(.v-text-field) {
    grid-column: 1 / -1;
  }

  .church-setup__add-button {
    grid-column: 1 / -1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .church-setup__choice,
  .church-setup__ministry {
    transition: none;
  }
}
</style>
