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
  departmentId: string;
  department?: {
    id: string;
    name: string;
    type: string;
  };
  assignments?: {
    id: string;
    role: string;
    userId: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  }[];
}

export interface DepartmentResource {
  id: string;
  title: string;
  url: string;
  category: string;
  metadata?: {
    notes?: string;
  } | null;
  departmentId: string;
}

interface CreateDepartmentDTO {
  name: string;
  leaderId: string;
  type: string;
}

interface CreateDepartmentTaskDTO {
  title: string;
  description?: string;
  priority?: string;
  dueDate?: string;
  assigneeId?: string;
}

interface CreateDepartmentScheduleDTO {
  title: string;
  date: string;
  time?: string;
  departmentId?: string;
}

interface CreateDepartmentResourceDTO {
  title: string;
  url: string;
  category?: string;
  notes?: string;
}

interface UpdateScheduleAssignmentsDTO {
  assignments: {
    userId: string;
    role: string;
  }[];
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

  return {
    getDepartments,
    createDepartment,
    getDepartmentById,
    getDepartmentTasks,
    createDepartmentTask,
    getDepartmentSchedules,
    createDepartmentSchedule,
    getChurchSchedules,
    createChurchSchedule,
    updateScheduleAssignments,
    getDepartmentResources,
    createDepartmentResource,
  };
};
