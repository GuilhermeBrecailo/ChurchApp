import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getAllNavigationItems,
  getBottomNavigationItems,
  getChurchHubItems,
  getQuickAccessItems,
  type RoleNavigationUser,
} from "../app/utils/roleNavigation";

const churchUser = (overrides: Partial<RoleNavigationUser>): RoleNavigationUser => ({
  hasChurch: true,
  role: "MEMBER",
  is_admin: false,
  roles: [],
  ...overrides,
});

const labels = (items: { label: string }[]) => items.map((item) => item.label);
const routes = (items: { route: string }[]) => items.map((item) => item.route);

describe("role navigation", () => {
  it("prioriza cuidado, pessoas, cultos e relatorios para pastor", () => {
    const items = getBottomNavigationItems(churchUser({ role: "PASTOR" }));

    assert.deepEqual(labels(items), [
      "Início",
      "Pastoral",
      "Pessoas",
      "Cultos",
      "Relatórios",
    ]);
    assert.deepEqual(routes(items), [
      "/",
      "/pastoral",
      "/admin/pessoas",
      "/cultos",
      "/admin/relatorios",
    ]);
  });

  it("mostra execucao delegada para lider com cuidado pastoral", () => {
    const items = getBottomNavigationItems(
      churchUser({
        roles: [
          {
            scope: "CHURCH",
            departmentId: null,
            permissions: ["PASTORAL_CARE_MANAGE"],
          },
        ],
      }),
    );

    assert.deepEqual(labels(items), [
      "Início",
      "Equipe",
      "Visitas",
      "Cultos",
      "Perfil",
    ]);
    assert.deepEqual(routes(items), [
      "/",
      "/ministery",
      "/pastoral/visitas",
      "/cultos",
      "/user",
    ]);
  });

  it("mantem membro focado em participacao e perfil", () => {
    const items = getBottomNavigationItems(churchUser({}));

    assert.deepEqual(labels(items), [
      "Início",
      "Cultos",
      "Agenda",
      "Ministérios",
      "Perfil",
    ]);
  });

  it("personaliza acesso rapido do pastor com atalhos pastorais", () => {
    const items = getQuickAccessItems(churchUser({ role: "PASTOR" }));

    assert.deepEqual(labels(items).slice(0, 5), [
      "Painel",
      "Visitas",
      "Pessoas",
      "Mensagens",
      "Relatórios",
    ]);
  });

  it("monta hub da igreja com prioridade pastoral para pastor", () => {
    const items = getChurchHubItems(churchUser({ role: "PASTOR" }));

    assert.deepEqual(labels(items).slice(0, 5), [
      "Painel",
      "Pessoas",
      "Mensagens",
      "Cultos",
      "Relatórios",
    ]);
  });

  it("pastor com preview de membro ve a navegacao de membro sem perder o preview", () => {
    const items = getBottomNavigationItems(
      churchUser({ role: "PASTOR", navPreviewRole: "MEMBRO" }),
    );

    assert.deepEqual(labels(items), [
      "Início",
      "Cultos",
      "Agenda",
      "Ministérios",
      "Perfil",
    ]);
  });

  it("pastor com preview de lider ve a navegacao de lider com visitas", () => {
    const items = getBottomNavigationItems(
      churchUser({ role: "PASTOR", navPreviewRole: "LIDER" }),
    );

    assert.deepEqual(labels(items), [
      "Início",
      "Equipe",
      "Visitas",
      "Cultos",
      "Perfil",
    ]);
  });

  it("membro sem privilegio real ignora navPreviewRole", () => {
    const items = getBottomNavigationItems(
      churchUser({ navPreviewRole: "PASTOR" }),
    );

    assert.deepEqual(labels(items), [
      "Início",
      "Cultos",
      "Agenda",
      "Ministérios",
      "Perfil",
    ]);
  });

  it("lista completa do pastor nao tem duplicatas e cobre tudo", () => {
    const items = getAllNavigationItems(churchUser({ role: "PASTOR" }));
    const keys = items.map((entry) => entry.key);

    assert.equal(new Set(keys).size, keys.length, "nao deve ter chaves repetidas");
    assert.ok(keys.includes("messages"));
    assert.ok(keys.includes("settings"));
    assert.ok(keys.includes("people"));
    assert.ok(keys.includes("profile"));
  });

  it("monta hub da igreja sem administracao para membro", () => {
    const items = getChurchHubItems(churchUser({}));

    assert.deepEqual(labels(items), [
      "Cultos",
      "Agenda",
      "Ministérios",
      "Conteúdo",
      "Oração",
    ]);
  });
});
