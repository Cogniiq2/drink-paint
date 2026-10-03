/**
 * Minimal, dependency-free admin auth: a single shared password and an
 * HMAC-SHA256 signed session cookie (Web Crypto, so it also runs in proxy.ts).
 * For multiple operators switch to Supabase Auth; the `requireAdmin` boundary
 * is the only place that would change.
 */
export const ADMIN_COOKIE = "bolagio_admin";
const SESSION_HOURS = 12;

const enc = new TextEncoder();

async function hmac(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return Buffer.from(sig).toString("base64url");
}

export async function createSessionToken(secret: string): Promise<string> {
  const exp = Date.now() + SESSION_HOURS * 3600_000;
  const nonce = Buffer.from(crypto.getRandomValues(new Uint8Array(12))).toString("base64url");
  const payload = `${exp}.${nonce}`;
  return `${payload}.${await hmac(secret, payload)}`;
}

export async function verifySessionToken(token: string | undefined, secret: string | undefined): Promise<boolean> {
  if (!token || !secret) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [exp, nonce, sig] = parts;
  if (Number(exp) < Date.now()) return false;
  const expected = await hmac(secret, `${exp}.${nonce}`);
  if (expected.length !== sig.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  return diff === 0;
}

/** Constant-time password comparison. */
export async function passwordMatches(input: string, expected: string | undefined): Promise<boolean> {
  if (!expected) return false;
  const a = await hmac("pw", input);
  const b = await hmac("pw", expected);
  return a === b;
}
