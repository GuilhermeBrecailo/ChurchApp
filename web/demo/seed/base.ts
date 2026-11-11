import type { DemoChurch, DemoDB, DemoUser } from "../types";
import { addDays, startOfDay, ymd } from "./dates";

export const DB_VERSION = 1;

export function emptyDb(world: string, now: Date): DemoDB {
  return {
    meta: {
      version: DB_VERSION,
      world,
      seedDay: ymd(now),
      whatsappConnected: false,
      holyricsConnected: false,
    },
    users: [],
    churches: [],
    memberships: [],
    churchRoles: [],
    serviceTimes: [],
    departments: [],
    departmentMembers: [],
    mediaItems: [],
    tasks: [],
    schedules: [],
    assignments: [],
    scheduleMedia: [],
    checklistItems: [],
    occurrences: [],
    occurrenceAttendees: [],
    roster: [],
    followUps: [],
    visits: [],
    children: [],
    childSessions: [],
    announcements: [],
    dailyVerses: [],
    devotionals: [],
    devotionalProgress: [],
    devotionalComments: [],
    posts: [],
    prayerRequests: [],
    notifications: [],
    bibleNotes: [],
    songPreferences: [],
    messageTemplates: [],
    messageRules: [],
    messageLogs: [],
    birthdaySettings: [],
    serviceAttendance: [],
    extra: {},
  };
}

export function makeUser(partial: Partial<DemoUser> & Pick<DemoUser, "id" | "name" | "email">, now: Date): DemoUser {
  return {
    phone: null,
    avatarUrl: null,
    birthDate: null,
    mustChangePassword: false,
    profileSuggestion: null,
    unavailableDates: [],
    navPreviewRole: null,
    createdAt: addDays(startOfDay(now), -30).toISOString(),
    ...partial,
  };
}

export function makeChurch(partial: Partial<DemoChurch> & Pick<DemoChurch, "id" | "name" | "slug">, now: Date): DemoChurch {
  return {
    city: "",
    road: "",
    number: null,
    localZipCode: "",
    state: "",
    complement: null,
    document: null,
    logo: null,
    accentColor: "#B5472A",
    textColor: null,
    fontFamily: "EDITORIAL",
    isActive: true,
    userMainId: null,
    phone: null,
    whatsapp: null,
    email: null,
    instagram: null,
    facebook: null,
    youtube: null,
    website: null,
    welcomeMessage: null,
    plan: "PRO",
    subscriptionStatus: "TRIALING",
    trialEndsAt: addDays(startOfDay(now), 90).toISOString(),
    pastDueSince: null,
    inviteCode: "ABC123",
    createdAt: now.toISOString(),
    ...partial,
  };
}

/** Data de nascimento "YYYY-MM-DDT12:00:00.000Z" (meio-dia evita virar o dia no fuso). */
export function birthDateFrom(
  birth: { year: number; offsetDays?: number; monthDay?: string } | undefined,
  now: Date,
): string | null {
  if (!birth) return null;
  let monthDay = birth.monthDay;
  if (!monthDay) {
    const target = addDays(startOfDay(now), birth.offsetDays ?? 0);
    monthDay = ymd(target).slice(5);
  }
  return `${birth.year}-${monthDay}T12:00:00.000Z`;
}
