<template>
  <div class="person-page app-operational-page app-page--narrow pa-4 pb-16">
    <UtilsPageHeader
      :title="profile?.person.name ?? 'Pessoa'"
      back="/pessoas"
      back-label="Voltar para Pessoas"
    >
      <template v-if="profile" #below-title>
        <div class="person-chips">
          <span class="person-chip" :class="`person-chip--${profile.person.status.toLowerCase()}`">
            {{ kindLabel }}
          </span>
          <span v-if="profile.person.hasAccount" class="person-chip person-chip--account">
            <Smartphone size="14" aria-hidden="true" /> Tem conta no app
          </span>
          <span v-else-if="profile.permissions.canSeeAccount" class="person-chip">
            Sem conta no app
          </span>
        </div>
      </template>
    </UtilsPageHeader>

    <v-skeleton-loader v-if="loading && !profile" type="card, card, card" class="app-surface" />

    <UtilsEmptyState
      v-else-if="loadError && !profile"
      variant="no-results"
      :icon="UserX"
      title="Não encontramos esta pessoa"
      :description="loadError"
      action-label="Voltar para Pessoas"
      action-to="/pessoas"
    />

    <div v-else-if="profile" class="person-cards">
      <!-- Contato -->
      <section class="person-card app-surface" aria-labelledby="person-contact-title">
        <div class="person-identity">
          <PeopleAvatar :name="profile.person.name" :src="profile.person.avatarUrl" :size="56" />
          <div class="person-identity-copy">
            <h2 id="person-contact-title" class="person-card-title">Contato</h2>
            <p class="person-muted mb-0">{{ contactLine }}</p>
          </div>
        </div>
        <PeopleContactActions
          :person="consentPerson"
          :can-record-consent="profile.permissions.canRecordConsent"
          @record-consent="consentOpen = true"
        />
        <v-btn
          v-if="access.isChurchManager && profile.person.phone"
          variant="text"
          size="small"
          color="primary"
          class="text-none mt-1"
          :loading="checkingWhatsApp"
          @click="checkWhatsApp"
        >
          Verificar se o número tem WhatsApp
        </v-btn>
      </section>

      <!-- Situação -->
      <section class="person-card app-surface">
        <UtilsSectionHeader title="Situação" tag="h2" />
        <PeopleStatusActions
          :person="profile.person"
          :can-change-status="profile.permissions.canChangeStatus"
          @changed="load"
        />
      </section>

      <!-- Acolhimento -->
      <section v-if="showFollowUp" class="person-card app-surface">
        <UtilsSectionHeader
          title="Acolhimento"
          tag="h2"
          description="O caminho do visitante até se sentir em casa."
        />
        <div class="person-facts">
          <div>
            <span class="person-fact-label">Etapa</span>
            <strong>{{ stageLabel }}</strong>
          </div>
          <div>
            <span class="person-fact-label">Responsável</span>
            <strong>{{ profile.followUp?.responsible?.name ?? "Ninguém ainda" }}</strong>
          </div>
          <div>
            <span class="person-fact-label">Próximo contato</span>
            <strong :class="{ 'person-alert': followUpOverdue }">
              {{ nextContactLabel }}
            </strong>
          </div>
        </div>

        <ol v-if="profile.followUp?.activities.length" class="person-timeline">
          <li v-for="activity in profile.followUp.activities.slice(0, showAllActivities ? 20 : 3)" :key="activity.id">
            <span class="person-timeline-dot" aria-hidden="true" />
            <div>
              <p class="person-timeline-title mb-0">
                {{ activityLabel(activity.action) }}
                <span class="person-muted">· {{ dateLabel(activity.createdAt) }}<template v-if="activity.actor"> · {{ activity.actor.name }}</template></span>
              </p>
              <p v-if="activity.note" class="person-muted mb-0">{{ activity.note }}</p>
            </div>
          </li>
        </ol>
        <button
          v-if="(profile.followUp?.activities.length ?? 0) > 3 && !showAllActivities"
          type="button"
          class="person-link"
          @click="showAllActivities = true"
        >
          Ver histórico completo
        </button>

        <div v-if="profile.person.status === 'VISITOR'" class="person-actions">
          <v-btn color="primary" class="text-none font-weight-bold" @click="followUpOpen = true">
            <MessageSquareHeart size="18" class="mr-2" aria-hidden="true" /> Registrar contato
          </v-btn>
        </div>
      </section>

      <!-- Cuidado pastoral -->
      <section v-if="profile.permissions.canCare && profile.person.status !== 'FORMER'" class="person-card app-surface">
        <UtilsSectionHeader title="Cuidado pastoral" tag="h2" :count="openVisits.length || null" />

        <p v-if="attendanceLine" class="person-attendance" :class="{ 'person-alert': attendanceAlert }">
          <CalendarCheck size="18" aria-hidden="true" /> {{ attendanceLine }}
        </p>

        <ol v-if="profile.visits.length" class="person-timeline">
          <li v-for="visit in profile.visits" :key="visit.id">
            <span class="person-timeline-dot" :class="{ 'person-timeline-dot--done': visit.status === 'DONE' }" aria-hidden="true" />
            <div class="person-visit">
              <p class="person-timeline-title mb-0">
                {{ visit.reason }}
              </p>
              <p class="person-muted mb-0">
                {{ visitStatusLabel(visit) }}<template v-if="visit.responsible"> · {{ visit.responsible.name }}</template>
              </p>
              <p v-if="visit.notes" class="person-muted mb-0">{{ visit.notes }}</p>
              <div v-if="visit.status === 'OPEN' || visit.status === 'SCHEDULED'" class="person-visit-actions">
                <v-btn
                  size="small"
                  color="primary"
                  variant="tonal"
                  class="text-none"
                  :loading="busyVisit === visit.id"
                  @click="completeVisit(visit)"
                >
                  Concluir visita
                </v-btn>
                <v-btn size="small" variant="text" class="text-none" @click="editVisit(visit)">Editar</v-btn>
                <v-btn size="small" variant="text" color="error" class="text-none" @click="visitToDelete = visit">
                  Excluir
                </v-btn>
              </div>
              <div v-else class="person-visit-actions">
                <v-btn size="small" variant="text" color="error" class="text-none" @click="visitToDelete = visit">
                  Excluir
                </v-btn>
              </div>
            </div>
          </li>
        </ol>
        <p v-else class="person-muted">Nenhuma visita registrada.</p>

        <div class="person-actions">
          <v-btn color="primary" variant="tonal" class="text-none font-weight-bold" @click="newVisit">
            <HandHeart size="18" class="mr-2" aria-hidden="true" /> Agendar visita
          </v-btn>
        </div>
      </section>

      <!-- Ministérios e escalas -->
      <section v-if="profile.person.hasAccount" class="person-card app-surface">
        <UtilsSectionHeader title="Ministérios e escalas" tag="h2" />
        <div v-if="profile.ministries.length" class="person-ministries">
          <NuxtLink
            v-for="ministry in profile.ministries"
            :key="ministry.id"
            :to="`/ministery/${ministry.id}`"
            class="person-ministry"
          >
            <strong>{{ ministry.name }}</strong>
            <span>{{ [ministry.isLeader ? "Líder" : null, ministry.function].filter(Boolean).join(" · ") || "Participa" }}</span>
          </NuxtLink>
        </div>
        <p v-else class="person-muted">Ainda não participa de nenhum ministério.</p>

        <p class="person-subtitle">Próximas escalas</p>
        <ul v-if="profile.upcomingAssignments.length" class="person-assignments">
          <li v-for="assignment in profile.upcomingAssignments" :key="assignment.id">
            <NuxtLink :to="`${route.path}?schedule=${assignment.scheduleId}`" class="person-assignment">
              <span class="person-assignment-date">{{ dateLabel(assignment.date) }}</span>
              <span class="person-assignment-copy">
                <strong>{{ assignment.department.name }} · {{ assignment.role }}</strong>
                <span>{{ assignment.description }}</span>
              </span>
              <span class="person-assignment-status" :class="`text-${scheduleStatusInfo(assignment.confirmationStatus).color}`">
                {{ scheduleStatusInfo(assignment.confirmationStatus).label }}
              </span>
            </NuxtLink>
          </li>
        </ul>
        <p v-else class="person-muted mb-0">Nenhuma escala marcada.</p>
      </section>

      <!-- Acesso e cargos -->
      <section v-if="profile.permissions.canSeeAccount" class="person-card app-surface">
        <UtilsSectionHeader title="Acesso e cargos" tag="h2" />

        <template v-if="profile.person.hasAccount">
          <p v-if="profile.person.mustChangePassword" class="person-muted">
            Ainda não trocou a senha temporária.
          </p>
          <div class="person-roles">
            <span v-if="accountTypeLabel" class="person-role person-role--type">{{ accountTypeLabel }}</span>
            <span v-for="role in profile.person.roles" :key="role.id" class="person-role">
              {{ role.name }}<template v-if="role.scope === 'MINISTRY'"> · {{ ministryName(role.departmentId) }}</template>
              <button
                v-if="profile.permissions.canManageRoles"
                type="button"
                class="person-role-remove"
                :aria-label="`Tirar o cargo ${role.name}`"
                :disabled="busyRole === role.id"
                @click="removeRole(role)"
              >
                <X size="14" aria-hidden="true" />
              </button>
            </span>
            <span v-if="!profile.person.roles.length && !accountTypeLabel" class="person-muted">Nenhum cargo.</span>
          </div>
          <p v-if="lockedReason" class="person-muted mb-0">{{ lockedReason }}</p>
          <div class="person-actions">
            <v-btn
              v-if="profile.permissions.canManageRoles"
              color="primary"
              class="text-none font-weight-bold"
              @click="openGrant"
            >
              <ShieldCheck size="18" class="mr-2" aria-hidden="true" /> Dar cargo
            </v-btn>
            <v-btn
              v-if="profile.permissions.canResetPassword"
              variant="tonal"
              class="text-none"
              @click="resetConfirmOpen = true"
            >
              <KeyRound size="18" class="mr-2" aria-hidden="true" /> Gerar senha temporária
            </v-btn>
          </div>
        </template>

        <template v-else>
          <p class="person-muted">
            {{ firstName }} ainda não usa o app. Com o app, vê as escalas e os avisos da igreja.
          </p>
          <div v-if="profile.permissions.canInvite" class="person-actions">
            <v-btn color="primary" class="text-none font-weight-bold" @click="inviteOpen = true">
              <Send size="18" class="mr-2" aria-hidden="true" /> Convidar para o app
            </v-btn>
          </div>
        </template>
      </section>

      <!-- Dados -->
      <section class="person-card app-surface">
        <UtilsSectionHeader title="Dados" tag="h2">
          <template v-if="profile.permissions.canEdit" #action>
            <v-btn variant="tonal" color="primary" class="text-none" @click="editOpen = true">
              <Pencil size="16" class="mr-2" aria-hidden="true" /> Editar dados
            </v-btn>
          </template>
        </UtilsSectionHeader>
        <dl class="person-data">
          <div><dt>Telefone</dt><dd>{{ profile.person.phone || "—" }}</dd></div>
          <div><dt>E-mail</dt><dd>{{ profile.person.email || "—" }}</dd></div>
          <div><dt>Nascimento</dt><dd>{{ birthDateLabel }}</dd></div>
          <div v-if="profile.person.hasAccount && profile.person.role"><dt>Tipo de conta</dt><dd>{{ accountTypeLabel || "Membro" }}</dd></div>
          <div v-if="profile.person.notes" class="person-data-wide"><dt>Observações</dt><dd>{{ profile.person.notes }}</dd></div>
        </dl>
      </section>

      <!-- Zona de perigo -->
      <section v-if="dangerAction" class="person-card person-card--danger app-surface">
        <UtilsSectionHeader title="Zona de perigo" tag="h2" />
        <p class="person-muted">{{ dangerAction.description }}</p>
        <v-btn color="error" variant="outlined" class="text-none" @click="dangerOpen = true">
          <component :is="dangerAction.icon" size="18" class="mr-2" aria-hidden="true" />
          {{ dangerAction.label }}
        </v-btn>
      </section>
    </div>

    <template v-if="profile">
      <PeopleFollowUpSheet
        v-model="followUpOpen"
        :roster-id="profile.person.id"
        :name="profile.person.name"
        :follow-up="profile.followUp"
        :responsibles="profile.responsibles"
        @saved="load"
      />
      <UtilsConfirmDialog
        :model-value="Boolean(visitToDelete)"
        title="Excluir visita"
        :message="visitToDelete ? `A visita “${visitToDelete.reason}” sai do histórico de ${profile.person.name}. Isso não pode ser desfeito.` : ''"
        confirm-text="Excluir visita"
        :loading="deletingVisit"
        @update:model-value="(open: boolean) => !open && (visitToDelete = null)"
        @cancel="visitToDelete = null"
        @confirm="confirmDeleteVisit"
      />

      <PeopleVisitSheet
        v-model="visitOpen"
        :fixed-person="{ id: profile.person.id, name: profile.person.name }"
        :responsibles="profile.responsibles"
        :visit="editingVisit"
        :default-reason="defaultVisitReason"
        @saved="load"
      />
      <PeoplePersonEditSheet
        v-model="editOpen"
        :person="profile.person"
        :can-edit-account="profile.permissions.canEditAccount"
        :can-change-type="access.isChurchManager"
        @saved="load"
      />
      <PeopleGrantRoleSheet
        v-if="profile.person.userId"
        v-model="grantOpen"
        :user-id="profile.person.userId"
        :person-name="profile.person.name"
        :assigned-role-ids="profile.person.roles.map((role) => role.id)"
        :roles="churchRoles"
        :ministries="departments"
        @granted="applyRoles"
        @roles-changed="loadRoles"
      />
      <PeopleInviteSheet v-model="inviteOpen" :person="profile.person" @access-created="load" />

      <UtilsConfirmDialog
        v-model="consentOpen"
        title="Registrar autorização"
        :message="`${profile.person.name} autorizou receber mensagens da igreja por WhatsApp e e-mail?`"
        confirm-text="Sim, autorizou"
        :icon="ShieldCheck"
        :loading="savingConsent"
        @cancel="consentOpen = false"
        @confirm="recordConsent"
      />
      <UtilsConfirmDialog
        v-model="resetConfirmOpen"
        title="Gerar senha temporária?"
        :message="`A senha atual de ${firstName} deixa de funcionar. Você recebe uma senha nova para passar, e o app pede para trocar no próximo acesso.`"
        confirm-text="Gerar senha"
        :icon="KeyRound"
        :loading="resettingPassword"
        @cancel="resetConfirmOpen = false"
        @confirm="resetPassword"
      />
      <UtilsConfirmDialog
        v-if="dangerAction"
        v-model="dangerOpen"
        :title="dangerAction.confirmTitle"
        :message="dangerAction.confirmMessage"
        :confirm-text="dangerAction.label"
        :loading="dangerBusy"
        @cancel="dangerOpen = false"
        @confirm="runDanger"
      />

      <UtilsResponsiveOverlay v-model="passwordOpen" max-width="480" variant="detail">
        <UtilsOverlayCard title="Senha temporária" :subtitle="profile.person.name" :icon="KeyRound" @close="passwordOpen = false">
          <p class="mb-2">Passe a senha para {{ firstName }}. No próximo acesso, o app pede uma senha nova.</p>
          <div class="person-secret">
            <span class="person-fact-label">E-mail</span>
            <strong>{{ profile.person.email }}</strong>
            <span class="person-fact-label">Senha temporária</span>
            <strong class="person-password">{{ temporaryPassword }}</strong>
          </div>
          <template #actions>
            <v-btn variant="tonal" color="primary" class="text-none" @click="copyPassword">
              <Copy size="18" class="mr-2" aria-hidden="true" /> Copiar
            </v-btn>
            <v-btn
              color="success"
              class="text-none font-weight-bold"
              :href="passwordShareHref"
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle size="18" class="mr-2" aria-hidden="true" /> Enviar pelo WhatsApp
            </v-btn>
          </template>
        </UtilsOverlayCard>
      </UtilsResponsiveOverlay>
    </template>
  </div>
</template>

<script setup lang="ts">
/**
 * /pessoas/[id] — o perfil único da pessoa (registro do rol). Cartões
 * empilhados e mostrados conforme a permissão de quem vê. Só "Dados" tem
 * botão Salvar; o resto salva na hora, com aviso no rodapé.
 */
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  CalendarCheck,
  Copy,
  HandHeart,
  KeyRound,
  MessageCircle,
  MessageSquareHeart,
  Pencil,
  Send,
  ShieldCheck,
  Smartphone,
  Trash2,
  UserMinus,
  UserX,
  X,
} from "lucide-vue-next";
import { usePeople, type PersonProfile, type PersonRole } from "../../../composables/usePeople";
import { usePastoral, type PastoralVisit } from "../../../composables/usePastoral";
import { useRoster } from "../../../composables/useRoster";
import { useMembers } from "../../../composables/useMembers";
import { useChurchRoles, type ChurchRole } from "../../../composables/useChurchRoles";
import { useDepartments } from "../../../composables/useDepartments";
import { useChurchAccess } from "../../../composables/useChurchAccess";
import { useAuth } from "../../../composables/useAuth";
import { useAppToast } from "../../../composables/useAppToast";
import {
  dateLabel,
  daysFromToday,
  FOLLOW_UP_STAGE_LABELS,
  personKindLabel,
  relativeDayLabel,
} from "../../utils/peopleSegments";
import { scheduleStatusInfo } from "../../utils/scheduleStatus";
import { whatsAppHref, whatsAppShareHref } from "../../utils/contactConsent";

const route = useRoute();
const router = useRouter();
const access = useChurchAccess();
const { user } = useAuth();
const toast = useAppToast();
const { getPerson } = usePeople();
const { updateVisit, deleteVisit } = usePastoral();
const { updateRosterConsent, deleteRosterMember, checkRosterMemberWhatsApp } = useRoster();

// Ações que existiam nas telas antigas (Rol e Visitas) e continuam aqui.
const checkingWhatsApp = ref(false);
const checkWhatsApp = async () => {
  if (!profile.value) return;
  checkingWhatsApp.value = true;
  try {
    const { data, error } = await checkRosterMemberWhatsApp(profile.value.person.id);
    if (error) toast.error(error);
    else if (data?.exists) toast.success("Esse número tem WhatsApp.");
    else toast.info("Esse número não tem WhatsApp. Confira o telefone com a pessoa.");
  } finally {
    checkingWhatsApp.value = false;
  }
};

const visitToDelete = ref<PastoralVisit | null>(null);
const deletingVisit = ref(false);
const confirmDeleteVisit = async () => {
  const visit = visitToDelete.value;
  if (!visit || !profile.value) return;
  deletingVisit.value = true;
  try {
    const { error } = await deleteVisit(visit.id);
    if (error) {
      toast.error(error);
      return;
    }
    profile.value.visits = profile.value.visits.filter((item) => item.id !== visit.id);
    toast.success("Visita excluída.");
    visitToDelete.value = null;
  } finally {
    deletingVisit.value = false;
  }
};
const { resetMemberPassword, deleteMember } = useMembers();
const { getRoles, addMemberRole, removeMemberRole } = useChurchRoles();
const { getDepartments } = useDepartments();

const personId = computed(() => String(route.params.id ?? ""));

const profile = ref<PersonProfile | null>(null);
const loading = ref(false);
const loadError = ref("");
const showAllActivities = ref(false);

const followUpOpen = ref(false);
const visitOpen = ref(false);
const editingVisit = ref<PastoralVisit | null>(null);
const editOpen = ref(false);
const grantOpen = ref(false);
const inviteOpen = ref(false);
const consentOpen = ref(false);
const savingConsent = ref(false);
const resetConfirmOpen = ref(false);
const resettingPassword = ref(false);
const passwordOpen = ref(false);
const temporaryPassword = ref("");
const dangerOpen = ref(false);
const dangerBusy = ref(false);
const busyVisit = ref<string | null>(null);
const busyRole = ref<string | null>(null);

const churchRoles = ref<ChurchRole[]>([]);
const departments = ref<{ id: string; name: string }[]>([]);

useHead(() => ({ title: profile.value?.person.name ?? "Pessoa" }));

const firstName = computed(() => profile.value?.person.name.trim().split(/\s+/)[0] ?? "");

const kindLabel = computed(() => (profile.value ? personKindLabel(profile.value.person) : ""));

const accountTypeLabel = computed(() => {
  const role = profile.value?.person.role;
  if (role === "ADMIN" || role === "SUPER_ADMIN") return "Admin";
  if (role === "PASTOR" || profile.value?.person.isTitularPastor) {
    return profile.value?.person.isTitularPastor ? "Pastor titular" : "Pastor";
  }
  return "";
});

const consentPerson = computed(() => ({
  name: profile.value!.person.name,
  status: profile.value!.person.status,
  hasAccount: profile.value!.person.hasAccount,
  phone: profile.value!.person.phone,
  email: profile.value!.person.email,
  followUp: profile.value!.followUp,
}));

const contactLine = computed(() => {
  const person = profile.value?.person;
  if (!person) return "";
  return [person.phone, person.email].filter(Boolean).join(" · ") || "Sem telefone ou e-mail";
});

const showFollowUp = computed(
  () =>
    Boolean(profile.value?.permissions.canCare) &&
    (profile.value?.person.status === "VISITOR" || Boolean(profile.value?.followUp?.activities.length)),
);

const stageLabel = computed(() => {
  const stage = profile.value?.followUp?.stage;
  return stage ? FOLLOW_UP_STAGE_LABELS[stage] ?? stage : "Sem acompanhamento";
});

const followUpOverdue = computed(() => {
  const diff = daysFromToday(profile.value?.followUp?.nextContactAt);
  return diff !== null && diff < 0 && profile.value?.person.status === "VISITOR";
});

const nextContactLabel = computed(() => {
  const value = profile.value?.followUp?.nextContactAt;
  if (!value) return "Não combinado";
  return followUpOverdue.value ? `Atrasado (${dateLabel(value)})` : dateLabel(value);
});

const openVisits = computed(() =>
  (profile.value?.visits ?? []).filter((visit) => visit.status === "OPEN" || visit.status === "SCHEDULED"),
);

const attendanceAlert = computed(() => {
  const attendance = profile.value?.attendance;
  return Boolean(attendance?.tracksAttendance && attendance.recentServices > 0 && attendance.attended === 0);
});

const attendanceLine = computed(() => {
  const attendance = profile.value?.attendance;
  if (!attendance || !attendance.tracksAttendance || !attendance.recentServices) return "";
  const base = `Veio a ${attendance.attended} dos últimos ${attendance.recentServices} cultos`;
  return attendance.lastPresentAt ? `${base} · última presença ${dateLabel(attendance.lastPresentAt)}` : base;
});

const defaultVisitReason = computed(() => (attendanceAlert.value ? "Está faltando aos cultos" : ""));

const birthDateLabel = computed(() => {
  const value = profile.value?.person.birthDate;
  if (!value) return "—";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
});

const lockedReason = computed(() => {
  const person = profile.value?.person;
  if (!person || profile.value?.permissions.canManageRoles || !access.value.isChurchManager) return "";
  if (person.isSelf) return "Você não pode mudar os seus próprios cargos.";
  if (person.isTitularPastor) return "O pastor titular não muda de cargo por aqui.";
  return "";
});

const dangerAction = computed(() => {
  const current = profile.value;
  if (!current) return null;
  const name = current.person.name;
  if (current.person.hasAccount) {
    if (!current.permissions.canRemoveFromChurch) return null;
    return {
      kind: "remove" as const,
      icon: UserMinus,
      label: "Remover da igreja",
      description: `${firstName.value} perde o acesso ao app desta igreja e vai para Desligados.`,
      confirmTitle: `Remover ${name} da igreja?`,
      confirmMessage: `${name} perde o acesso ao app desta igreja (cargos e escalas futuras deixam de valer) e passa para Desligados. O histórico de visitas e contatos continua guardado.`,
    };
  }
  if (!current.permissions.canDelete) return null;
  return {
    kind: "delete" as const,
    icon: Trash2,
    label: "Excluir do cadastro",
    description: "Apaga a pessoa e todo o histórico de visitas e acolhimento. Para só tirar da lista, use “Desligar”.",
    confirmTitle: `Excluir ${name}?`,
    confirmMessage: `${name} e todo o histórico (visitas, contatos e presença) serão apagados. Isso não pode ser desfeito.`,
  };
});

const passwordShareText = computed(() =>
  temporaryPassword.value && import.meta.client
    ? `Olá, ${firstName.value}! Sua nova senha temporária do app da ${user.value?.activeChurch?.name ?? "igreja"} é ${temporaryPassword.value}\nEntre em ${window.location.origin}/login com o e-mail ${profile.value?.person.email}. O app vai pedir uma senha nova.`
    : "",
);

const passwordShareHref = computed(
  () => whatsAppHref(profile.value?.person.phone, passwordShareText.value) ?? whatsAppShareHref(passwordShareText.value),
);

function activityLabel(action: string) {
  const labels: Record<string, string> = {
    FOLLOW_UP_STARTED: "Acolhimento iniciado",
    CONTACT_RECORDED: "Contato registrado",
    STAGE_CHANGED: "Etapa atualizada",
    FOLLOW_UP_UPDATED: "Acolhimento atualizado",
    BECAME_MEMBER: "Virou membro",
    CONSENT_UPDATED: "Autorização de contato",
  };
  return labels[action] ?? "Registro";
}

function visitStatusLabel(visit: PastoralVisit) {
  if (visit.status === "DONE") {
    return visit.completedAt ? `Feita ${dateLabel(visit.completedAt)}` : "Feita";
  }
  if (visit.status === "CANCELED") return "Cancelada";
  if (!visit.scheduledAt) return "A agendar";
  const time = new Date(visit.scheduledAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const diff = daysFromToday(visit.scheduledAt);
  const day = diff !== null && Math.abs(diff) <= 6 ? relativeDayLabel(visit.scheduledAt) : dateLabel(visit.scheduledAt);
  return diff !== null && diff < 0 ? `Marcada para ${day}, ${time} · atrasada` : `Marcada para ${day}, ${time}`;
}

function ministryName(departmentId: string | null) {
  return (
    departments.value.find((department) => department.id === departmentId)?.name ??
    profile.value?.ministries.find((ministry) => ministry.id === departmentId)?.name ??
    "Ministério"
  );
}

async function load() {
  if (!personId.value) return;
  loading.value = true;
  loadError.value = "";
  const { data, error } = await getPerson(personId.value);
  loading.value = false;
  if (error || !data) {
    loadError.value = error || "Ela pode ter sido excluída ou não faz parte desta igreja.";
    profile.value = null;
    return;
  }
  profile.value = data;
}

async function loadRoles() {
  if (!access.value.isChurchManager) return;
  const [rolesResult, departmentsResult] = await Promise.all([getRoles(), getDepartments()]);
  churchRoles.value = rolesResult.data ?? [];
  departments.value = (departmentsResult.data ?? []).map((department) => ({
    id: department.id,
    name: department.name,
  }));
}

async function openGrant() {
  grantOpen.value = true;
  if (!churchRoles.value.length) await loadRoles();
}

function applyRoles(roles: PersonRole[] | { id: string }[]) {
  if (!profile.value) return;
  profile.value = {
    ...profile.value,
    person: { ...profile.value.person, roles: roles as PersonRole[] },
  };
}

async function removeRole(role: PersonRole) {
  const userId = profile.value?.person.userId;
  if (!userId) return;
  busyRole.value = role.id;
  const { data, error } = await removeMemberRole(userId, role.id);
  busyRole.value = null;
  if (error || !data) {
    toast.error(error || "Não foi possível tirar o cargo.");
    return;
  }
  applyRoles(data.roles);
  toast.info(`Cargo ${role.name} tirado`, {
    actionLabel: "Desfazer",
    onAction: async () => {
      const result = await addMemberRole(userId, role.id);
      if (result.error || !result.data) {
        toast.error(result.error || "Não foi possível devolver o cargo.");
        return;
      }
      applyRoles(result.data.roles);
      toast.success(`Cargo ${role.name} devolvido`);
    },
  });
}

function newVisit() {
  editingVisit.value = null;
  visitOpen.value = true;
}

function editVisit(visit: PastoralVisit) {
  editingVisit.value = visit;
  visitOpen.value = true;
}

async function completeVisit(visit: PastoralVisit) {
  busyVisit.value = visit.id;
  const previous = visit.status;
  const { error } = await updateVisit(visit.id, { status: "DONE" });
  busyVisit.value = null;
  if (error) {
    toast.error(error);
    return;
  }
  toast.info("Visita concluída", {
    actionLabel: "Desfazer",
    onAction: async () => {
      const result = await updateVisit(visit.id, { status: previous, completedAt: null });
      if (result.error) toast.error(result.error);
      await load();
    },
  });
  await load();
}

async function recordConsent() {
  if (!profile.value) return;
  savingConsent.value = true;
  const { error } = await updateRosterConsent(profile.value.person.id, true);
  savingConsent.value = false;
  if (error) {
    toast.error(error);
    return;
  }
  consentOpen.value = false;
  toast.success("Autorização registrada");
  await load();
}

async function resetPassword() {
  const userId = profile.value?.person.userId;
  if (!userId) return;
  resettingPassword.value = true;
  const { data, error } = await resetMemberPassword(userId);
  resettingPassword.value = false;
  resetConfirmOpen.value = false;
  if (error || !data) {
    toast.error(error || "Não foi possível gerar a senha.");
    return;
  }
  temporaryPassword.value = data.temporaryPassword;
  passwordOpen.value = true;
  await load();
}

async function copyPassword() {
  try {
    await navigator.clipboard.writeText(passwordShareText.value);
    toast.success("Copiado. É só colar na conversa.");
  } catch {
    toast.error("Não foi possível copiar. Selecione o texto e copie.");
  }
}

async function runDanger() {
  const current = profile.value;
  const action = dangerAction.value;
  if (!current || !action) return;
  dangerBusy.value = true;
  const { error } =
    action.kind === "remove"
      ? await deleteMember(current.person.userId!)
      : await deleteRosterMember(current.person.id);
  dangerBusy.value = false;
  if (error) {
    toast.error(error);
    return;
  }
  dangerOpen.value = false;
  if (action.kind === "remove") {
    toast.success(`${current.person.name} foi removido(a) da igreja`);
    await load();
  } else {
    toast.success(`${current.person.name} foi excluído(a)`);
    await router.replace("/pessoas");
  }
}

watch(personId, () => {
  profile.value = null;
  void load();
});

onMounted(async () => {
  await load();
  if (profile.value?.person.roles.some((role) => role.scope === "MINISTRY")) await loadRoles();
});
</script>

<style scoped>
.person-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.person-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-height: 28px;
  padding: 0 10px;
  border: 1px solid var(--app-color-border-subtle);
  border-radius: 999px;
  color: var(--app-color-text-muted);
  font-size: 0.85rem;
  font-weight: 700;
}

.person-chip--visitor {
  border-color: transparent;
  background: var(--app-color-warning-tint);
  color: var(--app-color-warning);
}

.person-chip--member {
  border-color: transparent;
  background: var(--app-color-accent-tint);
  color: var(--app-color-accent);
}

.person-chip--former {
  background: var(--app-color-surface-muted);
}

.person-chip--account {
  border-color: transparent;
  background: var(--app-color-success-tint);
  color: var(--app-color-success);
}

.person-cards {
  display: grid;
  gap: 14px;
}

.person-card {
  display: grid;
  gap: 12px;
  padding: 16px;
  border-radius: var(--app-radius-card, 18px);
}

.person-card--danger {
  border-color: var(--app-color-danger-soft) !important;
}

.person-card--danger :deep(.v-btn) {
  justify-self: start;
  min-height: 44px;
}

.person-card-title {
  margin: 0;
  color: var(--app-color-text);
  font-size: 1.05rem;
  font-weight: 800;
}

.person-identity {
  display: flex;
  align-items: center;
  gap: 12px;
}

.person-identity-copy {
  min-width: 0;
  overflow-wrap: anywhere;
}

.person-muted {
  color: var(--app-color-text-muted);
  font-size: 0.95rem;
}

.person-alert {
  color: var(--app-color-warning) !important;
}

.person-link {
  justify-self: start;
  min-height: 40px;
  padding: 0;
  border: 0;
  background: none;
  color: var(--app-color-accent);
  font-weight: 700;
  cursor: pointer;
}

.person-facts {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.person-facts > div,
.person-data > div {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.person-fact-label,
.person-data dt {
  color: var(--app-color-text-muted);
  font-size: 0.85rem;
}

.person-facts strong,
.person-data dd {
  margin: 0;
  color: var(--app-color-text);
  font-size: 1rem;
  font-weight: 700;
  overflow-wrap: anywhere;
}

.person-timeline {
  display: grid;
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.person-timeline li {
  display: flex;
  gap: 10px;
}

.person-timeline-dot {
  flex: 0 0 auto;
  width: 10px;
  height: 10px;
  margin-top: 7px;
  border-radius: 50%;
  background: var(--app-color-accent);
}

.person-timeline-dot--done {
  background: var(--app-color-success);
}

.person-timeline-title {
  color: var(--app-color-text);
  font-size: 1rem;
  font-weight: 700;
}

.person-visit-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 6px;
}

.person-visit-actions :deep(.v-btn) {
  min-height: 40px;
}

.person-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.person-actions :deep(.v-btn) {
  min-height: 44px;
}

.person-attendance {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  color: var(--app-color-text);
  font-size: 0.95rem;
  font-weight: 600;
}

.person-ministries {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 8px;
}

.person-ministry {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-height: 56px;
  padding: 10px 12px;
  border: 1px solid var(--app-color-border-subtle);
  border-radius: 14px;
  color: var(--app-color-text-muted);
  font-size: 0.9rem;
  text-decoration: none;
}

.person-ministry strong {
  color: var(--app-color-text);
  font-size: 1rem;
}

.person-subtitle {
  margin: 4px 0 0;
  color: var(--app-color-text);
  font-size: 0.95rem;
  font-weight: 800;
}

.person-assignments {
  display: grid;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.person-assignment {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 56px;
  padding: 8px 4px;
  color: var(--app-color-text);
  text-decoration: none;
}

.person-assignment-date {
  flex: 0 0 76px;
  color: var(--app-color-accent);
  font-size: 0.9rem;
  font-weight: 800;
}

.person-assignment-copy {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-width: 0;
  color: var(--app-color-text-muted);
  font-size: 0.9rem;
}

.person-assignment-copy strong {
  color: var(--app-color-text);
  font-size: 0.98rem;
}

.person-assignment-status {
  flex: 0 0 auto;
  font-size: 0.85rem;
  font-weight: 700;
}

.person-roles {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.person-role {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-height: 36px;
  padding: 0 6px 0 12px;
  border-radius: 999px;
  background: var(--app-color-accent-tint);
  color: var(--app-color-accent);
  font-size: 0.92rem;
  font-weight: 700;
}

.person-role--type {
  padding-right: 12px;
  background: var(--app-color-surface-muted);
  color: var(--app-color-text);
}

.person-role-remove {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: inherit;
  cursor: pointer;
}

.person-role-remove:hover {
  background: var(--app-color-accent-soft);
}

.person-data {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin: 0;
}

.person-data-wide {
  grid-column: 1 / -1;
}

.person-secret {
  display: grid;
  gap: 2px;
  padding: 12px 14px;
  border-radius: 12px;
  background: var(--app-color-surface-muted);
  overflow-wrap: anywhere;
}

.person-password {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 1.25rem;
  letter-spacing: 0.06em;
}

@media (max-width: 600px) {
  .person-facts,
  .person-data {
    grid-template-columns: 1fr;
  }
}
</style>
