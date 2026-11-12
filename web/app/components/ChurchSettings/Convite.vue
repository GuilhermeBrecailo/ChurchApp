<template>
  <div>
    <ChurchSettingsCard
      title="Código da igreja"
      description="Quem recebe o link ou lê o QR pede para entrar. Você aprova cada pedido."
    >
      <div v-if="loading" class="d-flex justify-center pa-6">
        <v-progress-circular indeterminate size="28" color="primary" />
      </div>

      <template v-else>
        <v-alert v-if="loadError" type="error" variant="tonal" density="compact" class="mb-4">
          {{ loadError }}
          <template #append>
            <v-btn variant="text" size="small" class="text-none" @click="loadCode">Tentar de novo</v-btn>
          </template>
        </v-alert>

        <div class="invite-layout">
          <div class="invite-code-box">
            <span class="invite-code-kicker">Código</span>
            <span class="invite-code-text">{{ code || "—" }}</span>
          </div>
          <div v-if="code" class="invite-qr">
            <AdminInviteQrCode :value="joinUrl" />
          </div>
        </div>

        <div class="invite-actions">
          <v-btn
            color="primary"
            class="text-none font-weight-bold"
            min-height="48"
            :disabled="!code"
            @click="shareLink"
          >
            <Share2 size="18" class="mr-2" aria-hidden="true" /> Compartilhar convite
          </v-btn>
          <v-btn
            variant="tonal"
            color="primary"
            class="text-none"
            min-height="48"
            :disabled="!code"
            @click="copyLink"
          >
            <Link size="18" class="mr-2" aria-hidden="true" /> Copiar link
          </v-btn>
        </div>
      </template>
    </ChurchSettingsCard>

    <ChurchSettingsCard
      title="Link vazou ou caiu em grupo errado?"
      description="Gere um código novo. O link e o QR antigos param de funcionar."
    >
      <v-btn
        variant="outlined"
        color="red-darken-2"
        class="text-none"
        min-height="44"
        :disabled="loading"
        @click="isConfirmOpen = true"
      >
        <RefreshCw size="16" class="mr-2" aria-hidden="true" /> Gerar novo código
      </v-btn>
    </ChurchSettingsCard>

    <UtilsConfirmDialog
      v-model="isConfirmOpen"
      title="Gerar um novo código?"
      :message="confirmMessage"
      confirm-text="Gerar novo código"
      :icon="RefreshCw"
      :loading="regenerating"
      @cancel="isConfirmOpen = false"
      @confirm="regenerate"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { Link, RefreshCw, Share2 } from "lucide-vue-next";

const { getInviteCode, regenerateInviteCode } = useChurchInvite();
const { user } = useAuth();
const toast = useAppToast();

const code = ref("");
const loading = ref(false);
const loadError = ref("");
const regenerating = ref(false);
const isConfirmOpen = ref(false);

const joinUrl = computed(() =>
  code.value && import.meta.client ? `${window.location.origin}/join?code=${code.value}` : "",
);

const confirmMessage = computed(
  () =>
    `O código ${code.value || "atual"} e todos os links e QR codes já enviados param de funcionar. ` +
    "Quem já pediu para entrar não é afetado. Você vai precisar mandar o convite novo para quem ainda não entrou.",
);

const loadCode = async () => {
  loading.value = true;
  loadError.value = "";
  const { data, error } = await getInviteCode();
  loading.value = false;
  if (error) loadError.value = error;
  code.value = data?.inviteCode ?? "";
};

const regenerate = async () => {
  regenerating.value = true;
  const { data, error } = await regenerateInviteCode();
  regenerating.value = false;
  if (error || !data?.inviteCode) {
    toast.error(error || "Não foi possível gerar um código novo.");
    return;
  }
  code.value = data.inviteCode;
  isConfirmOpen.value = false;
  toast.success("Novo código gerado. O antigo não funciona mais.");
};

const copyLink = async () => {
  try {
    await navigator.clipboard.writeText(joinUrl.value);
    toast.success("Link do convite copiado");
  } catch {
    toast.error("Não foi possível copiar. Segure no link para copiar.");
  }
};

const shareLink = async () => {
  const churchName = user.value?.activeChurch?.name || user.value?.church?.name || "nossa igreja";
  const text = `Você foi convidado para entrar na ${churchName} no ChurchApp. Use o código ${code.value}.`;
  if (typeof navigator.share === "function") {
    try {
      await navigator.share({ title: churchName, text, url: joinUrl.value });
      return;
    } catch (error) {
      if ((error as Error)?.name === "AbortError") return;
    }
  }
  await copyLink();
};

onMounted(loadCode);
</script>

<style scoped>
.invite-layout {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.invite-code-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1 1 200px;
  padding: 16px;
  border: 2px dashed var(--app-color-border);
  border-radius: 12px;
  background: var(--app-color-background);
}

.invite-code-kicker {
  font-size: 0.8125rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--app-color-text-muted);
}

.invite-code-text {
  font-family: ui-monospace, "SF Mono", SFMono-Regular, Menlo, monospace;
  font-size: 1.9rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  color: var(--app-color-text);
}

.invite-qr {
  display: flex;
  justify-content: center;
  flex: 0 0 auto;
  margin-inline: auto;
  padding: 8px;
  border-radius: 12px;
  /* QR sempre em fundo branco, inclusive no tema escuro: leitores de QR
     falham com o código claro sobre fundo escuro. */
  background: white;
}

.invite-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

@media (max-width: 600px) {
  .invite-actions .v-btn {
    flex: 1 1 100%;
  }
}
</style>
