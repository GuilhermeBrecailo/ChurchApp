import type { DemoDB } from "../types";
import { emptyDb, makeChurch, makeUser } from "./base";
import { addDays, daysAgo, startOfDay } from "./dates";
import { seedEsperanca } from "./esperanca";

export type WorldKey = "esperanca" | "nova" | "semigreja";

/** Igreja recém-criada: só o pastor, nada configurado (primeiro uso). */
function seedNova(now: Date): DemoDB {
  const db = emptyDb("nova", now);
  const createdAt = new Date(now.getTime() - 15 * 60 * 1000).toISOString();
  db.users.push(
    makeUser(
      {
        id: "u-novo",
        name: "Rafael Lima",
        email: "pr.rafael@vidanova.com.br",
        phone: "(43) 99901-2233",
        globalRole: "PASTOR",
        createdAt,
      },
      now,
    ),
  );
  db.churches.push(
    makeChurch(
      {
        id: "c-nova",
        name: "Igreja Vida Nova",
        slug: "vida-nova",
        city: "Londrina",
        state: "PR",
        road: "Rua Pará",
        number: "455",
        localZipCode: "86010-450",
        accentColor: "#B5472A",
        userMainId: "u-novo",
        plan: "PRO",
        subscriptionStatus: "TRIALING",
        trialEndsAt: addDays(startOfDay(now), 90).toISOString(),
        inviteCode: "VIDA90",
        createdAt,
      },
      now,
    ),
  );
  db.memberships.push({
    id: "m-u-novo",
    userId: "u-novo",
    churchId: "c-nova",
    role: "PASTOR",
    canManageMembers: true,
    isPrimary: true,
    isActive: true,
    roleIds: [],
    createdAt,
  });
  db.roster.push({
    id: "r-u-novo",
    churchId: "c-nova",
    name: "Rafael Lima",
    email: "pr.rafael@vidanova.com.br",
    phone: "(43) 99901-2233",
    birthDate: null,
    notes: null,
    status: "MEMBER",
    joinedAt: createdAt,
    leftAt: null,
    createdAt,
    userId: "u-novo",
    contactConsent: true,
  });
  db.notifications.push({
    id: "nt-boas-vindas",
    userId: "u-novo",
    title: "Bem-vindo ao ChurchApp!",
    body: "Sua igreja foi criada. Você tem 90 dias do plano Pro grátis.",
    url: "/",
    type: "welcome",
    scheduleId: null,
    readAt: null,
    createdAt,
  });
  return db;
}

/** Pastor que acabou de se cadastrar e ainda não criou a igreja. */
function seedSemIgreja(now: Date): DemoDB {
  const db = emptyDb("semigreja", now);
  db.users.push(
    makeUser(
      {
        id: "u-semigreja",
        name: "André Matos",
        email: "andre.matos@email.com",
        phone: "(11) 98765-4321",
        globalRole: "PASTOR",
        createdAt: daysAgo(now, 0, "08:00"),
      },
      now,
    ),
  );
  return db;
}

export function seedWorld(world: WorldKey, now = new Date()): DemoDB {
  switch (world) {
    case "nova":
      return seedNova(now);
    case "semigreja":
      return seedSemIgreja(now);
    default:
      return seedEsperanca(now);
  }
}
