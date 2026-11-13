import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  consentAllowsDigitalContact,
  contactOptions,
  phoneHref,
  whatsAppHref,
  whatsAppShareHref,
} from "../app/utils/contactConsent";

describe("autorização de contato digital (LGPD)", () => {
  it("visitante só recebe WhatsApp/e-mail se autorizou", () => {
    assert.equal(consentAllowsDigitalContact({ status: "VISITOR", followUp: null }), false);
    assert.equal(
      consentAllowsDigitalContact({ status: "VISITOR", followUp: { consentToContact: false } }),
      false,
    );
    assert.equal(
      consentAllowsDigitalContact({ status: "VISITOR", followUp: { consentToContact: true } }),
      true,
    );
  });

  it("membro sem registro pode; registro explícito vale para todos", () => {
    assert.equal(consentAllowsDigitalContact({ status: "MEMBER" }), true);
    assert.equal(
      consentAllowsDigitalContact({ status: "MEMBER", followUp: { consentToContact: false } }),
      false,
    );
    assert.equal(consentAllowsDigitalContact({ status: "FORMER", hasAccount: true }), false);
    assert.equal(
      consentAllowsDigitalContact({ status: "FORMER", followUp: { consentToContact: true } }),
      true,
    );
    assert.equal(consentAllowsDigitalContact(null), false);
  });

  it("ligar fica sempre disponível; WhatsApp e e-mail dependem da autorização", () => {
    const blocked = contactOptions({
      status: "VISITOR",
      phone: "(11) 98888-7777",
      email: "bia@test.com",
      followUp: { consentToContact: false },
    });
    assert.deepEqual(blocked, {
      call: "tel:11988887777",
      whatsApp: null,
      email: null,
      blockedByConsent: true,
    });

    const allowed = contactOptions({ status: "MEMBER", phone: "11988887777", email: null });
    assert.equal(allowed.whatsApp, "https://wa.me/5511988887777");
    assert.equal(allowed.email, null);
    assert.equal(allowed.blockedByConsent, false);

    const noContact = contactOptions({ status: "VISITOR", phone: null, email: null });
    assert.equal(noContact.blockedByConsent, false);
    assert.equal(noContact.call, null);
  });

  it("monta links de WhatsApp e telefone", () => {
    assert.equal(whatsAppHref("+55 11 98888-7777"), "https://wa.me/5511988887777");
    assert.equal(whatsAppHref("123"), null);
    assert.equal(
      whatsAppHref("11988887777", "Olá, tudo bem?"),
      "https://wa.me/5511988887777?text=Ol%C3%A1%2C%20tudo%20bem%3F",
    );
    assert.equal(whatsAppShareHref("Oi"), "https://wa.me/?text=Oi");
    assert.equal(phoneHref("+55 (11) 98888-7777"), "tel:+5511988887777");
    assert.equal(phoneHref(""), null);
  });
});
