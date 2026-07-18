<template>
  <v-card class="rounded-xl pa-5 mb-6 elevation-1 setup-card">
    <div class="d-flex align-center mb-1">
      <v-avatar :color="isDark ? 'rgba(240,151,90,0.16)' : '#F7E2D3'" size="40" class="mr-3">
        <Sparkles size="20" :color="isDark ? '#f0975a' : '#B5472A'" />
      </v-avatar>
      <div>
        <h2 class="setup-title mb-0">Primeiros passos</h2>
        <p class="setup-subtitle mb-0">Configure sua igreja em poucos minutos</p>
      </div>
    </div>

    <div class="setup-steps mt-4">
      <div class="setup-step" :class="{ 'setup-step-done': membersCount > 1 }">
        <div class="setup-step-icon">
          <Check v-if="membersCount > 1" size="16" />
          <span v-else>1</span>
        </div>
        <div class="setup-step-body">
          <p class="setup-step-title mb-1">Convide sua equipe</p>
          <p class="setup-step-desc mb-3">
            Compartilhe o código para que membros entrem na igreja.
          </p>

          <template v-if="membersCount <= 1">
            <div v-if="inviteCodeLoading" class="d-flex justify-center pa-2">
              <v-progress-circular indeterminate size="22" color="purple-darken-3" />
            </div>
            <div v-else class="setup-invite-row">
              <span class="setup-invite-code">{{ inviteCodeValue || "—" }}</span>
              <v-btn
                color="purple-darken-3"
                variant="flat"
                size="small"
                class="text-none font-weight-bold"
                :disabled="!inviteCodeValue"
                @click="handleCopyInviteLink"
              >
                <Link size="14" class="mr-1" />
                {{ inviteCodeCopied ? "Copiado!" : "Copiar link" }}
              </v-btn>
            </div>
          </template>
          <p v-else class="setup-step-done-text mb-0">Feito — você já tem membros na igreja.</p>
        </div>
      </div>

      <div class="setup-step" :class="{ 'setup-step-done': departmentsCount > 0 }">
        <div class="setup-step-icon">
          <Check v-if="departmentsCount > 0" size="16" />
          <span v-else>2</span>
        </div>
        <div class="setup-step-body">
          <p class="setup-step-title mb-1">Crie o primeiro ministério</p>
          <p class="setup-step-desc mb-3">
            Organize equipes como Louvor, Recepção ou Mídia e defina um líder.
          </p>

          <v-btn
            v-if="departmentsCount === 0"
            color="purple-darken-3"
            variant="flat"
            size="small"
            class="text-none font-weight-bold"
            to="/ministery"
          >
            <Building size="14" class="mr-1" /> Criar ministério
          </v-btn>
          <p v-else class="setup-step-done-text mb-0">Feito — seu primeiro ministério já existe.</p>
        </div>
      </div>
    </div>
  </v-card>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { Sparkles, Check, Link, Building } from "lucide-vue-next";
import { useThemeMode } from "../../../../composables/useThemeMode";
import { useChurchInvite } from "../../../../composables/useChurchInvite";

defineProps<{
  membersCount: number;
  departmentsCount: number;
}>();

const { isDark } = useThemeMode();
const { getInviteCode } = useChurchInvite();

const inviteCodeValue = ref("");
const inviteCodeLoading = ref(false);
const inviteCodeCopied = ref(false);

const handleCopyInviteLink = () => {
  if (!inviteCodeValue.value) return;
  const url = `${window.location.origin}/join?code=${inviteCodeValue.value}`;
  navigator.clipboard.writeText(url).then(() => {
    inviteCodeCopied.value = true;
    setTimeout(() => {
      inviteCodeCopied.value = false;
    }, 2000);
  });
};

onMounted(async () => {
  inviteCodeLoading.value = true;
  const { data } = await getInviteCode();
  inviteCodeValue.value = data?.inviteCode ?? "";
  inviteCodeLoading.value = false;
});
</script>

<style scoped>
.setup-card {
  background: var(--app-color-surface) !important;
  border: 1px solid var(--app-color-border);
}

.setup-title {
  font-size: 1rem;
  font-weight: 800;
  color: var(--app-color-text);
}

.setup-subtitle {
  font-size: 0.8rem;
  color: var(--app-color-text-muted);
}

.setup-steps {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.setup-step {
  display: flex;
  gap: 14px;
}

.setup-step-icon {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 800;
  background: var(--app-color-border);
  color: var(--app-color-text-muted);
}

.setup-step-done .setup-step-icon {
  background: var(--app-color-success);
  color: #fff;
}

.setup-step-body {
  flex: 1;
  min-width: 0;
}

.setup-step-title {
  font-size: 0.92rem;
  font-weight: 700;
  color: var(--app-color-text);
}

.setup-step-desc {
  font-size: 0.8rem;
  color: var(--app-color-text-muted);
  line-height: 1.5;
}

.setup-step-done-text {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--app-color-success);
}

.setup-step-hint {
  font-size: 0.74rem;
  color: var(--app-color-text-muted);
}

.setup-invite-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.setup-invite-code {
  font-family: monospace;
  font-weight: 700;
  font-size: 0.9rem;
  color: var(--app-color-text);
  background: var(--app-color-background);
  border: 1px solid var(--app-color-border);
  border-radius: 8px;
  padding: 6px 10px;
}
</style>
