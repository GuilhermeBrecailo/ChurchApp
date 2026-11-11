// Estado da demonstração: um "banco" em memória por conjunto de dados
// (world), salvo no localStorage do aparelho. Pastor, Líder, Membro e
// "Aguardando aprovação" dividem a mesma igreja (o que o pastor cria, o membro
// vê); "Igreja nova" e "Sem igreja" têm dados próprios.

import { DEFAULT_PERSONA, findPersona, type Persona, type PersonaKey } from "./personas";
import { seedWorld, type WorldKey } from "./seed";
import { DB_VERSION } from "./seed/base";
import { DAY_MS, shiftAllDates, startOfDay, ymd } from "./seed/dates";
import type { DemoDB } from "./types";

const STORAGE_PREFIX = "churchapp-demo";
const PERSONA_KEY = `${STORAGE_PREFIX}:persona`;
const worldKey = (world: WorldKey) => `${STORAGE_PREFIX}:db:${world}`;

/** Chaves do próprio app (fora da demo) limpas ao recomeçar. */
const APP_KEYS_CLEARED_ON_RESET = ["onboarding_seen_v1"];

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const memoryStorage = (): StorageLike => {
  const data = new Map<string, string>();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  };
};

let storage: StorageLike = (() => {
  try {
    if (typeof localStorage !== "undefined") {
      const probe = `${STORAGE_PREFIX}:probe`;
      localStorage.setItem(probe, "1");
      localStorage.removeItem(probe);
      return localStorage;
    }
  } catch {
    // navegação privada / storage bloqueado: fica só em memória
  }
  return memoryStorage();
})();

const cache = new Map<WorldKey, DemoDB>();
let clock: () => Date = () => new Date();

/** Para testes: troca o storage (ex.: memória) e o relógio. */
export function configureDemoStore(options: { storage?: StorageLike; now?: () => Date }) {
  if (options.storage) storage = options.storage;
  if (options.now) clock = options.now;
  cache.clear();
}

export const now = () => clock();

// ---- persona --------------------------------------------------------------

export function getPersona(): Persona {
  try {
    return findPersona(storage.getItem(PERSONA_KEY));
  } catch {
    return findPersona(DEFAULT_PERSONA);
  }
}

export function setPersona(key: PersonaKey) {
  try {
    storage.removeItem(`${STORAGE_PREFIX}:logged-out`);
    storage.setItem(PERSONA_KEY, findPersona(key).key);
  } catch {
    // ignore
  }
}

/** Depois de "Sair", o refresh-token recusa até entrar de novo (ou trocar de persona). */
const LOGGED_OUT_KEY = `${STORAGE_PREFIX}:logged-out`;

export function isLoggedOut() {
  try {
    return storage.getItem(LOGGED_OUT_KEY) === "1";
  } catch {
    return false;
  }
}

export function setLoggedOut(value: boolean) {
  try {
    if (value) storage.setItem(LOGGED_OUT_KEY, "1");
    else storage.removeItem(LOGGED_OUT_KEY);
  } catch {
    // ignore
  }
}

// ---- banco ----------------------------------------------------------------

function load(world: WorldKey): DemoDB {
  const today = startOfDay(clock());
  try {
    const raw = storage.getItem(worldKey(world));
    if (raw) {
      let db = JSON.parse(raw) as DemoDB;
      if (db?.meta?.version === DB_VERSION) {
        // Reaberta dias depois: anda as datas em semanas inteiras, assim o
        // "próximo domingo" continua sendo domingo e no futuro.
        const [year, month, day] = db.meta.seedDay.split("-").map(Number);
        const seededAt = new Date(year!, month! - 1, day!);
        const diffDays = Math.round((today.getTime() - seededAt.getTime()) / DAY_MS);
        const weeks = Math.round(diffDays / 7);
        if (weeks !== 0) {
          db = shiftAllDates(db, weeks * 7);
          db.meta.seedDay = ymd(new Date(seededAt.getTime() + weeks * 7 * DAY_MS));
        }
        return db;
      }
    }
  } catch {
    // dado corrompido: recomeça
  }
  return seedWorld(world, clock());
}

export function getDb(world: WorldKey = getPersona().world): DemoDB {
  let db = cache.get(world);
  if (!db) {
    db = load(world);
    cache.set(world, db);
  }
  return db;
}

export function saveDb(world: WorldKey = getPersona().world) {
  const db = cache.get(world);
  if (!db) return;
  try {
    storage.setItem(worldKey(world), JSON.stringify(db));
  } catch {
    // storage cheio: segue só em memória
  }
}

/** Recomeça um conjunto de dados (ou todos) do zero. */
export function resetDemo(world?: WorldKey) {
  const worlds: WorldKey[] = world ? [world] : ["esperanca", "nova", "semigreja"];
  for (const key of worlds) {
    cache.delete(key);
    try {
      storage.removeItem(worldKey(key));
    } catch {
      // ignore
    }
  }
  if (!world) {
    for (const key of [...APP_KEYS_CLEARED_ON_RESET, `${STORAGE_PREFIX}:logged-out`]) {
      try {
        storage.removeItem(key);
      } catch {
        // ignore
      }
    }
  }
}

// ---- utilitários para handlers --------------------------------------------

let idCounter = 0;
/** Id novo e único (prefixo legível ajuda a depurar). */
export const newId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}${(++idCounter).toString(36)}${Math.random().toString(36).slice(2, 6)}`;
