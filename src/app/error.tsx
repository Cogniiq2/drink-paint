"use client";

import { useEffect } from "react";
import Link from "next/link";
import { copy } from "@/content/de/copy";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  const e = copy.errors;
  return (
    <main id="main" className="surface-bone min-h-svh flex items-center">
      <div className="container-x mx-auto max-w-[1440px] w-full py-24">
        <p className="eyebrow">Fehler</p>
        <h1 className="display-lg mt-4 max-w-[14ch]">{e.genericTitle}</h1>
        <p className="lede mt-6 text-muted max-w-[40ch]">{e.genericText}</p>
        <div className="mt-8 flex gap-4">
          <button type="button" onClick={reset} className="btn btn-primary">
            {e.retry}
          </button>
          <Link href="/" className="btn btn-outline">
            {e.notFoundCta}
          </Link>
        </div>
      </div>
    </main>
  );
}
