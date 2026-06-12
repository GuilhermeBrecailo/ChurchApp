import type { CustomFetch } from "../types/nuxt";
import type { ApiResponse } from "./useTypes";
import { useNuxtApp, useRuntimeConfig } from "#app";
import { useAuth } from "./useAuth";

export interface ChurchDepartment {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
  leaderId: string;
  membersCount?: number;
  schedulesCount?: number;
  tasksCount?: number;
  resourcesCount?: number;
  songsCount?: number;
  leader: {
    id: string;
    name: string;
    email: string;
  };
}

export interface DepartmentTask {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  dueDate?: string | null;
  createdAt?: string;
  assigneeId?: string | null;
  assignee?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export interface DepartmentSchedule {
  id: string;
  date: string;
  description: string;
  rehearsalAt?: string | null;
  rehearsalNotes?: string | null;
  departmentId: string;
  department?: {
    id: string;
    name: string;
    type: string;
    leaderId?: string;
  };
  assignments?: {
    id: string;
    role: string;
    userId: string;
    viewedAt?: string | null;
    confirmationStatus?: "PENDING" | "CONFIRMED" | string;
    confirmedAt?: string | null;
    attendanceStatus?: "PENDING" | "PRESENT" | "ABSENT" | string;
    attendedAt?: string | null;
    user: {
      id: string;
      name: string;
      email: string;
    };
  }[];
  mediaItems?: {
    id: string;
    mediaItemId: string;
    mediaItem: DepartmentResource | DepartmentSong;
  }[];
}

export interface DepartmentResource {
  id: string;
  title: string;
  url: string;
  category: string;
  metadata?: {
    notes?: string;
    pdf?: DepartmentPdfMetadata | null;
  } | null;
  departmentId: string;
}

export interface DepartmentSong {
  id: string;
  title: string;
  url: string;
  category: "MUSIC";
  metadata?: {
    artist?: string;
    key?: string;
    bpm?: string;
    songCategory?: string;
    notes?: string;
    lyrics?: string;
    chords?: string;
    keyboardChords?: string;
    pdf?: DepartmentPdfMetadata | null;
  } | null;
  departmentId: string;
}

export interface DepartmentPdfMetadata {
  url: string;
  key?: string;
  fileName?: string;
  mimeType?: string;
  size?: number;
}

export interface UploadedDepartmentPdf extends DepartmentPdfMetadata {
  key: string;
  fileName: string;
  mimeType: string;
  size: number;
}

export interface SongPreference {
  id: string | null;
  personalKey?: string | null;
  chords?: string | null;
  updatedAt?: string | null;
}

interface CreateDepartmentDTO {
  name: string;
  leaderId: string;
  type: string;
}

interface UpdateDepartmentDTO {
  name?: string;
  leaderId?: string;
  type?: string;
  isActive?: boolean;
}

interface CreateDepartmentTaskDTO {
  title: string;
  description?: string;
  priority?: string;
  dueDate?: string;
  assigneeId?: string;
}

interface UpdateDepartmentTaskDTO {
  title?: string;
  description?: string | null;
  status?: string;
  priority?: string;
  dueDate?: string | null;
  assigneeId?: string | null;
}

interface CreateDepartmentScheduleDTO {
  title: string;
  date: string;
  time?: string;
  departmentId?: string;
  songIds?: string[];
  resourceIds?: string[];
  rehearsalDate?: string | null;
  rehearsalTime?: string | null;
  rehearsalNotes?: string | null;
}

interface UpdateDepartmentScheduleDTO {
  title?: string;
  description?: string;
  date?: string;
  time?: string;
  departmentId?: string;
  songIds?: string[];
  resourceIds?: string[];
  rehearsalDate?: string | null;
  rehearsalTime?: string | null;
  rehearsalNotes?: string | null;
}

interface CreateDepartmentResourceDTO {
  title: string;
  url: string;
  category?: string;
  notes?: string;
  pdfUrl?: string;
  pdfKey?: string;
  pdfFileName?: string;
  pdfMimeType?: string;
  pdfSize?: number;
}

interface UpdateDepartmentResourceDTO {
  title?: string;
  url?: string;
  category?: string;
  notes?: string | null;
  pdfUrl?: string | null;
  pdfKey?: string | null;
  pdfFileName?: string | null;
  pdfMimeType?: string | null;
  pdfSize?: number | null;
  removePdf?: boolean;
}

interface CreateDepartmentSongDTO {
  title: string;
  artist?: string;
  key?: string;
  bpm?: string;
  songCategory?: string;
  url?: string;
  notes?: string;
  lyrics?: string;
  chords?: string;
  keyboardChords?: string;
  pdfUrl?: string;
  pdfKey?: string;
  pdfFileName?: string;
  pdfMimeType?: string;
  pdfSize?: number;
}

interface UpdateDepartmentSongDTO {
  title?: string;
  artist?: string;
  key?: string;
  bpm?: string | null;
  songCategory?: string;
  url?: string | null;
  notes?: string | null;
  lyrics?: string | null;
  chords?: string | null;
  keyboardChords?: string | null;
  pdfUrl?: string | null;
  pdfKey?: string | null;
  pdfFileName?: string | null;
  pdfMimeType?: string | null;
  pdfSize?: number | null;
  removePdf?: boolean;
}

interface UpdateScheduleAssignmentsDTO {
  assignments: {
    userId: string;
    role: string;
  }[];
}

interface UpdateMyScheduleAssignmentDTO {
  action: "VIEWED" | "CONFIRMED" | "DECLINED" | "MAYBE" | "SWAP_REQUESTED";
}

interface UpdateScheduleAssignmentAttendanceDTO {
  attendanceStatus: "PENDING" | "PRESENT" | "ABSENT";
}

interface SendScheduleReminderResponse {
  success: boolean;
  notifiedCount: number;
}

interface UpdateSongPreferenceDTO {
  personalKey?: string | null;
  chords?: string | null;
}

export const useDepartments = () => {
  const config = useRuntimeConfig();
  const { access_token } = useAuth();

  const { $customFetch } = useNuxtApp() as unknown as {
    $customFetch: CustomFetch;
  };

  const authHeaders = () => ({
    "Content-Type": "application/json",
    ...(access_token.value
      ? { Authorization: `Bearer ${access_token.value}` }
      : {}),
  });

  const authOnlyHeaders = () => ({
    ...(access_token.value
      ? { Authorization: `Bearer ${access_token.value}` }
      : {}),
  });

  const getDepartments = async (): Promise<ApiResponse<ChurchDepartment[]>> => {
    return await $customFetch<ChurchDepartment[]>(
      `${config.public.URL_BACKEND}/api/church/departments`,
      {
        method: "GET",
        headers: authHeaders(),
      },
    );
  };

  const createDepartment = async (
    department: CreateDepartmentDTO,
  ): Promise<ApiResponse<ChurchDepartment>> => {
    return await $customFetch<ChurchDepartment>(
      `${config.public.URL_BACKEND}/api/church/departments`,
      {
        method: "POST",
        headers: authHeaders(),
        body: department,
      },
    );
  };

  const getDepartmentById = async (
    id: string,
  ): Promise<ApiResponse<ChurchDepartment>> => {
    return await $customFetch<ChurchDepartment>(
      `${config.public.URL_BACKEND}/api/church/departments/${id}`,
      {
        method: "GET",
        headers: authHeaders(),
      },
    );
  };

  const updateDepartment = async (
    id: string,
    department: UpdateDepartmentDTO,
  ): Promise<ApiResponse<ChurchDepartment>> => {
    return await $customFetch<ChurchDepartment>(
      `${config.public.URL_BACKEND}/api/church/departments/${id}`,
      {
        method: "PATCH",
        headers: authHeaders(),
        body: department,
      },
    );
  };

  const deleteDepartment = async (
    id: string,
  ): Promise<ApiResponse<{ success: boolean }>> => {
    return await $customFetch<{ success: boolean }>(
      `${config.public.URL_BACKEND}/api/church/departments/${id}`,
      {
        method: "DELETE",
        headers: authOnlyHeaders(),
      },
    );
  };

  const getDepartmentTasks = async (
    id: string,
  ): Promise<ApiResponse<DepartmentTask[]>> => {
    return await $customFetch<DepartmentTask[]>(
      `${config.public.URL_BACKEND}/api/church/departments/${id}/tasks`,
      {
        method: "GET",
        headers: authHeaders(),
      },
    );
  };

  const createDepartmentTask = async (
    id: string,
    task: CreateDepartmentTaskDTO,
  ): Promise<ApiResponse<DepartmentTask>> => {
    return await $customFetch<DepartmentTask>(
      `${config.public.URL_BACKEND}/api/church/departments/${id}/tasks`,
      {
        method: "POST",
        headers: authHeaders(),
        body: task,
      },
    );
  };

  const updateDepartmentTask = async (
    departmentId: string,
    taskId: string,
    task: UpdateDepartmentTaskDTO,
  ): Promise<ApiResponse<DepartmentTask>> => {
    return await $customFetch<DepartmentTask>(
      `${config.public.URL_BACKEND}/api/church/departments/${departmentId}/tasks/${taskId}`,
      {
        method: "PATCH",
        headers: authHeaders(),
        body: task,
      },
    );
  };

  const deleteDepartmentTask = async (
    departmentId: string,
    taskId: string,
  ): Promise<ApiResponse<{ success: boolean }>> => {
    return await $customFetch<{ success: boolean }>(
      `${config.public.URL_BACKEND}/api/church/departments/${departmentId}/tasks/${taskId}`,
      {
        method: "DELETE",
        headers: authOnlyHeaders(),
      },
    );
  };

  const getDepartmentSchedules = async (
    id: string,
  ): Promise<ApiResponse<DepartmentSchedule[]>> => {
    return await $customFetch<DepartmentSchedule[]>(
      `${config.public.URL_BACKEND}/api/church/departments/${id}/schedules`,
      {
        method: "GET",
        headers: authHeaders(),
      },
    );
  };

  const createDepartmentSchedule = async (
    id: string,
    schedule: CreateDepartmentScheduleDTO,
  ): Promise<ApiResponse<DepartmentSchedule>> => {
    return await $customFetch<DepartmentSchedule>(
      `${config.public.URL_BACKEND}/api/church/departments/${id}/schedules`,
      {
        method: "POST",
        headers: authHeaders(),
        body: schedule,
      },
    );
  };

  const getChurchSchedules = async (): Promise<
    ApiResponse<DepartmentSchedule[]>
  > => {
    return await $customFetch<DepartmentSchedule[]>(
      `${config.public.URL_BACKEND}/api/church/schedules`,
      {
        method: "GET",
        headers: authHeaders(),
      },
    );
  };

  const createChurchSchedule = async (
    schedule: CreateDepartmentScheduleDTO,
  ): Promise<ApiResponse<DepartmentSchedule>> => {
    return await $customFetch<DepartmentSchedule>(
      `${config.public.URL_BACKEND}/api/church/schedules`,
      {
        method: "POST",
        headers: authHeaders(),
        body: schedule,
      },
    );
  };

  const updateScheduleAssignments = async (
    scheduleId: string,
    payload: UpdateScheduleAssignmentsDTO,
  ): Promise<ApiResponse<DepartmentSchedule>> => {
    return await $customFetch<DepartmentSchedule>(
      `${config.public.URL_BACKEND}/api/church/schedules/${scheduleId}/assignments`,
      {
        method: "PATCH",
        headers: authHeaders(),
        body: payload,
      },
    );
  };

  const updateMyScheduleAssignment = async (
    scheduleId: string,
    payload: UpdateMyScheduleAssignmentDTO,
  ): Promise<ApiResponse<NonNullable<DepartmentSchedule["assignments"]>[number]>> => {
    return await $customFetch<NonNullable<DepartmentSchedule["assignments"]>[number]>(
      `${config.public.URL_BACKEND}/api/church/schedules/${scheduleId}/my-assignment`,
      {
        method: "PATCH",
        headers: authHeaders(),
        body: payload,
      },
    );
  };

  const sendScheduleReminder = async (
    scheduleId: string,
  ): Promise<ApiResponse<SendScheduleReminderResponse>> => {
    return await $customFetch<SendScheduleReminderResponse>(
      `${config.public.URL_BACKEND}/api/church/schedules/${scheduleId}/reminders`,
      {
        method: "POST",
        headers: authOnlyHeaders(),
      },
    );
  };

  const updateScheduleAssignmentAttendance = async (
    scheduleId: string,
    assignmentId: string,
    payload: UpdateScheduleAssignmentAttendanceDTO,
  ): Promise<ApiResponse<NonNullable<DepartmentSchedule["assignments"]>[number]>> => {
    return await $customFetch<NonNullable<DepartmentSchedule["assignments"]>[number]>(
      `${config.public.URL_BACKEND}/api/church/schedules/${scheduleId}/assignments/${assignmentId}/attendance`,
      {
        method: "PATCH",
        headers: authHeaders(),
        body: payload,
      },
    );
  };

  const updateChurchSchedule = async (
    scheduleId: string,
    schedule: UpdateDepartmentScheduleDTO,
  ): Promise<ApiResponse<DepartmentSchedule>> => {
    return await $customFetch<DepartmentSchedule>(
      `${config.public.URL_BACKEND}/api/church/schedules/${scheduleId}`,
      {
        method: "PATCH",
        headers: authHeaders(),
        body: schedule,
      },
    );
  };

  const deleteChurchSchedule = async (
    scheduleId: string,
  ): Promise<ApiResponse<{ success: boolean }>> => {
    return await $customFetch<{ success: boolean }>(
      `${config.public.URL_BACKEND}/api/church/schedules/${scheduleId}`,
      {
        method: "DELETE",
        headers: authOnlyHeaders(),
      },
    );
  };

  const uploadDepartmentPdf = async (
    departmentId: string,
    file: File,
  ): Promise<ApiResponse<UploadedDepartmentPdf>> => {
    const formData = new FormData();
    formData.append("file", file);

    return await $customFetch<UploadedDepartmentPdf>(
      `${config.public.URL_BACKEND}/api/church/departments/${departmentId}/uploads/pdf`,
      {
        method: "POST",
        headers: authOnlyHeaders(),
        body: formData,
      },
    );
  };

  const getDepartmentResources = async (
    id: string,
  ): Promise<ApiResponse<DepartmentResource[]>> => {
    return await $customFetch<DepartmentResource[]>(
      `${config.public.URL_BACKEND}/api/church/departments/${id}/resources`,
      {
        method: "GET",
        headers: authHeaders(),
      },
    );
  };

  const createDepartmentResource = async (
    id: string,
    resource: CreateDepartmentResourceDTO,
  ): Promise<ApiResponse<DepartmentResource>> => {
    return await $customFetch<DepartmentResource>(
      `${config.public.URL_BACKEND}/api/church/departments/${id}/resources`,
      {
        method: "POST",
        headers: authHeaders(),
        body: resource,
      },
    );
  };

  const getDepartmentSongs = async (
    id: string,
  ): Promise<ApiResponse<DepartmentSong[]>> => {
    return await $customFetch<DepartmentSong[]>(
      `${config.public.URL_BACKEND}/api/church/departments/${id}/songs`,
      {
        method: "GET",
        headers: authHeaders(),
      },
    );
  };

  const createDepartmentSong = async (
    id: string,
    song: CreateDepartmentSongDTO,
  ): Promise<ApiResponse<DepartmentSong>> => {
    return await $customFetch<DepartmentSong>(
      `${config.public.URL_BACKEND}/api/church/departments/${id}/songs`,
      {
        method: "POST",
        headers: authHeaders(),
        body: song,
      },
    );
  };

  const updateDepartmentSong = async (
    departmentId: string,
    songId: string,
    song: UpdateDepartmentSongDTO,
  ): Promise<ApiResponse<DepartmentSong>> => {
    return await $customFetch<DepartmentSong>(
      `${config.public.URL_BACKEND}/api/church/departments/${departmentId}/songs/${songId}`,
      {
        method: "PATCH",
        headers: authHeaders(),
        body: song,
      },
    );
  };

  const deleteDepartmentSong = async (
    departmentId: string,
    songId: string,
  ): Promise<ApiResponse<{ success: boolean }>> => {
    return await $customFetch<{ success: boolean }>(
      `${config.public.URL_BACKEND}/api/church/departments/${departmentId}/songs/${songId}`,
      {
        method: "DELETE",
        headers: authOnlyHeaders(),
      },
    );
  };

  const getSongPreference = async (
    songId: string,
  ): Promise<ApiResponse<SongPreference>> => {
    return await $customFetch<SongPreference>(
      `${config.public.URL_BACKEND}/api/church/songs/${songId}/preference`,
      {
        method: "GET",
        headers: authHeaders(),
      },
    );
  };

  const updateSongPreference = async (
    songId: string,
    preference: UpdateSongPreferenceDTO,
  ): Promise<ApiResponse<SongPreference>> => {
    return await $customFetch<SongPreference>(
      `${config.public.URL_BACKEND}/api/church/songs/${songId}/preference`,
      {
        method: "PATCH",
        headers: authHeaders(),
        body: preference,
      },
    );
  };

  const updateDepartmentResource = async (
    departmentId: string,
    resourceId: string,
    resource: UpdateDepartmentResourceDTO,
  ): Promise<ApiResponse<DepartmentResource>> => {
    return await $customFetch<DepartmentResource>(
      `${config.public.URL_BACKEND}/api/church/departments/${departmentId}/resources/${resourceId}`,
      {
        method: "PATCH",
        headers: authHeaders(),
        body: resource,
      },
    );
  };

  const deleteDepartmentResource = async (
    departmentId: string,
    resourceId: string,
  ): Promise<ApiResponse<{ success: boolean }>> => {
    return await $customFetch<{ success: boolean }>(
      `${config.public.URL_BACKEND}/api/church/departments/${departmentId}/resources/${resourceId}`,
      {
        method: "DELETE",
        headers: authOnlyHeaders(),
      },
    );
  };

  return {
    getDepartments,
    createDepartment,
    getDepartmentById,
    updateDepartment,
    deleteDepartment,
    getDepartmentTasks,
    createDepartmentTask,
    updateDepartmentTask,
    deleteDepartmentTask,
    getDepartmentSchedules,
    createDepartmentSchedule,
    getChurchSchedules,
    createChurchSchedule,
    updateChurchSchedule,
    deleteChurchSchedule,
    updateScheduleAssignments,
    updateMyScheduleAssignment,
    sendScheduleReminder,
    updateScheduleAssignmentAttendance,
    uploadDepartmentPdf,
    getDepartmentResources,
    createDepartmentResource,
    updateDepartmentResource,
    deleteDepartmentResource,
    getDepartmentSongs,
    createDepartmentSong,
    updateDepartmentSong,
    deleteDepartmentSong,
    getSongPreference,
    updateSongPreference,
  };
};
