"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { submitInquiry, type InquiryState } from "@/lib/actions/inquiry";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { copy } from "@/content/de/copy";
import { track } from "@/lib/analytics";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary" disabled={pending} aria-busy={pending}>
      {pending ? "Wird gesendet …" : copy.privateForm.submit}
    </button>
  );
}

export function PrivateInquiryForm() {
  const [state, action] = useActionState<InquiryState, FormData>(submitInquiry, {});
  const f = copy.privateForm;

  useEffect(() => {
    if (state.status === "sent") track({ name: "private_event_lead", props: { type: "inquiry" } });
  }, [state.status]);

  if (state.status === "sent") {
    return (
      <div role="status" className="rise">
        <p className="display-sm">{f.successTitle}</p>
        <p className="mt-3 text-muted">{f.successText}</p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-6" noValidate>
      <div className="hidden" aria-hidden="true">
        <label>
          Website <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <div className="grid sm:grid-cols-2 gap-6">
        <Field label={f.name} name="name" error={state.fieldErrors?.name}>
          <Input name="name" autoComplete="name" required error={state.fieldErrors?.name} />
        </Field>
        <Field label={f.email} name="email" error={state.fieldErrors?.email}>
          <Input name="email" type="email" autoComplete="email" required error={state.fieldErrors?.email} />
        </Field>
      </div>
      <div className="grid sm:grid-cols-2 gap-6">
        <Field label={f.phone} name="phone">
          <Input name="phone" type="tel" autoComplete="tel" inputMode="tel" />
        </Field>
        <Field label={f.type} name="eventType" error={state.fieldErrors?.eventType}>
          <Select name="eventType" defaultValue="" required error={state.fieldErrors?.eventType}>
            <option value="" disabled>
              Bitte wählen
            </option>
            {f.types.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <div className="grid sm:grid-cols-3 gap-6">
        <Field label={f.guests} name="guests" error={state.fieldErrors?.guests}>
          <Input name="guests" type="number" inputMode="numeric" min={1} max={500} required error={state.fieldErrors?.guests} />
        </Field>
        <Field label={f.date} name="preferredDate" error={state.fieldErrors?.preferredDate}>
          <Input name="preferredDate" type="date" />
        </Field>
        <Field label={f.altDate} name="alternativeDate">
          <Input name="alternativeDate" type="date" />
        </Field>
      </div>
      <Field label={f.message} name="message">
        <Textarea name="message" rows={4} />
      </Field>
      {state.error && (
        <p className="text-sm text-wine" role="alert">
          {state.error}
        </p>
      )}
      <Submit />
    </form>
  );
}
