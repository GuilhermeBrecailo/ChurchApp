import { createHmac, timingSafeEqual } from "node:crypto";
import { InstagramIntegrationError } from "./InstagramBusinessLoginService";

export type InstagramSignedRequest = {
  userId: string;
  [key: string]: unknown;
};

function decodeBase64Url(value: string) {
  return Buffer.from(value, "base64url");
}

export function parseInstagramSignedRequest(
  signedRequest: string,
  appSecret = process.env.INSTAGRAM_APP_SECRET,
): InstagramSignedRequest {
  if (!appSecret?.trim()) {
    throw new InstagramIntegrationError();
  }

  const [signaturePart, payloadPart] = signedRequest.split(".");
  if (!signaturePart || !payloadPart) {
    throw new InstagramIntegrationError();
  }

  const expectedSignature = createHmac("sha256", appSecret)
    .update(payloadPart)
    .digest();
  const receivedSignature = decodeBase64Url(signaturePart);
  if (
    receivedSignature.length !== expectedSignature.length ||
    !timingSafeEqual(receivedSignature, expectedSignature)
  ) {
    throw new InstagramIntegrationError();
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(decodeBase64Url(payloadPart).toString("utf8"));
  } catch {
    throw new InstagramIntegrationError();
  }

  const rawUserId = payload.user_id ?? payload.instagram_user_id;
  if (typeof rawUserId !== "string" && typeof rawUserId !== "number") {
    throw new InstagramIntegrationError();
  }

  return { ...payload, userId: String(rawUserId) };
}
