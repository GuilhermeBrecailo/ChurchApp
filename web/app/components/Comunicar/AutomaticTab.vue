<template>
  <div>
    <UtilsSectionHeader
      title="Depois do culto"
      description="Mensagens de WhatsApp que saem sozinhas toda semana, depois de um culto."
    >
      <template #action>
        <v-btn color="primary" variant="tonal" class="text-none font-weight-bold" min-height="44" @click="openRule(null)">
          <Plus size="16" class="mr-1" aria-hidden="true" /> Nova
        </v-btn>
      </template>
    </UtilsSectionHeader>

    <UtilsEmptyState
      v-if="!rules.length"
      compact
      :icon="Repeat"
      title="Nenhuma mensagem pós-culto"
      description="Ex.: duas horas depois do culto de domingo, um “Obrigado pela visita, {nome}!” para os visitantes."
    />
    <ul v-else class="auto-list app-surface">
      <li v-for="rule in rules" :key="rule.id" class="auto-row">
        <button type="button" class="auto-row-main" @click="openRule(rule)">
          <span class="auto-row-title">{{ rule.template?.name || "Mensagem apagada" }}</span>
          <span class="auto-row-meta">{{ ruleSummary(rule) }}</span>
        </button>
        <v-switch
          :model-value="rule.isActive"
          color="primary"
          hide-details
          inset
          density="compact"
          :aria-label="`${rule.isActive ? 'Desligar' : 'Ligar'} ${rule.template?.name || 'mensagem'}`"
          :disabled="togglingId === rule.id"
          @update:model-value="toggleRule(rule, Boolean($event))"
        />
      </li>
    </ul>

    <UtilsSectionHeader
      class="mt-8"
      title="Aniversariantes"
      description="Parabéns pelo WhatsApp para quem faz aniversário. Visitantes só recebem se autorizaram."
    />

    <section class="birthday-card app-surface mb-4">
      <div class="birthday-auto">
        <div class="min-w-0">
          <p class="birthday-auto-title mb-0">Enviar sozinho</p>
          <p class="birthday-auto-copy mb-0">{{ birthdayAutoDescription(setting?.notifyTime) }}</p>
        </div>
        <v-switch
          :model-value="setting?.isActive ?? false"
          color="primary"
          hide-details
          inset
          aria-label="Enviar parabéns automaticamente"
          :disabled="settingSaving || !setting?.templateId"
          @update:model-value="saveSetting({ isActive: Boolean($event) })"
        />
      </div>
      <div class="birthday-fields">
        <v-select
          :model-value="setting?.templateId"
          :items="templates"
          item-title="name"
          item-value="id"
          label="Mensagem de parabéns"
          variant="outlined"
          color="primary"
          hide-details="auto"
          no-data-text="Crie uma mensagem na aba Modelos"
          :disabled="settingSaving"
          @update:model-value="saveSetting({ templateId: $event })"
        />
        <v-text-field
          :model-value="setting?.notifyTime ?? '08:00'"
          type="time"
          label="Horário"
          variant="outlined"
          color="primary"
          hide-details="auto"
          :disabled="settingSaving"
          @change="(event: Event) => saveSetting({ notifyTime: (event.target as HTMLInputElement).value })"
        />
      </div>
      <p v-if="!setting?.templateId" class="birthday-auto-copy mt-2 mb-0">
        Escolha a mensagem para poder ligar o envio sozinho.
      </p>
    </section>

    <div class="birthday-ranges" role="group" aria-label="Período">
      <v-chip
        v-for="option in RANGES"
        :key="option.value"
        :color="range === option.value ? 'primary' : undefined"
        :variant="range === option.value ? 'flat' : 'outlined'"
        @click="range = option.value"
      >
        {{ option.label }}
      </v-chip>
    </div>

    <div v-if="birthdaysLoading" class="d-flex justify-center pa-6">
      <v-progress-circular indeterminate size="28" color="primary" />
    </div>
    <UtilsEmptyState
      v-else-if="!birthdays.length"
      compact
      variant="all-done"
      :icon="Cake"
      :title="emptyLabel"
      description="As datas vêm do cadastro de pessoas."
    />
    <ul v-else class="auto-list app-surface">
      <li v-for="person in birthdays" :key="person.id" class="auto-row auto-row--static">
        <span class="birthday-icon accent-avatar" aria-hidden="true"><Cake size="18" /></span>
        <div class="min-w-0 flex-grow-1">
          <p class="auto-row-title mb-0">{{ person.name }}</p>
          <p class="auto-row-meta mb-0">
            {{ person.daysUntil === 0 ? "Hoje" : `Em ${person.daysUntil} dia${person.daysUntil > 1 ? "s" : ""}` }}
            · faz {{ person.turningAge }} anos
            <template v-if="!person.phone"> · sem telefone</template>
          </p>
          <p v-if="person.canReceiveMessage === false" class="auto-row-warning mb-0">
            Visitante sem autorização: não recebe WhatsApp
          </p>
        </div>
      </li>
    </ul>

    <div v-if="range === 'today' && todaysRecipients > 0" class="mt-4">
      <v-btn
        color="primary"
        class="text-none font-weight-bold"
        min-height="48"
        :disabled="!setting?.templateId || whatsappConnected === false"
        @click="isSendOpen = true"
      >
        <Send size="16" class="mr-2" aria-hidden="true" /> Mandar parabéns agora
      </v-btn>
      <p v-if="!setting?.templateId" class="birthday-auto-copy mt-2 mb-0">Escolha a mensagem de parabéns acima.</p>
    </div>

    <ComunicarRuleDialog
      v-model="isRuleOpen"
      :rule="editingRule"
      :templates="templates"
      :service-times="serviceTimes"
      @changed="emit('rules-changed')"
    />

    <UtilsConfirmDialog
      v-model="isSendOpen"
      :title="`Mandar parabéns para ${peopleCount(todaysRecipients)}?`"
      :message="sendMessage"
      :confirm-text="`Enviar para ${peopleCount(todaysRecipients)}`"
      :icon="Send"
      :loading="sending"
      @cancel="isSendOpen = false"
      @confirm="sendToday"
    />
  </div>
</template>

<script setup lang="ts">
/** "Automáticos": mensagens pós-culto e parabéns de aniversário. */
import { computed, onMounted, ref, watch } from "vue";
import { Cake, Plus, Repeat, Send } from "lucide-vue-next";
import type { MessageRule, MessageTemplate } from "../../../composables/useMessages";
import type { ServiceTime } from "../../../composables/useServiceTimes";
import type {
  BirthdayMember,
  BirthdayMessageSetting,
  BirthdayRange,
  BirthdaySettingFormDTO,
} from "../../../composables/useBirthdays";
import {
  audienceLabel,
  birthdayAutoDescription,
  excludedWithoutConsentLabel,
  peopleCount,
} from "../../utils/communication";

defineProps<{
  rules: MessageRule[];
  templates: MessageTemplate[];
  serviceTimes: ServiceTime[];
  whatsappConnected: boolean | null;
}>();
const emit = defineEmits<{ "rules-changed": []; sent: [] }>();

const RANGES: { value: BirthdayRange; label: string }[] = [
  { value: "today", label: "Hoje" },
  { value: "week", label: "Próximos 7 dias" },
  { value: "month", label: "Este mês" },
];
const WEEKDAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

const { updateRule } = useMessages();
const { listBirthdays, getBirthdaySetting, updateBirthdaySetting, sendBirthdayMessagesNow } = useBirthdays();
const toast = useAppToast();

// ── Pós-culto ──
const isRuleOpen = ref(false);
const editingRule = ref<MessageRule | null>(null);
const togglingId = ref("");

const openRule = (rule: MessageRule | null) => {
  editingRule.value = rule;
  isRuleOpen.value = true;
};

const offsetLabel = (minutes: number) => {
  if (minutes === 0) return "logo depois";
  if (minutes % 60 === 0) return `${minutes / 60}h depois`;
  return minutes > 60 ? `${Math.floor(minutes / 60)}h${String(minutes % 60).padStart(2, "0")} depois` : `${minutes} min depois`;
};

const ruleSummary = (rule: MessageRule) => {
  const service = rule.serviceTime
    ? `${WEEKDAYS[rule.serviceTime.weekday]} ${rule.serviceTime.time}`
    : "Culto";
  return `${service} · ${offsetLabel(rule.offsetMinutes)} · ${audienceLabel(rule.audience)}`;
};

const toggleRule = async (rule: MessageRule, isActive: boolean) => {
  togglingId.value = rule.id;
  const { error } = await updateRule(rule.id, { isActive });
  togglingId.value = "";
  if (error) {
    toast.error(error);
    return;
  }
  toast.success(isActive ? "Mensagem automática ligada" : "Mensagem automática desligada");
  emit("rules-changed");
};

// ── Aniversariantes ──
const setting = ref<BirthdayMessageSetting | null>(null);
const settingSaving = ref(false);
const range = ref<BirthdayRange>("today");
const birthdays = ref<BirthdayMember[]>([]);
const birthdaysLoading = ref(false);

const emptyLabel = computed(
  () =>
    ({
      today: "Ninguém faz aniversário hoje",
      week: "Ninguém faz aniversário nos próximos 7 dias",
      month: "Ninguém faz aniversário este mês",
    })[range.value],
);

const loadBirthdays = async () => {
  birthdaysLoading.value = true;
  const { data, error } = await listBirthdays(range.value);
  birthdaysLoading.value = false;
  if (error) toast.error(error);
  birthdays.value = data ?? [];
};

watch(range, loadBirthdays);

const saveSetting = async (change: BirthdaySettingFormDTO) => {
  if (change.notifyTime !== undefined && !/^\d{2}:\d{2}$/.test(change.notifyTime)) return;
  settingSaving.value = true;
  const { data, error } = await updateBirthdaySetting(change);
  settingSaving.value = false;
  if (error) {
    toast.error(error);
    return;
  }
  setting.value = data ?? setting.value;
  if (change.isActive !== undefined) {
    toast.success(change.isActive ? "Parabéns automático ligado" : "Parabéns automático desligado");
  } else {
    toast.success("Salvo");
  }
};

const todaysRecipients = computed(() =>
  range.value === "today" ? birthdays.value.filter((person) => person.canReceiveMessage !== false).length : 0,
);
const todaysExcluded = computed(() =>
  range.value === "today" ? birthdays.value.filter((person) => person.canReceiveMessage === false).length : 0,
);

const isSendOpen = ref(false);
const sending = ref(false);

const sendMessage = computed(() => {
  const excluded = excludedWithoutConsentLabel(todaysExcluded.value);
  return (
    "A mensagem de parabéns sai agora pelo WhatsApp da igreja e não dá para cancelar." +
    (excluded ? ` ${excluded}.` : "")
  );
});

const sendToday = async () => {
  sending.value = true;
  const { error } = await sendBirthdayMessagesNow();
  sending.value = false;
  if (error) {
    toast.error(error);
    return;
  }
  isSendOpen.value = false;
  toast.success("Parabéns a caminho. Acompanhe em Enviados.");
  emit("sent");
};

onMounted(async () => {
  const [, settingResponse] = await Promise.all([loadBirthdays(), getBirthdaySetting()]);
  setting.value = settingResponse.data ?? null;
});

defineExpose({ reload: loadBirthdays });
</script>

<style scoped>
.auto-list {
  list-style: none;
  margin: 0;
  padding: 0;
  border: 1px solid var(--app-color-border);
  border-radius: var(--app-radius-card, 14px);
  overflow: hidden;
}

.auto-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 12px 6px 0;
}

.auto-row--static {
  padding: 10px 12px 10px 14px;
}

.auto-row + .auto-row {
  border-top: 1px solid var(--app-color-border-subtle);
}

.auto-row-main {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-width: 0;
  min-height: 56px;
  justify-content: center;
  padding: 6px 0 6px 14px;
  border: 0;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.auto-row-main:focus-visible {
  outline: 3px solid var(--app-color-accent-soft);
  outline-offset: -3px;
}

.auto-row-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--app-color-text);
}

.auto-row-meta {
  font-size: 0.875rem;
  color: var(--app-color-text-muted);
}

.auto-row-warning {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--app-color-warning);
}

.auto-row :deep(.v-switch),
.birthday-auto :deep(.v-switch) {
  flex: 0 0 auto;
}

.birthday-card {
  border: 1px solid var(--app-color-border);
  border-radius: var(--app-radius-card, 14px);
  padding: 16px;
}

.birthday-auto {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.birthday-auto-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--app-color-text);
}

.birthday-auto-copy {
  font-size: 0.875rem;
  color: var(--app-color-text-muted);
}

.birthday-fields {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 160px;
  gap: 12px;
}

.birthday-ranges {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.birthday-icon {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 12px;
  flex-shrink: 0;
}

@media (max-width: 600px) {
  .birthday-fields {
    grid-template-columns: 1fr;
  }
}
</style>
