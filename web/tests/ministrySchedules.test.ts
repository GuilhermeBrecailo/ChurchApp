import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildMinistryPendencies,
  buildMinistrySetupChecklist,
  formatShortScheduleDate,
  formatTaskDueDate,
  isTaskOverdue,
  ministryCardContextLine,
  nextScheduleForUser,
  scheduleTeamSummary,
  splitMinistrySchedules,
  splitMinistryTasks,
} from "../app/utils/ministrySchedules";

// Quarta, 11/11/2026 às 15h (fuso do aparelho).
const now = new Date(2026, 10, 11, 15, 0);
const at = (day: number, hour = 19) => new Date(2026, 10, day, hour, 0).toISOString();

const assignment = (userId: string, role: string, confirmationStatus = "PENDING") => ({
  id: `${userId}-${role}`,
  userId,
  role,
  confirmationStatus,
});

const schedules = [
  { id: "passada-antiga", date: at(1), assignments: [] },
  { id: "domingo", date: at(15), assignments: [
    assignment("ana", "Violão", "CONFIRMED"),
    assignment("ana", "Vocal", "CONFIRMED"),
    assignment("bia", "Teclado"),
    assignment("caio", "Bateria", "SWAP_REQUESTED"),
  ] },
  { id: "passada-recente", date: at(8), assignments: [assignment("ana", "Violão")] },
  { id: "hoje-cedo", date: at(11, 13), assignments: [] },
  { id: "proximo-mes", date: new Date(2026, 11, 6, 19).toISOString(), assignments: [assignment("bia", "Teclado")] },
];

describe("splitMinistrySchedules", () => {
  it("próximas da mais perto para a mais longe; anteriores da mais recente para a mais antiga", () => {
    const { upcoming, past } = splitMinistrySchedules(schedules, now);
    assert.deepEqual(upcoming.map((item) => item.id), ["hoje-cedo", "domingo", "proximo-mes"]);
    assert.deepEqual(past.map((item) => item.id), ["passada-recente", "passada-antiga"]);
  });

  it("não depende da ordem de criação que vem da API", () => {
    const reversed = splitMinistrySchedules([...schedules].reverse(), now);
    assert.deepEqual(reversed.upcoming.map((item) => item.id), ["hoje-cedo", "domingo", "proximo-mes"]);
  });
});

describe("equipe da escala", () => {
  it("conta cada pessoa uma vez, mesmo com duas funções", () => {
    assert.deepEqual(scheduleTeamSummary(schedules[1]), {
      total: 3,
      confirmed: 1,
      pending: 1,
      declined: 0,
      swapRequested: 1,
    });
  });

  it("acha a próxima escala da pessoa com as funções juntas", () => {
    const mine = nextScheduleForUser(schedules, "ana", now);
    assert.equal(mine?.schedule.id, "domingo");
    assert.equal(mine?.roles, "Violão · Vocal");
    assert.equal(nextScheduleForUser(schedules, "ninguem", now), null);
  });
});

describe("linha do cartão na lista", () => {
  it("quem gerencia vê a saúde da próxima escala", () => {
    const line = ministryCardContextLine(schedules.slice(0, 3), { canManageSchedules: true, now });
    assert.equal(line, "Próxima escala: dom 15/11 · 1/3 confirmados");
    assert.equal(ministryCardContextLine([], { canManageSchedules: true, now }), "Sem escala marcada");
  });

  it("quem serve vê quando serve", () => {
    assert.equal(
      ministryCardContextLine(schedules, { canManageSchedules: false, userId: "ana", now }),
      "Você serve dom 15/11 · Violão · Vocal",
    );
  });

  it("formata a data curta com o dia da semana", () => {
    assert.equal(formatShortScheduleDate(new Date(2026, 10, 17, 19)), "ter 17/11");
    assert.equal(formatShortScheduleDate("data ruim"), "");
  });
});

describe("pendências do líder", () => {
  it("uma linha por problema, cada uma com um botão", () => {
    const pendencies = buildMinistryPendencies({
      schedules,
      tasks: [
        { id: "t1", status: "OPEN", dueDate: "2026-11-01T00:00:00.000Z" },
        { id: "t2", status: "OPEN", dueDate: "2026-11-10T00:00:00.000Z" },
        { id: "t3", status: "DONE", dueDate: "2026-11-01T00:00:00.000Z" },
        { id: "t4", status: "OPEN", dueDate: "2026-11-11T00:00:00.000Z" },
      ],
      now,
    });

    assert.deepEqual(
      pendencies.map((item) => [item.kind, item.label, item.actionLabel]),
      [
        ["no-team", "Escala de qua 11/11 sem equipe", "Montar equipe"],
        ["swap", "1 pediu troca em dom 15/11", "Ver escala"],
        ["no-response", "1 sem resposta em dom 15/11", "Lembrar"],
        ["no-response", "1 sem resposta em dom 06/12", "Lembrar"],
        ["overdue-tasks", "2 tarefas atrasadas", "Ver"],
      ],
    );
  });
});

describe("tarefas", () => {
  it("atrasada é a aberta com prazo antes de hoje", () => {
    assert.equal(isTaskOverdue({ id: "a", status: "OPEN", dueDate: "2026-11-10T00:00:00.000Z" }, now), true);
    assert.equal(isTaskOverdue({ id: "b", status: "OPEN", dueDate: "2026-11-11T00:00:00.000Z" }, now), false);
    assert.equal(isTaskOverdue({ id: "c", status: "DONE", dueDate: "2026-11-01T00:00:00.000Z" }, now), false);
    assert.equal(isTaskOverdue({ id: "d", status: "OPEN", dueDate: null }, now), false);
  });

  it("abertas: atrasadas primeiro, depois por prazo, sem prazo no fim", () => {
    const { open, done } = splitMinistryTasks([
      { id: "sem-prazo", status: "OPEN" },
      { id: "semana-que-vem", status: "OPEN", dueDate: "2026-11-18" },
      { id: "feita", status: "DONE" },
      { id: "atrasada", status: "OPEN", dueDate: "2026-11-02" },
      { id: "amanha", status: "OPEN", dueDate: "2026-11-12" },
    ], now);
    assert.deepEqual(open.map((task) => task.id), ["atrasada", "amanha", "semana-que-vem", "sem-prazo"]);
    assert.deepEqual(done.map((task) => task.id), ["feita"]);
    assert.equal(formatTaskDueDate("2026-11-18T00:00:00.000Z"), "18/11");
  });
});

describe("checklist do ministério", () => {
  it("Louvor pede pessoas, modelo, primeira escala e primeira música", () => {
    const steps = buildMinistrySetupChecklist({
      peopleCount: 1,
      templateReviewed: true,
      schedulesCount: 0,
      songsCount: 2,
      hasSchedules: true,
      hasSongs: true,
    });
    assert.deepEqual(steps.map((step) => [step.key, step.done]), [
      ["people", false],
      ["template", true],
      ["schedule", false],
      ["song", true],
    ]);
  });

  it("sem escalas nem repertório, só pede pessoas", () => {
    const steps = buildMinistrySetupChecklist({
      peopleCount: 2,
      templateReviewed: false,
      schedulesCount: 0,
      songsCount: 0,
      hasSchedules: false,
      hasSongs: false,
    });
    assert.deepEqual(steps.map((step) => [step.key, step.done]), [["people", true]]);
  });
});
