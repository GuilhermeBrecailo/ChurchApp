<template>
  <div
    class="app-segmented ui-page-tabs"
    :class="{ 'ui-page-tabs--fill': items.length <= 3 }"
    role="tablist"
    :aria-label="ariaLabel"
    @keydown="onKeydown"
  >
    <button
      v-for="(item, index) in items"
      :key="item.value"
      :ref="(el) => setTabRef(el, index)"
      type="button"
      role="tab"
      :aria-selected="item.value === current"
      :tabindex="item.value === current ? 0 : -1"
      :class="{ 'app-segmented--active': item.value === current }"
      @click="select(item.value)"
    >
      {{ item.label }}
      <span v-if="item.badge" class="ui-page-tabs-badge" :aria-label="`${item.badge} pendentes`">
        {{ item.badge }}
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
/**
 * Abas de uma tela (um estilo só no app). Com `queryKey` a aba ativa fica
 * no endereço (?aba=escalas): link direto funciona e o "voltar" do
 * celular volta para a aba anterior em vez de sair da tela.
 * Chips continuam servindo só para filtros, nunca para trocar de visão.
 */
import { computed, type ComponentPublicInstance } from "vue";

export type PageTabItem = { value: string; label: string; badge?: number | string | null };

const props = withDefaults(
  defineProps<{
    items: PageTabItem[];
    modelValue?: string;
    queryKey?: string;
    ariaLabel?: string;
  }>(),
  { ariaLabel: "Seções da tela" },
);

const emit = defineEmits<{ "update:modelValue": [value: string] }>();

const route = useRoute();
const router = useRouter();
const tabRefs: HTMLElement[] = [];

const setTabRef = (el: Element | ComponentPublicInstance | null, index: number) => {
  if (el instanceof HTMLElement) tabRefs[index] = el;
};

const fromQuery = computed(() => {
  if (!props.queryKey) return undefined;
  const value = route.query[props.queryKey];
  const text = Array.isArray(value) ? value[0] : value;
  return props.items.some((item) => item.value === text) ? String(text) : undefined;
});

const current = computed(
  () => fromQuery.value ?? props.modelValue ?? props.items[0]?.value ?? "",
);

const select = (value: string) => {
  emit("update:modelValue", value);
  if (props.queryKey && value !== fromQuery.value) {
    router.push({ query: { ...route.query, [props.queryKey]: value } });
  }
};

const onKeydown = (event: KeyboardEvent) => {
  if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
  const index = props.items.findIndex((item) => item.value === current.value);
  const last = props.items.length - 1;
  const next =
    event.key === "Home" ? 0 :
    event.key === "End" ? last :
    event.key === "ArrowRight" ? (index >= last ? 0 : index + 1) :
    index <= 0 ? last : index - 1;
  event.preventDefault();
  const item = props.items[next];
  if (!item) return;
  select(item.value);
  tabRefs[next]?.focus();
};
</script>

<style scoped>
.ui-page-tabs {
  margin-bottom: 16px;
}

.ui-page-tabs--fill > button {
  flex: 1 1 0;
}

.ui-page-tabs-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  margin-left: 6px;
  padding: 0 6px;
  border-radius: 999px;
  background: var(--app-color-accent);
  color: #fff;
  font-size: 0.72rem;
  font-weight: 800;
}
</style>
