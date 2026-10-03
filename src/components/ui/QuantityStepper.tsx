"use client";

export function QuantityStepper({
  value,
  min = 1,
  max,
  onChange,
  label = "Anzahl",
}: {
  value: number;
  min?: number;
  max: number;
  onChange: (v: number) => void;
  label?: string;
}) {
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));
  return (
    <div className="inline-flex items-center border border-hairline-strong rounded-xs" role="group" aria-label={label}>
      <button type="button" onClick={dec} disabled={value <= min} className="h-12 w-12 text-lg disabled:opacity-30 transition-colors hover:bg-surface-2" aria-label="Weniger">
        −
      </button>
      <output className="w-12 text-center tabular text-base" aria-live="polite">
        {value}
      </output>
      <button type="button" onClick={inc} disabled={value >= max} className="h-12 w-12 text-lg disabled:opacity-30 transition-colors hover:bg-surface-2" aria-label="Mehr">
        +
      </button>
    </div>
  );
}
