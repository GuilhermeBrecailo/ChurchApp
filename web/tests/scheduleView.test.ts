import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applyMyResponse,
  canChangeResponse,
  canMarkAttendance,
  computeHealth,
  groupByDate,
  groupByService,
  groupTeam,
  matchesOrganizerFilter,
  mergeMyAssignments,
  organizerStats,
  toScheduleView,
  type ApiSchedule,
} from "../app/utils/scheduleView.ts";
import {
  createInFlightDeduper,
  emptyScheduleCache,
  invalidateScheduleCache,
  isListFresh,
  patchSchedule,
  removeScheduleFromCache,
  scheduleListKey,
  scheduleListQuery,
  selectScheduleList,
  setScheduleList,
  storeSchedules,
} from "../app/utils/scheduleCache.ts";

const row = (id: string, userId: string, role: string, extra: Record<string, unknown> = {}) => ({
  id,
  userId,
  role,
  confirmationStatus: "PENDING",
  viewedAt: null,
  user: { id: userId, name: userId === "ana" ? "Ana Souza" : `Pessoa ${userId}` },
  ...extra,
});

const schedule = (overrides: Partial<ApiSchedule> = {}): ApiSchedule => ({
  id: "s1",
  date: "2026-11-15T19:00:00",
  description: "Culto de domingo",
  departmentId: "louvor",
  department: { id: "louvor", name: "Louvor", type: "WORSHIP" },
  serviceOccurrenceId: "occ-1",
  serviceOccurrence: { id: "occ-1", serviceTimeId: "st-1" },
  assignments: [],
  mediaItems: [],
  ...overrides,
});

describe("toScheduleView", () => {
  it("marca a escala como rascunho só quando a API manda isDraft", () => {
    assert.equal(toScheduleView(schedule({ isDraft: true }), { userId: "ana" }).isDraft, true);
    assert.equal(toScheduleView(schedule({}), { userId: "ana" }).isDraft, false);
  });

  it("junta as funções da mesma pessoa e mostra o status de quem pede atenção", () => {
    const view = toScheduleView(
      schedule({
        assignments: [
          row("a1", "ana", "Teclado", { confirmationStatus: "CONFIRMED", viewedAt: "2026-11-10" }),
          row("a2", "ana", "Vocal", { confirmationStatus: "DECLINED", declineReason: "Viagem" }),
          row("a3", "bia", "Baixo"),
        ],
      }),
      { userId: "ana", now: new Date("2026-11-11T10:00:00") },
    );

    assert.equal(view.team.length, 2);
    assert.deepEqual(view.me?.roles, ["Teclado", "Vocal"]);
    assert.equal(view.me?.status, "DECLINED");
    assert.equal(view.me?.declineReason, "Viagem");
    assert.equal(view.team[0].initials, "AS");
    assert.equal(view.timeLabel, "19:00");
    assert.equal(view.dayKey, "2026-11-15");
    assert.equal(view.hasStarted, false);
  });

  it("separa repertório (na ordem) e recursos", () => {
    const view = toScheduleView(
      schedule({
        mediaItems: [
          { id: "m2", mediaItemId: "song-2", order: 1, mediaItem: { id: "song-2", title: "B", category: "MUSIC", metadata: { key: "D" } } },
          { id: "m1", mediaItemId: "song-1", order: 0, mediaItem: { id: "song-1", title: "A", category: "MUSIC", metadata: { key: "G", chords: "G" } } },
          { id: "m3", mediaItemId: "res-1", order: 2, mediaItem: { id: "res-1", title: "Roteiro", category: "PDF", url: "/r.pdf" } },
        ],
      }),
    );

    assert.deepEqual(view.songs.map((song) => song.title), ["A", "B"]);
    assert.equal(view.songs[0].hasChords, true);
    assert.equal(view.resources[0].title, "Roteiro");
  });

  it("a pessoa de fora da equipe não tem 'Sua resposta'", () => {
    const view = toScheduleView(schedule({ assignments: [row("a1", "bia", "Baixo")] }), { userId: "ana" });
    assert.equal(view.me, null);
  });
});

describe("saúde da escala", () => {
  it("conta pessoas, não linhas", () => {
    const team = groupTeam([
      row("a1", "ana", "Teclado", { confirmationStatus: "CONFIRMED", viewedAt: "x" }),
      row("a2", "ana", "Vocal", { confirmationStatus: "CONFIRMED", viewedAt: "x" }),
      row("a3", "bia", "Baixo", { confirmationStatus: "SWAP_REQUESTED", viewedAt: "x" }),
      row("a4", "caio", "Bateria"),
      row("a5", "duda", "Violão", { confirmationStatus: "MAYBE", viewedAt: "x" }),
    ] as never);

    const health = computeHealth(team);
    assert.equal(health.total, 4);
    assert.equal(health.text, "1 de 4 confirmaram · 1 pediu troca · 1 talvez · 1 sem resposta");
    assert.equal(health.notViewed, 1);
  });

  it("escala vazia", () => {
    assert.equal(computeHealth([]).text, "Ninguém escalado ainda");
  });
});

describe("resposta de quem tem duas funções", () => {
  it("atualiza TODAS as linhas da pessoa (o selo não fica 'Confirmado')", () => {
    const before = schedule({
      assignments: [
        row("a1", "ana", "Teclado", { confirmationStatus: "CONFIRMED" }),
        row("a2", "ana", "Vocal", { confirmationStatus: "CONFIRMED" }),
        row("a3", "bia", "Baixo", { confirmationStatus: "CONFIRMED" }),
      ] as never,
    });

    const after = applyMyResponse(before, "ana", "DECLINED", " Trabalho ", new Date("2026-11-11T10:00:00Z"));
    const ana = after.assignments!.filter((item) => item.userId === "ana");
    assert.deepEqual(ana.map((item) => item.confirmationStatus), ["DECLINED", "DECLINED"]);
    assert.deepEqual(ana.map((item) => item.declineReason), ["Trabalho", "Trabalho"]);
    assert.equal(after.assignments![2].confirmationStatus, "CONFIRMED");
    assert.equal(toScheduleView(after, { userId: "ana" }).me?.status, "DECLINED");
  });

  it("'Pediu troca' guarda o motivo e 'Vi' não muda a resposta", () => {
    const base = schedule({ assignments: [row("a1", "ana", "Teclado", { confirmationStatus: "MAYBE" })] as never });
    assert.equal(applyMyResponse(base, "ana", "SWAP_REQUESTED", "Viagem").assignments![0].declineReason, "Viagem");
    const viewed = applyMyResponse(base, "ana", "VIEWED");
    assert.equal(viewed.assignments![0].confirmationStatus, "MAYBE");
    assert.ok(viewed.assignments![0].viewedAt);
  });

  it("aplica as linhas devolvidas pela API", () => {
    const base = schedule({ assignments: [row("a1", "ana", "Teclado"), row("a2", "ana", "Vocal")] as never });
    const merged = mergeMyAssignments(base, "ana", [
      row("a1", "ana", "Teclado", { confirmationStatus: "CONFIRMED" }),
      row("a2", "ana", "Vocal", { confirmationStatus: "CONFIRMED" }),
    ] as never);
    assert.deepEqual(merged.assignments!.map((item) => item.confirmationStatus), ["CONFIRMED", "CONFIRMED"]);
  });

  it("'Mudar resposta' vale até a escala começar", () => {
    const view = toScheduleView(schedule({ assignments: [row("a1", "ana", "Teclado")] as never }), {
      userId: "ana",
      now: new Date("2026-11-15T19:30:00"),
    });
    assert.equal(canChangeResponse(view), false);
  });

  it("'Marcar presença' só a partir do dia da escala", () => {
    const view = { dayKey: "2026-11-15", canManage: true };
    assert.equal(canMarkAttendance(view, new Date("2026-11-14T23:00:00")), false);
    assert.equal(canMarkAttendance(view, new Date("2026-11-15T08:00:00")), true);
    assert.equal(canMarkAttendance({ ...view, canManage: false }, new Date("2026-11-16T08:00:00")), false);
  });
});

describe("agrupamentos", () => {
  const now = new Date("2026-11-11T10:00:00"); // quarta
  const item = (date: string) => ({ startsAt: new Date(date) });

  it("esta semana (até domingo), próxima semana e depois por mês", () => {
    const groups = groupByDate(
      [item("2026-11-15T19:00:00"), item("2026-11-18T19:00:00"), item("2026-11-30T19:00:00"), item("2027-01-03T10:00:00")],
      { now },
    );
    assert.deepEqual(groups.map((group) => group.label), ["Esta semana", "Próxima semana", "Novembro", "Janeiro de 2027"]);
  });

  it("histórico é só por mês", () => {
    const groups = groupByDate([item("2026-11-08T19:00:00"), item("2026-10-25T19:00:00")], { now, past: true });
    assert.deepEqual(groups.map((group) => group.label), ["Novembro", "Outubro"]);
  });

  it("Igreja: escalas do mesmo culto juntas", () => {
    const views = [
      toScheduleView(schedule({ id: "s1" })),
      toScheduleView(schedule({ id: "s2", departmentId: "midia", department: { id: "midia", name: "Mídia", type: "MEDIA" } })),
      toScheduleView(schedule({ id: "s3", serviceOccurrenceId: null, serviceOccurrence: null, date: "2026-11-18T20:00:00" })),
    ];
    const groups = groupByService(views);
    assert.equal(groups.length, 2);
    assert.deepEqual(groups[0].schedules.map((view) => view.departmentName), ["Louvor", "Mídia"]);
  });
});

describe("Organizar: números só das próximas escalas", () => {
  const now = new Date("2026-11-11T10:00:00");
  const views = [
    toScheduleView(schedule({ id: "past", date: "2026-11-08T19:00:00", assignments: [row("a", "ana", "X")] as never }), { now }),
    toScheduleView(
      schedule({
        id: "next",
        assignments: [
          row("a1", "ana", "X"),
          row("a2", "bia", "Y", { confirmationStatus: "SWAP_REQUESTED", viewedAt: "x" }),
        ] as never,
      }),
      { now },
    ),
  ];

  it("ignora o histórico", () => {
    assert.deepEqual(organizerStats(views), { noAnswer: 1, swaps: 1, notViewed: 1 });
  });

  it("filtros dos números", () => {
    assert.equal(matchesOrganizerFilter(views[1], "trocas"), true);
    assert.equal(matchesOrganizerFilter(views[1], "sem-resposta"), true);
    assert.equal(matchesOrganizerFilter(views[1], null), true);
  });
});

describe("cache de escalas", () => {
  const light = schedule({
    mediaItems: [{ id: "m1", mediaItemId: "song-1", mediaItem: { id: "song-1", title: "A", category: "MUSIC", metadata: { key: "G" } } }],
  });
  const full = schedule({
    mediaItems: [{ id: "m1", mediaItemId: "song-1", mediaItem: { id: "song-1", title: "A", category: "MUSIC", metadata: { key: "G", lyrics: "letra" } } }],
  });

  it("a lista leve não apaga a letra da versão completa", () => {
    let state = storeSchedules(emptyScheduleCache(), [full], { full: true });
    state = storeSchedules(state, [{ ...light, description: "Novo título" }]);
    assert.equal(state.byId.s1.description, "Novo título");
    assert.equal((state.byId.s1.mediaItems![0].mediaItem.metadata as { lyrics: string }).lyrics, "letra");
    assert.equal(state.full.s1, true);
  });

  it("listas por chave, com páginas somadas", () => {
    const key = scheduleListKey({ scope: "mine", from: "2026-11-11" });
    let state = storeSchedules(emptyScheduleCache(), [light, schedule({ id: "s2" })]);
    state = setScheduleList(state, key, ["s1"], "s1", { now: 1000 });
    state = setScheduleList(state, key, ["s2", "s1"], null, { append: true, now: 2000 });
    assert.deepEqual(selectScheduleList(state, key).map((item) => item.id), ["s1", "s2"]);
    assert.equal(isListFresh(state, key, 60_000, 3000), true);
    assert.equal(isListFresh(invalidateScheduleCache(state), key, 60_000, 3000), false);
  });

  it("remove a escala de todas as listas", () => {
    let state = storeSchedules(emptyScheduleCache(), [light]);
    state = setScheduleList(state, "a", ["s1"], null);
    state = removeScheduleFromCache(state, "s1");
    assert.deepEqual(selectScheduleList(state, "a"), []);
    assert.equal(state.byId.s1, undefined);
  });

  it("patch e invalidação por id", () => {
    let state = storeSchedules(emptyScheduleCache(), [full], { full: true });
    state = patchSchedule(state, "s1", (item) => ({ ...item, description: "X" }));
    assert.equal(state.byId.s1.description, "X");
    assert.equal(invalidateScheduleCache(state, "s1").full.s1, undefined);
  });

  it("query string da lista", () => {
    assert.equal(
      scheduleListQuery({ scope: "all", from: "2026-11-11", departmentId: "louvor", cursor: "c1", limit: 20 }),
      "scope=all&from=2026-11-11&departmentId=louvor&limit=20&cursor=c1",
    );
  });

  it("junta pedidos iguais em andamento", async () => {
    const dedupe = createInFlightDeduper();
    let calls = 0;
    const run = () => new Promise<number>((resolve) => setTimeout(() => resolve(++calls), 5));
    const [first, second] = await Promise.all([dedupe("k", run), dedupe("k", run)]);
    assert.equal(first, 1);
    assert.equal(second, 1);
    assert.equal(await dedupe("k", run), 2);
  });
});

describe("resumo curto do ensaio", () => {
  it("formata dia e hora curtos (sem minutos quando é hora cheia)", async () => {
    const { shortDayTime } = await import("../app/utils/scheduleView");
    assert.equal(shortDayTime(new Date(2026, 10, 14, 16, 0)), "sáb 14/11, 16h");
    assert.equal(shortDayTime(new Date(2026, 10, 21, 19, 30)), "sáb 21/11, 19h30");
  });
});
