<template>
  <v-card class="app-surface pa-4 mb-4 setup-card">
    <div class="setup-header">
      <div class="d-flex align-center">
        <v-avatar :color="isDark ? 'rgba(240,151,90,0.16)' : '#F7E2D3'" size="40" class="mr-3">
          <Sparkles size="20" :color="isDark ? '#f0975a' : '#B5472A'" />
        </v-avatar>
        <div>
          <h2 class="setup-title mb-0">Prepare sua igreja</h2>
          <p class="setup-subtitle mb-0">Deixe o básico pronto para organizar a rotina.</p>
        </div>
      </div>
      <v-btn
        variant="text"
        size="small"
        class="setup-dismiss text-none"
        aria-label="Dispensar os primeiros passos"
        @click="emit('dismiss')"
      >
        Agora não
      </v-btn>
    </div>

    <div class="setup-progress" aria-live="polite">
      <span>{{ completedSteps }} de 2 etapas concluídas</span>
      <div
        class="setup-progress-track"
        role="progressbar"
        aria-label="Progresso da configuração da igreja"
        aria-valuemin="0"
        aria-valuemax="2"
        :aria-valuenow="completedSteps"
      >
        <span :style="{ width: `${completedSteps * 50}%` }" />
      </div>
    </div>

    <div class="setup-steps">
      <div class="setup-step" :class="{ 'setup-step-done': departmentsCount > 0 }">
        <div class="setup-step-icon">
          <Check v-if="departmentsCount > 0" size="16" />
          <span v-else>1</span>
        </div>
        <div class="setup-step-body">
          <p class="setup-step-title mb-1">Crie o primeiro ministério</p>
          <p class="setup-step-desc mb-3">
            Comece por uma equipe, como Louvor, Recepção ou Infantil.
          </p>

          <v-btn
            v-if="departmentsCount === 0"
            color="primary"
            variant="flat"
            size="small"
            class="text-none font-weight-bold"
            to="/ministery"
          >
            <Building size="14" class="mr-1" /> Criar ministério
          </v-btn>
          <p v-else class="setup-step-done-text mb-0">Primeiro ministério criado.</p>
        </div>
      </div>

      <div class="setup-step" :class="{ 'setup-step-done': membersCount > 1 }">
        <div class="setup-step-icon">
          <Check v-if="membersCount > 1" size="16" />
          <span v-else>2</span>
        </div>
        <div class="setup-step-body">
          <p class="setup-step-title mb-1">Convide sua equipe</p>
          <p class="setup-step-desc mb-3">
            Compartilhe um link para as pessoas entrarem na igreja.
          </p>

          <template v-if="membersCount <= 1">
            <div v-if="inviteCodeLoading" class="d-flex justify-center pa-2">
              <v-progress-circular indeterminate size="22" color="primary" />
            </div>
            <div v-else class="setup-invite-row">
              <span class="setup-invite-code">{{ inviteCodeValue || "—" }}</span>
              <v-btn
                color="primary"
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
          <p v-else class="setup-step-done-text mb-0">Sua equipe já está cadastrada.</p>
        </div>
      </div>
    </div>
  </v-card>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { Sparkles, Check, Link, Building } from "lucide-vue-next";
import { useThemeMode } from "../../../../composables/useThemeMode";
import { useChurchInvite } from "../../../../composables/useChurchInvite";

const props = defineProps<{
  membersCount: number;
  departmentsCount: number;
}>();

const emit = defineEmits<{
  dismiss: [];
}>();

const { isDark } = useThemeMode();
const { getInviteCode } = useChurchInvite();
const completedSteps = computed(
  () => Number(props.departmentsCount > 0) + Number(props.membersCount > 1),
);

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

.setup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.setup-dismiss {
  min-height: 44px;
  flex: 0 0 auto;
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

.setup-progress {
  display: grid;
  gap: 7px;
  margin: 16px 0 18px;
  color: var(--app-color-text-muted);
  font-size: 0.76rem;
  font-weight: 700;
}

.setup-progress-track {
  height: 6px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--app-color-border);
}

.setup-progress-track span {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: inherit;
  background: var(--app-color-accent);
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

@media (max-width: 420px) {
  .setup-header {
    align-items: flex-start;
  }

  .setup-dismiss {
    margin-right: -8px;
  }
}

</style>
