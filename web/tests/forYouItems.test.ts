import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildForYouItems,
  FOR_YOU_LIMIT,
  formatScheduleWhen,
  type ForYouSchedule,
} from "../app/utils/forYouItems";

const NOW = new Date(2026, 10, 12, 9, 0); // ter 12/11/2026 09:00
const ME = "me";

const inDays = (days: number, hour = 19) => {
  const date = new Date(NOW);
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
};

let nextId = 1;
const schedule = (overrides: Partial<ForYouSchedule> = {}): ForYouSchedule => ({
  id: `s${nextId++}`,
  date: inDays(5),
  description: "Culto de domingo",
  departmentId: "louvor",
  department: { id: "louvor", name: "Louvor" },
  assignments: [],
  ...overrides,
});

const kinds = (items: { kind: string }[]) => items.map((item) => item.kind);

describe("Para você: escalas", () => {
  it("minha escala sem resposta vira item para responder ali mesmo", () => {
    const pending = schedule({
      assignments: [
        { userId: ME, role: "Vocal", confirmationStatus: "PENDING" },
        { userId: "other", role: "Violão", confirmationStatus: "PENDING" },
      ],
    });
    const [item] = buildForYouItems({ userId: ME, now: NOW, schedules: [pending] });

    assert.equal(item?.kind, "schedule-response");
    assert.equal(item?.priority, 1);
    assert.equal(item?.schedule?.id, pending.id);
    assert.deepEqual(item?.schedule?.myRoles, ["Vocal"]);
    assert.match(item?.description ?? "", /Louvor · .* · Vocal/);
    assert.equal(item?.to, `/?schedule=${pending.id}`);
  });

  it("escala já respondida, passada ou de outra pessoa não entra", () => {
    const items = buildForYouItems({
      userId: ME,
      now: NOW,
      schedules: [
        schedule({ assignments: [{ userId: ME, role: "Vocal", confirmationStatus: "CONFIRMED" }] }),
        schedule({ assignments: [{ userId: ME, role: "Vocal", confirmationStatus: "MAYBE" }] }),
        schedule({ date: inDays(-1), assignments: [{ userId: ME, role: "Vocal", confirmationStatus: "PENDING" }] }),
        schedule({ assignments: [{ userId: "other", role: "Vocal", confirmationStatus: "PENDING" }] }),
      ],
    });
    assert.deepEqual(items, []);
  });

  it("duas funções: se uma linha disse 'não posso', a escala não fica pendente", () => {
    const items = buildForYouItems({
      userId: ME,
      now: NOW,
      schedules: [
        schedule({
          assignments: [
            { userId: ME, role: "Vocal", confirmationStatus: "DECLINED" },
            { userId: ME, role: "Violão", confirmationStatus: "PENDING" },
          ],
        }),
      ],
    });
    assert.deepEqual(items, []);
  });

  it("3 ou mais escalas para responder viram um item só", () => {
    const schedules = [1, 2, 3, 4].map((day) =>
      schedule({ date: inDays(day), assignments: [{ userId: ME, role: "Vocal", confirmationStatus: "PENDING" }] }),
    );
    const items = buildForYouItems({ userId: ME, now: NOW, schedules });
    assert.equal(items.length, 1);
    assert.equal(items[0]?.kind, "schedule-responses");
    assert.equal(items[0]?.title, "4 escalas para responder");
    assert.equal(items[0]?.to, "/scale?aba=minhas");

    const two = buildForYouItems({ userId: ME, now: NOW, schedules: schedules.slice(0, 2) });
    assert.deepEqual(kinds(two), ["schedule-response", "schedule-response"]);
  });

  it("líder vê pedido de troca e escala da semana sem equipe ou com 'não posso'", () => {
    const swap = schedule({
      assignments: [{ userId: "a", role: "Vocal", confirmationStatus: "SWAP_REQUESTED" }],
    });
    const declined = schedule({
      date: inDays(3),
      assignments: [
        { userId: "a", role: "Vocal", confirmationStatus: "DECLINED" },
        { userId: "b", role: "Bateria", confirmationStatus: "CONFIRMED" },
      ],
    });
    const empty = schedule({ date: inDays(2), assignments: [] });
    const farAway = schedule({ date: inDays(20), assignments: [] });
    const otherMinistry = schedule({ departmentId: "midia", assignments: [] });

    const items = buildForYouItems({
      userId: ME,
      now: NOW,
      schedules: [swap, declined, empty, farAway, otherMinistry],
      managedMinistryIds: ["louvor"],
    });

    assert.deepEqual(kinds(items), ["swap-request", "schedule-gap", "schedule-gap"]);
    assert.equal(items[1]?.title, "Escala sem equipe");
    assert.equal(items[2]?.title, 'Escala com 1 "não posso"');
  });

  it("quem não organiza escalas não vê vagas nem trocas", () => {
    const items = buildForYouItems({
      userId: ME,
      now: NOW,
      schedules: [schedule({ assignments: [] })],
      managedMinistryIds: [],
    });
    assert.deepEqual(items, []);
  });

  it("pastor ('all') vê vagas de todos os ministérios e muitas viram um item", () => {
    const schedules = [1, 2, 3].map((day) => schedule({ date: inDays(day), departmentId: `d${day}` }));
    const items = buildForYouItems({ userId: ME, now: NOW, schedules, managedMinistryIds: "all" });
    assert.deepEqual(kinds(items), ["schedule-gaps"]);
    assert.equal(items[0]?.count, 3);
  });
});

describe("Para você: gestão e cuidado", () => {
  it("cadastros, orações, visitantes e visitas, com contagem", () => {
    const items = buildForYouItems({
      userId: ME,
      now: NOW,
      pendingMembersCount: 3,
      pendingPrayersCount: 1,
      visitors: [
        { id: "v1", visitorFollowUp: { stage: "NEW" } },
        { id: "v2", visitorFollowUp: { stage: "CONTACTED", nextContactAt: inDays(0, 8) } },
        { id: "v3", visitorFollowUp: { stage: "CONTACTED", nextContactAt: inDays(4) } },
        { id: "v4", visitorFollowUp: { stage: "CLOSED" } },
      ],
      visits: [
        { id: "p1", status: "SCHEDULED", scheduledAt: inDays(-2) },
        { id: "p2", status: "SCHEDULED", scheduledAt: inDays(0, 15) },
        { id: "p3", status: "DONE", scheduledAt: inDays(-1) },
        { id: "p4", status: "OPEN", scheduledAt: null },
      ],
    });

    assert.deepEqual(kinds(items), ["pending-members", "pending-prayers", "visitors", "visits"]);
    assert.equal(items[0]?.title, "3 pedidos para entrar na igreja");
    assert.equal(items[0]?.to, "/pessoas?filtro=pendentes");
    assert.equal(items[1]?.title, "1 pedido de oração para revisar");
    assert.equal(items[2]?.title, "Falar com 2 visitantes");
    assert.equal(items[3]?.title, "2 visitas para hoje");
    assert.equal(items[3]?.description, "1 atrasada");
    assert.ok(items.every((item) => item.priority === 2));
  });

  it("fonte sem permissão (null) ou zerada não aparece", () => {
    const items = buildForYouItems({
      userId: ME,
      now: NOW,
      pendingMembersCount: null,
      pendingPrayersCount: 0,
      visitors: null,
      visits: [],
    });
    assert.deepEqual(items, []);
  });
});

describe("Para você: prioridade 3", () => {
  it("aviso novo (não visto, até 3 dias), notificações desligadas e perfil sem telefone", () => {
    const items = buildForYouItems({
      userId: ME,
      now: NOW,
      announcements: [
        { id: "old", title: "Antigo", publishedAt: inDays(-10) },
        { id: "a1", title: "Retiro de jovens", publishedAt: inDays(-1) },
        { id: "seen", title: "Visto", publishedAt: inDays(0, 8) },
      ],
      seenAnnouncementIds: ["seen"],
      pushStatus: "default",
      phone: "",
    });
    assert.deepEqual(kinds(items), ["announcement", "enable-push", "profile-phone"]);
    assert.equal(items[0]?.description, "Retiro de jovens");
  });

  it("push ativo/bloqueado e telefone preenchido ou desconhecido não sugerem nada", () => {
    for (const pushStatus of ["enabled", "denied", "unsupported", null]) {
      assert.deepEqual(buildForYouItems({ userId: ME, now: NOW, pushStatus, phone: "11999990000" }), []);
    }
    assert.deepEqual(buildForYouItems({ userId: ME, now: NOW }), []);
  });
});

describe("Para você: ordem e limite", () => {
  it("ordena por prioridade e o Início mostra no máximo 5", () => {
    const items = buildForYouItems({
      userId: ME,
      now: NOW,
      pushStatus: "default",
      phone: "",
      pendingMembersCount: 2,
      pendingPrayersCount: 2,
      visitors: [{ id: "v", visitorFollowUp: { stage: "NEW" } }],
      schedules: [schedule({ assignments: [{ userId: ME, role: "Vocal", confirmationStatus: "PENDING" }] })],
    });
    assert.deepEqual(items.map((item) => item.priority), [1, 2, 2, 2, 3, 3]);
    assert.equal(FOR_YOU_LIMIT, 5);
    assert.equal(items.slice(0, FOR_YOU_LIMIT).length, 5);
  });

  it("chaves únicas", () => {
    const items = buildForYouItems({
      userId: ME,
      now: NOW,
      managedMinistryIds: "all",
      schedules: [
        schedule({ assignments: [{ userId: ME, role: "Vocal", confirmationStatus: "PENDING" }] }),
        schedule({ assignments: [{ userId: "x", role: "Vocal", confirmationStatus: "SWAP_REQUESTED" }] }),
        schedule({ date: inDays(1), assignments: [] }),
      ],
    });
    assert.equal(new Set(items.map((item) => item.key)).size, items.length);
  });
});

describe("formatScheduleWhen", () => {
  it("dia da semana curto, data e hora", () => {
    assert.equal(formatScheduleWhen(new Date(2026, 10, 15, 19, 0)), "dom 15/11 19h");
    assert.equal(formatScheduleWhen(new Date(2026, 10, 18, 19, 30)), "qua 18/11 19h30");
  });
});
