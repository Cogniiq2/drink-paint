"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/lib/actions/admin";
import { btn, input, label } from "./ui";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  return (
    <form action={action} className="bg-white border border-hairline rounded-md p-6 space-y-4">
      <input type="hidden" name="next" value={next} />
      <div>
        <label htmlFor="password" className={label}>
          Passwort
        </label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className={input} />
      </div>
      {state.error && (
        <p className="text-sm text-red-700" role="alert">
          {state.error}
        </p>
      )}
      <button className={btn} disabled={pending}>
        {pending ? "…" : "Anmelden"}
      </button>
    </form>
  );
}
