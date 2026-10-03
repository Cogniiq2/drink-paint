import type { ComponentProps, ReactNode } from "react";

interface FieldProps {
  label: string;
  name: string;
  hint?: string;
  error?: string;
  children?: ReactNode;
  optional?: boolean;
}

export function Field({ label, name, hint, error, children, optional }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-sm text-muted">
        {label}
        {optional && <span className="opacity-70"> · optional</span>}
      </label>
      {children}
      {hint && !error && (
        <p id={`${name}-hint`} className="text-sm text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${name}-error`} className="text-sm text-wine" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function Input({ error, hint, ...rest }: ComponentProps<"input"> & { error?: string; hint?: string }) {
  const name = rest.name ?? rest.id;
  return (
    <input
      id={name}
      className="field-input"
      aria-invalid={error ? "true" : undefined}
      aria-describedby={error ? `${name}-error` : hint ? `${name}-hint` : undefined}
      {...rest}
    />
  );
}

export function Textarea({ error, ...rest }: ComponentProps<"textarea"> & { error?: string }) {
  const name = rest.name ?? rest.id;
  return <textarea id={name} className="field-input min-h-28 resize-y" aria-invalid={error ? "true" : undefined} aria-describedby={error ? `${name}-error` : undefined} {...rest} />;
}

export function Select({ error, children, ...rest }: ComponentProps<"select"> & { error?: string }) {
  const name = rest.name ?? rest.id;
  return (
    <select id={name} className="field-input" aria-invalid={error ? "true" : undefined} aria-describedby={error ? `${name}-error` : undefined} {...rest}>
      {children}
    </select>
  );
}

export function Checkbox({ label, name, error, ...rest }: ComponentProps<"input"> & { label: ReactNode; name: string; error?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="flex cursor-pointer items-start gap-3 text-sm leading-snug">
        <input
          id={name}
          name={name}
          type="checkbox"
          className="mt-0.5 h-5 w-5 shrink-0 appearance-none rounded-xs border border-hairline-strong bg-transparent checked:bg-text checked:border-text focus-visible:outline-2 transition-colors"
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error ? `${name}-error` : undefined}
          {...rest}
        />
        <span>{label}</span>
      </label>
      {error && (
        <p id={`${name}-error`} className="text-sm text-wine" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
