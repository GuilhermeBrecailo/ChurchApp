<template>
  <v-text-field
    :model-value="modelValue"
    :label="label"
    :type="visible ? 'text' : 'password'"
    :autocomplete="autocomplete"
    :name="name"
    :disabled="disabled"
    :error-messages="errorMessages"
    :hint="hint"
    :persistent-hint="Boolean(hint)"
    variant="outlined"
    density="comfortable"
    color="primary"
    class="onboarding-input"
    hide-details="auto"
    autocapitalize="off"
    spellcheck="false"
    @update:model-value="emit('update:modelValue', String($event ?? ''))"
  >
    <template #append-inner>
      <button
        type="button"
        class="password-toggle"
        :aria-label="visible ? 'Esconder a senha' : 'Mostrar a senha'"
        :aria-pressed="visible"
        :disabled="disabled"
        @click="visible = !visible"
      >
        <EyeOff v-if="visible" :size="20" aria-hidden="true" />
        <Eye v-else :size="20" aria-hidden="true" />
      </button>
    </template>
  </v-text-field>
</template>

<script setup lang="ts">
/** Campo de senha com o "olhinho" para conferir o que foi digitado. */
import { ref } from "vue";
import { Eye, EyeOff } from "lucide-vue-next";

withDefaults(
  defineProps<{
    modelValue: string;
    label?: string;
    autocomplete?: string;
    name?: string;
    hint?: string;
    disabled?: boolean;
    errorMessages?: string | string[];
  }>(),
  { label: "Senha", autocomplete: "current-password", name: "password" },
);

const emit = defineEmits<{ "update:modelValue": [value: string] }>();

const visible = ref(false);
</script>

<style scoped>
.password-toggle {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  margin-right: -8px;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: var(--app-color-text-muted);
  cursor: pointer;
}

.password-toggle:hover {
  color: var(--app-color-text);
}

.password-toggle:focus-visible {
  outline: 3px solid color-mix(in srgb, var(--app-color-accent) 34%, transparent);
  outline-offset: 0;
}
</style>
