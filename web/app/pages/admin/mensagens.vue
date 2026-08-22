<template>
  <div
    v-if="canAccessChurchAdmin && isChurchWideManager"
    class="church-admin-page pa-4 bg-grey-lighten-4 min-vh-100 pb-20"
  >
    <div class="mensagens-header mb-4">
      <div class="content-detail-title-group min-w-0">
        <v-btn icon variant="text" size="small" class="mr-2" @click="router.back()">
          <ChevronLeft size="20" />
        </v-btn>
        <div class="flex-1 min-w-0">
          <h1 class="text-h5 font-weight-bold">Mensagens</h1>
        </div>
      </div>
      <UtilsPageHelpButton title="Mensagens" />
    </div>

    <section class="church-admin-section">
      <div class="section-heading mb-4">
        <div>
          <h2 class="text-subtitle-1 font-weight-bold text-grey-darken-4 mb-0">
            Mensagens
          </h2>
          <p class="text-body-2 text-grey-darken-1 mb-0">
            Modelos, envio e histórico de mensagens de WhatsApp pra visitantes e membros do rol.
          </p>
        </div>
      </div>

      <div class="messages-subtabs d-flex ga-2 mb-5 flex-wrap">
        <v-btn
          v-for="tab in messagesSubTabs"
          :key="tab.value"
          :color="messagesSubTab === tab.value ? 'purple-darken-3' : 'grey-darken-2'"
          :variant="messagesSubTab === tab.value ? 'flat' : 'tonal'"
          class="text-none"
          @click="messagesSubTab = tab.value"
        >
          {{ tab.label }}
        </v-btn>
      </div>

      <v-alert v-if="!whatsappConnected" type="warning" variant="tonal" density="compact" class="mb-4">
        WhatsApp não conectado. Conecte na aba "Geral" antes de enviar mensagens.
      </v-alert>

      <div v-show="messagesSubTab === 'modelos'">
        <div class="d-flex justify-end mb-4">
          <v-btn
            color="purple-darken-3"
            class="rounded-lg text-none px-4"
            size="small"
            elevation="1"
            @click="openCreateTemplateDialog"
          >
            <Plus size="16" class="mr-2" /> Novo modelo
          </v-btn>
        </div>

        <v-alert v-if="templatesError" type="error" variant="tonal" density="compact" class="mb-4">
          {{ templatesError }}
        </v-alert>

        <div v-if="templatesLoading" class="d-flex justify-center pa-6">
          <v-progress-circular indeterminate size="28" color="purple-darken-3" />
        </div>

        <v-card
          v-else-if="messageTemplates.length === 0"
          class="rounded-xl pa-6 elevation-1 bg-white d-flex flex-column align-center justify-center border-subtle"
        >
          <MessageSquare size="32" color="#9CA3AF" class="mb-3" />
          <p class="text-caption text-grey-darken-1 font-weight-medium mb-0">
            Nenhum modelo criado ainda
          </p>
        </v-card>

        <div v-else class="church-list d-flex flex-column ga-3">
          <v-card
            v-for="template in messageTemplates"
            :key="template.id"
            class="member-card rounded-xl pa-4 elevation-1 bg-white border-subtle"
            role="button"
            tabindex="0"
            :aria-label="`Editar modelo ${template.name}`"
            @click="openEditTemplateDialog(template)"
            @keydown.enter="openEditTemplateDialog(template)"
            @keydown.space.prevent="openEditTemplateDialog(template)"
          >
            <v-avatar :color="avatarBgIndigo" size="44" class="member-avatar">
              <MessageSquare size="20" :color="accentColor" />
            </v-avatar>
            <div class="member-copy">
              <h3 class="text-subtitle-2 font-weight-bold text-grey-darken-4 mb-0">
                {{ template.name }}
              </h3>
              <p class="text-caption text-grey-darken-1 mb-0 message-template-preview">
                {{ template.body }}
              </p>
            </div>
          </v-card>
        </div>
      </div>

      <div v-show="messagesSubTab === 'enviar'">
        <v-card class="rounded-xl pa-5 elevation-1 border-subtle">
          <v-select
            v-model="sendForm.templateId"
            label="Modelo"
            :items="messageTemplates"
            item-title="name"
            item-value="id"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            class="mb-3"
            hide-details="auto"
          />
          <v-select
            v-model="sendForm.audience"
            label="Público"
            :items="sendAudienceOptions"
            item-title="title"
            item-value="value"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            class="mb-4"
            hide-details="auto"
          />

          <div v-if="sendForm.audience === 'SELECTED'" class="mb-4">
            <p class="text-caption text-grey-darken-1 mb-2">
              {{ selectedRecipientIds.length }} selecionado{{ selectedRecipientIds.length === 1 ? "" : "s" }}
            </p>
            <div v-if="rosterMembersLoading" class="d-flex justify-center pa-4">
              <v-progress-circular indeterminate size="24" color="purple-darken-3" />
            </div>
            <p v-else-if="rosterMembersForSelection.length === 0" class="text-caption text-grey-darken-1 mb-0">
              Nenhuma pessoa no rol ainda.
            </p>
            <div v-else class="recipient-picker-list">
              <div
                v-for="member in rosterMembersForSelection"
                :key="member.id"
                class="recipient-picker-row"
                role="checkbox"
                :aria-checked="selectedRecipientIds.includes(member.id)"
                tabindex="0"
                @click="toggleRecipient(member.id)"
                @keydown.enter="toggleRecipient(member.id)"
                @keydown.space.prevent="toggleRecipient(member.id)"
              >
                <v-checkbox
                  :model-value="selectedRecipientIds.includes(member.id)"
                  color="purple-darken-3"
                  density="compact"
                  hide-details
                  class="recipient-picker-checkbox"
                  @click.stop="toggleRecipient(member.id)"
                />
                <div class="member-copy">
                  <h3 class="text-subtitle-2 font-weight-bold text-grey-darken-4 mb-0">{{ member.name }}</h3>
                  <p class="text-caption text-grey-darken-1 mb-0">
                    {{ member.status === "MEMBER" ? "Membro" : "Visitante" }}
                    <span v-if="!member.phone"> · Sem telefone</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <v-alert v-if="sendError" type="error" variant="tonal" density="compact" class="mb-4">
            {{ sendError }}
          </v-alert>
          <v-alert v-if="sendSuccess" type="success" variant="tonal" density="compact" class="mb-4">
            {{ sendSuccess }}
          </v-alert>

          <v-btn
            color="purple-darken-3"
            variant="flat"
            class="text-none font-weight-bold"
            :disabled="
              !whatsappConnected ||
              !sendForm.templateId ||
              (sendForm.audience === 'SELECTED' && selectedRecipientIds.length === 0)
            "
            :loading="isSendingNow"
            @click="handleSendNow"
          >
            <Send size="16" class="mr-2" /> Enviar agora
          </v-btn>
        </v-card>
      </div>

      <div v-show="messagesSubTab === 'regras'">
        <div class="d-flex justify-end mb-4">
          <v-btn
            color="purple-darken-3"
            class="rounded-lg text-none px-4"
            size="small"
            elevation="1"
            @click="openCreateRuleDialog"
          >
            <Plus size="16" class="mr-2" /> Nova regra
          </v-btn>
        </div>

        <v-alert v-if="rulesError" type="error" variant="tonal" density="compact" class="mb-4">
          {{ rulesError }}
        </v-alert>

        <div v-if="rulesLoading" class="d-flex justify-center pa-6">
          <v-progress-circular indeterminate size="28" color="purple-darken-3" />
        </div>

        <v-card
          v-else-if="messageRules.length === 0"
          class="rounded-xl pa-6 elevation-1 bg-white d-flex flex-column align-center justify-center border-subtle"
        >
          <Clock size="32" color="#9CA3AF" class="mb-3" />
          <p class="text-caption text-grey-darken-1 font-weight-medium mb-0">
            Nenhuma regra automática criada ainda
          </p>
        </v-card>

        <div v-else class="church-list d-flex flex-column ga-3">
          <v-card
            v-for="rule in messageRules"
            :key="rule.id"
            class="member-card rounded-xl pa-4 elevation-1 bg-white border-subtle"
            role="button"
            tabindex="0"
            :aria-label="`Editar regra`"
            @click="openEditRuleDialog(rule)"
            @keydown.enter="openEditRuleDialog(rule)"
            @keydown.space.prevent="openEditRuleDialog(rule)"
          >
            <v-avatar :color="avatarBgIndigo" size="44" class="member-avatar">
              <Clock size="20" :color="accentColor" />
            </v-avatar>
            <div class="member-copy">
              <h3 class="text-subtitle-2 font-weight-bold text-grey-darken-4 mb-0">
                {{ rule.template?.name || "Modelo" }}
              </h3>
              <p class="text-caption text-grey-darken-1 mb-0">
                {{ rule.serviceTime ? `${weekdayName(rule.serviceTime.weekday)} ${rule.serviceTime.time}` : "Culto" }} · {{ rule.offsetMinutes }} min depois · {{ audienceLabel(rule.audience) }}
              </p>
            </div>
            <div class="member-badges">
              <v-chip size="small" :color="rule.isActive ? 'teal-darken-2' : 'grey-darken-1'" variant="tonal">
                {{ rule.isActive ? "Ativa" : "Inativa" }}
              </v-chip>
            </div>
          </v-card>
        </div>
      </div>

      <div v-show="messagesSubTab === 'historico'">
        <v-alert v-if="logsError" type="error" variant="tonal" density="compact" class="mb-4">
          {{ logsError }}
        </v-alert>

        <div v-if="logsLoading" class="d-flex justify-center pa-6">
          <v-progress-circular indeterminate size="28" color="purple-darken-3" />
        </div>

        <v-card
          v-else-if="messageLogs.length === 0"
          class="rounded-xl pa-6 elevation-1 bg-white d-flex flex-column align-center justify-center border-subtle"
        >
          <History size="32" color="#9CA3AF" class="mb-3" />
          <p class="text-caption text-grey-darken-1 font-weight-medium mb-0">
            Nenhum envio registrado ainda
          </p>
        </v-card>

        <div v-else class="church-list d-flex flex-column ga-3">
          <v-card
            v-for="log in messageLogs"
            :key="log.id"
            class="member-card rounded-xl pa-4 elevation-1 bg-white border-subtle"
          >
            <v-avatar :color="avatarBgIndigo" size="44" class="member-avatar">
              <History size="20" :color="accentColor" />
            </v-avatar>
            <div class="member-copy">
              <h3 class="text-subtitle-2 font-weight-bold text-grey-darken-4 mb-0">
                {{ log.template?.name || "Modelo removido" }}
              </h3>
              <p class="text-caption text-grey-darken-1 mb-0">
                {{ formatLogDate(log.createdAt) }} · {{ audienceLabel(log.audience) }} · {{ log.ruleId ? "Automático" : "Manual" }}
              </p>
            </div>
            <div class="member-badges">
              <v-chip size="small" color="teal-darken-2" variant="tonal">{{ log.successCount }} ok</v-chip>
              <v-chip v-if="log.failedCount > 0" size="small" color="red-darken-2" variant="tonal">{{ log.failedCount }} falhou</v-chip>
              <v-chip v-if="log.status === 'PROCESSING'" size="small" color="amber-darken-3" variant="tonal">Enviando...</v-chip>
            </div>
          </v-card>
        </div>
      </div>

      <div v-show="messagesSubTab === 'aniversariantes'">
        <v-card class="rounded-xl pa-5 elevation-1 border-subtle mb-4">
          <div class="d-flex align-center justify-space-between flex-wrap ga-3 mb-3">
            <div>
              <h3 class="text-subtitle-2 font-weight-bold text-grey-darken-4 mb-0">Envio automático</h3>
              <p class="text-caption text-grey-darken-1 mb-0">
                Ligado, quem faz aniversário recebe a mensagem sozinho, todo dia às 8h. Desligado, você manda na mão.
              </p>
            </div>
            <v-switch
              :model-value="birthdaySetting?.isActive ?? false"
              color="purple-darken-3"
              hide-details
              :disabled="birthdaySettingSaving || !birthdaySetting?.templateId"
              @update:model-value="handleToggleBirthdayAuto"
            />
          </div>
          <v-select
            :model-value="birthdaySetting?.templateId"
            label="Modelo de mensagem"
            :items="messageTemplates"
            item-title="name"
            item-value="id"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            class="mb-3"
            hide-details="auto"
            :disabled="birthdaySettingSaving"
            @update:model-value="handleSetBirthdayTemplate"
          />
          <v-text-field
            :model-value="birthdaySetting?.notifyTime ?? '08:00'"
            type="time"
            label="Horário do envio automático"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            hide-details="auto"
            :disabled="birthdaySettingSaving"
            @update:model-value="handleSetBirthdayNotifyTime"
          />
          <v-alert v-if="birthdaySettingError" type="error" variant="tonal" density="compact" class="mt-3">
            {{ birthdaySettingError }}
          </v-alert>
        </v-card>

        <div class="messages-subtabs d-flex ga-2 mb-4 flex-wrap">
          <v-btn
            v-for="option in birthdayRangeOptions"
            :key="option.value"
            :color="birthdayRange === option.value ? 'purple-darken-3' : 'grey-darken-2'"
            :variant="birthdayRange === option.value ? 'flat' : 'tonal'"
            class="text-none"
            @click="birthdayRange = option.value"
          >
            {{ option.label }}
          </v-btn>
        </div>

        <v-alert v-if="birthdaysError" type="error" variant="tonal" density="compact" class="mb-4">
          {{ birthdaysError }}
        </v-alert>

        <div v-if="birthdaysLoading" class="d-flex justify-center pa-6">
          <v-progress-circular indeterminate size="28" color="purple-darken-3" />
        </div>

        <v-card
          v-else-if="birthdayMembers.length === 0"
          class="rounded-xl pa-6 elevation-1 bg-white d-flex flex-column align-center justify-center border-subtle"
        >
          <Cake size="32" color="#9CA3AF" class="mb-3" />
          <p class="text-caption text-grey-darken-1 font-weight-medium mb-0">{{ birthdayEmptyLabel }}</p>
        </v-card>

        <div v-else class="church-list d-flex flex-column ga-3">
          <v-card
            v-for="member in birthdayMembers"
            :key="member.id"
            class="member-card rounded-xl pa-4 elevation-1 bg-white border-subtle"
          >
            <v-avatar :color="avatarBgIndigo" size="44" class="member-avatar">
              <Cake size="20" :color="accentColor" />
            </v-avatar>
            <div class="member-copy">
              <h3 class="text-subtitle-2 font-weight-bold text-grey-darken-4 mb-0">
                {{ member.name }}
              </h3>
              <p class="text-caption text-grey-darken-1 mb-0">
                Completa {{ member.turningAge }} anos
                · {{ member.daysUntil === 0 ? "Hoje" : `em ${member.daysUntil} dia${member.daysUntil > 1 ? "s" : ""}` }}
                <span v-if="!member.phone"> · Sem telefone</span>
              </p>
            </div>
          </v-card>
        </div>

        <div v-if="birthdayRange === 'today' && birthdayMembers.length > 0" class="mt-4">
          <v-alert v-if="sendBirthdaysError" type="error" variant="tonal" density="compact" class="mb-3">
            {{ sendBirthdaysError }}
          </v-alert>
          <v-alert v-if="sendBirthdaysSuccess" type="success" variant="tonal" density="compact" class="mb-3">
            {{ sendBirthdaysSuccess }}
          </v-alert>
          <v-btn
            color="purple-darken-3"
            variant="flat"
            class="text-none font-weight-bold"
            :disabled="!whatsappConnected || !birthdaySetting?.templateId"
            :loading="isSendingBirthdaysNow"
            @click="handleSendBirthdaysNow"
          >
            <Send size="16" class="mr-2" /> Mandar mensagem agora
          </v-btn>
        </div>
      </div>
    </section>

    <UtilsResponsiveOverlay v-model="isTemplateDialogOpen" max-width="480">
      <v-card class="rounded-xl pa-6 bg-white" elevation="0">
        <div class="responsive-dialog-header mb-5">
          <h2 class="text-h6 font-weight-bold text-grey-darken-4 mb-0">
            {{ editingTemplateId ? "Editar modelo" : "Novo modelo" }}
          </h2>
          <v-btn icon variant="text" color="grey-darken-1" size="small" @click="isTemplateDialogOpen = false">
            <v-icon size="20">mdi-close</v-icon>
          </v-btn>
        </div>

        <v-text-field
          v-model="templateForm.name"
          label="Nome do modelo"
          variant="outlined"
          density="comfortable"
          color="purple-darken-3"
          class="mb-3"
          hide-details="auto"
        />
        <v-textarea
          v-model="templateForm.body"
          label="Mensagem"
          variant="outlined"
          density="comfortable"
          color="purple-darken-3"
          class="mb-2"
          hide-details="auto"
          rows="4"
          auto-grow
        />
        <p class="text-caption text-grey-darken-1 mb-4">
          Use <strong>{{ '{nome}' }}</strong> no texto pra ser substituído pelo nome de cada pessoa.
        </p>

        <v-alert v-if="templateFormError" type="error" variant="tonal" density="compact" class="mb-3">
          {{ templateFormError }}
        </v-alert>

        <div class="d-flex justify-space-between align-center">
          <v-btn v-if="editingTemplateId" variant="text" color="red-darken-2" class="text-none" @click="handleDeleteTemplate">
            Excluir
          </v-btn>
          <div v-else />
          <div class="d-flex gap-2">
            <v-btn variant="text" color="grey-darken-1" class="text-none" @click="isTemplateDialogOpen = false">
              Cancelar
            </v-btn>
            <v-btn
              color="purple-darken-3"
              variant="flat"
              class="text-none font-weight-bold"
              :loading="isSavingTemplate"
              @click="handleSaveTemplate"
            >
              Salvar
            </v-btn>
          </div>
        </div>
      </v-card>
    </UtilsResponsiveOverlay>

    <UtilsResponsiveOverlay v-model="isRuleDialogOpen" max-width="480">
      <v-card class="rounded-xl pa-6 bg-white" elevation="0">
        <div class="responsive-dialog-header mb-5">
          <h2 class="text-h6 font-weight-bold text-grey-darken-4 mb-0">
            {{ editingRuleId ? "Editar regra" : "Nova regra automática" }}
          </h2>
          <v-btn icon variant="text" color="grey-darken-1" size="small" @click="isRuleDialogOpen = false">
            <v-icon size="20">mdi-close</v-icon>
          </v-btn>
        </div>

        <v-alert
          v-if="sortedServiceTimes.length === 0"
          type="info"
          variant="tonal"
          density="compact"
          class="mb-3"
        >
          Nenhum culto cadastrado ainda. Configure um horário de culto na aba "Geral" antes de criar uma regra automática.
        </v-alert>
        <v-select
          v-else
          v-model="ruleForm.serviceTimeId"
          label="Culto"
          :items="sortedServiceTimes"
          :item-title="ruleServiceTimeLabel"
          item-value="id"
          variant="outlined"
          density="comfortable"
          color="purple-darken-3"
          class="mb-3"
          hide-details="auto"
        />
        <v-text-field
          v-model.number="ruleForm.offsetMinutes"
          type="number"
          min="0"
          label="Minutos depois do culto"
          variant="outlined"
          density="comfortable"
          color="purple-darken-3"
          class="mb-3"
          hide-details="auto"
        />
        <v-select
          v-model="ruleForm.templateId"
          label="Modelo"
          :items="messageTemplates"
          item-title="name"
          item-value="id"
          variant="outlined"
          density="comfortable"
          color="purple-darken-3"
          class="mb-3"
          hide-details="auto"
        />
        <v-select
          v-model="ruleForm.audience"
          label="Público"
          :items="audienceOptions"
          item-title="title"
          item-value="value"
          variant="outlined"
          density="comfortable"
          color="purple-darken-3"
          class="mb-3"
          hide-details="auto"
        />
        <v-switch
          v-model="ruleForm.isActive"
          label="Regra ativa"
          color="purple-darken-3"
          density="comfortable"
          hide-details
          class="mb-2"
        />

        <v-alert v-if="ruleFormError" type="error" variant="tonal" density="compact" class="mb-3">
          {{ ruleFormError }}
        </v-alert>

        <div class="d-flex justify-space-between align-center">
          <v-btn v-if="editingRuleId" variant="text" color="red-darken-2" class="text-none" @click="handleDeleteRule">
            Excluir
          </v-btn>
          <div v-else />
          <div class="d-flex gap-2">
            <v-btn variant="text" color="grey-darken-1" class="text-none" @click="isRuleDialogOpen = false">
              Cancelar
            </v-btn>
            <v-btn
              color="purple-darken-3"
              variant="flat"
              class="text-none font-weight-bold"
              :disabled="sortedServiceTimes.length === 0"
              :loading="isSavingRule"
              @click="handleSaveRule"
            >
              Salvar
            </v-btn>
          </div>
        </div>
      </v-card>
    </UtilsResponsiveOverlay>
  </div>

  <div v-else class="pa-4 bg-grey-lighten-4 min-vh-100 pb-20">
    <v-card
      class="rounded-xl pa-6 elevation-1 bg-white d-flex flex-column align-center justify-center border-subtle permission-empty"
    >
      <UserCheck size="34" color="#9CA3AF" class="mb-3" />
      <h1 class="text-subtitle-1 font-weight-bold text-grey-darken-4 mb-1">
        Administração indisponível
      </h1>
      <p class="text-body-2 text-grey-darken-1 mb-0 text-center">
        Esta área é liberada para pastores, admins ou membros com permissão de gestão.
      </p>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { Cake, ChevronLeft, Clock, History, MessageSquare, Plus, Send, UserCheck } from "lucide-vue-next";
import { useAuth } from "../../../composables/useAuth";
import { useThemeMode } from "../../../composables/useThemeMode";
import { usePermissions } from "../../../composables/usePermissions";
import { useServiceTimes, type ServiceTime } from "../../../composables/useServiceTimes";
import { useWhatsApp } from "../../../composables/useWhatsApp";
import { useRoster, type RosterMember } from "../../../composables/useRoster";
import { useBirthdays, type BirthdayMember, type BirthdayRange, type BirthdayMessageSetting } from "../../../composables/useBirthdays";
import {
  useMessages,
  type MessageAudience,
  type MessageTemplate,
  type MessageRule,
  type MessageLog,
} from "../../../composables/useMessages";

const router = useRouter();

const { user } = useAuth();
const { isDark } = useThemeMode();
const { can } = usePermissions();

const accentColor = computed(() => isDark.value ? "#f0975a" : "#B5472A");
const avatarBgIndigo = computed(() => isDark.value ? "rgba(240,151,90,0.16)" : "#F7E2D3");

const isPlatformAdmin = computed(
  () =>
    user.value?.role === "ADMIN" ||
    user.value?.role === "SUPER_ADMIN" ||
    user.value?.is_admin === true,
);
const isChurchWideManager = computed(
  () => user.value?.role === "PASTOR" || isPlatformAdmin.value,
);
const canManageMembersByRole = computed(
  () =>
    isChurchWideManager.value ||
    user.value?.canManageMembers === true ||
    can("MEMBER_CREATE") ||
    can("MEMBER_EDIT") ||
    can("MEMBER_DELETE"),
);
const canAccessChurchAdmin = computed(
  () =>
    user.value?.hasChurch === true &&
    canManageMembersByRole.value,
);

const { serviceTimes, loadServiceTimes } = useServiceTimes();

const weekdayOptions = [
  { label: "Domingo", value: 0 },
  { label: "Segunda", value: 1 },
  { label: "Terca", value: 2 },
  { label: "Quarta", value: 3 },
  { label: "Quinta", value: 4 },
  { label: "Sexta", value: 5 },
  { label: "Sabado", value: 6 },
];

const weekdayName = (weekday: number) =>
  weekdayOptions.find((day) => day.value === weekday)?.label ?? "-";

const sortedServiceTimes = computed(() =>
  [...serviceTimes.value].sort(
    (a, b) => a.weekday - b.weekday || a.time.localeCompare(b.time),
  ),
);

const { getWhatsAppStatus } = useWhatsApp();

const whatsappConnected = ref(false);

const loadWhatsAppStatus = async () => {
  if (!isChurchWideManager.value) return;
  const { data } = await getWhatsAppStatus();
  whatsappConnected.value = data?.connected ?? false;
};

const {
  listTemplates: listMessageTemplates,
  createTemplate: createMessageTemplate,
  updateTemplate: updateMessageTemplate,
  deleteTemplate: deleteMessageTemplate,
  listRules: listMessageRules,
  createRule: createMessageRule,
  updateRule: updateMessageRule,
  deleteRule: deleteMessageRule,
  listLogs: listMessageLogs,
  sendNow: sendMessageNow,
} = useMessages();

type MessagesSubTab = "modelos" | "enviar" | "regras" | "historico" | "aniversariantes";

const messagesSubTabs: { value: MessagesSubTab; label: string }[] = [
  { value: "modelos", label: "Modelos" },
  { value: "enviar", label: "Enviar agora" },
  { value: "regras", label: "Regras automáticas" },
  { value: "historico", label: "Histórico" },
  { value: "aniversariantes", label: "Aniversariantes" },
];
const messagesSubTab = ref<MessagesSubTab>("modelos");

// Publico das regras automaticas - so os 3 originais (SELECTED e so de envio
// manual, ver design.md da change messaging-targeting-and-scheduling).
const audienceOptions = [
  { title: "Visitantes", value: "VISITOR" },
  { title: "Membros", value: "MEMBER" },
  { title: "Todos (visitantes + membros)", value: "ALL" },
];
// Publico do "Enviar agora" - os 3 de sempre + selecionar pessoas a mao.
const sendAudienceOptions = [
  ...audienceOptions,
  { title: "Selecionar pessoas", value: "SELECTED" },
];
const audienceLabel = (audience: MessageAudience) =>
  sendAudienceOptions.find((option) => option.value === audience)?.title ?? audience;

const ruleServiceTimeLabel = (item: ServiceTime | string) => {
  if (!item || typeof item !== "object") return "";
  return `${weekdayName(item.weekday)} · ${item.time} · ${item.label}`;
};

const formatLogDate = (value: string) =>
  new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

const messageTemplates = ref<MessageTemplate[]>([]);
const templatesLoading = ref(false);
const templatesError = ref("");

const messageRules = ref<MessageRule[]>([]);
const rulesLoading = ref(false);
const rulesError = ref("");

const messageLogs = ref<MessageLog[]>([]);
const logsLoading = ref(false);
const logsError = ref("");

const loadMessageTemplates = async () => {
  if (!isChurchWideManager.value) return;
  templatesLoading.value = true;
  templatesError.value = "";
  const { data, error } = await listMessageTemplates();
  if (error) templatesError.value = error;
  messageTemplates.value = data ?? [];
  templatesLoading.value = false;
};

const loadMessageRules = async () => {
  if (!isChurchWideManager.value) return;
  rulesLoading.value = true;
  rulesError.value = "";
  const { data, error } = await listMessageRules();
  if (error) rulesError.value = error;
  messageRules.value = data ?? [];
  rulesLoading.value = false;
};

const loadMessageLogs = async () => {
  if (!isChurchWideManager.value) return;
  logsLoading.value = true;
  logsError.value = "";
  const { data, error } = await listMessageLogs();
  if (error) logsError.value = error;
  messageLogs.value = data ?? [];
  logsLoading.value = false;
};

const loadMessagesData = async () => {
  await Promise.all([loadMessageTemplates(), loadMessageRules(), loadMessageLogs()]);
};

const { listBirthdays, getBirthdaySetting, updateBirthdaySetting, sendBirthdayMessagesNow } = useBirthdays();

const birthdayRangeOptions: { value: BirthdayRange; label: string }[] = [
  { value: "today", label: "Hoje" },
  { value: "week", label: "Esta semana" },
  { value: "month", label: "Este mês" },
];
const birthdayRange = ref<BirthdayRange>("today");
const birthdayMembers = ref<BirthdayMember[]>([]);
const birthdaysLoading = ref(false);
const birthdaysError = ref("");

const birthdaySetting = ref<BirthdayMessageSetting | null>(null);
const birthdaySettingSaving = ref(false);
const birthdaySettingError = ref("");

const isSendingBirthdaysNow = ref(false);
const sendBirthdaysError = ref("");
const sendBirthdaysSuccess = ref("");

const birthdayEmptyLabel = computed(() => {
  if (birthdayRange.value === "today") return "Ninguém faz aniversário hoje";
  if (birthdayRange.value === "week") return "Ninguém faz aniversário esta semana";
  return "Ninguém faz aniversário este mês";
});

const loadBirthdays = async () => {
  if (!isChurchWideManager.value) return;
  birthdaysLoading.value = true;
  birthdaysError.value = "";
  const { data, error } = await listBirthdays(birthdayRange.value);
  if (error) birthdaysError.value = error;
  birthdayMembers.value = data ?? [];
  birthdaysLoading.value = false;
};

watch(birthdayRange, loadBirthdays);

const loadBirthdaySetting = async () => {
  if (!isChurchWideManager.value) return;
  const { data, error } = await getBirthdaySetting();
  if (error) birthdaySettingError.value = error;
  birthdaySetting.value = data ?? null;
};

const loadBirthdayData = async () => {
  await Promise.all([loadBirthdays(), loadBirthdaySetting()]);
};

const handleToggleBirthdayAuto = async (isActive: boolean) => {
  birthdaySettingSaving.value = true;
  birthdaySettingError.value = "";
  const { data, error } = await updateBirthdaySetting({ isActive });
  birthdaySettingSaving.value = false;
  if (error) {
    birthdaySettingError.value = error;
    return;
  }
  birthdaySetting.value = data ?? birthdaySetting.value;
};

const handleSetBirthdayTemplate = async (templateId: string | null) => {
  birthdaySettingSaving.value = true;
  birthdaySettingError.value = "";
  const { data, error } = await updateBirthdaySetting({ templateId });
  birthdaySettingSaving.value = false;
  if (error) {
    birthdaySettingError.value = error;
    return;
  }
  birthdaySetting.value = data ?? birthdaySetting.value;
};

const handleSetBirthdayNotifyTime = async (notifyTime: string) => {
  birthdaySettingSaving.value = true;
  birthdaySettingError.value = "";
  const { data, error } = await updateBirthdaySetting({ notifyTime });
  birthdaySettingSaving.value = false;
  if (error) {
    birthdaySettingError.value = error;
    return;
  }
  birthdaySetting.value = data ?? birthdaySetting.value;
};

const handleSendBirthdaysNow = async () => {
  isSendingBirthdaysNow.value = true;
  sendBirthdaysError.value = "";
  sendBirthdaysSuccess.value = "";

  const { error } = await sendBirthdayMessagesNow();
  isSendingBirthdaysNow.value = false;

  if (error) {
    sendBirthdaysError.value = error;
    return;
  }

  sendBirthdaysSuccess.value = "Envio iniciado - acompanhe o progresso no Histórico.";
  await loadMessageLogs();
};

const isTemplateDialogOpen = ref(false);
const editingTemplateId = ref("");
const isSavingTemplate = ref(false);
const templateFormError = ref("");
const templateForm = reactive({ name: "", body: "" });

const resetTemplateForm = () => {
  templateForm.name = "";
  templateForm.body = "";
  templateFormError.value = "";
};

const openCreateTemplateDialog = () => {
  editingTemplateId.value = "";
  resetTemplateForm();
  isTemplateDialogOpen.value = true;
};

const openEditTemplateDialog = (template: MessageTemplate) => {
  editingTemplateId.value = template.id;
  templateForm.name = template.name;
  templateForm.body = template.body;
  templateFormError.value = "";
  isTemplateDialogOpen.value = true;
};

const handleSaveTemplate = async () => {
  if (!templateForm.name.trim() || !templateForm.body.trim()) {
    templateFormError.value = "Nome e mensagem são obrigatórios";
    return;
  }

  isSavingTemplate.value = true;
  templateFormError.value = "";

  const payload = { name: templateForm.name, body: templateForm.body };
  const { error } = editingTemplateId.value
    ? await updateMessageTemplate(editingTemplateId.value, payload)
    : await createMessageTemplate(payload);

  isSavingTemplate.value = false;

  if (error) {
    templateFormError.value = error;
    return;
  }

  isTemplateDialogOpen.value = false;
  await loadMessageTemplates();
};

const handleDeleteTemplate = async () => {
  if (!editingTemplateId.value) return;
  isSavingTemplate.value = true;
  const { error } = await deleteMessageTemplate(editingTemplateId.value);
  isSavingTemplate.value = false;

  if (error) {
    templateFormError.value = error;
    return;
  }

  isTemplateDialogOpen.value = false;
  await Promise.all([loadMessageTemplates(), loadMessageRules()]);
};

const sendForm = reactive<{ templateId: string; audience: MessageAudience }>({
  templateId: "",
  audience: "ALL",
});
const isSendingNow = ref(false);
const sendError = ref("");
const sendSuccess = ref("");

const { listRosterMembers } = useRoster();
const rosterMembersForSelection = ref<RosterMember[]>([]);
const rosterMembersLoading = ref(false);
const selectedRecipientIds = ref<string[]>([]);

const loadRosterForSelection = async () => {
  if (!isChurchWideManager.value) return;
  rosterMembersLoading.value = true;
  const { data } = await listRosterMembers();
  rosterMembersForSelection.value = data ?? [];
  rosterMembersLoading.value = false;
};

const toggleRecipient = (id: string) => {
  const index = selectedRecipientIds.value.indexOf(id);
  if (index === -1) selectedRecipientIds.value.push(id);
  else selectedRecipientIds.value.splice(index, 1);
};

watch(
  () => sendForm.audience,
  (audience) => {
    if (audience === "SELECTED" && rosterMembersForSelection.value.length === 0) {
      loadRosterForSelection();
    }
  },
);

const handleSendNow = async () => {
  if (!sendForm.templateId) return;
  if (sendForm.audience === "SELECTED" && selectedRecipientIds.value.length === 0) return;

  isSendingNow.value = true;
  sendError.value = "";
  sendSuccess.value = "";

  const { error } = await sendMessageNow(
    sendForm.templateId,
    sendForm.audience,
    sendForm.audience === "SELECTED" ? selectedRecipientIds.value : undefined,
  );
  isSendingNow.value = false;

  if (error) {
    sendError.value = error;
    return;
  }

  sendSuccess.value = "Envio iniciado - acompanhe o progresso no Histórico.";
  selectedRecipientIds.value = [];
  await loadMessageLogs();
};

const isRuleDialogOpen = ref(false);
const editingRuleId = ref("");
const isSavingRule = ref(false);
const ruleFormError = ref("");
const ruleForm = reactive<{
  serviceTimeId: string;
  templateId: string;
  audience: MessageAudience;
  offsetMinutes: number;
  isActive: boolean;
}>({
  serviceTimeId: "",
  templateId: "",
  audience: "ALL",
  offsetMinutes: 120,
  isActive: true,
});

const resetRuleForm = () => {
  ruleForm.serviceTimeId = sortedServiceTimes.value[0]?.id ?? "";
  ruleForm.templateId = "";
  ruleForm.audience = "ALL";
  ruleForm.offsetMinutes = 120;
  ruleForm.isActive = true;
  ruleFormError.value = "";
};

const openCreateRuleDialog = () => {
  editingRuleId.value = "";
  resetRuleForm();
  isRuleDialogOpen.value = true;
};

const openEditRuleDialog = (rule: MessageRule) => {
  editingRuleId.value = rule.id;
  ruleForm.serviceTimeId = rule.serviceTimeId;
  ruleForm.templateId = rule.templateId;
  ruleForm.audience = rule.audience;
  ruleForm.offsetMinutes = rule.offsetMinutes;
  ruleForm.isActive = rule.isActive;
  ruleFormError.value = "";
  isRuleDialogOpen.value = true;
};

const handleSaveRule = async () => {
  if (!ruleForm.serviceTimeId || !ruleForm.templateId) {
    ruleFormError.value = "Culto e modelo são obrigatórios";
    return;
  }

  isSavingRule.value = true;
  ruleFormError.value = "";

  const payload = {
    serviceTimeId: ruleForm.serviceTimeId,
    templateId: ruleForm.templateId,
    audience: ruleForm.audience,
    offsetMinutes: ruleForm.offsetMinutes,
    isActive: ruleForm.isActive,
  };

  const { error } = editingRuleId.value
    ? await updateMessageRule(editingRuleId.value, payload)
    : await createMessageRule(payload);

  isSavingRule.value = false;

  if (error) {
    ruleFormError.value = error;
    return;
  }

  isRuleDialogOpen.value = false;
  await loadMessageRules();
};

const handleDeleteRule = async () => {
  if (!editingRuleId.value) return;
  isSavingRule.value = true;
  const { error } = await deleteMessageRule(editingRuleId.value);
  isSavingRule.value = false;

  if (error) {
    ruleFormError.value = error;
    return;
  }

  isRuleDialogOpen.value = false;
  await loadMessageRules();
};

onMounted(async () => {
  await Promise.all([
    canAccessChurchAdmin.value ? loadServiceTimes() : Promise.resolve(),
    loadWhatsAppStatus(),
    loadMessagesData(),
    loadBirthdayData(),
  ]);
});
</script>

<style scoped>
.min-vh-100 {
  min-height: 100vh;
}
.pb-20 {
  padding-bottom: 90px !important; /* Espaço para o Bottom Navigation */
}
.border-subtle {
  border: 1px solid #f3f4f6;
}

.church-admin-page {
  max-width: 1120px;
  margin: 0 auto;
}

.mensagens-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.content-detail-title-group {
  display: flex;
  align-items: center;
}

.church-admin-section {
  min-width: 0;
}

.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.section-heading .v-btn {
  flex: 0 0 auto;
}

.responsive-dialog-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.permission-empty {
  min-height: 320px;
}

.member-card:focus-visible {
  outline: 3px solid rgba(181, 71, 42, 0.32);
  outline-offset: 2px;
}

.member-card {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease;
}

.member-avatar {
  align-self: start;
}

.member-copy {
  min-width: 0;
}

.member-copy h3,
.member-copy p {
  overflow-wrap: anywhere;
}

.member-badges {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 8px;
  min-width: 0;
}

.recipient-picker-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 320px;
  overflow-y: auto;
  border: 1px solid #f3f4f6;
  border-radius: 12px;
  padding: 6px;
}

.recipient-picker-row {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 8px;
  cursor: pointer;
}

.recipient-picker-row:hover {
  background: rgba(181, 71, 42, 0.05);
}

.recipient-picker-row:focus-visible {
  outline: 2px solid rgba(181, 71, 42, 0.32);
  outline-offset: 2px;
}

.recipient-picker-checkbox {
  flex: 0 0 auto;
}

.message-template-preview {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.member-card:active {
  transform: scale(0.99);
}

@media (max-width: 520px) {
  .church-admin-page {
    padding-right: 12px !important;
    padding-left: 12px !important;
  }

  .section-heading {
    align-items: stretch;
    flex-direction: column;
  }

  .section-heading .v-btn {
    width: 100%;
  }

  .member-card {
    grid-template-columns: 40px minmax(0, 1fr);
    align-items: start;
    padding: 14px !important;
  }

  .member-avatar {
    width: 40px !important;
    height: 40px !important;
  }

  .member-badges {
    grid-column: 2;
    justify-content: flex-start;
    margin-top: 2px;
  }

  .member-badges :deep(.v-chip) {
    max-width: 100%;
  }
}
</style>
