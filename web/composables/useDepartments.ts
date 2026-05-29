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

  return {
    getDepartments,
    createDepartment,
    getDepartmentById,
    getDepartmentTasks,
    createDepartmentTask,
  };
};
