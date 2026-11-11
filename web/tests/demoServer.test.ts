import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";

import { handleDemoRequest, listDemoRoutes } from "../demo/server.ts";
import { configureDemoStore, getDb, resetDemo, setPersona } from "../demo/store.ts";

// Storage em memória (sem localStorage no Node) e um "hoje" fixo numa quarta.
const memory = new Map<string, string>();
const storage = {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => void memory.set(key, value),
  removeItem: (key: string) => void memory.delete(key),
};
let today = new Date(2026, 10, 11, 9, 30);
configureDemoStore({ storage, now: () => today });

const call = (method: string, url: string, body?: unknown) =>
  handleDemoRequest({ method, url, body: body === undefined ? undefined : JSON.stringify(body) });

const data = async <T = any>(method: string, url: string, body?: unknown) => {
  const response = await call(method, url, body);
  const envelope = response.body as { data?: T; error?: string; status: number };
  assert.equal(response.status, 200, `${method} ${url} -> HTTP ${response.status}`);
  assert.equal(envelope.status, 200, `${method} ${url} -> ${envelope.error}`);
  return envelope.data as T;
};

describe("demo server", () => {
  beforeEach(() => {
    memory.clear();
    today = new Date(2026, 10, 11, 9, 30);
    configureDemoStore({ storage, now: () => today });
    resetDemo();
    setPersona("pastor");
  });

  it("devolve o envelope do controllerHandler e um token decodificável", async () => {
    const response = await call("GET", "https://demo.churchapp.local/public/auth/refresh-token");
    assert.equal(response.status, 200);
    const { data: payload } = response.body as { data: { access_token: string } };
    const [, part] = payload.access_token.split(".");
    const decoded = JSON.parse(Buffer.from(part!, "base64url").toString("utf8"));
    assert.equal(decoded.sub, "u-pastor");
    assert.equal(decoded.name, "Marcos Oliveira");
  });

  it("monta /api/me no formato que useAuth espera", async () => {
    const me = await data("GET", "/api/me");
    assert.equal(me.role, "PASTOR");
    assert.equal(me.hasChurch, true);
    assert.equal(me.isTitularPastor, true);
    assert.equal(me.church.slug, "esperanca");
    assert.equal(me.church.effectivePlan, "PRO");
    assert.equal(me.memberships.length, 1);
    assert.ok(Array.isArray(me.church.features) && me.church.features.includes("REPORTS"));
  });

  it("casa rotas com parâmetros e query", async () => {
    const departments = await data<any[]>("GET", "/api/church/departments");
    assert.deepEqual(
      departments.map((item) => item.name),
      ["Diaconato", "Infantil", "Louvor", "Mídia", "Recepção"],
    );
    const louvor = departments.find((item) => item.name === "Louvor");
    const songs = await data<any[]>("GET", `/api/church/departments/${louvor.id}/songs`);
    assert.ok(songs.length >= 6);
    assert.ok(songs[0].metadata.chords);
    const prayers = await data<any>("GET", "/api/church/prayer-requests?page=1");
    assert.ok(prayers.items.length > 0);
    assert.equal(prayers.page, 1);
  });

  it("endpoint sem handler responde lista vazia e avisa no console", async () => {
    const warnings: unknown[][] = [];
    const original = console.warn;
    console.warn = (...args: unknown[]) => void warnings.push(args);
    try {
      const response = await call("GET", "/api/church/nao-existe");
      assert.deepEqual(response.body, { data: [], status: 200 });
    } finally {
      console.warn = original;
    }
    assert.equal(warnings[0]?.[0], "[demo] sem handler");
  });

  it("erro de domínio vem com HTTP 200 e status 409 no corpo", async () => {
    const response = await call("POST", "/api/church/departments", { name: "" });
    assert.equal(response.status, 200);
    assert.equal((response.body as { status: number }).status, 409);
    assert.ok((response.body as { error: string }).error);
  });

  it("uma mutação aparece nos GETs seguintes (e em outras telas)", async () => {
    const created = await data("POST", "/api/church/departments", {
      name: "Intercessão",
      type: "INTERCESSION",
      leaderId: "u-patricia",
    });
    const departments = await data<any[]>("GET", "/api/church/departments");
    assert.ok(departments.some((item) => item.id === created.id));

    const schedule = await data("POST", `/api/church/departments/${created.id}/schedules`, {
      title: "Vigília de oração",
      date: "2026-11-20",
      time: "22:00",
    });
    await data("PATCH", `/api/church/schedules/${schedule.id}/assignments`, {
      assignments: [{ userId: "u-lucas", role: "Intercessor(a)" }],
    });
    const all = await data<any[]>("GET", "/api/church/schedules");
    const saved = all.find((item) => item.id === schedule.id);
    assert.equal(saved.department.name, "Intercessão");
    assert.equal(saved.assignments[0].user.name, "Lucas Ferreira");

    // Mesma igreja vista pelo membro: a escala nova e a notificação estão lá
    setPersona("membro");
    const asMember = await data<any[]>("GET", "/api/church/schedules");
    assert.ok(asMember.some((item) => item.id === schedule.id));
    const inbox = await data<any>("GET", "/api/notifications");
    assert.ok(inbox.notifications.some((item: any) => item.scheduleId === schedule.id));
  });

  it("membro confirma a escala pendente de domingo", async () => {
    setPersona("membro");
    const schedules = await data<any[]>("GET", "/api/church/schedules");
    const pending = schedules.find((item) =>
      item.assignments.some((a: any) => a.userId === "u-lucas" && a.confirmationStatus === "PENDING" && new Date(item.date) > today),
    );
    assert.ok(pending, "Lucas deveria ter uma escala pendente");
    const updated = await data("PATCH", `/api/church/schedules/${pending.id}/my-assignment`, { action: "CONFIRMED" });
    assert.equal(updated.confirmationStatus, "CONFIRMED");
  });

  it("personas mostram o que cada uma deve ver", async () => {
    setPersona("lider");
    const lider = await data("GET", "/api/me");
    assert.equal(lider.role, "MEMBER");
    assert.ok(lider.roles.some((role: any) => role.scope === "MINISTRY" && role.permissions.includes("SCHEDULE_CREATE")));

    setPersona("nova");
    const nova = await data("GET", "/api/me");
    assert.equal(nova.hasChurch, true);
    assert.deepEqual(await data("GET", "/api/church/departments"), []);
    assert.deepEqual(await data("GET", "/api/church/service-times"), []);

    setPersona("semigreja");
    const semIgreja = await data("GET", "/api/me");
    assert.equal(semIgreja.hasChurch, false);

    setPersona("pendente");
    const pendente = await data("GET", "/api/me");
    assert.equal(pendente.hasChurch, false);
    assert.equal(pendente.pendingChurches[0].name, "Igreja Batista Esperança");
  });

  it("resetDemo volta aos dados de exemplo e salva no storage", async () => {
    await data("POST", "/api/church/announcements", { title: "Teste", body: "Corpo" });
    assert.ok(memory.has("churchapp-demo:db:esperanca"));
    assert.ok((await data<any[]>("GET", "/api/church/announcements")).some((item) => item.title === "Teste"));

    resetDemo();
    assert.ok(!memory.has("churchapp-demo:db:esperanca"));
    assert.ok(!(await data<any[]>("GET", "/api/church/announcements")).some((item) => item.title === "Teste"));
  });

  it("reabrir dias depois anda as datas em semanas inteiras", async () => {
    const before = getDb("esperanca").schedules.map((item) => item.date).sort();
    await data("POST", "/api/church/announcements", { title: "Persistido", body: "x" });
    today = new Date(2026, 10, 25, 9, 30); // 2 semanas depois
    configureDemoStore({ storage, now: () => today });
    const after = getDb("esperanca").schedules.map((item) => item.date).sort();
    const shift = new Date(after[0]!).getTime() - new Date(before[0]!).getTime();
    assert.equal(Math.round(shift / (24 * 3600 * 1000)), 14);
    assert.ok(getDb("esperanca").announcements.some((item) => item.title === "Persistido"));
  });

  it("tem handler para cada endpoint chamado pelos composables principais", () => {
    const routes = new Set(listDemoRoutes());
    for (const route of [
      "GET /api/me",
      "GET /api/church/schedules",
      "PATCH /api/church/schedules/:id/my-assignment",
      "GET /api/church/service-occurrences",
      "GET /api/church/pastoral/dashboard",
      "GET /api/notifications",
      "GET /api/church/roster",
    ]) {
      assert.ok(routes.has(route), route);
    }
  });
});
