<template>
  <v-form @submit.prevent="handleSave">
    <ChurchSettingsCard
      title="Endereço da página"
      description="É o final do link que você compartilha com visitantes."
    >
      <v-text-field
        v-model="form.slug"
        label="Endereço"
        :prefix="`${siteHost}/c/`"
        placeholder="comunidade-vida"
        variant="outlined"
        color="primary"
        hide-details="auto"
        :error-messages="slugError"
        :disabled="saving"
      />
      <div class="d-flex flex-wrap ga-2 mt-3">
        <v-btn
          v-if="savedLandingUrl"
          :href="savedLandingUrl"
          target="_blank"
          rel="noopener noreferrer"
          variant="tonal"
          color="primary"
          class="text-none font-weight-bold"
          min-height="44"
        >
          <ExternalLink size="16" class="mr-2" aria-hidden="true" /> Ver página
        </v-btn>
        <v-btn
          v-if="savedLandingUrl"
          variant="text"
          color="primary"
          class="text-none"
          min-height="44"
          @click="copyLink"
        >
          <Link size="16" class="mr-2" aria-hidden="true" /> Copiar link
        </v-btn>
      </div>
      <p class="settings-hint mt-3 mb-0">
        A logo aparece no topo da página. Para trocar, use
        <NuxtLink to="/configuracoes/cadastro" class="config-inline-link">Dados e logo</NuxtLink>.
      </p>
    </ChurchSettingsCard>

    <ChurchSettingsCard title="Aparência" description="Cor e estilo de letra da página pública.">
      <div class="public-grid">
        <v-text-field
          v-model="form.accentColor"
          label="Cor de destaque"
          type="color"
          variant="outlined"
          hide-details="auto"
          :disabled="saving"
        >
          <template #prepend-inner><Palette size="18" aria-hidden="true" /></template>
        </v-text-field>
        <v-text-field
          v-model="form.textColor"
          label="Cor da letra (opcional)"
          type="color"
          variant="outlined"
          hide-details="auto"
          :disabled="saving"
        >
          <template #prepend-inner><Palette size="18" aria-hidden="true" /></template>
        </v-text-field>
      </div>
      <v-select
        v-model="form.fontFamily"
        :items="FONT_OPTIONS"
        item-title="label"
        item-value="key"
        label="Estilo da letra"
        variant="outlined"
        color="primary"
        class="mt-4"
        hide-details="auto"
        :disabled="saving"
      />
      <p class="font-sample mt-3 mb-0" :style="{ fontFamily: fontCssValue(form.fontFamily), color: form.accentColor }">
        {{ churchName }}
      </p>
    </ChurchSettingsCard>

    <ChurchSettingsCard
      title="Contatos e redes"
      description="Aparecem no rodapé da página. Deixe em branco o que não usar."
    >
      <div class="public-grid">
        <v-text-field
          v-for="field in contactFields"
          :key="field.key"
          v-model="form[field.key]"
          :label="field.label"
          :type="field.type"
          variant="outlined"
          color="primary"
          hide-details="auto"
          :disabled="saving"
        >
          <template #prepend-inner><component :is="field.icon" size="18" aria-hidden="true" /></template>
        </v-text-field>
      </div>
    </ChurchSettingsCard>

    <div class="settings-save-bar">
      <v-btn
        type="submit"
        color="primary"
        class="text-none font-weight-bold"
        min-height="48"
        :loading="saving"
        :disabled="!isDirty"
      >
        Salvar página pública
      </v-btn>
    </div>
  </v-form>
</template>

<script setup lang="ts">
/** Página pública: endereço, aparência e contatos (sem foto — ver Cadastro). */
import { computed, reactive, ref, watch, type Component } from "vue";
import {
  ExternalLink,
  Facebook,
  Globe,
  Instagram,
  Link,
  Mail,
  MessageCircle,
  Palette,
  Phone,
  Youtube,
} from "lucide-vue-next";
import { FONT_OPTIONS, fontCssValue } from "../../../composables/useChurchAppearance";

const { user } = useAuth();
const { updateOwnChurch } = useChurch();
const toast = useAppToast();
const config = useRuntimeConfig();

const church = computed(() => user.value?.activeChurch ?? user.value?.church ?? null);
const churchName = computed(() => church.value?.name || "Sua igreja");
const siteHost = computed(() => {
  try {
    return new URL(String(config.public.siteUrl)).host;
  } catch {
    return "churchapp.site";
  }
});

const DEFAULT_ACCENT = "#B5472A";
const KEYS = [
  "slug",
  "accentColor",
  "textColor",
  "fontFamily",
  "phone",
  "whatsapp",
  "email",
  "instagram",
  "facebook",
  "youtube",
  "website",
] as const;
type Key = (typeof KEYS)[number];
type ContactKey = Exclude<Key, "slug" | "accentColor" | "textColor" | "fontFamily">;

const contactFields: { key: ContactKey; label: string; icon: Component; type?: string }[] = [
  { key: "whatsapp", label: "WhatsApp", icon: MessageCircle, type: "tel" },
  { key: "phone", label: "Telefone", icon: Phone, type: "tel" },
  { key: "email", label: "E-mail", icon: Mail, type: "email" },
  { key: "instagram", label: "Instagram", icon: Instagram },
  { key: "facebook", label: "Facebook", icon: Facebook },
  { key: "youtube", label: "YouTube", icon: Youtube },
  { key: "website", label: "Site", icon: Globe, type: "url" },
];

const form = reactive<Record<Key, string>>(
  Object.fromEntries(KEYS.map((key) => [key, ""])) as Record<Key, string>,
);
const saved = ref<Record<Key, string>>({ ...form });

const fillForm = () => {
  const current = (church.value ?? {}) as Partial<Record<Key, string | null>>;
  for (const key of KEYS) form[key] = current[key] ?? "";
  form.accentColor = current.accentColor || DEFAULT_ACCENT;
  form.fontFamily = current.fontFamily || "EDITORIAL";
  saved.value = { ...form };
};
watch(church, fillForm, { immediate: true });

const isDirty = computed(() => KEYS.some((key) => form[key] !== saved.value[key]));

const savedLandingUrl = computed(() => {
  const slug = church.value?.slug;
  if (!slug) return "";
  return import.meta.client ? `${window.location.origin}/c/${slug}` : `/c/${slug}`;
});

const copyLink = async () => {
  try {
    await navigator.clipboard.writeText(savedLandingUrl.value);
    toast.success("Link copiado");
  } catch {
    toast.error("Não foi possível copiar. Segure no link para copiar.");
  }
};

const saving = ref(false);
const slugError = ref("");

const handleSave = async () => {
  slugError.value = "";
  const slug = form.slug.trim().toLowerCase();
  if (!slug) {
    slugError.value = "Escolha o endereço da página.";
    return;
  }

  const optional = (value: string) => value.trim() || null;
  saving.value = true;
  const { error } = await updateOwnChurch({
    slug,
    accentColor: form.accentColor || null,
    textColor: optional(form.textColor),
    fontFamily: form.fontFamily || null,
    phone: optional(form.phone),
    whatsapp: optional(form.whatsapp),
    email: optional(form.email),
    instagram: optional(form.instagram),
    facebook: optional(form.facebook),
    youtube: optional(form.youtube),
    website: optional(form.website),
  });
  saving.value = false;

  if (error) {
    toast.error(error);
    return;
  }
  form.slug = slug;
  saved.value = { ...form };
  toast.success("Página pública atualizada");
};
</script>

<style scoped>
.public-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.settings-hint {
  font-size: 0.9375rem;
  color: var(--app-color-text-muted);
}

.font-sample {
  font-size: 1.5rem;
  font-weight: 650;
  overflow-wrap: anywhere;
}

.settings-save-bar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 24px;
}

@media (max-width: 600px) {
  .public-grid {
    grid-template-columns: 1fr;
  }

  .settings-save-bar .v-btn {
    width: 100%;
  }
}
</style>
