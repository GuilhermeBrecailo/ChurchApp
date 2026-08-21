const serviceUrl = process.env.WHATSAPP_SERVICE_URL || "http://localhost:3060";
const gatewaySecret = process.env.WHATSAPP_GATEWAY_SECRET || "";

// Numeros sao cadastrados no Rol/roster como o pastor digita - normalmente
// DDD + numero, sem o codigo do pais (ex: "41999999999"). O gateway de
// WhatsApp so resolve o contato pelo numero internacional completo
// (ex: "5541999999999"), entao sem isso todo envio falha silenciosamente
// como "numero nao encontrado" mesmo pra numeros validos.
function normalizeBrazilianNumber(rawNumber: string): string {
  const digits = rawNumber.replace(/\D/g, "");
  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) {
    return digits;
  }
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }
  return digits;
}

async function callWhatsAppService<T>(
  path: string,
  tenantId: string,
  body?: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(`${serviceUrl}/whatsapp-service${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-auth-required": "true",
      "x-gateway-secret": gatewaySecret,
      "x-tenant-id": tenantId,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    const message = typeof data?.message === "string" ? data.message : "Erro no serviço de WhatsApp";
    throw new Error(message);
  }

  return data as T;
}

// Registrar o tenant e criar a sessao lancam erro (constraint unica) se ja
// existirem - aqui isso e o caminho normal (igreja reconectando), entao o
// erro e engolido de proposito em vez de propagado.
async function ensureTenantRegistered(tenantId: string, name: string) {
  try {
    await callWhatsAppService("/public/api/v1/tenant/register", tenantId, {
      tenant_id: tenantId,
      name,
    });
  } catch {
    // ja registrado - segue o fluxo
  }
}

async function ensureSessionCreated(tenantId: string, name: string) {
  try {
    await callWhatsAppService("/api/v1/session/create", tenantId, {
      session_id: tenantId,
      name,
      descricao: "",
    });
  } catch {
    // sessao ja existe - segue o fluxo
  }
}

export const WhatsAppServiceClient = {
  async connect(tenantId: string, churchName: string): Promise<{ qr: string }> {
    await ensureTenantRegistered(tenantId, churchName);
    await ensureSessionCreated(tenantId, churchName);

    return callWhatsAppService<{ qr: string }>(
      "/api/v1/session/new-qr-code",
      tenantId,
      { session_id: tenantId },
    );
  },

  async isConnected(tenantId: string): Promise<boolean> {
    try {
      const result = await callWhatsAppService<{ connected: boolean }>(
        "/api/v1/session/is-connected",
        tenantId,
        { session_id: tenantId },
      );
      return result.connected;
    } catch {
      // sessao nunca criada ainda - trata como desconectado
      return false;
    }
  },

  async disconnect(tenantId: string): Promise<void> {
    await callWhatsAppService("/api/v1/session/logout", tenantId, {
      session_id: tenantId,
    });
  },

  async sendText(tenantId: string, number: string, text: string): Promise<void> {
    await callWhatsAppService("/api/v1/message/send-text", tenantId, {
      session_id: tenantId,
      number: normalizeBrazilianNumber(number),
      text,
    });
  },

  // Confere se o numero esta registrado no WhatsApp antes de mandar mensagem
  // pra ele (evita gastar o rate limit do envio em massa com numero errado).
  // Mesmo tratamento de erro do isConnected: sessao nao pronta ou numero mal
  // formatado nao deve derrubar quem chamou, so reporta "nao existe".
  async checkNumberExists(tenantId: string, number: string): Promise<boolean> {
    try {
      const result = await callWhatsAppService<{ exists: boolean }>(
        "/api/v1/contact/check-exists",
        tenantId,
        { session_id: tenantId, number: normalizeBrazilianNumber(number) },
      );
      return result.exists;
    } catch {
      return false;
    }
  },
};
