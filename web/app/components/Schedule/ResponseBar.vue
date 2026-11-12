<template>
  <div v-if="view.me" class="response-bar" :class="{ 'response-bar--compact': compact }" @click.stop>
    <template v-if="showButtons">
      <div class="response-bar-buttons" role="group" aria-label="Sua resposta">
        <v-btn
          color="primary"
          variant="flat"
          :size="compact ? 'small' : 'default'"
          class="text-none font-weight-bold response-btn"
          :loading="busy === 'CONFIRMED'"
          :disabled="Boolean(busy)"
          @click="answer('CONFIRMED')"
        >
          <CheckCircle2 v-if="!compact" :size="16" class="mr-1" aria-hidden="true" /> Confirmar
        </v-btn>
        <v-btn
          color="amber-darken-3"
          variant="tonal"
          :size="compact ? 'small' : 'default'"
          class="text-none font-weight-bold response-btn"
          :loading="busy === 'MAYBE'"
          :disabled="Boolean(busy)"
          @click="answer('MAYBE')"
        >
          Talvez
        </v-btn>
        <v-btn
          color="red-darken-2"
          variant="tonal"
          :size="compact ? 'small' : 'default'"
          class="text-none font-weight-bold response-btn"
          :disabled="Boolean(busy)"
          @click="isDeclineOpen = true"
        >
          Não posso
        </v-btn>
      </div>
      <v-btn
        v-if="editing"
        variant="text"
        size="small"
        class="text-none mt-1"
        @click="editing = false"
      >
        Manter resposta
      </v-btn>
    </template>

    <div v-else class="response-bar-answered">
      <ScheduleStatusPill :status="view.me.status" :mine="!compact" :size="compact ? 'small' : 'default'" />
      <v-btn
        v-if="canChange"
        variant="text"
        color="primary"
        :size="compact ? 'small' : 'default'"
        class="text-none font-weight-bold"
        @click="editing = true"
      >
        Mudar resposta
      </v-btn>
    </div>

    <p v-if="!compact && view.me.declineReason && !showButtons" class="response-bar-reason">
      Motivo: {{ view.me.declineReason }}
    </p>

    <ScheduleDeclineSheet
      v-model="isDeclineOpen"
      :date-label="`${view.dateLabel} · ${view.timeLabel}`"
      :loading="busy === 'DECLINED'"
      @confirm="decline"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * O jeito único de responder a uma escala (Início, lista, folha):
 * Confirmar · Talvez · Não posso. Depois de responder vira o selo + "Mudar
 * resposta", que vale até a escala começar.
 */
import { computed, ref } from "vue";
import { CheckCircle2 } from "lucide-vue-next";
import { canChangeResponse, type ScheduleAction, type ScheduleView } from "../../utils/scheduleView";
import { buildUnavailableProfileUpdate } from "../../utils/scheduleEditor";

const props = withDefaults(defineProps<{ view: ScheduleView; compact?: boolean }>(), { compact: false });
const emit = defineEmits<{ answered: [action: ScheduleAction] }>();

const { respond } = useSchedules();
const { getMyProfile, updateMyProfile } = useUser();
const toast = useAppToast();

const editing = ref(false);
const busy = ref<ScheduleAction | null>(null);
const isDeclineOpen = ref(false);

const canChange = computed(() => canChangeResponse(props.view));
const showButtons = computed(
  () => (props.view.me?.status === "PENDING" && !props.view.hasStarted) || editing.value,
);

const MESSAGES: Record<string, string> = {
  CONFIRMED: "Presença confirmada. Obrigado!",
  MAYBE: "Resposta enviada: talvez.",
  DECLINED: "Avisamos a liderança que você não pode.",
  SWAP_REQUESTED: "Pedido de troca enviado à liderança.",
};

const answer = async (action: ScheduleAction, reason?: string) => {
  busy.value = action === "SWAP_REQUESTED" ? "DECLINED" : action;
  const { error } = await respond(props.view.id, action, reason);
  busy.value = null;
  if (error) {
    toast.error(error || "Não foi possível enviar sua resposta.");
    return false;
  }
  editing.value = false;
  toast.success(MESSAGES[action] ?? "Resposta enviada.");
  emit("answered", action);
  return true;
};

const markDateUnavailable = async () => {
  const { data: profile, error } = await getMyProfile();
  if (error || !profile) {
    toast.error("Não foi possível marcar a data como indisponível.");
    return;
  }
  const result = await updateMyProfile(buildUnavailableProfileUpdate(profile, props.view.dayKey));
  if (result.error) toast.error(result.error);
};

const decline = async (payload: {
  action: "DECLINED" | "SWAP_REQUESTED";
  reason: string;
  markUnavailable: boolean;
}) => {
  const ok = await answer(payload.action, payload.reason);
  if (!ok) return;
  isDeclineOpen.value = false;
  if (payload.markUnavailable) await markDateUnavailable();
};
</script>

<style scoped>
.response-bar-buttons {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.response-btn {
  min-height: 48px;
  min-width: 0 !important;
  padding-inline: 8px !important;
}

.response-bar--compact .response-btn {
  min-height: 44px;
}

.response-bar-answered {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.response-bar-reason {
  margin: 8px 0 0;
  color: var(--app-color-text-muted);
  font-size: 0.9rem;
}
</style>
