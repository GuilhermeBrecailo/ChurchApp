import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const algorithm = "aes-256-gcm";

function encryptionKey() {
  const secret =
    process.env.INSTAGRAM_TOKEN_ENCRYPTION_KEY || process.env.ENCRYPTION_KEY;
  if (!secret?.trim()) {
    throw new Error("INSTAGRAM_TOKEN_ENCRYPTION_KEY não configurada");
  }

  return createHash("sha256").update(secret).digest();
}

export function encryptInstagramToken(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv(algorithm, encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return ["v1", iv.toString("hex"), tag.toString("hex"), ciphertext.toString("hex")].join(":");
}

export function decryptInstagramToken(value: string) {
  const [version, ivHex, tagHex, ciphertextHex] = value.split(":");
  if (version !== "v1" || !ivHex || !tagHex || !ciphertextHex) {
    throw new Error("Token do Instagram armazenado em formato inválido");
  }

  const decipher = createDecipheriv(
    algorithm,
    encryptionKey(),
    Buffer.from(ivHex, "hex"),
  );
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));

  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextHex, "hex")),
    decipher.final(),
  ]).toString("utf8");
}
