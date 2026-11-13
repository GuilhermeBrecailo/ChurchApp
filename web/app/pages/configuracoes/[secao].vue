<template>
  <div class="pa-4 pb-16 app-operational-page app-page--narrow">
    <UtilsPageHeader
      :title="section?.title ?? 'Configurações'"
      :subtitle="section?.description"
      back="/configuracoes"
      back-label="Voltar para Configurações"
    />

    <UtilsEmptyState
      v-if="!section"
      variant="no-results"
      :icon="SearchX"
      title="Esta configuração não existe"
      description="O link pode estar desatualizado."
      action-label="Ver configurações"
      action-to="/configuracoes"
    />

    <UtilsEmptyState
      v-else-if="!allowed"
      variant="no-permission"
      :icon="Lock"
      title="Só o pastor mexe aqui"
      description="Peça ao pastor ou a um administrador da igreja para alterar esta configuração."
    />

    <component :is="sectionComponent" v-else-if="sectionComponent" />
  </div>
</template>

<script setup lang="ts">
import { computed, type Component } from "vue";
import { Lock, SearchX } from "lucide-vue-next";
import {
  ChurchSettingsAvancado,
  ChurchSettingsCadastro,
  ChurchSettingsConvite,
  ChurchSettingsHolyrics,
  ChurchSettingsHorarios,
  ChurchSettingsPaginaPublica,
  ChurchSettingsPlano,
  ChurchSettingsWhatsApp,
} from "#components";
import {
  canOpenSettingsSection,
  isSettingsSectionSlug,
  SETTINGS_SECTIONS,
  type SettingsSectionSlug,
} from "../../utils/churchSettings";

const COMPONENTS: Record<SettingsSectionSlug, Component> = {
  cadastro: ChurchSettingsCadastro,
  "pagina-publica": ChurchSettingsPaginaPublica,
  horarios: ChurchSettingsHorarios,
  convite: ChurchSettingsConvite,
  whatsapp: ChurchSettingsWhatsApp,
  holyrics: ChurchSettingsHolyrics,
  plano: ChurchSettingsPlano,
  avancado: ChurchSettingsAvancado,
};

const route = useRoute();
const access = useChurchAccess();

const slug = computed(() => {
  const value = route.params.secao;
  return isSettingsSectionSlug(value) ? value : null;
});
const section = computed(() => (slug.value ? SETTINGS_SECTIONS[slug.value] : null));
const allowed = computed(() => (slug.value ? canOpenSettingsSection(access.value, slug.value) : false));
const sectionComponent = computed(() => (slug.value ? COMPONENTS[slug.value] : null));

useHead(() => ({ title: section.value ? `${section.value.title} · Configurações` : "Configurações" }));
</script>
