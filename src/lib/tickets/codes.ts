import { randomBytes, randomInt } from "node:crypto";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I

function randomString(len: number): string {
  const bytes = randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

/** Human-readable order reference, e.g. "BLG-7KQ2-M9XT". Brand-neutral prefix stays stable. */
export function generateOrderNumber(): string {
  return `BLG-${randomString(4)}-${randomString(4)}`;
}

/** Ticket code used for QR check-in. 12 chars → ~60 bits of entropy. */
export function generateTicketCode(): string {
  return `${randomString(4)}-${randomString(4)}-${randomString(4)}`;
}

export function randomSlugSuffix(): string {
  return String(randomInt(100, 999));
}
