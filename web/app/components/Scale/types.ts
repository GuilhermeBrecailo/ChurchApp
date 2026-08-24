import type { DepartmentResource, DepartmentSong } from "../../../composables/useDepartments";

export type ScheduleEvent = {
  id: string;
  title: string;
  date: string;
  time: string;
  rehearsalLabel?: string;
  rehearsalNotes?: string | null;
  volunteerCount: number;
  viewedCount: number;
  confirmedCount: number;
  volunteers: {
    userId: string;
    initials: string;
    name: string;
    role: string;
    confirmationStatus?: string;
    attendanceStatus?: string;
    viewedAt?: string | null;
    declineReason?: string | null;
  }[];
  currentUserAssignment?: {
    id: string;
    role: string;
    viewedAt?: string | null;
    confirmationStatus?: string;
    confirmedAt?: string | null;
  } | null;
  mediaItems: {
    id: string;
    scheduleMediaItemId: string;
    order: number;
    title: string;
    category: string;
    url?: string;
    metadata?: DepartmentSong["metadata"] | DepartmentResource["metadata"];
    startedByUserId?: string | null;
    startedByName?: string | null;
  }[];
  canManage: boolean;
};
