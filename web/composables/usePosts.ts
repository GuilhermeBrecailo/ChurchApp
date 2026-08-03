import type { CustomFetch } from "../types/nuxt";
import type { ApiResponse } from "./useTypes";
import { useNuxtApp, useRuntimeConfig } from "#app";
import { useAuth } from "./useAuth";

export interface ChurchPost {
  id: string;
  title: string;
  body?: string | null;
  imageUrl?: string | null;
  imageKey?: string | null;
  videoUrl?: string | null;
  isPublic: boolean;
  pinned: boolean;
  publishedAt: string;
  author?: { id: string; name: string } | null;
}

export interface UploadedPostImage {
  url: string;
  key: string;
  fileName: string;
  mimeType: string;
  size: number;
}

export interface PostPayload {
  title: string;
  body?: string | null;
  imageUrl?: string | null;
  imageKey?: string | null;
  videoUrl?: string | null;
  isPublic?: boolean;
  pinned?: boolean;
}

export const usePosts = () => {
  const config = useRuntimeConfig();
  const { access_token } = useAuth();
  const { $customFetch } = useNuxtApp() as unknown as {
    $customFetch: CustomFetch;
  };

  const authHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${access_token.value}`,
  });

  const authOnlyHeaders = () => ({
    Authorization: `Bearer ${access_token.value}`,
  });

  const listPosts = async (): Promise<ApiResponse<ChurchPost[]>> =>
    await $customFetch<ChurchPost[]>(
      `${config.public.URL_BACKEND}/api/church/posts`,
      { method: "GET", headers: authHeaders() },
    );

  const createPost = async (
    body: PostPayload,
  ): Promise<ApiResponse<ChurchPost>> =>
    await $customFetch<ChurchPost>(
      `${config.public.URL_BACKEND}/api/church/posts`,
      { method: "POST", headers: authHeaders(), body },
    );

  const updatePost = async (
    id: string,
    body: Partial<PostPayload>,
  ): Promise<ApiResponse<ChurchPost>> =>
    await $customFetch<ChurchPost>(
      `${config.public.URL_BACKEND}/api/church/posts/${id}`,
      { method: "PATCH", headers: authHeaders(), body },
    );

  const deletePost = async (
    id: string,
  ): Promise<ApiResponse<{ success: boolean }>> =>
    await $customFetch<{ success: boolean }>(
      `${config.public.URL_BACKEND}/api/church/posts/${id}`,
      { method: "DELETE", headers: authOnlyHeaders() },
    );

  const uploadImage = async (
    file: File,
  ): Promise<ApiResponse<UploadedPostImage>> => {
    const formData = new FormData();
    formData.append("file", file);
    return await $customFetch<UploadedPostImage>(
      `${config.public.URL_BACKEND}/api/church/uploads/image`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${access_token.value}` },
        body: formData,
      },
    );
  };

  return { listPosts, createPost, updatePost, deletePost, uploadImage };
};
