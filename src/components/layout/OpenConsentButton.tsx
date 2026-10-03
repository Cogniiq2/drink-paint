"use client";

export function OpenConsentButton({ label }: { label: string }) {
  return (
    <button type="button" className="hover:opacity-70 transition-opacity" onClick={() => window.dispatchEvent(new Event("bolagio:consent:open"))}>
      {label}
    </button>
  );
}
