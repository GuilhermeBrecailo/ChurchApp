import path from "node:path";
import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
  type WASocket,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import pino from "pino";

// Sessao persistida em disco (bind-mount do host em producao - sobrevive a
// restart/rebuild do container, ver docker-compose.yml). Autenticada uma
// unica vez via scripts/whatsapp-setup.ts (QR code escaneado no celular do
// boss man). Relativo a cwd (sempre api/ - todo script roda via
// "npx tsx --env-file=.env scripts/..." de dentro de api/), nao a
// import.meta.url, pra nao forcar modulo ESM no ts-jest (module: commonjs).
export const WHATSAPP_AUTH_DIR = path.resolve(process.cwd(), ".whatsapp-auth");

const logger = pino({ level: "silent" });

function toJid(phoneNumber: string): string {
  const digitsOnly = phoneNumber.replace(/\D/g, "");
  return `${digitsOnly}@s.whatsapp.net`;
}

type ConnectOptions = {
  onQr?: (qr: string) => void;
  printQrInTerminal?: boolean;
};

// Conecta, executa `onOpen`, fecha o socket. Cron dispara isso uma vez por
// job em vez de manter um processo Node vivo o tempo todo - mais simples de
// operar (systemd/cron sem daemon) e evita segurar uma conexao WebSocket
// ociosa entre execucoes.
async function withConnection<T>(
  run: (socket: WASocket) => Promise<T>,
  options: ConnectOptions = {},
): Promise<T> {
  const { state, saveCreds } = await useMultiFileAuthState(WHATSAPP_AUTH_DIR);
  const { version } = await fetchLatestBaileysVersion();

  const socket = makeWASocket({
    version,
    auth: state,
    logger,
    printQRInTerminal: false,
    browser: ["ChurchApp", "Chrome", "1.0.0"],
  });

  socket.ev.on("creds.update", saveCreds);

  return new Promise<T>((resolve, reject) => {
    let settled = false;

    socket.ev.on("connection.update", (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr && options.onQr) {
        options.onQr(qr);
      }

      if (connection === "open" && !settled) {
        settled = true;
        run(socket)
          .then((result) => {
            socket.end(undefined);
            resolve(result);
          })
          .catch((error) => {
            socket.end(undefined);
            reject(error);
          });
      }

      if (connection === "close" && !settled) {
        const statusCode = (lastDisconnect?.error as Boom | undefined)?.output
          ?.statusCode;
        const loggedOut = statusCode === DisconnectReason.loggedOut;
        settled = true;
        reject(
          new Error(
            loggedOut
              ? "Sessao do WhatsApp desconectada (logout) - rode scripts/whatsapp-setup.ts de novo pra reautenticar."
              : `Conexao com o WhatsApp fechou antes de abrir (status ${statusCode ?? "desconhecido"}).`,
          ),
        );
      }
    });
  });
}

// Usado apenas pelo setup inicial - precisa do QR code e do socket ficando
// vivo ate a autenticacao completar (nao ha `run` a executar ainda).
//
// Depois que o WhatsApp aceita o scan/codigo, ele fecha a conexao com
// restartRequired (515) de proposito - e' o sinal de "credenciais aceitas,
// reconecta pra terminar o registro", nao uma falha. Sem reconectar aqui, o
// scan bem-sucedido aparecia como erro (foi exatamente o que aconteceu nas
// primeiras tentativas desta sessao).
export async function connectForSetup(
  onQr: (qr: string) => void,
  attempt = 1,
): Promise<void> {
  if (attempt > 5) {
    throw new Error("Muitas tentativas de reconexao apos o scan. Roda o setup de novo.");
  }

  const { state, saveCreds } = await useMultiFileAuthState(WHATSAPP_AUTH_DIR);
  const { version } = await fetchLatestBaileysVersion();

  const socket = makeWASocket({
    version,
    auth: state,
    logger,
    printQRInTerminal: false,
    browser: ["ChurchApp", "Chrome", "1.0.0"],
    connectTimeoutMs: 120_000,
  });

  socket.ev.on("creds.update", saveCreds);

  return new Promise<void>((resolve, reject) => {
    let settled = false;

    socket.ev.on("connection.update", (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) onQr(qr);

      if (connection === "open" && !settled) {
        settled = true;
        resolve();
      }

      if (connection === "close" && !settled) {
        const statusCode = (lastDisconnect?.error as Boom | undefined)?.output
          ?.statusCode;
        const loggedOut = statusCode === DisconnectReason.loggedOut;
        const restartRequired = statusCode === DisconnectReason.restartRequired;

        if (restartRequired) {
          settled = true;
          connectForSetup(onQr, attempt + 1).then(resolve, reject);
          return;
        }

        settled = true;
        reject(
          new Error(
            loggedOut
              ? "Sessao do WhatsApp desconectada (logout) - rode scripts/whatsapp-setup.ts de novo pra reautenticar."
              : `Conexao com o WhatsApp fechou antes de abrir (status ${statusCode ?? "desconhecido"}).`,
          ),
        );
      }
    });
  });
}

// Alternativa ao QR: gera um codigo de 8 caracteres pra digitar direto no
// WhatsApp do celular (Aparelhos conectados > Conectar com numero de
// telefone) - mais confiavel que escanear um QR renderizado dentro do chat,
// que expira em ~20s e costuma perder a janela.
export async function connectForSetupWithPairingCode(
  phoneNumber: string,
  onCode: (code: string) => void,
  attempt = 1,
): Promise<void> {
  if (attempt > 5) {
    throw new Error("Muitas tentativas de reconexao apos o pareamento. Roda o setup de novo.");
  }

  const { state, saveCreds } = await useMultiFileAuthState(WHATSAPP_AUTH_DIR);
  const { version } = await fetchLatestBaileysVersion();

  const socket = makeWASocket({
    version,
    auth: state,
    logger,
    printQRInTerminal: false,
    browser: ["ChurchApp", "Chrome", "1.0.0"],
    // Default do Baileys e' 20s - tempo real de um humano ler o codigo,
    // abrir o WhatsApp e digitar os 8 caracteres passa disso facil, e a
    // conexao fecha com "timedOut" (408) antes de dar tempo. 2 minutos da
    // folga de sobra sem segurar o processo indefinidamente.
    connectTimeoutMs: 120_000,
  });

  socket.ev.on("creds.update", saveCreds);

  return new Promise<void>((resolve, reject) => {
    let codeRequested = false;
    let settled = false;

    socket.ev.on("connection.update", (update) => {
      const { connection, lastDisconnect } = update;

      // Pedir o codigo so depois que o handshake WS termina ("connecting" ->
      // "connected to WA" internamente) - pedir logo apos makeWASocket()
      // ainda com o socket em handshake derruba a conexao com "Connection
      // Closed" (428) porque o transporte ainda nao tem canal de escrita.
      if (connection === "connecting" && !codeRequested && !socket.authState.creds.registered) {
        codeRequested = true;
        setTimeout(async () => {
          try {
            const digitsOnly = phoneNumber.replace(/\D/g, "");
            const code = await socket.requestPairingCode(digitsOnly);
            onCode(code);
          } catch (error) {
            reject(error);
          }
        }, 3000);
      }

      if (connection === "open" && !settled) {
        settled = true;
        resolve();
      }

      if (connection === "close" && !settled) {
        const statusCode = (lastDisconnect?.error as Boom | undefined)?.output
          ?.statusCode;
        const loggedOut = statusCode === DisconnectReason.loggedOut;
        const restartRequired = statusCode === DisconnectReason.restartRequired;

        if (restartRequired) {
          settled = true;
          connectForSetupWithPairingCode(phoneNumber, onCode, attempt + 1).then(resolve, reject);
          return;
        }

        settled = true;
        if (!loggedOut) {
          reject(
            new Error(
              `Conexao fechou antes de autenticar (status ${statusCode ?? "desconhecido"}). Tenta rodar de novo.`,
            ),
          );
        }
      }
    });
  });
}

export async function sendWhatsAppMessage(
  phoneNumber: string,
  text: string,
): Promise<void> {
  const jid = toJid(phoneNumber);
  await withConnection(async (socket) => {
    await socket.sendMessage(jid, { text });
  });
}
