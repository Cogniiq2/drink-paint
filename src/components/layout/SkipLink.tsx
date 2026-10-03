import { copy } from "@/content/de/copy";

export function SkipLink() {
  return (
    <a href="#main" className="sr-only-focusable fixed left-4 top-4 z-[100] bg-ink text-ivory px-4 py-3 rounded-xs">
      {copy.nav.skip}
    </a>
  );
}
