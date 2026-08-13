// Chamado pelo script de monitoramento host-level (bash, fora do container)
// via `docker exec api-igreja npm run whatsapp:alert -- "mensagem"`.
import { sendWhatsAppMessage } from "../src/infrastructure/whatsapp/WhatsAppClient";

const message = process.argv.slice(2).join(" ").trim();

if (!message) {
  console.error("Uso: npm run whatsapp:alert -- \"mensagem\"");
  process.exit(1);
}

const alertNumber = process.env.WHATSAPP_ALERT_NUMBER?.trim();
if (!alertNumber) {
  console.error("WHATSAPP_ALERT_NUMBER nao configurado");
  process.exit(1);
}

await sendWhatsAppMessage(alertNumber, message);
console.log("Alerta enviado.");
process.exit(0);
