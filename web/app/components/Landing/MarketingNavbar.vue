<template>
  <header class="marketing-navbar">
    <div class="marketing-navbar__inner">
      <NuxtLink to="/comece" class="marketing-brand" aria-label="ChurchApp — página inicial">
        <span class="marketing-brand__mark">C</span>
        <span class="marketing-brand__name">ChurchApp</span>
      </NuxtLink>

      <button
        type="button"
        class="marketing-navbar__toggle"
        :aria-expanded="isOpen"
        aria-controls="marketing-navigation"
        aria-label="Abrir menu"
        @click="isOpen = !isOpen"
      >
        <X v-if="isOpen" :size="20" aria-hidden="true" />
        <Menu v-else :size="20" aria-hidden="true" />
      </button>

      <nav
        id="marketing-navigation"
        class="marketing-navigation"
        :class="{ 'marketing-navigation--open': isOpen }"
        aria-label="Navegação principal"
      >
        <a href="#beneficios" @click="closeMenu">Benefícios</a>
        <a href="#produto" @click="closeMenu">Produto</a>
        <a href="#como-funciona" @click="closeMenu">Como funciona</a>
        <a href="#planos" @click="closeMenu">Planos</a>
        <a href="#faq" @click="closeMenu">FAQ</a>
        <NuxtLink to="/login" class="marketing-navigation__login" @click="closeMenu">
          Entrar
        </NuxtLink>
        <NuxtLink to="/register" class="marketing-button marketing-button--small" @click="closeMenu">
          Começar grátis
          <ArrowUpRight :size="15" aria-hidden="true" />
        </NuxtLink>
      </nav>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { ArrowUpRight, Menu, X } from "lucide-vue-next";

const isOpen = ref(false);

const closeMenu = () => {
  isOpen.value = false;
};
</script>

<style scoped>
.marketing-navbar {
  position: sticky;
  top: 14px;
  z-index: 20;
  width: min(1160px, calc(100% - 32px));
  margin: 14px auto 0;
}

.marketing-navbar__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 64px;
  padding: 8px 10px 8px 14px;
  border: 1px solid var(--landing-line);
  border-radius: 18px;
  background: color-mix(in srgb, var(--landing-paper) 88%, transparent);
  box-shadow: 0 12px 30px rgba(40, 29, 22, 0.08);
  backdrop-filter: blur(18px);
}

.marketing-brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: var(--landing-ink);
  font-size: 1rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  text-decoration: none;
}

.marketing-brand__mark {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 11px;
  background: var(--landing-accent);
  color: #fffaf4;
  font-family: "Fraunces", Georgia, serif;
  font-size: 1.2rem;
  line-height: 1;
}

.marketing-brand__name {
  white-space: nowrap;
}

.marketing-navigation {
  display: flex;
  align-items: center;
  gap: 22px;
}

.marketing-navigation a {
  color: var(--landing-muted);
  font-size: 0.82rem;
  font-weight: 700;
  text-decoration: none;
  transition: color 160ms ease;
}

.marketing-navigation a:hover,
.marketing-navigation a:focus-visible {
  color: var(--landing-accent);
}

.marketing-navigation__login {
  margin-left: 4px;
}

.marketing-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 48px;
  padding: 0 18px;
  border: 1px solid transparent;
  border-radius: 12px;
  background: var(--landing-accent);
  color: #fffaf4 !important;
  font-size: 0.88rem;
  font-weight: 800;
  text-decoration: none;
  box-shadow: 0 10px 20px rgba(181, 71, 42, 0.2);
  transition: transform 160ms ease, background-color 160ms ease, box-shadow 160ms ease;
}

.marketing-button:hover,
.marketing-button:focus-visible {
  background: var(--landing-accent-strong);
  color: #fffaf4 !important;
  transform: translateY(-1px);
  box-shadow: 0 14px 24px rgba(181, 71, 42, 0.25);
}

.marketing-button--small {
  min-height: 40px;
  padding-inline: 14px;
  border-radius: 10px;
  font-size: 0.78rem;
}

.marketing-navbar__toggle {
  display: none;
  place-items: center;
  width: 42px;
  height: 42px;
  border: 1px solid var(--landing-line-strong);
  border-radius: 11px;
  background: transparent;
  color: var(--landing-ink);
  cursor: pointer;
}

@media (max-width: 860px) {
  .marketing-navbar {
    top: 8px;
    width: min(100% - 24px, 720px);
    margin-top: 8px;
  }

  .marketing-navbar__toggle {
    display: grid;
  }

  .marketing-navigation {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    left: 0;
    display: none;
    flex-direction: column;
    align-items: stretch;
    gap: 0;
    padding: 8px;
    border: 1px solid var(--landing-line);
    border-radius: 16px;
    background: var(--landing-paper);
    box-shadow: 0 18px 36px rgba(40, 29, 22, 0.13);
  }

  .marketing-navigation--open {
    display: flex;
  }

  .marketing-navigation a {
    min-height: 44px;
    display: flex;
    align-items: center;
    padding: 0 12px;
    border-radius: 10px;
  }

  .marketing-navigation a:hover,
  .marketing-navigation a:focus-visible {
    background: var(--landing-accent-soft);
  }

  .marketing-navigation__login {
    margin: 4px 0 0;
  }

  .marketing-navigation .marketing-button {
    justify-content: center;
    margin-top: 6px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .marketing-navigation a,
  .marketing-button {
    transition: none;
  }
}
</style>
