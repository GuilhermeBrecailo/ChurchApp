<template>
  <footer class="marketing-footer marketing-container">
    <div class="marketing-footer__main">
      <NuxtLink to="/comece" class="marketing-brand" aria-label="ChurchApp — página inicial">
        <span class="marketing-brand__mark">C</span>
        <span class="marketing-brand__name">ChurchApp</span>
      </NuxtLink>
      <p>Organização simples para igrejas que cuidam de pessoas.</p>
    </div>

    <div class="marketing-footer__links">
      <a href="#beneficios">Benefícios</a>
      <a href="#planos">Planos</a>
      <a href="#faq">FAQ</a>
      <NuxtLink to="/login">Entrar</NuxtLink>
      <NuxtLink to="/register">Começar grátis</NuxtLink>
    </div>

    <div class="marketing-footer__bottom">
      <span>© {{ currentYear }} ChurchApp</span>
      <span>
        <NuxtLink to="/termos">Termos</NuxtLink>
        <NuxtLink to="/privacidade">Privacidade</NuxtLink>
      </span>
    </div>
  </footer>
</template>

<script setup lang="ts">
const currentYear = new Date().getFullYear();
</script>

<style scoped>
.marketing-footer {
  padding-top: 0;
  padding-bottom: 30px;
}

.marketing-footer__main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 28px 0;
  border-top: 1px solid var(--landing-line-strong);
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

.marketing-footer__main p {
  margin: 0;
  color: var(--landing-muted);
  font-size: 0.82rem;
}

.marketing-footer__links,
.marketing-footer__bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}

.marketing-footer__links {
  padding-bottom: 28px;
}

.marketing-footer a {
  color: var(--landing-muted);
  font-size: 0.78rem;
  font-weight: 750;
  text-decoration: none;
}

.marketing-footer a:hover,
.marketing-footer a:focus-visible {
  color: var(--landing-accent);
}

.marketing-footer__bottom {
  padding-top: 18px;
  border-top: 1px solid var(--landing-line);
  color: var(--landing-muted);
  font-size: 0.72rem;
}

.marketing-footer__bottom span:last-child {
  display: flex;
  gap: 18px;
}

@media (max-width: 620px) {
  .marketing-footer__main,
  .marketing-footer__links,
  .marketing-footer__bottom {
    align-items: flex-start;
    flex-direction: column;
  }

  .marketing-footer__main p {
    margin-top: -8px;
  }

  .marketing-footer__links {
    flex-wrap: wrap;
    flex-direction: row;
  }
}
</style>
