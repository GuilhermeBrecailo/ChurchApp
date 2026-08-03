import type { CustomFetch } from "../types/nuxt";
import type { ApiResponse } from "./useTypes";
import { useNuxtApp, useRuntimeConfig, useState } from "#app";

export type PublicAnnouncementKind = "ANNOUNCEMENT" | "PASTOR_MESSAGE" | "PRAYER";

export interface PublicChurchFeedItem {
  id: string;
  title: string;
  body: string;
  pinned?: boolean;
  publishedAt: string;
  expiresAt?: string | null;
  kind?: PublicAnnouncementKind;
  imageUrl?: string | null;
  videoUrl?: string | null;
}

export interface PublicChurch {
  id: string;
  name: string;
  logo?: string | null;
  accentColor?: string | null;
  isActive?: boolean;
  city?: string | null;
  state?: string | null;
  welcomeMessage?: string | null;
  feed?: PublicChurchFeedItem[];
  announcements?: PublicChurchFeedItem[];
}

export interface PublicChurchVerse {
  id: string;
  text: string;
  reference: string;
  commentary?: string | null;
  videoUrl?: string | null;
  imageUrl?: string | null;
  publishedAt: string;
  author?: { id: string; name: string } | null;
}

export interface PublicChurchDevotional {
  id: string;
  title: string;
  description?: string | null;
  videoUrl?: string | null;
  imageUrl?: string | null;
  publishedAt: string;
  author?: { id: string; name: string } | null;
  chapters?: {
    id: string;
    title: string;
    content: string;
    bibleRef?: string | null;
    order: number;
  }[];
}

export interface PublicChurchPost {
  id: string;
  title: string;
  body?: string | null;
  imageUrl?: string | null;
  videoUrl?: string | null;
  pinned?: boolean;
  publishedAt: string;
  author?: { id: string; name: string } | null;
}

export interface PublicChurchFooter {
  address?: {
    road?: string | null;
    number?: string | null;
    complement?: string | null;
    city?: string | null;
    state?: string | null;
    zipCode?: string | null;
  };
  contacts?: {
    phone?: string | null;
    whatsapp?: string | null;
    email?: string | null;
  };
  social?: Record<string, string>;
}

interface PublicChurchEnvelope {
  church: PublicChurch;
  serviceTimes?: PublicServiceTime[];
  upcomingServices?: { week?: PublicServiceOccurrence[]; month?: PublicServiceOccurrence[] };
  publicContent?: PublicChurchFeedItem[];
  publicVerses?: PublicChurchVerse[];
  publicDevotionals?: PublicChurchDevotional[];
  publicPosts?: PublicChurchPost[];
  footer?: PublicChurchFooter;
}

export interface PublicServiceTime {
  id: string;
  label: string;
  weekday: number;
  time: string;
  isActive?: boolean;
}

export interface PublicServiceOccurrence {
  id?: string;
  serviceTimeId?: string;
  label: string;
  weekday: number;
  time: string;
  startsAt?: string;
  date?: string;
}

export interface PublicServiceTimesResponse {
  serviceTimes?: PublicServiceTime[];
  times?: PublicServiceTime[];
  upcomingServices?: { week?: PublicServiceOccurrence[]; month?: PublicServiceOccurrence[] };
  week?: PublicServiceOccurrence[];
  month?: PublicServiceOccurrence[];
  occurrences?: PublicServiceOccurrence[];
}

export const useChurchLanding = () => {
  const config = useRuntimeConfig();
  const { $customFetch } = useNuxtApp() as unknown as {
    $customFetch: CustomFetch;
  };

  const church = useState<PublicChurch | null>("public-church", () => null);
  const serviceTimes = useState<PublicServiceTime[]>("public-service-times", () => []);
  const weekOccurrences = useState<PublicServiceOccurrence[]>(
    "public-service-week-occurrences",
    () => [],
  );
  const monthOccurrences = useState<PublicServiceOccurrence[]>(
    "public-service-month-occurrences",
    () => [],
  );
  const publicVerses = useState<PublicChurchVerse[]>("public-church-verses", () => []);
  const publicDevotionals = useState<PublicChurchDevotional[]>(
    "public-church-devotionals",
    () => [],
  );
  const posts = useState<PublicChurchPost[]>("public-church-posts", () => []);
  const footer = useState<PublicChurchFooter | null>("public-church-footer", () => null);
  const loading = useState<boolean>("public-church-loading", () => false);
  const error = useState<string | null>("public-church-error", () => null);

  const getPublicChurch = async (
    slug: string,
  ): Promise<ApiResponse<PublicChurchEnvelope>> => {
    return await $customFetch<PublicChurchEnvelope>(
      `${config.public.URL_BACKEND}/public/church/${encodeURIComponent(slug)}`,
      {
        method: "GET",
      },
    );
  };

  const getPublicServiceTimes = async (
    slug: string,
  ): Promise<ApiResponse<PublicServiceTimesResponse>> => {
    return await $customFetch<PublicServiceTimesResponse>(
      `${config.public.URL_BACKEND}/public/church/${encodeURIComponent(slug)}/service-times`,
      {
        method: "GET",
      },
    );
  };

  const loadLanding = async (slug: string) => {
    loading.value = true;
    error.value = null;
    church.value = null;
    serviceTimes.value = [];
    weekOccurrences.value = [];
    monthOccurrences.value = [];
    publicVerses.value = [];
    publicDevotionals.value = [];
    posts.value = [];
    footer.value = null;

    try {
      const [churchResponse, timesResponse] = await Promise.all([
        getPublicChurch(slug),
        getPublicServiceTimes(slug),
      ]);

      if (churchResponse.error || !churchResponse.data?.church) {
        error.value = churchResponse.error || "Igreja nao encontrada.";
        return;
      }

      church.value = {
        ...churchResponse.data.church,
        feed: churchResponse.data.publicContent ?? [],
      };
      publicVerses.value = churchResponse.data.publicVerses ?? [];
      publicDevotionals.value = churchResponse.data.publicDevotionals ?? [];
      posts.value = churchResponse.data.publicPosts ?? [];
      footer.value = churchResponse.data.footer ?? null;

      const payload = timesResponse.data;
      serviceTimes.value =
        payload?.serviceTimes ?? payload?.times ?? churchResponse.data.serviceTimes ?? [];
      weekOccurrences.value =
        payload?.upcomingServices?.week ??
        payload?.week ??
        churchResponse.data.upcomingServices?.week ??
        [];
      monthOccurrences.value =
        payload?.upcomingServices?.month ??
        payload?.month ??
        payload?.occurrences ??
        churchResponse.data.upcomingServices?.month ??
        [];
    } finally {
      loading.value = false;
    }
  };

  return {
    church,
    serviceTimes,
    weekOccurrences,
    monthOccurrences,
    publicVerses,
    publicDevotionals,
    posts,
    footer,
    loading,
    error,
    getPublicChurch,
    getPublicServiceTimes,
    loadLanding,
  };
};