import type { CustomFetch } from "../types/nuxt";
import type { ApiResponse } from "./useTypes";
import { useNuxtApp, useRuntimeConfig } from "#app";
import { useAuth } from "./useAuth";
import type { PastoralVisit } from "./usePastoral";
import type { VisitorFollowUpActivity, VisitorFollowUpStage } from "./useVisitorFollowUp";

export type PersonStatus = "VISITOR" | "MEMBER" | "FORMER";

export interface PersonRole {
  id: string;
  name: string;
  scope: "CHURCH" | "MINISTRY";
  departmentId: string | null;
  permissions: string[];
}

export interface PersonFollowUpSummary {
  stage: VisitorFollowUpStage;
  consentToContact: boolean;
  nextContactAt: string | null;
  lastContactAt: string | null;
  responsible: { id: string; name: string } | null;
}

export interface PersonCareSummary {
  openVisits: number;
  nextVisitAt: string | null;
  absent: boolean;
}

/** Uma linha do diretório (/pessoas). `id` é sempre o id do registro no rol. */
export interface PersonSummary {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: PersonStatus;
  joinedAt: string | null;
  leftAt: string | null;
  createdAt: string | null;
  avatarUrl: string | null;
  userId: string | null;
  hasAccount: boolean;
  membershipId: string | null;
  role: string | null;
  isTitularPastor: boolean;
  roles: PersonRole[];
  departments: string[];
  followUp: PersonFollowUpSummary | null;
  /** Só para quem faz cuidado pastoral. */
  care: PersonCareSummary | null;
}

export interface PendingPerson {
  membershipId: string;
  userId: string;
  name: string;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  requestedAt: string | null;
}

export interface PeopleAccessFlags {
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canSeeAccounts: boolean;
  canCare: boolean;
  isManager: boolean;
}

export interface PeopleDirectory {
  people: PersonSummary[];
  pending: PendingPerson[];
  responsibles: { id: string; name: string }[];
  access: PeopleAccessFlags;
}

export interface PersonProfile {
  person: PersonSummary & {
    birthDate: string | null;
    notes: string | null;
    mustChangePassword: boolean;
    isSelf: boolean;
  };
  followUp:
    | (PersonFollowUpSummary & {
        id: string;
        responsibleId: string | null;
        activities: VisitorFollowUpActivity[];
      })
    | null;
  visits: PastoralVisit[];
  attendance: {
    recentServices: number;
    attended: number;
    tracksAttendance: boolean;
    lastPresentAt: string | null;
  } | null;
  ministries: { id: string; name: string; function: string | null; isLeader: boolean }[];
  upcomingAssignments: {
    id: string;
    role: string;
    confirmationStatus: string;
    scheduleId: string;
    date: string;
    description: string;
    department: { id: string; name: string };
  }[];
  responsibles: { id: string; name: string }[];
  permissions: {
    canEdit: boolean;
    canEditAccount: boolean;
    canChangeStatus: boolean;
    canDelete: boolean;
    canRemoveFromChurch: boolean;
    canCare: boolean;
    canRecordConsent: boolean;
    canInvite: boolean;
    canManageRoles: boolean;
    canResetPassword: boolean;
    canSeeAccount: boolean;
  };
}

/** Diretório e perfil únicos de pessoas (GET /api/church/people[/:id]). */
export const usePeople = () => {
  const config = useRuntimeConfig();
  const { access_token } = useAuth();
  const { $customFetch } = useNuxtApp() as unknown as { $customFetch: CustomFetch };

  const headers = () => ({
    ...(access_token.value ? { Authorization: `Bearer ${access_token.value}` } : {}),
  });

  const base = `${config.public.URL_BACKEND}/api/church/people`;

  const getPeople = async (): Promise<ApiResponse<PeopleDirectory>> =>
    await $customFetch<PeopleDirectory>(base, { method: "GET", headers: headers() });

  const getPerson = async (rosterId: string): Promise<ApiResponse<PersonProfile>> =>
    await $customFetch<PersonProfile>(`${base}/${encodeURIComponent(rosterId)}`, {
      method: "GET",
      headers: headers(),
    });

  return { getPeople, getPerson };
};
