// Setup unico: imprime o QR code como ASCII direto no stdout (sem depender
// de envio de arquivo/imagem) pra escanear com o WhatsApp do celular
// (Aparelhos conectados > Conectar um aparelho). Persiste a sessao em
// api/.whatsapp-auth/ assim que autenticar - os jobs de cron reusam essa
// sessao sem precisar reautenticar.
import qrcodeTerminal from "qrcode-terminal";
import { connectForSetup } from "../src/infrastructure/whatsapp/WhatsAppClient";

console.log("Aguardando QR code do WhatsApp...");

try {
  await connectForSetup((qr) => {
    console.log("QR_ASCII_START");
    qrcodeTerminal.generate(qr, { small: true }, (ascii) => {
      console.log(ascii);
      console.log("QR_ASCII_END");
    });
  });

  // creds.update final (com registered:true) e' assincrono - sair na hora
  // corta a escrita no meio e deixa creds.json com 0 bytes (foi exatamente
  // o que aconteceu na primeira vez). Da tempo do fs.writeFile do Baileys
  // terminar antes de matar o processo.
  await new Promise((resolve) => setTimeout(resolve, 3000));

  console.log("WHATSAPP_CONNECTED");
  process.exit(0);
} catch (error) {
  console.log(`WHATSAPP_SETUP_FAILED:${(error as Error).message}`);
  process.exit(1);
}
