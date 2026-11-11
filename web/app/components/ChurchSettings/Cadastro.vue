<template>
  <div>
    <ChurchSettingsCard
      title="Logo da igreja"
      description="Aparece na página pública e no topo do app. PNG, JPG ou WEBP, até 5 MB."
    >
      <div class="church-logo-row">
        <div class="church-logo-preview">
          <img v-if="church?.logo" :src="church.logo" alt="Logo da igreja" />
          <Church v-else size="28" aria-hidden="true" />
        </div>
        <div class="d-flex flex-column ga-2">
          <v-btn
            color="primary"
            variant="tonal"
            class="text-none font-weight-bold"
            min-height="44"
            :loading="isUploadingLogo"
            @click="logoInput?.click()"
          >
            <ImageUp size="18" class="mr-2" aria-hidden="true" />
            {{ church?.logo ? "Trocar logo" : "Enviar logo" }}
          </v-btn>
        </div>
        <input
          ref="logoInput"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          class="d-none"
          @change="onLogoChange"
        />
      </div>
    </ChurchSettingsCard>

    <ChurchSettingsCard title="Dados da igreja" description="Usados no cadastro e na página pública.">
      <v-form class="church-form" @submit.prevent="handleSave">
        <v-text-field
          v-model="form.name"
          label="Nome da igreja"
          variant="outlined"
          color="primary"
          hide-details="auto"
          :error-messages="nameError"
          :disabled="saving"
        />
        <div class="church-form-grid">
          <v-text-field v-model="form.city" label="Cidade" variant="outlined" color="primary" hide-details="auto" :disabled="saving" />
          <v-text-field v-model="form.state" label="Estado" variant="outlined" color="primary" hide-details="auto" :disabled="saving" />
        </div>
        <v-text-field v-model="form.road" label="Endereço (rua)" variant="outlined" color="primary" hide-details="auto" :disabled="saving" />
        <div class="church-form-grid">
          <v-text-field v-model="form.number" label="Número" variant="outlined" color="primary" hide-details="auto" :disabled="saving" />
          <v-text-field v-model="form.localZipCode" label="CEP" variant="outlined" color="primary" hide-details="auto" :disabled="saving" />
        </div>
        <v-text-field v-model="form.complement" label="Complemento" variant="outlined" color="primary" hide-details="auto" :disabled="saving" />
        <v-text-field
          v-model="form.document"
          label="Documento (CNPJ)"
          variant="outlined"
          color="primary"
          hide-details="auto"
          :disabled="saving"
        />

        <div class="d-flex justify-end">
          <v-btn
            type="submit"
            color="primary"
            class="text-none font-weight-bold"
            min-height="48"
            :loading="saving"
            :disabled="!isDirty"
          >
            Salvar alterações
          </v-btn>
        </div>
      </v-form>
    </ChurchSettingsCard>
  </div>
</template>

<script setup lang="ts">
/**
 * "Dados e logo": o ÚNICO lugar para enviar a foto da igreja (antes havia
 * um envio em /settings e outro em Configurações › Página pública).
 */
import { computed, reactive, ref, watch } from "vue";
import { Church, ImageUp } from "lucide-vue-next";

const { user } = useAuth();
const { updateOwnChurch, uploadChurchPhoto } = useChurch();
const toast = useAppToast();

const church = computed(() => user.value?.activeChurch ?? user.value?.church ?? null);

const LOGO_TYPES = ["image/png", "image/jpeg", "image/webp"];
const LOGO_MAX_BYTES = 5 * 1024 * 1024;

const logoInput = ref<HTMLInputElement | null>(null);
const isUploadingLogo = ref(false);

const onLogoChange = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (!file) return;

  if (!LOGO_TYPES.includes(file.type)) {
    toast.error("Envie uma imagem PNG, JPG ou WEBP.");
    return;
  }
  if (file.size > LOGO_MAX_BYTES) {
    toast.error("A imagem deve ter no máximo 5 MB.");
    return;
  }

  isUploadingLogo.value = true;
  const { error } = await uploadChurchPhoto(file);
  isUploadingLogo.value = false;

  if (error) {
    toast.error(error || "Não foi possível enviar a logo.");
    return;
  }
  toast.success("Logo da igreja atualizada");
};

const FIELDS = ["name", "city", "state", "road", "number", "localZipCode", "complement", "document"] as const;
type Field = (typeof FIELDS)[number];

const form = reactive<Record<Field, string>>({
  name: "",
  city: "",
  state: "",
  road: "",
  number: "",
  localZipCode: "",
  complement: "",
  document: "",
});
const saved = ref<Record<Field, string>>({ ...form });
const saving = ref(false);
const nameError = ref("");

const fillForm = () => {
  const current = church.value as Partial<Record<Field, string | null>> | null;
  for (const field of FIELDS) form[field] = current?.[field] ?? "";
  saved.value = { ...form };
};

watch(church, fillForm, { immediate: true });

const isDirty = computed(() => FIELDS.some((field) => form[field] !== saved.value[field]));

const handleSave = async () => {
  nameError.value = "";
  if (!form.name.trim()) {
    nameError.value = "Informe o nome da igreja.";
    return;
  }

  saving.value = true;
  const { error } = await updateOwnChurch({ ...form, name: form.name.trim() });
  saving.value = false;

  if (error) {
    toast.error(error);
    return;
  }
  saved.value = { ...form };
  toast.success("Dados da igreja salvos");
};
</script>

<style scoped>
.church-logo-row {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.church-logo-preview {
  display: grid;
  place-items: center;
  width: 88px;
  height: 88px;
  border-radius: 16px;
  border: 1px dashed var(--app-color-border-strong);
  background: var(--app-color-surface-soft);
  color: var(--app-color-text-muted);
  overflow: hidden;
  flex-shrink: 0;
}

.church-logo-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.church-form {
  display: grid;
  gap: 16px;
}

.church-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

@media (max-width: 600px) {
  .church-form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
