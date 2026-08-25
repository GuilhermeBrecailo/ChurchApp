import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
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

    assert.deepEqual(labels(items).slice(0, 4), [
      "Painel",
      "Visitas",
      "Pessoas",
      "Relatórios",
    ]);
  });

  it("monta hub da igreja com prioridade pastoral para pastor", () => {
    const items = getChurchHubItems(churchUser({ role: "PASTOR" }));

    assert.deepEqual(labels(items).slice(0, 4), [
      "Painel",
      "Pessoas",
      "Cultos",
      "Relatórios",
    ]);
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
