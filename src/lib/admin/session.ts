import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { env } from "@/config/env";
import { ADMIN_COOKIE, verifySessionToken } from "./auth";

export async function isAdmin(): Promise<boolean> {
  const jar = await cookies();
  return verifySessionToken(jar.get(ADMIN_COOKIE)?.value, env().ADMIN_SESSION_SECRET);
}

/** Server-side gate for every admin page and action. The proxy is only an optimistic pre-check. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/login");
}

export const adminConfigured = () => Boolean(env().ADMIN_PASSWORD && env().ADMIN_SESSION_SECRET);
