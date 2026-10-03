"use client";

import { useId, useState } from "react";

export interface AccordionItem {
  id: string;
  q: string;
  a: string;
}

/**
 * Native <details> for progressive enhancement and keyboard support, with a
 * height transition driven by CSS grid rows (transform/opacity only elsewhere).
 */
export function Accordion({ items }: { items: AccordionItem[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const base = useId();
  return (
    <div className="hairline-t">
      {items.map((item) => {
        const isOpen = open === item.id;
        const panelId = `${base}-${item.id}`;
        return (
          <div key={item.id} className="hairline-b">
            <h3 className="m-0">
              <button
                type="button"
                className="group flex w-full items-baseline justify-between gap-6 py-5 text-left font-display text-xl md:text-2xl leading-tight min-h-[56px]"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(isOpen ? null : item.id)}
              >
                <span>{item.q}</span>
                <span
                  aria-hidden="true"
                  className="font-sans text-base text-muted transition-transform duration-300 ease-out"
                  style={{ transform: isOpen ? "rotate(45deg)" : "none" }}
                >
                  +
                </span>
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              className="grid transition-[grid-template-rows] duration-500 ease-out"
              style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
              hidden={!isOpen ? undefined : undefined}
              aria-hidden={!isOpen}
            >
              <div className="overflow-hidden">
                <p className="measure-wide pb-6 text-muted text-base" style={{ textWrap: "pretty" }}>
                  {item.a}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
