<template>
  <div class="people-row" :class="{ 'people-row--link': Boolean(to) && !$slots.actions }">
    <component
      :is="to ? NuxtLink : 'div'"
      :to="to || undefined"
      class="people-row-main"
      :aria-label="to ? `Abrir ${name}` : undefined"
    >
      <PeopleAvatar :name="name" :src="avatarUrl" :size="44" />
      <span class="people-row-copy">
        <span class="people-row-name">{{ name }}</span>
        <span v-if="statusLine" class="people-row-status" :class="{ 'people-row-status--alert': alert }">
          {{ statusLine }}
        </span>
        <slot name="details" />
      </span>
      <ChevronRight v-if="to && !$slots.actions" size="18" class="people-row-chevron" aria-hidden="true" />
    </component>
    <span v-if="$slots.actions" class="people-row-actions">
      <slot name="actions" />
    </span>
  </div>
</template>

<script setup lang="ts">
/**
 * Linha de pessoa: foto/iniciais, nome e a linha em palavras simples.
 * Com `to`, a área principal abre o perfil; as ações (slot) ficam fora do
 * link para não aninhar botões dentro de um link.
 */
import { resolveComponent } from "vue";
import { ChevronRight } from "lucide-vue-next";

withDefaults(
  defineProps<{
    name: string;
    statusLine?: string;
    avatarUrl?: string | null;
    to?: string | null;
    /** Destaca a linha de status (atrasado, faltando). */
    alert?: boolean;
  }>(),
  { statusLine: "", avatarUrl: null, to: null, alert: false },
);

const NuxtLink = resolveComponent("NuxtLink");
</script>

<style scoped>
.people-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
  padding: 10px 14px;
  color: var(--app-color-text);
  background: var(--app-color-surface);
}

.people-row + .people-row {
  border-top: 1px solid var(--app-color-border-subtle);
}

.people-row--link {
  transition: background-color 0.15s ease;
}

.people-row--link:hover {
  background: var(--app-color-surface-muted);
}

.people-row-main {
  display: flex;
  flex: 1 1 220px;
  align-items: center;
  gap: 12px;
  min-width: 0;
  min-height: 48px;
  color: inherit;
  text-decoration: none;
}

a.people-row-main:focus-visible {
  outline: 2px solid var(--app-color-accent);
  outline-offset: 4px;
  border-radius: 8px;
}

.people-row-copy {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-width: 0;
  gap: 2px;
}

.people-row-name {
  overflow: hidden;
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.people-row-status {
  color: var(--app-color-text-muted);
  font-size: 0.9rem;
  line-height: 1.35;
}

.people-row-status--alert {
  color: var(--app-color-warning);
  font-weight: 600;
}

.people-row-actions {
  display: flex;
  flex: 0 0 auto;
  flex-wrap: wrap;
  gap: 6px;
  margin-left: auto;
}

.people-row-chevron {
  flex: 0 0 auto;
  color: var(--app-color-text-soft);
}
</style>
