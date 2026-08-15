import { Prisma } from "@prisma/client";
import { DomainError } from "../../../domain/value-objects/utils/DomainError";

export type CurrentUser = Prisma.UserGetPayload<{
  include: {
    crunch: true;
  };
}> & {
  isPlatformAdmin: boolean;
  role: string;
  canManageMembers: boolean;
  roles: {
    id: string;
    name: string;
    scope: string;
    departmentId: string | null;
    permissions: string[];
  }[];
};

export type AuthPayload = {
  sub?: string;
  is_admin?: boolean;
  realm_access?: {
    roles?: string[];
  };
  resource_access?: Record<string, { roles?: string[] }>;
};

export type DepartmentWithStats = {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
  modules: string[];
  leaderId: string;
  leader: {
    id: string;
    name: string;
    email: string;
  };
  _count: {
    members: number;
    schedules: number;
    tasks: number;
  };
  mediaItems: {
    category: string;
  }[];
};

export type UploadedPdf = {
  url: string;
  key: string;
  fileName: string;
  mimeType: string;
  size: number;
};

export const PDF_MAX_SIZE_BYTES = 10 * 1024 * 1024;

export type CifraClubSongImport = {
  title: string;
  artist: string;
  key: string;
  bpm: string;
  songCategory: string;
  url: string;
  notes: string;
  lyrics: string;
  chords: string;
  keyboardChords: string;
  source: "cifraclub";
  youtubeUrl?: string;
};

export function throwDomainError(message: string): never {
  throw new DomainError(message);
}
