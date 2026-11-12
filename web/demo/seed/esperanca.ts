// Mundo "esperanca": a Igreja Batista Esperança, configurada e cheia de dados.
// Usado pelas personas Pastor, Líder, Membro e Membro aguardando aprovação -
// todas enxergam (e alteram) a mesma igreja.

import { getDepartmentSchedulePreset } from "../../app/utils/departmentScheduleConfig";
import type {
  DemoAssignment,
  DemoDB,
  DemoSchedule,
} from "../types";
import { birthDateFrom, emptyDb, makeChurch, makeUser } from "./base";
import {
  ANNOUNCEMENTS,
  DAILY_VERSES,
  DEVOTIONALS,
  MESSAGE_TEMPLATES,
  POSTS,
  PRAYERS,
} from "./content";
import {
  addDays,
  at,
  createRandom,
  daysAgo,
  daysFromNow,
  isoAt,
  nextWeekday,
  previousWeekday,
  startOfDay,
  ymd,
} from "./dates";
import { CHILDREN, PEOPLE, ROSTER_ONLY, rosterIdForUser } from "./people";
import { SEED_SONGS } from "./songs";

export const ESPERANCA_CHURCH_ID = "c-esperanca";

const DEPARTMENTS = [
  { id: "d-louvor", name: "Louvor", type: "WORSHIP", leaderId: "u-ana", modules: ["SCHEDULES", "TASKS", "RESOURCES", "SONGS"] },
  { id: "d-recepcao", name: "Recepção", type: "RECEPTION", leaderId: "u-pedro", modules: ["SCHEDULES", "TASKS", "RESOURCES"] },
  { id: "d-infantil", name: "Infantil", type: "KIDS", leaderId: "u-sandra", modules: ["SCHEDULES", "TASKS", "RESOURCES", "CLASSES"] },
  { id: "d-midia", name: "Mídia", type: "MEDIA", leaderId: "u-thiago", modules: ["SCHEDULES", "TASKS", "RESOURCES"] },
  { id: "d-diaconato", name: "Diaconato", type: "DEACONATE", leaderId: "u-joao", modules: ["SCHEDULES", "TASKS", "RESOURCES"] },
] as const;

const DEPARTMENT_MEMBERS: Record<string, [string, string][]> = {
  "d-louvor": [["u-ana", "Ministro"], ["u-lucas", "Violão"], ["u-gabriel", "Bateria"], ["u-beatriz", "Cantor(a)"], ["u-rafael", "Teclado"], ["u-camila", "Cantor(a)"], ["u-daniel", "Baixo"]],
  "d-recepcao": [["u-pedro", "Recepção"], ["u-mariana", "Recepção"], ["u-aline", "Recepção"], ["u-daniel", "Recepção"], ["u-helena", "Recepção"]],
  "d-infantil": [["u-sandra", "Professor(a)"], ["u-fernanda", "Professor(a)"], ["u-aline", "Auxiliar"]],
  "d-midia": [["u-thiago", "Mídia"], ["u-larissa", "Mesa de som"], ["u-vinicius", "Luzes"]],
  "d-diaconato": [["u-joao", "Dízimo"], ["u-roberto", "Apoio"], ["u-daniel", "Recepção"], ["u-patricia", "Apoio"]],
};

const MINISTER_PERMISSIONS = [
  "SONG_CREATE", "SONG_EDIT", "SONG_DELETE",
  "SCHEDULE_CREATE", "SCHEDULE_EDIT", "SCHEDULE_DELETE",
  "MINISTRY_MEMBER_MANAGE", "MINISTRY_NOTIFY", "MINISTRY_MANAGE",
];

// Cargos com os nomes de ROLE_PRESETS (web/composables/usePermissions.ts)
const CHURCH_ROLES = [
  { id: "cr-ministro-louvor", name: "Ministro", description: "Lidera o louvor e monta as escalas", scope: "MINISTRY" as const, departmentId: "d-louvor", permissions: MINISTER_PERMISSIONS, holders: ["u-ana"] },
  { id: "cr-repertorio-louvor", name: "Editor de repertório", description: null, scope: "MINISTRY" as const, departmentId: "d-louvor", permissions: ["SONG_CREATE", "SONG_EDIT"], holders: ["u-rafael"] },
  { id: "cr-escala-midia", name: "Responsável por escala", description: null, scope: "MINISTRY" as const, departmentId: "d-midia", permissions: ["SCHEDULE_CREATE", "SCHEDULE_EDIT", "SCHEDULE_DELETE"], holders: ["u-larissa"] },
  { id: "cr-secretaria", name: "Secretária", description: "Cadastro e atualização de membros", scope: "CHURCH" as const, departmentId: null, permissions: ["MEMBER_CREATE", "MEMBER_EDIT", "MEMBER_DELETE"], holders: ["u-helena"] },
  { id: "cr-comunicacao", name: "Comunicação", description: "Avisos, versículo do dia e devocionais", scope: "CHURCH" as const, departmentId: null, permissions: ["CONTENT_PUBLISH", "ANNOUNCEMENT_PUBLISH"], holders: ["u-daniel"] },
  { id: "cr-cultos", name: "Gestor de cultos", description: null, scope: "CHURCH" as const, departmentId: null, permissions: ["CULT_CREATE", "CULT_EDIT", "CULT_DELETE", "CULT_ATTENDANCE_MANAGE"], holders: ["u-joao"] },
  { id: "cr-cuidado", name: "Cuidado pastoral", description: "Acompanha visitantes e visitas", scope: "CHURCH" as const, departmentId: null, permissions: ["PASTORAL_CARE_MANAGE"], holders: ["u-helena"] },
  { id: "cr-oracao", name: "Equipe de oração", description: null, scope: "CHURCH" as const, departmentId: null, permissions: ["PRAYER_MANAGE"], holders: ["u-patricia"] },
];

const SERVICES = [
  { id: "st-dom-manha", label: "Culto da Família", weekday: 0, time: "10:00", departments: ["d-louvor", "d-recepcao", "d-infantil", "d-midia", "d-diaconato"] },
  { id: "st-dom-noite", label: "Culto da Noite", weekday: 0, time: "19:00", departments: ["d-louvor", "d-recepcao", "d-midia"] },
  { id: "st-quarta", label: "Culto de Oração e Palavra", weekday: 3, time: "19:30", departments: ["d-louvor", "d-recepcao"] },
];

// Quem serve em cada função (rodízio por semana)
const ROTATION: Record<string, Record<string, string[][]>> = {
  "d-louvor": {
    "st-dom-manha": [["Ministro", "u-ana"], ["Cantor(a)", "u-camila"], ["Violão", "u-lucas"], ["Teclado", "u-rafael"], ["Bateria", "u-gabriel"], ["Baixo", "u-daniel"]],
    "st-dom-noite": [["Ministro", "u-beatriz"], ["Cantor(a)", "u-camila"], ["Violão", "u-ana"], ["Teclado", "u-rafael"], ["Bateria", "u-gabriel"]],
    "st-quarta": [["Ministro", "u-ana"], ["Violão", "u-lucas"], ["Teclado", "u-rafael"]],
  },
  "d-recepcao": {
    "st-dom-manha": [["Recepção", "u-pedro"], ["Recepção", "u-mariana"], ["Recepção", "u-aline"]],
    "st-dom-noite": [["Recepção", "u-helena"], ["Recepção", "u-daniel"]],
    "st-quarta": [["Recepção", "u-mariana"]],
  },
  "d-infantil": {
    "st-dom-manha": [["Professor(a)", "u-sandra"], ["Professor(a)", "u-fernanda"], ["Auxiliar", "u-aline"]],
  },
  "d-midia": {
    "st-dom-manha": [["Mídia", "u-thiago"], ["Mesa de som", "u-larissa"], ["Luzes", "u-vinicius"]],
    "st-dom-noite": [["Mídia", "u-vinicius"], ["Mesa de som", "u-thiago"]],
  },
  "d-diaconato": {
    "st-dom-manha": [["Dízimo", "u-joao"], ["Recepção", "u-patricia"], ["Apoio", "u-roberto"]],
  },
};

const SONG_ROTATION = [
  ["luz", "esperanca-viva", "graca", "santo"],
  ["rio", "castelo", "firme", "mais-perto"],
  ["esperanca-viva", "graca", "luz", "firme"],
  ["santo", "rio", "mais-perto", "castelo"],
];

export function seedEsperanca(now: Date): DemoDB {
  const db = emptyDb("esperanca", now);
  const today = startOfDay(now);
  const rand = createRandom(20261111);
  const pick = <T>(items: T[]) => items[Math.floor(rand() * items.length)]!;
  let counter = 0;
  const nextId = (prefix: string) => `${prefix}-${(++counter).toString(36)}`;

  // ---- igreja ---------------------------------------------------------
  db.churches.push(
    makeChurch(
      {
        id: ESPERANCA_CHURCH_ID,
        name: "Igreja Batista Esperança",
        slug: "esperanca",
        city: "Curitiba",
        state: "PR",
        road: "Rua Mateus Leme",
        number: "2140",
        complement: "Templo",
        localZipCode: "80530-010",
        document: "12.345.678/0001-90",
        accentColor: "#B5472A",
        userMainId: "u-pastor",
        phone: "(41) 3254-8800",
        whatsapp: "(41) 99812-3400",
        email: "contato@esperanca.org.br",
        instagram: "@ibesperancacwb",
        youtube: "https://youtube.com/@ibesperancacwb",
        website: "https://esperanca.org.br",
        welcomeMessage: "Uma família para pertencer, servir e crescer em Cristo.",
        plan: "PRO",
        subscriptionStatus: "TRIALING",
        trialEndsAt: addDays(today, 23).toISOString(),
        inviteCode: "ESPE26",
        createdAt: addDays(today, -67).toISOString(),
      },
      now,
    ),
  );

  // ---- pessoas --------------------------------------------------------
  for (const person of PEOPLE) {
    db.users.push(
      makeUser(
        {
          id: person.id,
          name: person.name,
          email: person.email,
          phone: person.phone,
          birthDate: birthDateFrom(person.birth, now),
          createdAt: daysAgo(now, person.joinedDaysAgo),
          profileSuggestion: null,
          globalRole: person.churchRole === "PASTOR" ? "PASTOR" : "MEMBER",
        },
        now,
      ),
    );
    db.memberships.push({
      id: `m-${person.id}`,
      userId: person.id,
      churchId: ESPERANCA_CHURCH_ID,
      role: person.churchRole ?? "MEMBER",
      canManageMembers: person.canManageMembers ?? false,
      isPrimary: true,
      isActive: !person.pending,
      roleIds: CHURCH_ROLES.filter((role) => role.holders.includes(person.id)).map((role) => role.id),
      createdAt: person.pending ? daysAgo(now, person.joinedDaysAgo, "20:15") : daysAgo(now, person.joinedDaysAgo),
    });
    if (!person.pending) {
      db.roster.push({
        id: rosterIdForUser(person.id),
        churchId: ESPERANCA_CHURCH_ID,
        name: person.name,
        email: person.email,
        phone: person.phone,
        birthDate: birthDateFrom(person.birth, now),
        notes: null,
        status: "MEMBER",
        joinedAt: daysAgo(now, person.joinedDaysAgo),
        leftAt: null,
        createdAt: daysAgo(now, person.joinedDaysAgo),
        userId: person.id,
        contactConsent: true,
      });
    }
  }
  // Lucas já marcou datas em que não pode servir
  const lucas = db.users.find((user) => user.id === "u-lucas")!;
  lucas.unavailableDates = [ymd(nextWeekday(now, 0, 3)), ymd(nextWeekday(now, 3, 2))];
  lucas.profileSuggestion = "Toco violão e um pouco de guitarra.";

  for (const person of ROSTER_ONLY) {
    db.roster.push({
      id: person.id,
      churchId: ESPERANCA_CHURCH_ID,
      name: person.name,
      email: person.email ?? null,
      phone: person.phone,
      birthDate: birthDateFrom(person.birth, now),
      notes: person.notes ?? null,
      status: person.status,
      joinedAt: person.status === "VISITOR" ? null : daysAgo(now, person.createdDaysAgo),
      leftAt: person.status === "FORMER" ? daysAgo(now, 120) : null,
      createdAt: daysAgo(now, person.createdDaysAgo, "11:40"),
      userId: null,
      contactConsent: person.status !== "FORMER",
    });
  }

  // ---- cargos ---------------------------------------------------------
  for (const role of CHURCH_ROLES) {
    db.churchRoles.push({
      id: role.id,
      churchId: ESPERANCA_CHURCH_ID,
      name: role.name,
      description: role.description,
      scope: role.scope,
      departmentId: role.departmentId,
      permissions: [...role.permissions],
    });
  }

  // ---- horários de culto ---------------------------------------------
  for (const service of SERVICES) {
    db.serviceTimes.push({
      id: service.id,
      churchId: ESPERANCA_CHURCH_ID,
      label: service.label,
      weekday: service.weekday,
      time: service.time,
      isActive: true,
    });
  }

  // ---- ministérios ----------------------------------------------------
  for (const department of DEPARTMENTS) {
    db.departments.push({
      id: department.id,
      churchId: ESPERANCA_CHURCH_ID,
      name: department.name,
      type: department.type,
      isActive: true,
      modules: [...department.modules],
      scheduleConfig: getDepartmentSchedulePreset(department.type),
      leaderId: department.leaderId,
      createdAt: daysAgo(now, 60),
    });
    for (const [userId, fn] of DEPARTMENT_MEMBERS[department.id] ?? []) {
      db.departmentMembers.push({
        id: `dm-${department.id}-${userId}`,
        departmentId: department.id,
        userId,
        function: fn,
        isPrimary: !db.departmentMembers.some((member) => member.userId === userId),
      });
    }
  }

  // ---- repertório e recursos -----------------------------------------
  for (const song of SEED_SONGS) {
    db.mediaItems.push({
      id: `song-${song.key}`,
      departmentId: "d-louvor",
      title: song.title,
      url: song.mediaLink ?? "",
      category: "MUSIC",
      metadata: {
        artist: song.artist,
        key: song.songKey,
        bpm: song.bpm,
        songCategory: song.songCategory,
        notes: song.notes ?? "",
        lyrics: song.lyrics,
        chords: song.chords,
        mediaLink: song.mediaLink ?? "",
      },
      createdAt: daysAgo(now, 50),
    });
  }
  const resources = [
    { id: "res-louvor-ensaio", departmentId: "d-louvor", title: "Roteiro de ensaio", url: "https://docs.google.com/document/d/demo-ensaio", category: "Ensaio", notes: "Passagem de som 30 min antes. Cifras sempre no app." },
    { id: "res-louvor-playlist", departmentId: "d-louvor", title: "Playlist de referência (Spotify)", url: "https://open.spotify.com/playlist/demo", category: "Referência", notes: null },
    { id: "res-midia-transmissao", departmentId: "d-midia", title: "Checklist da transmissão ao vivo", url: "https://docs.google.com/document/d/demo-live", category: "Procedimento", notes: "Ligar a mesa, testar o áudio do YouTube, conferir os slides." },
    { id: "res-midia-slides", departmentId: "d-midia", title: "Modelo de slides 2026", url: "https://canva.com/design/demo", category: "Modelos", notes: null },
    { id: "res-diaconato-ceia", departmentId: "d-diaconato", title: "Como preparar a Santa Ceia", url: "https://docs.google.com/document/d/demo-ceia", category: "Procedimento", notes: "Pão sem fermento e suco de uva integral. Bandejas no armário da sala 3." },
    { id: "res-recepcao-guia", departmentId: "d-recepcao", title: "Guia de boas-vindas ao visitante", url: "https://docs.google.com/document/d/demo-recepcao", category: "Procedimento", notes: null },
  ];
  for (const resource of resources) {
    db.mediaItems.push({
      id: resource.id,
      departmentId: resource.departmentId,
      title: resource.title,
      url: resource.url,
      category: resource.category,
      metadata: resource.notes ? { notes: resource.notes } : {},
      createdAt: daysAgo(now, 40),
    });
  }
  // Materiais do infantil (PDF de atividade)
  for (const [index, title] of ["Atividade: A arca de Noé", "Atividade: Davi e Golias", "Atividade: O bom samaritano"].entries()) {
    db.mediaItems.push({
      id: `act-${index + 1}`,
      departmentId: "d-infantil",
      title,
      url: "",
      category: "ACTIVITY",
      metadata: {
        notes: index === 0 ? "Imprimir 15 cópias para o maternal." : null,
        pdf: { url: "demo://atividade.pdf", key: `demo/act-${index + 1}.pdf`, fileName: `${title.replace(/[^a-zA-Z]+/g, "-").toLowerCase()}.pdf`, mimeType: "application/pdf", size: 184320 },
      },
      createdAt: daysAgo(now, 20 - index * 5),
    });
  }

  // ---- tarefas --------------------------------------------------------
  const tasks = [
    { departmentId: "d-louvor", title: "Trocar as cordas do violão da igreja", status: "TODO", priority: "MEDIUM", due: 3, assigneeId: "u-lucas" },
    { departmentId: "d-louvor", title: "Montar repertório do Natal", status: "IN_PROGRESS", priority: "HIGH", due: 10, assigneeId: "u-ana", description: "Cantata no dia 20/12 com o coral infantil." },
    { departmentId: "d-louvor", title: "Revisar cifras de Esperança Viva", status: "DONE", priority: "LOW", due: -2, assigneeId: "u-rafael" },
    { departmentId: "d-midia", title: "Comprar cabo HDMI de 10 m", status: "TODO", priority: "HIGH", due: 2, assigneeId: "u-thiago" },
    { departmentId: "d-midia", title: "Atualizar vinheta de abertura", status: "IN_PROGRESS", priority: "MEDIUM", due: 7, assigneeId: "u-vinicius" },
    { departmentId: "d-diaconato", title: "Repor copinhos da Ceia", status: "TODO", priority: "HIGH", due: 3, assigneeId: "u-roberto" },
    { departmentId: "d-recepcao", title: "Imprimir novos cartões de visitante", status: "TODO", priority: "MEDIUM", due: 4, assigneeId: "u-mariana" },
    { departmentId: "d-infantil", title: "Organizar a sala do maternal", status: "DONE", priority: "LOW", due: -5, assigneeId: "u-fernanda" },
  ];
  for (const task of tasks) {
    db.tasks.push({
      id: nextId("task"),
      departmentId: task.departmentId,
      title: task.title,
      description: task.description ?? null,
      status: task.status,
      priority: task.priority,
      dueDate: daysFromNow(now, task.due, "12:00"),
      assigneeId: task.assigneeId,
      createdAt: daysAgo(now, 8),
    });
  }

  // ---- cultos e escalas -----------------------------------------------
  const nextSundayKey = ymd(nextWeekday(now, 0, 0));
  const communionSundays = new Set([ymd(nextWeekday(now, 0, 0)), ymd(previousWeekday(now, 0, 2))]);
  let louvorIndex = 0;

  for (let week = -3; week <= 2; week += 1) {
    for (const service of SERVICES) {
      const day = week >= 0 ? nextWeekday(now, service.weekday, week) : previousWeekday(now, service.weekday, -week - 1);
      const dayKey = ymd(day);
      const startsAt = at(day, service.time);
      const isPast = startsAt.getTime() < now.getTime();
      const occurrenceId = `oc-${service.id}-${dayKey}`;
      db.occurrences.push({
        id: occurrenceId,
        churchId: ESPERANCA_CHURCH_ID,
        serviceTimeId: service.id,
        date: dayKey,
        title: null,
        time: null,
        description: null,
        imageUrl: null,
        imageKey: null,
      });

      for (const departmentId of service.departments) {
        const isCommunion = departmentId === "d-diaconato" && communionSundays.has(dayKey);
        const scheduleId = `sc-${departmentId.slice(2)}-${service.id.slice(3)}-${dayKey}`;
        const arrivalOffset = departmentId === "d-louvor" ? 90 : 45;
        const arrival = new Date(startsAt.getTime() - arrivalOffset * 60 * 1000);
        const schedule: DemoSchedule = {
          id: scheduleId,
          departmentId,
          date: startsAt.toISOString(),
          description: isCommunion ? `${service.label} · Santa Ceia` : service.label,
          arrivalAt: departmentId === "d-louvor" ? null : arrival.toISOString(),
          rehearsalAt:
            departmentId === "d-louvor" && service.weekday === 0
              ? isoAt(addDays(day, -1), "16:00")
              : departmentId === "d-louvor"
                ? isoAt(day, "18:30")
                : null,
          rehearsalNotes:
            departmentId === "d-louvor" && service.weekday === 0
              ? "Ensaio no templo. Chegar 10 min antes para passar o som."
              : null,
          isCommunionService: isCommunion,
          serviceOccurrenceId: occurrenceId,
          createdAt: isoAt(addDays(day, -10), "21:00"),
        };
        db.schedules.push(schedule);

        // Equipe
        const team = ROTATION[departmentId]?.[service.id] ?? [];
        team.forEach(([role, userId], index) => {
          let personId = userId!;
          // rodízio leve para não ser sempre a mesma pessoa
          if (departmentId === "d-louvor" && role === "Ministro" && week % 2 !== 0) {
            personId = personId === "u-ana" ? "u-beatriz" : "u-ana";
          }
          if (departmentId === "d-louvor" && role === "Violão" && service.id === "st-dom-manha" && (week === 1)) {
            personId = "u-ana";
          }
          if (departmentId === "d-midia" && role === "Mídia" && week % 2 === 0 && service.id === "st-dom-manha") {
            personId = "u-vinicius";
          }
          if (departmentId === "d-midia" && role === "Luzes" && week % 2 === 0 && service.id === "st-dom-manha") {
            personId = "u-thiago";
          }
          if (departmentId === "d-recepcao" && service.id === "st-dom-manha" && index === 2 && week % 2 !== 0) {
            personId = "u-daniel";
          }
          if (departmentId === "d-diaconato" && role === "Dízimo" && week % 2 !== 0) {
            personId = "u-roberto";
          }
          if (departmentId === "d-diaconato" && role === "Apoio" && week % 2 !== 0) {
            personId = "u-joao";
          }
          if (db.assignments.some((item) => item.scheduleId === scheduleId && item.userId === personId)) return;

          const assignment: DemoAssignment = {
            id: `as-${scheduleId}-${index}`,
            scheduleId,
            userId: personId,
            role: role!,
            viewedAt: null,
            confirmationStatus: "PENDING",
            confirmedAt: null,
            declineReason: null,
            attendanceStatus: "PENDING",
            attendedAt: null,
          };
          const created = new Date(schedule.createdAt).getTime();
          const viewed = new Date(created + (2 + index) * 3600 * 1000).toISOString();

          if (isPast) {
            const roll = rand();
            if (roll < 0.08) {
              assignment.confirmationStatus = "DECLINED";
              assignment.declineReason = pick(["Plantão no hospital", "Estava doente", "Viagem em família"]);
              assignment.viewedAt = viewed;
            } else {
              assignment.confirmationStatus = "CONFIRMED";
              assignment.confirmedAt = viewed;
              assignment.viewedAt = viewed;
              assignment.attendanceStatus = roll > 0.93 ? "ABSENT" : "PRESENT";
              assignment.attendedAt = assignment.attendanceStatus === "PRESENT" ? startsAt.toISOString() : null;
            }
          } else if (dayKey === nextSundayKey && service.id === "st-dom-manha" && departmentId === "d-louvor") {
            // A escala que a demo usa para mostrar cada status
            const byUser: Record<string, Partial<DemoAssignment>> = {
              "u-ana": { confirmationStatus: "CONFIRMED", confirmedAt: viewed, viewedAt: viewed },
              "u-beatriz": { confirmationStatus: "CONFIRMED", confirmedAt: viewed, viewedAt: viewed },
              "u-camila": { confirmationStatus: "MAYBE", viewedAt: viewed },
              "u-lucas": { confirmationStatus: "PENDING", viewedAt: null },
              "u-rafael": { confirmationStatus: "CONFIRMED", confirmedAt: viewed, viewedAt: viewed },
              "u-gabriel": { confirmationStatus: "SWAP_REQUESTED", viewedAt: viewed },
              "u-daniel": { confirmationStatus: "DECLINED", declineReason: "Viagem a trabalho para São Paulo", viewedAt: viewed },
            };
            Object.assign(assignment, byUser[personId] ?? {});
          } else if (week === 0) {
            const roll = rand();
            if (personId === "u-lucas") {
              // Lucas só tem pendente a do domingo (o resto ele já confirmou)
              Object.assign(assignment, { confirmationStatus: "CONFIRMED", confirmedAt: viewed, viewedAt: viewed });
            } else if (roll < 0.65) {
              Object.assign(assignment, { confirmationStatus: "CONFIRMED", confirmedAt: viewed, viewedAt: viewed });
            } else if (roll < 0.8) {
              Object.assign(assignment, { confirmationStatus: "MAYBE", viewedAt: viewed });
            } else {
              Object.assign(assignment, { confirmationStatus: "PENDING", viewedAt: roll < 0.9 ? viewed : null });
            }
          } else {
            const roll = rand();
            if (personId === "u-lucas" && week === 1) {
              Object.assign(assignment, { confirmationStatus: "PENDING", viewedAt: null });
            } else if (roll < 0.35) {
              Object.assign(assignment, { confirmationStatus: "CONFIRMED", confirmedAt: viewed, viewedAt: viewed });
            } else {
              Object.assign(assignment, { confirmationStatus: "PENDING", viewedAt: roll < 0.6 ? viewed : null });
            }
          }
          db.assignments.push(assignment);
        });

        // Músicas da escala do louvor
        if (departmentId === "d-louvor") {
          const songs = SONG_ROTATION[louvorIndex % SONG_ROTATION.length]!;
          louvorIndex += 1;
          songs.forEach((songKey, order) => {
            db.scheduleMedia.push({
              id: `sm-${scheduleId}-${order}`,
              scheduleId,
              mediaItemId: `song-${songKey}`,
              order,
              observation: order === 0 ? "Começar só com teclado" : null,
              startedByUserId: order === 1 ? "u-beatriz" : null,
            });
          });
          if (dayKey === nextSundayKey && service.id === "st-dom-manha") {
            // Música da Ceia: uma que ainda não está no repertório do dia.
            const ceiaSong = ["mais-perto", "santo", "graca", "luz"].find((key) => !songs.includes(key)) ?? "santo";
            db.scheduleMedia.push({
              id: `sm-${scheduleId}-ceia`,
              scheduleId,
              mediaItemId: `song-${ceiaSong}`,
              order: 4,
              observation: "Durante a distribuição da Ceia",
              startedByUserId: null,
            });
          }
        }
        if (departmentId === "d-midia") {
          db.scheduleMedia.push({
            id: `sm-${scheduleId}-0`,
            scheduleId,
            mediaItemId: "res-midia-transmissao",
            order: 0,
            observation: null,
            startedByUserId: null,
          });
        }

        // Checklist do diaconato
        const config = getDepartmentSchedulePreset(
          DEPARTMENTS.find((department) => department.id === departmentId)!.type,
        );
        const templates = [
          ...config.checklistItems,
          ...(isCommunion ? config.communion.checklistItems : []),
        ];
        templates.forEach((template, order) => {
          const done = isPast || (order === 0 && week === 0);
          db.checklistItems.push({
            id: `ck-${scheduleId}-${order}`,
            scheduleId,
            title: template.title,
            assigneeId: order === 0 ? (DEPARTMENTS.find((department) => department.id === departmentId)!.leaderId) : order === 1 ? "u-roberto" : "u-patricia",
            dueAt: new Date(startsAt.getTime() - (order + 1) * 30 * 60 * 1000).toISOString(),
            isComplete: done,
            completedAt: done ? new Date(startsAt.getTime() - 2 * 3600 * 1000).toISOString() : null,
            isApplicable: true,
            templateKey: template.templateKey,
            order,
          });
        });
      }

      // Presença e contagem dos cultos que já aconteceram
      if (isPast) {
        const absentees = new Set(["r-kleber", "r-antonio", "r-cida", "r-marta"]);
        const visitorsByWeek: Record<number, string[]> = {
          [-1]: ["r-renata", "r-igor"],
          [-2]: ["r-felipe", "r-igor"],
          [-3]: ["r-igor", "r-tatiane"],
        };
        let members = 0;
        let visitors = 0;
        for (const person of db.roster) {
          if (person.status === "FORMER" || absentees.has(person.id)) continue;
          const isVisitorThisWeek = (visitorsByWeek[week] ?? []).includes(person.id) && service.weekday === 0;
          if (person.status === "VISITOR" && !isVisitorThisWeek) continue;
          if (["r-renata", "r-felipe", "r-igor", "r-tatiane"].includes(person.id) && !isVisitorThisWeek) continue;
          if (person.status === "MEMBER" && !isVisitorThisWeek && rand() > (service.weekday === 0 ? 0.85 : 0.45)) continue;
          db.occurrenceAttendees.push({
            id: nextId("att"),
            occurrenceId,
            rosterMemberId: person.id,
            markedAt: new Date(startsAt.getTime() + 20 * 60 * 1000).toISOString(),
          });
          if (person.status === "VISITOR" || isVisitorThisWeek) visitors += 1;
          else members += 1;
        }
        db.serviceAttendance.push({
          id: nextId("sa"),
          churchId: ESPERANCA_CHURCH_ID,
          serviceTimeId: service.id,
          date: startsAt.toISOString(),
          visitorCount: visitors + (service.weekday === 0 ? 3 : 1),
          memberCount: members + (service.weekday === 0 ? 96 : 38),
          notes: service.id === "st-dom-manha" && week === -1 ? "Batismo de 4 irmãos" : null,
          endedAt: new Date(startsAt.getTime() + 110 * 60 * 1000).toISOString(),
          createdAt: startsAt.toISOString(),
          updatedAt: startsAt.toISOString(),
        });
      }
    }
  }

  // Culto avulso (sem horário fixo): Noite de Louvor no sábado da semana que vem
  const specialDay = nextWeekday(now, 6, 1);
  const specialKey = ymd(specialDay);
  db.occurrences.push({
    id: `oc-especial-${specialKey}`,
    churchId: ESPERANCA_CHURCH_ID,
    serviceTimeId: null,
    date: specialKey,
    title: "Noite de Louvor e Adoração",
    time: "19:30",
    description: "Uma noite inteira de adoração com os ministérios de louvor da região. Entrada gratuita — traga um amigo!",
    imageUrl: null,
    imageKey: null,
  });
  db.schedules.push({
    id: `sc-louvor-especial-${specialKey}`,
    departmentId: "d-louvor",
    date: isoAt(specialDay, "19:30"),
    description: "Noite de Louvor e Adoração",
    arrivalAt: null,
    rehearsalAt: isoAt(specialDay, "15:00"),
    rehearsalNotes: "Ensaio geral com as bandas convidadas.",
    isCommunionService: false,
    serviceOccurrenceId: `oc-especial-${specialKey}`,
    createdAt: daysAgo(now, 2, "22:00"),
  });
  ["u-ana", "u-beatriz", "u-lucas", "u-rafael", "u-gabriel"].forEach((userId, index) => {
    db.assignments.push({
      id: `as-especial-${index}`,
      scheduleId: `sc-louvor-especial-${specialKey}`,
      userId,
      role: ["Ministro", "Cantor(a)", "Violão", "Teclado", "Bateria"][index]!,
      viewedAt: index < 2 ? daysAgo(now, 1, "08:00") : null,
      confirmationStatus: index < 2 ? "CONFIRMED" : "PENDING",
      confirmedAt: index < 2 ? daysAgo(now, 1, "08:00") : null,
      declineReason: null,
      attendanceStatus: "PENDING",
      attendedAt: null,
    });
  });
  ["esperanca-viva", "rio", "graca", "firme", "luz"].forEach((songKey, order) => {
    db.scheduleMedia.push({
      id: `sm-especial-${order}`,
      scheduleId: `sc-louvor-especial-${specialKey}`,
      mediaItemId: `song-${songKey}`,
      order,
      observation: null,
      startedByUserId: null,
    });
  });

  // ---- infantil ---------------------------------------------------------
  for (const child of CHILDREN) {
    const birth = addDays(today, -Math.round(child.age * 365.25) - 40);
    db.roster.push({
      id: child.id,
      churchId: ESPERANCA_CHURCH_ID,
      name: child.name,
      email: null,
      phone: null,
      birthDate: `${ymd(birth)}T12:00:00.000Z`,
      notes: child.id === "r-theo" ? "Alergia a amendoim." : null,
      status: "MEMBER",
      joinedAt: daysAgo(now, 300),
      leftAt: null,
      createdAt: daysAgo(now, 300),
      userId: null,
      contactConsent: false,
    });
    db.children.push({
      id: `ch-${child.id.slice(2)}`,
      departmentId: "d-infantil",
      rosterMemberId: child.id,
      groupName: child.group,
      isActive: true,
      guardianRosterIds: child.guardians,
      createdAt: daysAgo(now, 300),
    });
  }
  for (const weeksBack of [0, 1]) {
    const day = previousWeekday(now, 0, weeksBack);
    db.childSessions.push({
      id: `cs-${ymd(day)}`,
      departmentId: "d-infantil",
      date: isoAt(day, "10:00"),
      groupName: null,
      createdAt: isoAt(day, "09:40"),
      attendances: db.children.map((child, index) => ({
        id: `csa-${ymd(day)}-${index}`,
        childProfileId: child.id,
        status: child.rosterMemberId === "r-davi" || (weeksBack === 1 && index % 4 === 0) ? "ABSENT" : "PRESENT",
      })),
    });
  }

  // ---- visitantes (acompanhamento) ------------------------------------
  const followUps = [
    { rosterMemberId: "r-renata", stage: "NEW" as const, consent: true, next: 1, last: null, responsibleId: "u-helena", activities: [{ action: "FOLLOW_UP_STARTED", note: "Veio com a vizinha, a Mariana. Mora no Bigorrilho.", stage: "NEW", daysAgo: 3, actorId: "u-mariana" }] },
    { rosterMemberId: "r-felipe", stage: "CONTACTED" as const, consent: true, next: 3, last: 6, responsibleId: "u-pedro", activities: [
      { action: "FOLLOW_UP_STARTED", note: null, stage: "NEW", daysAgo: 10, actorId: "u-pedro" },
      { action: "CONTACT_RECORDED", note: "Mandei mensagem no WhatsApp, ele agradeceu e disse que volta.", stage: "CONTACTED", daysAgo: 6, actorId: "u-pedro" },
    ] },
    { rosterMemberId: "r-igor", stage: "RETURNED" as const, consent: true, next: 7, last: 3, responsibleId: "u-pastor", activities: [
      { action: "FOLLOW_UP_STARTED", note: null, stage: "NEW", daysAgo: 24, actorId: "u-pastor" },
      { action: "CONTACT_RECORDED", note: "Conversamos depois do culto. Interesse em batismo.", stage: "CONTACTED", daysAgo: 17, actorId: "u-pastor" },
      { action: "STAGE_CHANGED", note: "Etapa alterada para Voltou.", stage: "RETURNED", daysAgo: 3, actorId: "u-pastor" },
    ] },
    { rosterMemberId: "r-tatiane", stage: "INTEGRATED" as const, consent: true, next: null, last: 30, responsibleId: "u-helena", activities: [
      { action: "FOLLOW_UP_STARTED", note: null, stage: "NEW", daysAgo: 60, actorId: "u-helena" },
      { action: "CONTACT_RECORDED", note: "Participou da classe de novos membros.", stage: "RETURNED", daysAgo: 40, actorId: "u-helena" },
      { action: "PROMOTED_TO_MEMBER", note: "Tornou-se membro.", stage: "INTEGRATED", daysAgo: 30, actorId: "u-pastor" },
    ] },
  ];
  for (const followUp of followUps) {
    db.followUps.push({
      id: `fu-${followUp.rosterMemberId.slice(2)}`,
      churchId: ESPERANCA_CHURCH_ID,
      rosterMemberId: followUp.rosterMemberId,
      stage: followUp.stage,
      consentToContact: followUp.consent,
      nextContactAt: followUp.next === null ? null : daysFromNow(now, followUp.next, "10:00"),
      lastContactAt: followUp.last === null ? null : daysAgo(now, followUp.last, "15:00"),
      responsibleId: followUp.responsibleId,
      activities: followUp.activities
        .map((activity) => ({
          id: nextId("fua"),
          action: activity.action,
          note: activity.note,
          stage: activity.stage,
          createdAt: daysAgo(now, activity.daysAgo, "14:30"),
          actorId: activity.actorId,
        }))
        .reverse(),
    });
  }

  // ---- visitas pastorais ------------------------------------------------
  db.visits.push(
    { id: "vi-kleber", churchId: ESPERANCA_CHURCH_ID, rosterMemberId: "r-kleber", reason: "Ausente há 3 semanas; desemprego", priority: "HIGH", status: "SCHEDULED", scheduledAt: daysFromNow(now, 2, "19:30"), completedAt: null, notes: "Levar a cesta básica da ação social.", responsibleId: "u-pastor", createdAt: daysAgo(now, 5) },
    { id: "vi-cida", churchId: ESPERANCA_CHURCH_ID, rosterMemberId: "r-cida", reason: "Recuperação de cirurgia no quadril", priority: "MEDIUM", status: "DONE", scheduledAt: daysAgo(now, 6, "15:00"), completedAt: daysAgo(now, 6, "16:30"), notes: "Está bem, pediu para levar a Ceia em casa no domingo.", responsibleId: "u-helena", createdAt: daysAgo(now, 9) },
    { id: "vi-antonio", churchId: ESPERANCA_CHURCH_ID, rosterMemberId: "r-antonio", reason: "Levar a Santa Ceia em casa", priority: "MEDIUM", status: "OPEN", scheduledAt: null, completedAt: null, notes: null, responsibleId: "u-joao", createdAt: daysAgo(now, 1) },
  );

  // ---- conteúdo -------------------------------------------------------
  for (const item of ANNOUNCEMENTS) {
    db.announcements.push({
      id: item.id,
      churchId: ESPERANCA_CHURCH_ID,
      title: item.title,
      body: item.body,
      pinned: item.pinned,
      publishedAt: daysAgo(now, item.publishedDaysAgo, "08:30"),
      expiresAt: item.expiresInDays === null ? null : daysFromNow(now, item.expiresInDays, "23:59"),
      isPublic: item.isPublic,
      kind: item.kind,
      imageUrl: null,
      imageKey: null,
      videoUrl: null,
    });
  }
  DAILY_VERSES.forEach((verse, index) => {
    db.dailyVerses.push({
      id: `vs-${index + 1}`,
      churchId: ESPERANCA_CHURCH_ID,
      text: verse.text,
      reference: verse.reference,
      commentary: verse.commentary,
      videoUrl: null,
      imageUrl: null,
      imageKey: null,
      isPublic: index < 3,
      publishedAt: daysAgo(now, index, "06:00"),
      authorId: index % 2 === 0 ? "u-pastor" : "u-daniel",
    });
  });
  for (const devotional of DEVOTIONALS) {
    db.devotionals.push({
      id: devotional.id,
      churchId: ESPERANCA_CHURCH_ID,
      title: devotional.title,
      description: devotional.description,
      videoUrl: null,
      imageUrl: null,
      imageKey: null,
      isPublic: devotional.isPublic,
      publishedAt: daysAgo(now, devotional.publishedDaysAgo, "07:00"),
      authorId: "u-pastor",
      chapters: devotional.chapters.map((chapter, order) => ({
        id: `${devotional.id}-c${order + 1}`,
        title: chapter.title,
        content: chapter.content,
        bibleRef: chapter.bibleRef,
        order,
      })),
    });
  }
  db.devotionalProgress.push(
    { id: "dp-1", userId: "u-lucas", devotionalId: "dv-fundamentos", lastChapterId: "dv-fundamentos-c3", updatedAt: daysAgo(now, 1, "07:20") },
    { id: "dp-2", userId: "u-ana", devotionalId: "dv-salmos", lastChapterId: "dv-salmos-c2", updatedAt: daysAgo(now, 0, "06:40") },
    { id: "dp-3", userId: "u-pastor", devotionalId: "dv-fundamentos", lastChapterId: "dv-fundamentos-c5", updatedAt: daysAgo(now, 8, "06:00") },
  );
  db.devotionalComments.push(
    { id: "dc-1", devotionalId: "dv-fundamentos", authorId: "u-camila", body: "O dia 2 me ministrou muito. Obrigada, pastor!", createdAt: daysAgo(now, 9, "21:10") },
    { id: "dc-2", devotionalId: "dv-fundamentos", authorId: "u-roberto", body: "Estou fazendo com minha esposa à noite. Recomendo!", createdAt: daysAgo(now, 7, "22:05") },
    { id: "dc-3", devotionalId: "dv-salmos", authorId: "u-patricia", body: "Salmo 46 é o meu preferido. 🙏", createdAt: daysAgo(now, 2, "08:15") },
  );
  for (const post of POSTS) {
    db.posts.push({
      id: post.id,
      churchId: ESPERANCA_CHURCH_ID,
      title: post.title,
      body: post.body,
      imageUrl: null,
      imageKey: null,
      videoUrl: null,
      isPublic: post.isPublic,
      pinned: post.pinned,
      publishedAt: daysAgo(now, post.publishedDaysAgo, "18:00"),
      authorId: "u-daniel",
    });
  }
  for (const prayer of PRAYERS) {
    db.prayerRequests.push({
      id: prayer.id,
      churchId: ESPERANCA_CHURCH_ID,
      userId: prayer.userId,
      title: prayer.title,
      body: prayer.body,
      isAnonymous: prayer.isAnonymous,
      isAnswered: prayer.isAnswered,
      status: prayer.status,
      rejectionReason: null,
      createdAt: daysAgo(now, prayer.daysAgo, prayer.daysAgo === 0 ? "07:45" : "20:30"),
    });
  }

  // ---- notificações ---------------------------------------------------
  const sundayLouvor = `sc-louvor-dom-manha-${nextSundayKey}`;
  const notify = (userId: string, title: string, body: string, url: string, type: string, hoursAgo: number, read = false, scheduleId: string | null = null) => {
    const createdAt = new Date(now.getTime() - hoursAgo * 3600 * 1000).toISOString();
    db.notifications.push({ id: nextId("nt"), userId, title, body, url, type, scheduleId, readAt: read ? createdAt : null, createdAt });
  };
  notify("u-pastor", "Novo pedido de oração: Ansiedade no trabalho", "Tenho tido crises de ansiedade com a pressão no trabalho. Peço oração.", "/prayer?tab=pending", "prayer_request_pending", 3);
  notify("u-pastor", "Resposta de escala", "Daniel Araújo marcou que não pode ir: Viagem a trabalho para São Paulo em Culto da Família", `/scale?schedule=${sundayLouvor}`, "schedule-response", 9, false, sundayLouvor);
  notify("u-pastor", "Novo pedido para entrar na igreja", "Juliana Ribeiro quer fazer parte da Igreja Batista Esperança.", "/admin/pessoas", "membership_request", 20);
  notify("u-pastor", "Resposta de escala", "Gabriel Santos pediu troca em Culto da Família", `/scale?schedule=${sundayLouvor}`, "schedule-response", 26, true, sundayLouvor);
  notify("u-ana", "Resposta de escala", "Gabriel Santos pediu troca em Culto da Família", `/scale?schedule=${sundayLouvor}`, "schedule-response", 26, false, sundayLouvor);
  notify("u-ana", "Resposta de escala", "Daniel Araújo marcou que não pode ir: Viagem a trabalho para São Paulo em Culto da Família", `/scale?schedule=${sundayLouvor}`, "schedule-response", 9, false, sundayLouvor);
  notify("u-ana", "Novo aviso", "Santa Ceia no próximo domingo", "/", "announcement", 30, true);
  notify("u-lucas", "Você foi escalado", "Louvor · Culto da Família — Violão. Confirme sua presença.", `/scale?schedule=${sundayLouvor}`, "schedule-assignment", 40, false, sundayLouvor);
  notify("u-lucas", "Novo aviso", "Santa Ceia no próximo domingo", "/", "announcement", 30, false);
  notify("u-lucas", "Novo devocional", "Salmos para dias difíceis", "/content/devotionals/dv-salmos", "devotional", 96, true);
  notify("u-juliana", "Pedido enviado", "Seu pedido para entrar na Igreja Batista Esperança foi enviado ao pastor.", "/", "membership_request", 20, true);

  // ---- mensagens / aniversários --------------------------------------
  for (const template of MESSAGE_TEMPLATES) {
    db.messageTemplates.push({
      id: template.id,
      churchId: ESPERANCA_CHURCH_ID,
      name: template.name,
      body: template.body,
      suggestionKey: template.suggestionKey,
      createdAt: daysAgo(now, 30),
      updatedAt: daysAgo(now, 30),
    });
  }
  db.messageRules.push({
    id: "mr-1",
    churchId: ESPERANCA_CHURCH_ID,
    audience: "VISITOR",
    offsetMinutes: 180,
    isActive: true,
    lastFiredAt: isoAt(previousWeekday(now, 0, 0), "13:00"),
    serviceTimeId: "st-dom-manha",
    templateId: "mt-visitante",
  });
  db.messageLogs.push(
    { id: "ml-1", churchId: ESPERANCA_CHURCH_ID, audience: "VISITOR", status: "DONE", totalCount: 2, successCount: 2, failedCount: 0, createdAt: isoAt(previousWeekday(now, 0, 0), "13:00"), finishedAt: isoAt(previousWeekday(now, 0, 0), "13:01"), ruleId: "mr-1", templateId: "mt-visitante" },
    { id: "ml-2", churchId: ESPERANCA_CHURCH_ID, audience: "MEMBER", status: "DONE", totalCount: 31, successCount: 29, failedCount: 2, createdAt: daysAgo(now, 9, "17:00"), finishedAt: daysAgo(now, 9, "17:04"), ruleId: null, templateId: "mt-lembrete" },
  );
  db.birthdaySettings.push({
    id: "bs-1",
    crunchId: ESPERANCA_CHURCH_ID,
    isActive: true,
    templateId: "mt-aniversario",
    lastNotifiedAt: daysAgo(now, 1, "08:00"),
    notifyTime: "08:00",
  });

  // ---- notas e preferências ------------------------------------------
  db.bibleNotes.push({ id: "bn-1", userId: "u-pastor", bookAbbrev: "sl", chapter: 23, content: "Sermão de domingo: o Pastor que conduz, restaura e acompanha (v. 2-4).", updatedAt: daysAgo(now, 5, "22:00") });
  db.songPreferences.push(
    { id: "sp-1", userId: "u-lucas", mediaItemId: "song-esperanca-viva", personalKey: "D", chords: null, notes: "Capo na 2ª casa", updatedAt: daysAgo(now, 6) },
    { id: "sp-2", userId: "u-lucas", mediaItemId: "song-graca", personalKey: "G", chords: null, notes: null, updatedAt: daysAgo(now, 12) },
    { id: "sp-3", userId: "u-ana", mediaItemId: "song-santo", personalKey: "C", chords: null, notes: "Tom mais confortável para a voz", updatedAt: daysAgo(now, 3) },
  );

  return db;
}
