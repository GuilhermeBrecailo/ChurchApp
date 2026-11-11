import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { normalizeThemeMode, resolveThemeMode, toggledThemeMode } from "../app/utils/themeMode";
import {
  canOpenSettingsSection,
  churchAddressStatus,
  formatBrazilianPhone,
  legacySettingsRoute,
  navPreviewStatus,
  planStatus,
  serviceTimesStatus,
  visibleSettingsGroups,
  whatsappStatus,
} from "../app/utils/churchSettings";
import {
  birthdayAutoDescription,
  buildSentHistory,
  composerKindsFor,
  excludedWithoutConsentLabel,
  sendButtonLabel,
} from "../app/utils/communication";
import { countPrayerStatuses, prayerStatusInfo } from "../app/utils/prayerStatus";
import type { AccessUser } from "../app/utils/churchAccess";

describe("tema Claro / Escuro / Sistema", () => {
  it("claro e escuro ignoram o aparelho", () => {
    assert.equal(resolveThemeMode("light", true), "light");
    assert.equal(resolveThemeMode("dark", false), "dark");
  });

  it("sistema segue o aparelho", () => {
    assert.equal(resolveThemeMode("system", true), "dark");
    assert.equal(resolveThemeMode("system", false), "light");
  });

  it("sistema renderiza claro enquanto o aparelho é desconhecido (servidor)", () => {
    assert.equal(resolveThemeMode("system", null), "light");
  });

  it("cookie inválido vira claro", () => {
    assert.equal(normalizeThemeMode("roxo"), "light");
    assert.equal(normalizeThemeMode(undefined), "light");
    assert.equal(resolveThemeMode("roxo", true), "light");
  });

  it("o botão sol/lua troca para o oposto do que está na tela", () => {
    assert.equal(toggledThemeMode("system", true), "light");
    assert.equal(toggledThemeMode("system", false), "dark");
    assert.equal(toggledThemeMode("dark", null), "light");
  });
});

describe("configurações da igreja", () => {
  const pastor = { canEditChurchSettings: true, canManagePeople: true };
  const peopleManager = { canEditChurchSettings: false, canManagePeople: true };
  const member = { canEditChurchSettings: false, canManagePeople: false };

  it("pastor vê todos os grupos", () => {
    const titles = visibleSettingsGroups(pastor).map((group) => group.title);
    assert.deepEqual(titles, ["Sua igreja", "Pessoas", "Integrações", "Assinatura", "Avançado"]);
  });

  it("quem só cuida de pessoas vê apenas o convite", () => {
    const groups = visibleSettingsGroups(peopleManager);
    assert.deepEqual(
      groups.flatMap((group) => group.sections.map((section) => section.slug)),
      ["convite"],
    );
    assert.equal(canOpenSettingsSection(peopleManager, "whatsapp"), false);
  });

  it("membro não vê nada", () => {
    assert.deepEqual(visibleSettingsGroups(member), []);
  });

  it("links antigos de ?secao= chegam na seção nova", () => {
    assert.equal(legacySettingsRoute("horarios"), "/configuracoes/horarios");
    assert.equal(legacySettingsRoute("publica"), "/configuracoes/pagina-publica");
    assert.equal(legacySettingsRoute("geral"), "/configuracoes/convite");
    assert.equal(legacySettingsRoute("whatsapp"), "/configuracoes/whatsapp");
    assert.equal(legacySettingsRoute("integracoes"), "/configuracoes/holyrics");
    assert.equal(legacySettingsRoute("plano"), "/configuracoes/plano");
    assert.equal(legacySettingsRoute(["plano"]), "/configuracoes/plano");
    assert.equal(legacySettingsRoute(undefined), "/configuracoes");
    assert.equal(legacySettingsRoute("qualquer"), "/configuracoes");
  });

  it("linhas de situação", () => {
    assert.equal(serviceTimesStatus(0), "Nenhum horário cadastrado");
    assert.equal(serviceTimesStatus(1), "1 culto por semana");
    assert.equal(serviceTimesStatus(3), "3 cultos por semana");
    assert.equal(whatsappStatus(true, "5511987654321"), "Conectado · (11) 98765-4321");
    assert.equal(whatsappStatus(true), "Conectado");
    assert.equal(whatsappStatus(false), "Não conectado");
    assert.equal(whatsappStatus(null), "Verificando…");
    assert.equal(formatBrazilianPhone("1133334444"), "(11) 3333-4444");
    assert.equal(
      planStatus({ planLabel: "Pro", isOnTrial: true, trialDaysLeft: 1, isPastDue: false }),
      "Pro · teste grátis, faltam 1 dia",
    );
    assert.equal(
      planStatus({ planLabel: "Pro", isOnTrial: false, trialDaysLeft: null, isPastDue: true }),
      "Pro · pagamento pendente",
    );
    assert.equal(navPreviewStatus("LIDER"), "Vendo o app como líder");
    assert.equal(navPreviewStatus(null), "Você vê o app como pastor");
    assert.equal(
      churchAddressStatus({ name: "IBC", city: "Curitiba", state: "PR" }),
      "IBC · Curitiba - PR",
    );
  });
});

describe("Comunicar", () => {
  const user = (overrides: Partial<AccessUser>): AccessUser => ({
    hasChurch: true,
    role: "MEMBER",
    roles: [],
    ...overrides,
  });

  it("pastor vê todos os tipos, inclusive WhatsApp", () => {
    assert.deepEqual(composerKindsFor(user({ role: "PASTOR" })), [
      "AVISO",
      "WHATSAPP",
      "VERSICULO",
      "DEVOCIONAL",
      "PUBLICACAO",
    ]);
  });

  it("cargo de comunicação publica no app, mas não manda WhatsApp", () => {
    const announcer = user({
      roles: [{ scope: "CHURCH", departmentId: null, permissions: ["ANNOUNCEMENT_PUBLISH"] }],
    });
    assert.deepEqual(composerKindsFor(announcer), ["AVISO"]);
    const publisher = user({
      roles: [{ scope: "CHURCH", departmentId: null, permissions: ["CONTENT_PUBLISH"] }],
    });
    assert.deepEqual(composerKindsFor(publisher), ["VERSICULO", "DEVOCIONAL", "PUBLICACAO"]);
  });

  it("membro comum não comunica", () => {
    assert.deepEqual(composerKindsFor(user({})), []);
  });

  it("explica quem ficou de fora por falta de autorização", () => {
    assert.equal(excludedWithoutConsentLabel(0), "");
    assert.equal(excludedWithoutConsentLabel(1), "1 visitante sem autorização ficou de fora");
    assert.equal(excludedWithoutConsentLabel(3), "3 visitantes sem autorização ficaram de fora");
  });

  it("o botão final diz para quantas pessoas vai", () => {
    assert.equal(sendButtonLabel("WHATSAPP", 47), "Enviar para 47 pessoas");
    assert.equal(sendButtonLabel("WHATSAPP", 1), "Enviar para 1 pessoa");
    assert.equal(sendButtonLabel("AVISO", null), "Publicar para a igreja");
    assert.equal(sendButtonLabel("AVISO", 12), "Publicar para 12 pessoas");
    assert.equal(sendButtonLabel("AVISO", 12, true), "Salvar alterações");
  });

  it("o texto do automático de aniversário usa o horário escolhido", () => {
    assert.match(birthdayAutoDescription("08:00"), /todo dia às 8h\./);
    assert.match(birthdayAutoDescription("19:30"), /todo dia às 19h30\./);
    assert.match(birthdayAutoDescription(undefined), /todo dia às 8h\./);
  });

  it("junta publicações e WhatsApp num histórico só, do mais novo para o mais antigo", () => {
    const history = buildSentHistory({
      announcements: [{ id: "a1", title: "Retiro", publishedAt: "2026-11-02T10:00:00Z", isPublic: true }],
      verses: [{ id: "v1", reference: "Sl 23", publishedAt: "2026-11-05T10:00:00Z" }],
      logs: [
        {
          id: "l1",
          createdAt: "2026-11-04T10:00:00Z",
          audience: "VISITOR",
          status: "DONE",
          totalCount: 3,
          successCount: 2,
          failedCount: 1,
          ruleId: "r1",
          template: { name: "Obrigado pela visita" },
        },
      ],
    });
    assert.deepEqual(history.map((item) => item.key), ["VERSICULO-v1", "WHATSAPP-l1", "AVISO-a1"]);
    assert.equal(history[1].manageable, false);
    assert.equal(history[1].meta, "Só visitantes · 2 enviadas · 1 não chegou · Automático");
    assert.equal(history[2].meta, "No app e na página pública");
  });
});

describe("pedidos de oração", () => {
  it("rótulos simples para quem pediu", () => {
    assert.equal(prayerStatusInfo("PENDING").label, "Em revisão");
    assert.equal(prayerStatusInfo("REJECTED").label, "Não publicado");
    assert.equal(prayerStatusInfo(undefined).label, "Em revisão");
  });

  it("conta por situação", () => {
    assert.deepEqual(
      countPrayerStatuses([{ status: "PENDING" }, { status: "APPROVED" }, { status: "PENDING" }]),
      { PENDING: 2, APPROVED: 1, REJECTED: 0 },
    );
  });
});
