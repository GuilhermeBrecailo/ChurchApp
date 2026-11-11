// Modelo de dados do modo demonstração. Espelha (de forma simplificada) as
// tabelas do Prisma em api/src/infrastructure/database/prisma/schema.prisma -
// os handlers montam as respostas no mesmo formato que os adapters da API.
//
// Datas ficam em string ISO (datetime) ou "YYYY-MM-DD" (só dia). O store
// desloca todas elas em semanas inteiras quando a demo é reaberta dias depois,
// então "próximo domingo" continua sendo o próximo domingo.

export type Id = string;

export interface DemoUser {
  id: Id;
  name: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  birthDate: string | null;
  mustChangePassword: boolean;
  profileSuggestion: string | null;
  unavailableDates: string[];
  navPreviewRole: "MEMBRO" | "LIDER" | "PASTOR" | null;
  /** papel da conta (User.role na API) - vale quando a pessoa ainda não tem igreja */
  globalRole?: "PASTOR" | "MEMBER";
  isPlatformAdmin?: boolean;
  createdAt: string;
}

export interface DemoChurch {
  id: Id;
  name: string;
  slug: string;
  city: string;
  road: string;
  number: string | null;
  localZipCode: string;
  state: string;
  complement: string | null;
  document: string | null;
  logo: string | null;
  accentColor: string | null;
  textColor: string | null;
  fontFamily: string | null;
  isActive: boolean;
  userMainId: Id | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  instagram: string | null;
  facebook: string | null;
  youtube: string | null;
  website: string | null;
  welcomeMessage: string | null;
  plan: "FREE" | "PRO" | "ILIMITADO";
  subscriptionStatus: "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELED";
  trialEndsAt: string | null;
  pastDueSince: string | null;
  inviteCode: string;
  createdAt: string;
}

export interface DemoMembership {
  id: Id;
  userId: Id;
  churchId: Id;
  role: "PASTOR" | "MEMBER" | "ADMIN";
  canManageMembers: boolean;
  isPrimary: boolean;
  /** false = pedido de entrada aguardando aprovação */
  isActive: boolean;
  roleIds: Id[];
  createdAt: string;
}

export interface DemoChurchRole {
  id: Id;
  churchId: Id;
  name: string;
  description: string | null;
  scope: "CHURCH" | "MINISTRY";
  departmentId: Id | null;
  permissions: string[];
}

export interface DemoServiceTime {
  id: Id;
  churchId: Id;
  label: string;
  weekday: number;
  time: string;
  isActive: boolean;
}

export interface DemoDepartment {
  id: Id;
  churchId: Id;
  name: string;
  type: string;
  isActive: boolean;
  modules: string[];
  scheduleConfig: unknown;
  leaderId: Id;
  createdAt: string;
}

export interface DemoDepartmentMember {
  id: Id;
  departmentId: Id;
  userId: Id;
  function: string | null;
  isPrimary: boolean;
}

export interface DemoMediaItem {
  id: Id;
  departmentId: Id;
  title: string;
  url: string;
  /** MUSIC (repertório), RESOURCE/links, ACTIVITY (material do infantil)... */
  category: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface DemoTask {
  id: Id;
  departmentId: Id;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  assigneeId: Id | null;
  createdAt: string;
}

export interface DemoSchedule {
  id: Id;
  departmentId: Id;
  date: string;
  description: string;
  arrivalAt: string | null;
  rehearsalAt: string | null;
  rehearsalNotes: string | null;
  isCommunionService: boolean;
  serviceOccurrenceId: Id | null;
  createdAt: string;
}

export interface DemoAssignment {
  id: Id;
  scheduleId: Id;
  userId: Id;
  role: string;
  viewedAt: string | null;
  confirmationStatus: string;
  confirmedAt: string | null;
  declineReason: string | null;
  attendanceStatus: string;
  attendedAt: string | null;
}

export interface DemoScheduleMedia {
  id: Id;
  scheduleId: Id;
  mediaItemId: Id;
  order: number;
  observation: string | null;
  startedByUserId: Id | null;
}

export interface DemoChecklistItem {
  id: Id;
  scheduleId: Id;
  title: string;
  assigneeId: Id | null;
  dueAt: string | null;
  isComplete: boolean;
  completedAt: string | null;
  isApplicable: boolean;
  templateKey: string | null;
  order: number;
}

export interface DemoOccurrence {
  id: Id;
  churchId: Id;
  serviceTimeId: Id | null;
  /** YYYY-MM-DD */
  date: string;
  title: string | null;
  time: string | null;
  description: string | null;
  imageUrl: string | null;
  imageKey: string | null;
}

export interface DemoOccurrenceAttendee {
  id: Id;
  occurrenceId: Id;
  rosterMemberId: Id;
  markedAt: string;
}

export interface DemoRosterMember {
  id: Id;
  churchId: Id;
  name: string;
  email: string | null;
  phone: string | null;
  birthDate: string | null;
  notes: string | null;
  status: "VISITOR" | "MEMBER" | "FORMER";
  joinedAt: string | null;
  leftAt: string | null;
  createdAt: string;
  userId: Id | null;
  contactConsent: boolean;
}

export interface DemoFollowUpActivity {
  id: Id;
  action: string;
  note: string | null;
  stage: string | null;
  createdAt: string;
  actorId: Id | null;
}

export interface DemoVisitorFollowUp {
  id: Id;
  churchId: Id;
  rosterMemberId: Id;
  stage: "NEW" | "CONTACTED" | "RETURNED" | "INTEGRATED" | "CLOSED";
  consentToContact: boolean;
  nextContactAt: string | null;
  lastContactAt: string | null;
  responsibleId: Id | null;
  activities: DemoFollowUpActivity[];
}

export interface DemoPastoralVisit {
  id: Id;
  churchId: Id;
  rosterMemberId: Id;
  reason: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: "OPEN" | "SCHEDULED" | "DONE" | "CANCELED";
  scheduledAt: string | null;
  completedAt: string | null;
  notes: string | null;
  responsibleId: Id | null;
  createdAt: string;
}

export interface DemoChildProfile {
  id: Id;
  departmentId: Id;
  rosterMemberId: Id;
  groupName: string | null;
  isActive: boolean;
  guardianRosterIds: Id[];
  createdAt: string;
}

export interface DemoChildSession {
  id: Id;
  departmentId: Id;
  date: string;
  groupName: string | null;
  createdAt: string;
  attendances: { id: Id; childProfileId: Id; status: "PENDING" | "PRESENT" | "ABSENT" }[];
}

export interface DemoAnnouncement {
  id: Id;
  churchId: Id;
  title: string;
  body: string;
  pinned: boolean;
  publishedAt: string;
  expiresAt: string | null;
  isPublic: boolean;
  kind: "ANNOUNCEMENT" | "PASTOR_MESSAGE" | "PRAYER";
  imageUrl: string | null;
  imageKey: string | null;
  videoUrl: string | null;
}

export interface DemoDailyVerse {
  id: Id;
  churchId: Id;
  text: string;
  reference: string;
  commentary: string | null;
  videoUrl: string | null;
  imageUrl: string | null;
  imageKey: string | null;
  isPublic: boolean;
  publishedAt: string;
  authorId: Id | null;
}

export interface DemoDevotional {
  id: Id;
  churchId: Id;
  title: string;
  description: string | null;
  videoUrl: string | null;
  imageUrl: string | null;
  imageKey: string | null;
  isPublic: boolean;
  publishedAt: string;
  authorId: Id | null;
  chapters: { id: Id; title: string; content: string; bibleRef: string | null; order: number }[];
}

export interface DemoDevotionalProgress {
  id: Id;
  userId: Id;
  devotionalId: Id;
  lastChapterId: Id;
  updatedAt: string;
}

export interface DemoDevotionalComment {
  id: Id;
  devotionalId: Id;
  authorId: Id;
  body: string;
  createdAt: string;
}

export interface DemoPost {
  id: Id;
  churchId: Id;
  title: string;
  body: string | null;
  imageUrl: string | null;
  imageKey: string | null;
  videoUrl: string | null;
  isPublic: boolean;
  pinned: boolean;
  publishedAt: string;
  authorId: Id | null;
}

export interface DemoPrayerRequest {
  id: Id;
  churchId: Id;
  userId: Id;
  title: string;
  body: string;
  isAnonymous: boolean;
  isAnswered: boolean;
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason: string | null;
  createdAt: string;
}

export interface DemoNotification {
  id: Id;
  userId: Id;
  title: string;
  body: string;
  url: string | null;
  type: string | null;
  scheduleId: Id | null;
  readAt: string | null;
  createdAt: string;
}

export interface DemoBibleNote {
  id: Id;
  userId: Id;
  bookAbbrev: string;
  chapter: number;
  content: string;
  updatedAt: string;
}

export interface DemoSongPreference {
  id: Id;
  userId: Id;
  mediaItemId: Id;
  personalKey: string | null;
  chords: string | null;
  notes: string | null;
  updatedAt: string;
}

export interface DemoMessageTemplate {
  id: Id;
  churchId: Id;
  name: string;
  body: string;
  suggestionKey: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DemoMessageRule {
  id: Id;
  churchId: Id;
  audience: string;
  offsetMinutes: number;
  isActive: boolean;
  lastFiredAt: string | null;
  serviceTimeId: Id;
  templateId: Id;
}

export interface DemoMessageLog {
  id: Id;
  churchId: Id;
  audience: string;
  status: "PROCESSING" | "DONE";
  totalCount: number;
  successCount: number;
  failedCount: number;
  createdAt: string;
  finishedAt: string | null;
  ruleId: Id | null;
  templateId: Id | null;
}

export interface DemoBirthdaySetting {
  id: Id | null;
  crunchId: Id;
  isActive: boolean;
  templateId: Id | null;
  lastNotifiedAt: string | null;
  notifyTime: string;
}

export interface DemoServiceAttendance {
  id: Id;
  churchId: Id;
  serviceTimeId: Id;
  date: string;
  visitorCount: number;
  memberCount: number;
  notes: string | null;
  endedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DemoDB {
  meta: {
    version: number;
    world: string;
    /** dia (YYYY-MM-DD) em que as datas relativas foram calculadas */
    seedDay: string;
    whatsappConnected: boolean;
    holyricsConnected: boolean;
  };
  users: DemoUser[];
  churches: DemoChurch[];
  memberships: DemoMembership[];
  churchRoles: DemoChurchRole[];
  serviceTimes: DemoServiceTime[];
  departments: DemoDepartment[];
  departmentMembers: DemoDepartmentMember[];
  mediaItems: DemoMediaItem[];
  tasks: DemoTask[];
  schedules: DemoSchedule[];
  assignments: DemoAssignment[];
  scheduleMedia: DemoScheduleMedia[];
  checklistItems: DemoChecklistItem[];
  occurrences: DemoOccurrence[];
  occurrenceAttendees: DemoOccurrenceAttendee[];
  roster: DemoRosterMember[];
  followUps: DemoVisitorFollowUp[];
  visits: DemoPastoralVisit[];
  children: DemoChildProfile[];
  childSessions: DemoChildSession[];
  announcements: DemoAnnouncement[];
  dailyVerses: DemoDailyVerse[];
  devotionals: DemoDevotional[];
  devotionalProgress: DemoDevotionalProgress[];
  devotionalComments: DemoDevotionalComment[];
  posts: DemoPost[];
  prayerRequests: DemoPrayerRequest[];
  notifications: DemoNotification[];
  bibleNotes: DemoBibleNote[];
  songPreferences: DemoSongPreference[];
  messageTemplates: DemoMessageTemplate[];
  messageRules: DemoMessageRule[];
  messageLogs: DemoMessageLog[];
  birthdaySettings: DemoBirthdaySetting[];
  serviceAttendance: DemoServiceAttendance[];
  /** Espaço livre para handlers novos guardarem estado sem mexer no tipo. */
  extra: Record<string, unknown>;
}
