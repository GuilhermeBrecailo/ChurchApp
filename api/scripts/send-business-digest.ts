import { sendBusinessDigest } from "../src/application/jobs/businessDigest";

const result = await sendBusinessDigest();
console.log(result.sent ? "Digest enviado." : "Digest nao enviado (numero nao configurado).");
process.exit(0);
