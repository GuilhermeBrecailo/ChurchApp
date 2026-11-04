import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatNotificationRelativeDate,
  notificationToneFor,
} from "../app/utils/notificationDisplay";

describe("exibição de notificações", () => {
  it("classifica o tipo da notificação pelo contexto", () => {
    assert.equal(notificationToneFor({ type: "schedule", title: "Você foi escalado" }), "schedule");
    assert.equal(notificationToneFor({ title: "Novo membro no ministério" }), "member");
    assert.equal(notificationToneFor({ title: "Novo aviso da igreja" }), "announcement");
    assert.equal(notificationToneFor({ title: "Lembrete de ensaio" }), "general");
  });

  it("formata a data de forma relativa", () => {
    const now = new Date("2026-11-04T12:00:00Z").getTime();
    const ago = (ms: number) => new Date(now - ms).toISOString();

    assert.equal(formatNotificationRelativeDate(ago(10_000), now), "agora");
    assert.equal(formatNotificationRelativeDate(ago(5 * 60_000), now), "há 5 min");
    assert.equal(formatNotificationRelativeDate(ago(3 * 3_600_000), now), "há 3h");
    assert.equal(formatNotificationRelativeDate(ago(30 * 3_600_000), now), "ontem");
    assert.equal(formatNotificationRelativeDate(ago(3 * 86_400_000), now), "há 3 dias");
    assert.equal(formatNotificationRelativeDate("invalida", now), "");
  });
});
