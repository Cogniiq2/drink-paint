import "server-only";
import Stripe from "stripe";
import { env, hasStripe } from "@/config/env";

let client: Stripe | null = null;

/** Server-only Stripe client. Returns null in development without a key. */
export function getStripe(): Stripe | null {
  if (!hasStripe()) return null;
  if (!client) client = new Stripe(env().STRIPE_SECRET_KEY!, { typescript: true });
  return client;
}
