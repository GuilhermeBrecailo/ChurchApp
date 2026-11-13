import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  availableSegments,
  countSegments,
  defaultSegment,
  filterBySegment,
  parseSegment,
  personSegments,
  personStatusLine,
  relativeDayLabel,
  roleNamesOf,
  searchPeople,
  type SegmentPerson,
} from "../app/utils/peopleSegments";

// Quarta, 11/11/2026, meio-dia (horário local).
const NOW = new Date(2026, 10, 11, 12, 0, 0);

const person = (overrides: Partial<SegmentPerson> = {}): SegmentPerson => ({
  name: "Ana Souza",
  status: "MEMBER",
  hasAccount: true,
  roles: [],
  departments: [],
  followUp: null,
  care: null,
  ...overrides,
});

const manager = { canSeeAccounts: true, canCreate: true, canCare: true };
const careOnly = { canSeeAccounts: false, canCreate: false, canCare: true };
const secretary = { canSeeAccounts: true, canCreate: true, canCare: false };

describe("grupos do diretório", () => {
  it("separa conta, sem conta, visitante, cuidado e desligado", () => {
    assert.deepEqual(personSegments(person()), ["todos", "com-conta"]);
    assert.deepEqual(personSegments(person({ hasAccount: false })), ["todos", "sem-conta"]);
    assert.deepEqual(personSegments(person({ status: "VISITOR", hasAccount: false })), [
      "todos",
      "visitantes",
    ]);
    assert.deepEqual(
      personSegments(person({ care: { openVisits: 1, nextVisitAt: null, absent: false } })),
      ["todos", "com-conta", "cuidado"],
    );
    assert.deepEqual(
      personSegments(person({ status: "FORMER", care: { openVisits: 1, absent: true } })),
      ["desligados"],
    );
  });

  it("conta cada grupo e usa o total de pendentes que veio da API", () => {
    const counts = countSegments(
      [
        person(),
        person({ hasAccount: false }),
        person({ status: "VISITOR", hasAccount: false }),
        person({ care: { openVisits: 0, absent: true } }),
        person({ status: "FORMER" }),
      ],
      3,
    );
    assert.deepEqual(counts, {
      todos: 4,
      "com-conta": 2,
      pendentes: 3,
      "sem-conta": 1,
      visitantes: 1,
      cuidado: 1,
      desligados: 1,
    });
  });

  it("filtra por grupo e deixa pendentes para a lista própria", () => {
    const people = [person({ name: "A" }), person({ name: "B", status: "VISITOR", hasAccount: false })];
    assert.deepEqual(filterBySegment(people, "visitantes").map((p) => p.name), ["B"]);
    assert.deepEqual(filterBySegment(people, "pendentes"), []);
  });

  it("mostra só os filtros que a pessoa pode usar", () => {
    assert.deepEqual(availableSegments(manager), [
      "todos",
      "com-conta",
      "pendentes",
      "sem-conta",
      "visitantes",
      "cuidado",
      "desligados",
    ]);
    assert.deepEqual(availableSegments(careOnly), ["visitantes", "cuidado"]);
    assert.ok(!availableSegments(secretary).includes("cuidado"));
  });

  it("quem só faz cuidado pastoral abre em Em cuidado", () => {
    assert.equal(defaultSegment(careOnly), "cuidado");
    assert.equal(defaultSegment(manager), "todos");
    assert.equal(parseSegment("desligados", careOnly), "cuidado");
    assert.equal(parseSegment("visitantes", careOnly), "visitantes");
    assert.equal(parseSegment(["pendentes"], manager), "pendentes");
    assert.equal(parseSegment(undefined, secretary), "todos");
  });
});

describe("linha de status em palavras simples", () => {
  it("visitante com retorno marcado", () => {
    assert.equal(
      personStatusLine(
        person({ status: "VISITOR", hasAccount: false, followUp: { stage: "NEW", nextContactAt: "2026-11-12T00:00:00.000Z" } }),
        NOW,
      ),
      "Visitante · retorno amanhã",
    );
    assert.equal(
      personStatusLine(
        person({ status: "VISITOR", followUp: { stage: "CONTACTED", nextContactAt: "2026-11-09" } }),
        NOW,
      ),
      "Visitante · retorno atrasado",
    );
    assert.equal(
      personStatusLine(person({ status: "VISITOR", followUp: null }), NOW),
      "Visitante · sem acompanhamento",
    );
  });

  it("membro com ministérios e cargo", () => {
    assert.equal(
      personStatusLine(
        person({ departments: ["Louvor", "Mídia"], roles: [{ name: "Secretária" }] }),
        NOW,
      ),
      "Membro · Louvor, Mídia · Secretária",
    );
    assert.equal(
      personStatusLine(person({ departments: ["Louvor", "Mídia", "Infantil"] }), NOW),
      "Membro · Louvor, Mídia +1",
    );
  });

  it("pastor, admin, desligado e sinais de cuidado", () => {
    assert.equal(personStatusLine(person({ role: "PASTOR" }), NOW), "Pastor");
    assert.equal(personStatusLine(person({ role: "ADMIN" }), NOW), "Admin");
    assert.equal(personStatusLine(person({ status: "FORMER" }), NOW), "Desligado");
    assert.equal(
      personStatusLine(
        person({ care: { openVisits: 1, nextVisitAt: "2026-11-11T18:00:00.000Z", absent: true } }),
        NOW,
      ),
      "Membro · visita hoje · faltou aos últimos cultos",
    );
  });

  it("datas relativas", () => {
    assert.equal(relativeDayLabel("2026-11-11", NOW), "hoje");
    assert.equal(relativeDayLabel("2026-11-10", NOW), "ontem");
    assert.equal(relativeDayLabel("2026-11-14", NOW), "em 3 dias");
    assert.equal(relativeDayLabel("2026-11-08", NOW), "há 3 dias");
    assert.equal(relativeDayLabel("2026-12-25", NOW), "25 dez");
    assert.equal(relativeDayLabel(null, NOW), "");
  });
});

describe("busca", () => {
  it("acha por nome sem acento, ministério, cargo e telefone", () => {
    const people = [
      person({ name: "João Gonçalves", phone: "(11) 98888-7777", departments: ["Louvor"] }),
      person({ name: "Bia", roles: [{ name: "Secretária" }] }),
    ];
    assert.deepEqual(searchPeople(people, "joao").map((p) => p.name), ["João Gonçalves"]);
    assert.deepEqual(searchPeople(people, "louvor").map((p) => p.name), ["João Gonçalves"]);
    assert.deepEqual(searchPeople(people, "secretaria").map((p) => p.name), ["Bia"]);
    assert.deepEqual(searchPeople(people, "98888").map((p) => p.name), ["João Gonçalves"]);
    assert.equal(searchPeople(people, " ").length, 2);
    assert.deepEqual(roleNamesOf(people), ["Secretária"]);
  });
});
