import "server-only";
import { env, hasSupabase } from "@/config/env";
import type { DataStore } from "./store";
import { MemoryStore } from "./memory-store";
import { SupabaseStore } from "./supabase-store";

/**
 * Process-wide singleton. In development the memory store survives HMR via
 * globalThis so inventory state is not lost on every file save.
 */
const g = globalThis as unknown as { __bolagioStore?: DataStore };

export function getStore(): DataStore {
  if (g.__bolagioStore) return g.__bolagioStore;
  const e = env();
  g.__bolagioStore = hasSupabase() ? new SupabaseStore(e.SUPABASE_URL!, e.SUPABASE_SERVICE_ROLE_KEY!) : new MemoryStore();
  return g.__bolagioStore;
}

export * from "./types";
export type { DataStore } from "./store";
