/**
 * Verification securisee du CRON_SECRET.
 * Utilise timingSafeEqual pour eviter les timing attacks.
 */

import { timingSafeEqual } from "crypto";

export function verifyCronSecret(authHeader: string | null): {
  ok: boolean;
  error?: string;
  status: number;
} {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error("[cron] CRON_SECRET non configure");
    return { ok: false, error: "CRON_SECRET not configured", status: 500 };
  }

  const expected = `Bearer ${cronSecret}`;
  const provided = authHeader ?? "";

  // timingSafeEqual exige des buffers de meme longueur
  // On compare d'abord la longueur, puis le contenu
  if (Buffer.byteLength(provided) !== Buffer.byteLength(expected)) {
    return { ok: false, error: "Unauthorized", status: 401 };
  }

  const isValid = timingSafeEqual(
    Buffer.from(provided),
    Buffer.from(expected)
  );

  if (!isValid) {
    return { ok: false, error: "Unauthorized", status: 401 };
  }

  return { ok: true, status: 200 };
}
