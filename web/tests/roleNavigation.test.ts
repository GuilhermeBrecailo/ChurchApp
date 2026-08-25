import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getAllNavigationItems,
  getBottomNavigationItems,
  getChurchHubItems,
  getMoreNavigationItems,
  getQuickAccessItems,
  isNavigationItemActive,
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
  it("prioriza cuidado, cultos, relatorios e mais para pastor", () => {
    const items = getBottomNavigationItems(churchUser({ role: "PASTOR" }));

    assert.deepEqual(labels(items), [
      "Início",
      "Pastoral",
      "Cultos",
      "Relatórios",
      "Mais",
    ]);
    assert.deepEqual(routes(items), [
      "/",
      "/pastoral",
      "/cultos",
      "/admin/relatorios",
      "",
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
      "Ministérios",
      "Visitas",
      "Cultos",
      "Mais",
    ]);
    assert.deepEqual(routes(items), [
      "/",
      "/ministery",
      "/pastoral/visitas",
      "/cultos",
      "",
    ]);
  });

  it("mantem membro focado em participacao e perfil", () => {
    const items = getBottomNavigationItems(churchUser({}));

    assert.deepEqual(labels(items), [
      "Início",
      "Cultos",
      "Escalas",
      "Ministérios",
      "Mais",
    ]);
  });

  it("prioriza ministerios e escalas para lider de ministerio", () => {
    const items = getBottomNavigationItems(
      churchUser({
        roles: [
          {
            scope: "MINISTRY",
            departmentId: "music",
            permissions: ["SCHEDULE_CREATE", "SONG_EDIT"],
          },
        ],
      }),
    );

    assert.deepEqual(labels(items), [
      "Início",
      "Ministérios",
      "Escalas",
      "Cultos",
      "Mais",
    ]);
  });

  it("leva gestor de membros direto para pessoas sem expor cargos globais", () => {
    const user = churchUser({
      roles: [
        {
          scope: "CHURCH",
          departmentId: null,
          permissions: ["MEMBER_CREATE", "MEMBER_EDIT"],
        },
      ],
    });

    assert.deepEqual(labels(getBottomNavigationItems(user)), [
      "Início",
      "Pessoas",
      "Cultos",
      "Escalas",
      "Mais",
    ]);

    const moreKeys = getMoreNavigationItems(user).map((entry) => entry.key);
    assert.ok(moreKeys.includes("churchAdmin"));
    assert.ok(moreKeys.includes("settings"));
    assert.ok(!moreKeys.includes("rolesManagement"));
    assert.ok(!moreKeys.includes("messages"));
  });

  it("prioriza conteudo para comunicacao sem liberar admin pastoral", () => {
    const user = churchUser({
      roles: [
        {
          scope: "CHURCH",
          departmentId: null,
          permissions: ["CONTENT_PUBLISH", "ANNOUNCEMENT_PUBLISH"],
        },
      ],
    });

    assert.deepEqual(labels(getBottomNavigationItems(user)), [
      "Início",
      "Conteúdo",
      "Cultos",
      "Escalas",
      "Mais",
    ]);

    const moreKeys = getMoreNavigationItems(user).map((entry) => entry.key);
    assert.ok(!moreKeys.includes("churchAdmin"));
    assert.ok(!moreKeys.includes("messages"));
    assert.ok(!moreKeys.includes("rolesManagement"));
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
      "Escalas",
      "Ministérios",
      "Mais",
    ]);
  });

  it("pastor com preview de lider ve a navegacao de lider com visitas", () => {
    const items = getBottomNavigationItems(
      churchUser({ role: "PASTOR", navPreviewRole: "LIDER" }),
    );

    assert.deepEqual(labels(items), [
      "Início",
      "Ministérios",
      "Visitas",
      "Cultos",
      "Mais",
    ]);
  });

  it("membro sem privilegio real ignora navPreviewRole", () => {
    const items = getBottomNavigationItems(
      churchUser({ navPreviewRole: "PASTOR" }),
    );

    assert.deepEqual(labels(items), [
      "Início",
      "Cultos",
      "Escalas",
      "Ministérios",
      "Mais",
    ]);
  });

  it("coloca pessoas e administracao no menu mais do pastor", () => {
    const items = getMoreNavigationItems(churchUser({ role: "PASTOR" }));
    const keys = items.map((entry) => entry.key);

    assert.ok(keys.includes("people"));
    assert.ok(keys.includes("churchAdmin"));
    assert.ok(keys.includes("rolesManagement"));
    assert.ok(keys.includes("settings"));
    assert.ok(keys.includes("profile"));
  });

  it("ordena o menu mais do pastor em ordem alfabetica pelo titulo", () => {
    const items = getMoreNavigationItems(churchUser({ role: "PASTOR" }));

    assert.deepEqual(
      items.map((entry) => entry.title),
      [
        "Administração da igreja",
        "Cargos e permissões",
        "Configurações",
        "Conteúdo",
        "Mensagens",
        "Meu perfil",
        "Ministérios",
        "Pessoas",
        "Publicações",
        "Visitas",
      ],
    );
  });

  it("nao marca administracao geral como ativa em subrotas especificas do admin", () => {
    const items = getMoreNavigationItems(churchUser({ role: "PASTOR" }));
    const churchAdmin = items.find((entry) => entry.key === "churchAdmin");

    assert.ok(churchAdmin);
    assert.equal(isNavigationItemActive(churchAdmin, "/admin"), true);
    assert.equal(isNavigationItemActive(churchAdmin, "/admin/relatorios"), false);
  });

  it("nao mostra administracao no menu mais do membro", () => {
    const items = getMoreNavigationItems(churchUser({}));
    const keys = items.map((entry) => entry.key);

    assert.ok(keys.includes("profile"));
    assert.ok(!keys.includes("people"));
    assert.ok(!keys.includes("churchAdmin"));
    assert.ok(!keys.includes("settings"));
    assert.ok(!keys.includes("platformAdmin"));
  });

  it("nao mostra atalhos de igreja para admin da plataforma sem igreja", () => {
    const items = getMoreNavigationItems({
      hasChurch: false,
      role: "ADMIN",
      is_admin: true,
      roles: [],
    });
    const keys = items.map((entry) => entry.key);

    assert.deepEqual(keys, ["profile"]);
  });

  it("ordena o menu mais do membro em ordem alfabetica pelo titulo", () => {
    const items = getMoreNavigationItems(churchUser({}));

    assert.deepEqual(
      items.map((entry) => entry.title),
      ["Conteúdo", "Meu perfil", "Oração"],
    );
  });

  it("lista completa do pastor nao tem duplicatas e cobre tudo", () => {
    const items = getAllNavigationItems(churchUser({ role: "PASTOR" }));
    const keys = items.map((entry) => entry.key);

    assert.equal(new Set(keys).size, keys.length, "nao deve ter chaves repetidas");
    assert.ok(keys.includes("messages"));
    assert.ok(keys.includes("rolesManagement"));
    assert.ok(keys.includes("settings"));
    assert.ok(keys.includes("people"));
    assert.ok(keys.includes("profile"));
  });

  it("monta hub da igreja sem administracao para membro", () => {
    const items = getChurchHubItems(churchUser({}));

    assert.deepEqual(labels(items), [
      "Cultos",
      "Escalas",
      "Ministérios",
      "Conteúdo",
      "Oração",
    ]);
  });
});
