<template>
  <OnboardingAuthShell
    title="Como se chama sua igreja?"
    subtitle="Só isso por agora. Endereço, CNPJ e o resto você completa depois, nas configurações."
    :icon="Church"
  >
    <!-- Formulário comum (não v-form): a validação é nossa, e o v-form entrava
         em laço de atualização quando o erro de "nome vazio" aparecia. -->
    <form class="auth-form" novalidate @submit.prevent="handleCreateChurch">
      <v-text-field
        v-model="form.name"
        label="Nome da igreja"
        placeholder="Ex.: Igreja Batista Central"
        name="organization"
        autocomplete="organization"
        autocapitalize="words"
        required
        variant="outlined"
        density="comfortable"
        color="primary"
        hide-details="auto"
        :error-messages="nameErrors"
        :disabled="loading"
        @update:model-value="nameError && (nameError = '')"
      />

      <div class="church-location">
        <v-text-field
          v-model="form.city"
          label="Cidade"
          name="address-level2"
          autocomplete="address-level2"
          autocapitalize="words"
          variant="outlined"
          density="comfortable"
          color="primary"
          hide-details="auto"
          :disabled="loading"
        />
        <v-autocomplete
          v-model="form.state"
          :items="BRAZILIAN_STATES"
          label="UF"
          name="address-level1"
          autocomplete="address-level1"
          variant="outlined"
          density="comfortable"
          color="primary"
          hide-details="auto"
          :disabled="loading"
          :menu-props="{ maxHeight: 280 }"
        />
      </div>

      <v-alert v-if="errorMessage" type="error" variant="tonal" density="compact" role="alert">
        {{ errorMessage }}
      </v-alert>

      <v-btn
        type="submit"
        block
        color="primary"
        size="x-large"
        rounded="xl"
        class="auth-submit"
        :loading="loading"
        :disabled="loading"
      >
        Criar igreja
      </v-btn>

      <p class="church-next">
        Depois, um checklist no Início ajuda a cadastrar horários, ministérios e
        convidar a equipe.
      </p>
    </form>

    <template #footer>
      <button type="button" class="church-logout" :disabled="loading" @click="handleLogout">
        Sair da conta
      </button>
    </template>
  </OnboardingAuthShell>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { Church } from "lucide-vue-next";
import { useAuth } from "../../../composables/useAuth";
import { useChurch } from "../../../composables/useChurch";

definePageMeta({
  layout: "not-app-bottom",
});

useHead({ title: "Criar igreja · ChurchApp" });

const BRAZILIAN_STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA",
  "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

const router = useRouter();
const toast = useAppToast();
const { logout } = useAuth();
const { createOwnChurch } = useChurch();

const loading = ref(false);
const errorMessage = ref("");
const nameError = ref("");
const nameErrors = computed(() => (nameError.value ? [nameError.value] : []));

const form = reactive({
  name: "",
  city: "",
  state: null as string | null,
});

const handleCreateChurch = async () => {
  errorMessage.value = "";
  nameError.value = "";

  if (!form.name.trim()) {
    nameError.value = "Escreva o nome da igreja.";
    return;
  }

  loading.value = true;

  // Os ministérios nascem depois, pelo checklist e pelo assistente; aqui
  // nenhum vem pré-marcado (proposta §4, decisão 4).
  const { error } = await createOwnChurch({
    name: form.name.trim(),
    city: form.city.trim(),
    state: form.state ?? "",
    setupMode: "later",
    initialDepartments: [],
  });

  loading.value = false;

  if (error) {
    errorMessage.value = error;
    return;
  }

  toast.success("Igreja criada! Vamos deixar tudo pronto em poucos passos.");
  await router.replace("/");
};

const handleLogout = async () => {
  await logout();
  await router.push("/login");
};
</script>

<style scoped>
.church-location {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 112px;
  gap: 12px;
}

.church-next {
  margin: 0;
  color: var(--app-color-text-muted);
  font-size: 0.92rem;
  line-height: 1.5;
  text-align: center;
}

.church-logout {
  min-height: 44px;
  padding: 0 12px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: var(--app-color-text-muted);
  font-size: 0.95rem;
  font-weight: 650;
  cursor: pointer;
}

.church-logout:hover {
  color: var(--app-color-text);
}
</style>
