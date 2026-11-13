import crypto from "node:crypto";

// Sem letras/números que se confundem (0/O, 1/l/I): a senha é ditada ou
// mandada por WhatsApp para gente que vai digitar no celular.
const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

export function generateTemporaryPassword(length = 10) {
  let password = "";
  for (let index = 0; index < length; index += 1) {
    password += ALPHABET[crypto.randomInt(ALPHABET.length)];
  }
  return password;
}
