<template>
  <div ref="root" class="demo-bar" :class="{ 'demo-bar--open': open }">
    <transition name="demo-bar-menu">
      <div
        v-if="open"
        id="demo-bar-menu"
        class="demo-bar__menu"
        role="menu"
        aria-label="Ver a demonstração como"
      >
        <p class="demo-bar__menu-title">Ver como</p>
        <button
          v-for="persona in personas"
          :key="persona.key"
          type="button"
          role="menuitemradio"
          class="demo-bar__item"
          :aria-checked="persona.key === current.key"
          @click="choose(persona.key)"
        >
          <span class="demo-bar__check" aria-hidden="true">{{ persona.key === current.key ? "✓" : "" }}</span>
          <span class="demo-bar__item-text">
            <strong>{{ persona.label }}</strong>
            <small>{{ persona.description }}</small>
          </span>
        </button>
        <hr class="demo-bar__divider" />
        <button type="button" role="menuitem" class="demo-bar__item demo-bar__item--reset" @click="restart">
          <span class="demo-bar__check" aria-hidden="true">↺</span>
          <span class="demo-bar__item-text">
            <strong>Recomeçar demonstração</strong>
            <small>Apaga o que você mudou e volta aos dados de exemplo</small>
          </span>
        </button>
      </div>
    </transition>

    <button
      type="button"
      class="demo-bar__pill"
      aria-haspopup="menu"
      :aria-expanded="open"
      aria-controls="demo-bar-menu"
      @click="open = !open"
    >
      <span class="demo-bar__dot" aria-hidden="true" />
      <span class="demo-bar__label">Demonstração</span>
      <span class="demo-bar__sep" aria-hidden="true">·</span>
      <span class="demo-bar__as">Ver como:</span>
      <strong class="demo-bar__persona">{{ current.label }}</strong>
      <span class="demo-bar__caret" aria-hidden="true">▾</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { PERSONAS, type PersonaKey } from "../../../demo/personas";
import { getPersona, resetDemo, setPersona } from "../../../demo/store";

const personas = PERSONAS;
const current = ref(getPersona());
const open = ref(false);
const root = ref<HTMLElement | null>(null);

// Recarrega o app inteiro no Início: zera a sessão (token em memória, usuário,
// estados dos composables) e o próximo /api/me já vem da persona nova.
const restartAtHome = () => {
  document.cookie = "active_church_id=; Max-Age=0; path=/";
  const { location } = window;
  if (location.hash.startsWith("#/")) {
    location.hash = "#/";
    location.reload();
    return;
  }
  location.assign(useRuntimeConfig().app.baseURL || "/");
};

const choose = (key: PersonaKey) => {
  open.value = false;
  setPersona(key);
  current.value = getPersona();
  restartAtHome();
};

const restart = () => {
  open.value = false;
  resetDemo();
  restartAtHome();
};

const onPointerDown = (event: PointerEvent) => {
  if (open.value && root.value && !root.value.contains(event.target as Node)) open.value = false;
};
const onKeyDown = (event: KeyboardEvent) => {
  if (event.key === "Escape") open.value = false;
};

onMounted(() => {
  document.addEventListener("pointerdown", onPointerDown);
  document.addEventListener("keydown", onKeyDown);
});
onBeforeUnmount(() => {
  document.removeEventListener("pointerdown", onPointerDown);
  document.removeEventListener("keydown", onKeyDown);
});
</script>

<style>
/* Fora do scoped: depende de elementos do layout (barra inferior/lateral). */
/* Celular com barra inferior: fica logo acima dela, sem cobrir os botões. */
body:has(.bottom-nav) .demo-bar {
  bottom: calc(68px + 10px + env(safe-area-inset-bottom));
}

/* Desktop com barra lateral: canto inferior esquerdo da área de conteúdo. */
body:has(.side-nav) .demo-bar {
  left: calc(256px + 16px);
}
</style>

<style scoped>
.demo-bar {
  --demo-bg: #1f1a17;
  --demo-fg: #fdf6ee;
  --demo-muted: #cbbfb3;
  --demo-accent: #f0975a;
  position: fixed;
  z-index: 2400;
  left: max(12px, env(safe-area-inset-left));
  bottom: calc(12px + env(safe-area-inset-bottom));
  font-family: inherit;
  max-width: calc(100vw - 24px);
}

.demo-bar__pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 44px;
  padding: 6px 12px 6px 10px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 999px;
  background: var(--demo-bg);
  color: var(--demo-fg);
  font-size: 0.8125rem;
  line-height: 1.1;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.22);
  cursor: pointer;
  opacity: 0.92;
  white-space: nowrap;
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.demo-bar__pill:hover,
.demo-bar--open .demo-bar__pill {
  opacity: 1;
}

.demo-bar__pill:focus-visible,
.demo-bar__item:focus-visible {
  outline: 2px solid var(--demo-accent);
  outline-offset: 2px;
}

.demo-bar__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--demo-accent);
  box-shadow: 0 0 0 3px rgba(240, 151, 90, 0.25);
}

.demo-bar__sep,
.demo-bar__as {
  color: var(--demo-muted);
}

.demo-bar__persona {
  font-weight: 700;
}

.demo-bar__caret {
  font-size: 0.8125rem;
  color: var(--demo-muted);
}

.demo-bar__menu {
  position: absolute;
  left: 0;
  bottom: calc(100% + 8px);
  width: min(320px, calc(100vw - 24px));
  max-height: min(calc(100vh - 160px), 560px);
  overflow-y: auto;
  padding: 8px;
  border-radius: 16px;
  background: var(--demo-bg);
  color: var(--demo-fg);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.35);
}

.demo-bar__menu-title {
  margin: 4px 10px 6px;
  font-size: 0.8125rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--demo-muted);
}

.demo-bar__item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  width: 100%;
  min-height: 44px;
  padding: 6px 10px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.demo-bar__item:hover,
.demo-bar__item[aria-checked="true"] {
  background: rgba(255, 255, 255, 0.08);
}

.demo-bar__check {
  flex: 0 0 16px;
  color: var(--demo-accent);
  font-weight: 700;
}

.demo-bar__item-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.demo-bar__item-text strong {
  font-size: 0.92rem;
}

.demo-bar__item-text small {
  font-size: 0.8125rem;
  color: var(--demo-muted);
}

.demo-bar__item--reset strong {
  color: var(--demo-accent);
}

.demo-bar__divider {
  margin: 6px 4px;
  border: 0;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
}

.demo-bar-menu-enter-active,
.demo-bar-menu-leave-active {
  transition: opacity 0.14s ease, transform 0.14s ease;
}

.demo-bar-menu-enter-from,
.demo-bar-menu-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

@media (max-width: 420px) {
  .demo-bar__as {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .demo-bar-menu-enter-active,
  .demo-bar-menu-leave-active {
    transition: none;
  }
}
</style>
