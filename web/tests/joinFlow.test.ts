import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildJoinLink,
  destinationAfterJoin,
  initialJoinStep,
  isAccountExistsResponse,
  loginRedirectForJoin,
  normalizeInviteCode,
  normalizeJoinForm,
  validateJoinForm,
} from "../app/utils/joinFlow";
import {
  noChurchHome,
  resolveFirstRunRedirect,
  safeRedirectPath,
} from "../app/utils/firstRunRoutes";
import {
  buildWhatsAppLink,
  memberPasswordHelpMessage,
  SUPPORT_WHATSAPP,
} from "../app/utils/supportContact";

const validForm = {
  name: "Maria Souza",
  phone: "(41) 99999-8888",
  email: "Maria@Exemplo.com ",
  password: "segredo1",
};

describe("participar de uma igreja (/join)", () => {
  it("normaliza o código digitado ou vindo do link", () => {
    assert.equal(normalizeInviteCode(" ab12-cd34 "), "AB12CD34");
    assert.equal(normalizeInviteCode(undefined), "");
    assert.equal(normalizeInviteCode(["x"]), "");
  });

  it("monta o link de convite que abre o /join com o código", () => {
    assert.equal(
      buildJoinLink("https://churchapp.site/", "ab12cd34"),
      "https://churchapp.site/join?code=AB12CD34",
    );
  });

  it("pula o passo do código quando ele vem no link", () => {
    assert.equal(initialJoinStep("AB12CD34"), "confirm");
    assert.equal(initialJoinStep(""), "code");
    assert.equal(initialJoinStep(undefined), "code");
  });

  it("manda quem já tem conta para o login e continua o pedido depois", () => {
    const url = loginRedirectForJoin("ab12cd34");
    assert.equal(url, "/login?redirect=%2Fjoin%3Fcode%3DAB12CD34%26continuar%3D1");
    const redirect = new URL(url, "https://x.test").searchParams.get("redirect");
    assert.equal(redirect, "/join?code=AB12CD34&continuar=1");
    assert.equal(safeRedirectPath(redirect), redirect);
  });

  it("reconhece a resposta de conta existente pelo código ou pela mensagem antiga", () => {
    assert.equal(isAccountExistsResponse({ code: "ACCOUNT_EXISTS", error: "x" }), true);
    assert.equal(
      isAccountExistsResponse({ error: "Já existe uma conta com esse email. Faça login…" }),
      true,
    );
    assert.equal(isAccountExistsResponse({ error: "Código de convite inválido" }), false);
    assert.equal(isAccountExistsResponse(null), false);
  });

  it("valida o formulário com mensagens simples, na ordem dos campos", () => {
    assert.equal(validateJoinForm(validForm), "");
    assert.equal(validateJoinForm({ ...validForm, name: " " }), "Escreva seu nome.");
    assert.equal(validateJoinForm({ ...validForm, phone: "" }), "Informe seu WhatsApp.");
    assert.equal(validateJoinForm({ ...validForm, phone: "9999" }), "Confira o WhatsApp: use DDD + número.");
    assert.equal(validateJoinForm({ ...validForm, email: "maria" }), "Confira o e-mail.");
    assert.equal(
      validateJoinForm({ ...validForm, password: "123" }),
      "A senha precisa ter pelo menos 6 caracteres.",
    );
  });

  it("limpa os dados antes de enviar", () => {
    assert.deepEqual(normalizeJoinForm({ ...validForm, name: "  Maria   Souza " }), {
      name: "Maria Souza",
      phone: "(41) 99999-8888",
      email: "maria@exemplo.com",
      password: "segredo1",
    });
  });

  it("depois do pedido, quem não tem igreja aguarda aprovação", () => {
    assert.equal(destinationAfterJoin({ pending: true }, false), "/onboarding/aguardando");
    assert.equal(destinationAfterJoin({ pending: true }, true), "/");
    assert.equal(destinationAfterJoin({ pending: false, alreadyMember: true }, false), "/");
  });
});

describe("redirecionamentos de primeiro uso (middleware)", () => {
  const route = (path: string, fullPath = path) => ({ path, fullPath });

  it("senha provisória vem antes de tudo e guarda o destino", () => {
    assert.equal(
      resolveFirstRunRedirect({ mustChangePassword: true, hasChurch: true }, route("/scale", "/scale?aba=minhas")),
      "/definir-senha?redirect=%2Fscale%3Faba%3Dminhas",
    );
    assert.equal(
      resolveFirstRunRedirect({ mustChangePassword: true, hasChurch: true }, route("/")),
      "/definir-senha",
    );
    assert.equal(
      resolveFirstRunRedirect({ mustChangePassword: true }, route("/definir-senha")),
      null,
    );
  });

  it("sai da tela de senha quando não há senha provisória", () => {
    assert.equal(resolveFirstRunRedirect({ hasChurch: true }, route("/definir-senha")), "/");
  });

  it("pastor sem igreja vai criar a igreja", () => {
    const pastor = { role: "PASTOR", hasChurch: false };
    assert.equal(noChurchHome(pastor), "/onboarding/church");
    assert.equal(resolveFirstRunRedirect(pastor, route("/")), "/onboarding/church");
    assert.equal(resolveFirstRunRedirect(pastor, route("/onboarding/church")), null);
    assert.equal(resolveFirstRunRedirect(pastor, route("/user")), null);
  });

  it("membro sem igreja e sem pedido vai para o convite", () => {
    const member = { role: "MEMBER", hasChurch: false, pendingChurches: [] };
    assert.equal(resolveFirstRunRedirect(member, route("/scale")), "/join");
    assert.equal(resolveFirstRunRedirect(member, route("/onboarding/church")), "/join");
  });

  it("pedido pendente leva para Aguardando aprovação, mas deixa tentar outro código", () => {
    const pending = {
      role: "MEMBER",
      hasChurch: false,
      pendingChurches: [{ id: "c1", name: "Igreja X", slug: "igreja-x" }],
    };
    assert.equal(resolveFirstRunRedirect(pending, route("/")), "/onboarding/aguardando");
    assert.equal(resolveFirstRunRedirect(pending, route("/onboarding/aguardando")), null);
    assert.equal(resolveFirstRunRedirect(pending, route("/join")), null);
  });

  it("quem já tem igreja não fica preso nas telas de primeiro uso", () => {
    const member = { role: "MEMBER", hasChurch: true };
    assert.equal(resolveFirstRunRedirect(member, route("/onboarding/aguardando")), "/");
    assert.equal(resolveFirstRunRedirect(member, route("/onboarding/church")), "/");
    assert.equal(resolveFirstRunRedirect(member, route("/scale")), null);
  });

  it("admin da plataforma sem igreja vai para o painel da plataforma", () => {
    const admin = { role: "SUPER_ADMIN", is_admin: true, hasChurch: false };
    assert.equal(resolveFirstRunRedirect(admin, route("/")), "/platform-admin");
    assert.equal(resolveFirstRunRedirect(admin, route("/platform-admin")), null);
    assert.equal(resolveFirstRunRedirect(admin, route("/scale")), "/platform-admin");
  });

  it("só aceita redirecionamentos internos", () => {
    assert.equal(safeRedirectPath("/scale?aba=minhas"), "/scale?aba=minhas");
    assert.equal(safeRedirectPath("//evil.com"), "/");
    assert.equal(safeRedirectPath("/\\evil.com"), "/");
    assert.equal(safeRedirectPath("https://evil.com"), "/");
    assert.equal(safeRedirectPath(undefined, "/x"), "/x");
    assert.equal(safeRedirectPath("/definir-senha?redirect=/"), "/");
  });
});

describe("ajuda com a senha pelo WhatsApp", () => {
  it("monta o link do wa.me com a mensagem pronta", () => {
    const link = buildWhatsAppLink("+55 (41) 99999-0000", memberPasswordHelpMessage("maria@exemplo.com"));
    assert.match(link, /^https:\/\/wa\.me\/5541999990000\?text=/);
    assert.match(decodeURIComponent(link), /gerar uma senha temporária/);
    assert.match(decodeURIComponent(link), /maria@exemplo\.com/);
  });

  it("sem número (ou com o placeholder do suporte), deixa a pessoa escolher o contato", () => {
    assert.match(buildWhatsAppLink(null, "oi"), /^https:\/\/wa\.me\/\?text=oi$/);
    assert.match(buildWhatsAppLink(SUPPORT_WHATSAPP, "oi"), /^https:\/\/wa\.me\/\?text=oi$/);
  });
});
