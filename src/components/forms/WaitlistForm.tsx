"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { joinWaitlist, type WaitlistState } from "@/lib/actions/waitlist";
import { Field, Input, Select } from "@/components/ui/Field";
import { copy } from "@/content/de/copy";
import { track } from "@/lib/analytics";

interface Option {
  slug: string;
  label: string;
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary" disabled={pending} aria-busy={pending}>
      {pending ? "Einen Moment …" : copy.waitlist.submit}
    </button>
  );
}

export function WaitlistForm({ options, defaultSlug, compact = false }: { options: Option[]; defaultSlug?: string; compact?: boolean }) {
  const [state, action] = useActionState<WaitlistState, FormData>(joinWaitlist, {});
  const w = copy.waitlist;

  useEffect(() => {
    if (state.status === "joined") track({ name: "waitlist_signup", props: { slug: defaultSlug ?? null } });
  }, [state.status, defaultSlug]);

  if (state.status) {
    const already = state.status === "already";
    return (
      <div role="status" className="rise">
        <p className="display-sm">{already ? w.alreadyTitle : w.successTitle}</p>
        <p className="mt-3 text-muted">{already ? w.alreadyText : w.successText}</p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-6 max-w-lg" noValidate>
      <div className="hidden" aria-hidden="true">
        <label>
          Website <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      {options.length > 0 && (
        <Field label={w.event} name="eventSlug">
          <Select name="eventSlug" defaultValue={defaultSlug ?? ""}>
            <option value="">{w.anyEvent}</option>
            {options.map((o) => (
              <option key={o.slug} value={o.slug}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>
      )}
      <div className={compact ? "space-y-6" : "grid sm:grid-cols-2 gap-6"}>
        <Field label={w.name} name="name" error={state.fieldErrors?.name}>
          <Input name="name" autoComplete="name" required error={state.fieldErrors?.name} />
        </Field>
        <Field label={w.email} name="email" error={state.fieldErrors?.email}>
          <Input name="email" type="email" inputMode="email" autoComplete="email" required error={state.fieldErrors?.email} />
        </Field>
      </div>
      <Field label={w.quantity} name="quantity">
        <Select name="quantity" defaultValue="1">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </Select>
      </Field>
      {state.error && (
        <p className="text-sm text-wine" role="alert">
          {state.error}
        </p>
      )}
      <Submit />
      <p className="text-xs text-muted">
        Keine Zahlung, keine Verpflichtung. Hinweise zur Verarbeitung in der{" "}
        <a href="/datenschutz" className="underline">
          Datenschutzerklärung
        </a>
        .
      </p>
    </form>
  );
}
