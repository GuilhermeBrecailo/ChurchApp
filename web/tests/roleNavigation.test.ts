import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getManagementItems,
  getNavPreviewLabel,
  getOwnerTab,
  getPrimaryTabs,
  resolveNavTier,
  type RoleNavigationUser,
} from "../app/utils/roleNavigation";

const churchUser = (overrides: Partial<RoleNavigationUser> = {}): RoleNavigationUser => ({
  hasChurch: true,
  role: "MEMBER",
  is_admin: false,
  roles: [],
  ...overrides,
});

const pastor = (overrides: Partial<RoleNavigationUser> = {}) =>
  churchUser({ role: "PASTOR", ...overrides });

const ministryLeader = churchUser({
  roles: [{ scope: "MINISTRY", departmentId: "louvor", permissions: ["SCHEDULE_CREATE", "SONG_EDIT"] }],
});

const peopleManager = churchUser({
  roles: [{ scope: "CHURCH", departmentId: null, permissions: ["MEMBER_CREATE", "MEMBER_EDIT"] }],
});

const careOnly = churchUser({
  roles: [{ scope: "CHURCH", departmentId: null, permissions: ["PASTORAL_CARE_MANAGE"] }],
});

const prayerModerator = churchUser({
  roles: [{ scope: "CHURCH", departmentId: null, permissions: ["PRAYER_MANAGE"] }],
});

const publisher = churchUser({
  roles: [{ scope: "CHURCH", departmentId: null, permissions: ["ANNOUNCEMENT_PUBLISH"] }],
});

const labels = (user: RoleNavigationUser | null) => getPrimaryTabs(user).map((tab) => tab.label);
const managementKeys = (user: RoleNavigationUser) =>
  getManagementItems(user).flatMap((group) => group.items.map((item) => item.key));

describe("abas por nível", () => {
  it("membro: Início · Escalas · Igreja · Perfil", () => {
    assert.equal(resolveNavTier(churchUser()), "member");
    assert.deepEqual(labels(churchUser()), ["Início", "Escalas", "Igreja", "Perfil"]);
  });

  it("líder de ministério: ganha a aba Ministérios", () => {
    assert.equal(resolveNavTier(ministryLeader), "leader");
    assert.deepEqual(labels(ministryLeader), ["Início", "Escalas", "Igreja", "Ministérios", "Perfil"]);
  });

  it("pastor: ganha a aba Gestão no lugar de Ministérios", () => {
    assert.equal(resolveNavTier(pastor()), "manager");
    assert.deepEqual(labels(pastor()), ["Início", "Escalas", "Igreja", "Gestão", "Perfil"]);
    assert.equal(getPrimaryTabs(pastor())[3]?.route, "/admin");
  });

  it("quem tem qualquer ferramenta de gestão da igreja vê Gestão", () => {
    for (const user of [peopleManager, careOnly, prayerModerator, publisher]) {
      assert.deepEqual(labels(user), ["Início", "Escalas", "Igreja", "Gestão", "Perfil"]);
    }
  });

  it("líder que também gerencia pessoas fica com Gestão (não duas abas)", () => {
    const user = churchUser({
      roles: [
        ...(ministryLeader.roles ?? []),
        ...(peopleManager.roles ?? []),
      ],
    });
    assert.deepEqual(labels(user), ["Início", "Escalas", "Igreja", "Gestão", "Perfil"]);
  });

  it("sem igreja não há barra", () => {
    assert.deepEqual(labels(churchUser({ hasChurch: false })), []);
    assert.deepEqual(labels(churchUser({ hasChurch: false, role: "PASTOR" })), []);
    assert.deepEqual(labels(null), []);
  });

  it("admin da plataforma sem igreja: Início · Plataforma · Perfil", () => {
    const admin = churchUser({ hasChurch: false, is_admin: true, role: "SUPER_ADMIN" });
    assert.deepEqual(labels(admin), ["Início", "Plataforma", "Perfil"]);
  });

  it("não existe mais a aba Mais", () => {
    for (const user of [churchUser(), ministryLeader, pastor()]) {
      assert.ok(!labels(user).includes("Mais"));
    }
  });
});

describe("pré-visualização (navPreviewRole)", () => {
  it("pastor vendo como membro ou líder", () => {
    assert.deepEqual(labels(pastor({ navPreviewRole: "MEMBRO" })), ["Início", "Escalas", "Igreja", "Perfil"]);
    assert.deepEqual(labels(pastor({ navPreviewRole: "LIDER" })), [
      "Início",
      "Escalas",
      "Igreja",
      "Ministérios",
      "Perfil",
    ]);
    assert.deepEqual(labels(pastor({ navPreviewRole: "PASTOR" })), labels(pastor()));
  });

  it("aviso 'Vendo como' só quando a pré-visualização muda algo", () => {
    assert.equal(getNavPreviewLabel(pastor({ navPreviewRole: "MEMBRO" })), "Membro");
    assert.equal(getNavPreviewLabel(pastor({ navPreviewRole: "LIDER" })), "Líder");
    assert.equal(getNavPreviewLabel(pastor({ navPreviewRole: "PASTOR" })), null);
    assert.equal(getNavPreviewLabel(pastor()), null);
  });

  it("quem não é pastor/admin não consegue se pré-visualizar", () => {
    const sneaky = churchUser({ navPreviewRole: "PASTOR" });
    assert.equal(resolveNavTier(sneaky), "member");
    assert.equal(getNavPreviewLabel(churchUser({ navPreviewRole: "MEMBRO" })), null);
  });

  it("a pré-visualização não muda o acesso real aos itens de Gestão", () => {
    assert.deepEqual(
      managementKeys(pastor({ navPreviewRole: "MEMBRO" })),
      managementKeys(pastor()),
    );
  });
});

describe("itens de Gestão", () => {
  it("pastor vê todos os grupos, na ordem", () => {
    const groups = getManagementItems(pastor());
    assert.deepEqual(
      groups.map((group) => group.label),
      ["Pessoas e cuidado", "Ministérios e cultos", "Comunicação", "Igreja"],
    );
    assert.deepEqual(managementKeys(pastor()), [
      "people",
      "care",
      "prayerReview",
      "ministries",
      "cults",
      "communicate",
      "churchSettings",
      "reports",
    ]);
  });

  it("cada pessoa só vê o que pode usar", () => {
    assert.deepEqual(managementKeys(peopleManager), ["people"]);
    assert.deepEqual(managementKeys(careOnly), ["people", "care"]);
    assert.deepEqual(managementKeys(prayerModerator), ["prayerReview"]);
    assert.deepEqual(managementKeys(publisher), ["communicate"]);
    assert.deepEqual(managementKeys(churchUser()), []);
  });

  it("admin da plataforma com igreja chega à Plataforma pela Gestão", () => {
    const admin = churchUser({ is_admin: true, role: "SUPER_ADMIN" });
    assert.ok(managementKeys(admin).includes("platform"));
    assert.equal(getOwnerTab(admin, "/platform-admin"), "management");
  });
});

describe("aba dona de cada rota", () => {
  it("rotas de cada aba", () => {
    const user = pastor();
    assert.equal(getOwnerTab(user, "/"), "home");
    assert.equal(getOwnerTab(user, "/notifications"), "home");
    assert.equal(getOwnerTab(user, "/scale?aba=igreja"), "scale");
    assert.equal(getOwnerTab(user, "/cultos/abc"), "scale");
    assert.equal(getOwnerTab(user, "/igreja"), "church");
    assert.equal(getOwnerTab(user, "/content/devotionals/1"), "church");
    assert.equal(getOwnerTab(user, "/prayer"), "church");
    assert.equal(getOwnerTab(user, "/admin"), "management");
    assert.equal(getOwnerTab(user, "/admin/relatorios"), "management");
    assert.equal(getOwnerTab(user, "/pessoas/123"), "management");
    assert.equal(getOwnerTab(user, "/configuracoes/whatsapp"), "management");
    assert.equal(getOwnerTab(user, "/user"), "profile");
    assert.equal(getOwnerTab(user, "/perfil/preferencias"), "profile");
  });

  it("/ministery é da Igreja (membro), de Ministérios (líder) e da Gestão (pastor)", () => {
    assert.equal(getOwnerTab(churchUser(), "/ministery/abc"), "church");
    assert.equal(getOwnerTab(ministryLeader, "/ministery/abc?aba=escalas"), "ministries");
    assert.equal(getOwnerTab(pastor(), "/ministery"), "management");
  });

  it("não confunde prefixos parecidos", () => {
    assert.equal(getOwnerTab(pastor(), "/scale-antigo"), null);
    assert.equal(getOwnerTab(churchUser(), "/admin"), null);
  });

  it("sem igreja nenhuma aba é dona", () => {
    assert.equal(getOwnerTab(churchUser({ hasChurch: false }), "/"), null);
  });
});

describe("invariantes", () => {
  const users: RoleNavigationUser[] = [
    churchUser(),
    ministryLeader,
    peopleManager,
    careOnly,
    prayerModerator,
    publisher,
    pastor(),
    pastor({ navPreviewRole: "MEMBRO" }),
    pastor({ navPreviewRole: "LIDER" }),
    churchUser({ is_admin: true, role: "SUPER_ADMIN" }),
    churchUser({ canManageMembers: true }),
    churchUser({ permissions: ["SCHEDULE_CREATE"] }),
  ];

  it("com igreja, a barra tem de 3 a 5 abas, começa em Início e termina em Perfil", () => {
    for (const user of users) {
      const tabs = getPrimaryTabs(user);
      assert.ok(tabs.length >= 3 && tabs.length <= 5, `${tabs.length} abas`);
      assert.equal(tabs[0]?.key, "home");
      assert.equal(tabs.at(-1)?.key, "profile");
    }
  });

  it("as 3 primeiras abas são sempre as mesmas (só a 4ª muda)", () => {
    for (const user of users) {
      assert.deepEqual(
        getPrimaryTabs(user).slice(0, 3).map((tab) => tab.key),
        ["home", "scale", "church"],
      );
    }
  });

  it("sem chaves ou rotas repetidas", () => {
    for (const user of users) {
      const tabs = getPrimaryTabs(user);
      assert.equal(new Set(tabs.map((tab) => tab.key)).size, tabs.length);
      assert.equal(new Set(tabs.map((tab) => tab.route)).size, tabs.length);

      const items = getManagementItems(user).flatMap((group) => group.items);
      assert.equal(new Set(items.map((item) => item.key)).size, items.length);
      assert.equal(new Set(items.map((item) => item.route)).size, items.length);
    }
  });

  it("cada aba é dona da própria rota", () => {
    for (const user of users) {
      for (const tab of getPrimaryTabs(user)) {
        assert.equal(getOwnerTab(user, tab.route), tab.key, `${tab.key} em ${tab.route}`);
      }
    }
  });

  it("todo item de Gestão tem uma aba dona (para quem vê a aba Gestão)", () => {
    for (const user of users.filter((entry) => resolveNavTier(entry) === "manager")) {
      for (const item of getManagementItems(user).flatMap((group) => group.items)) {
        assert.ok(getOwnerTab(user, item.route), `${item.route} sem aba`);
      }
    }
  });

  it("quem vê a aba Gestão tem pelo menos um item nela", () => {
    for (const user of users.filter((entry) => resolveNavTier(entry) === "manager")) {
      if (user.navPreviewRole) continue;
      assert.ok(getManagementItems(user).length > 0);
    }
  });
});
