"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Re-fetches the success page while the webhook is still landing (max ~90 s). */
export function PendingRefresh() {
  const router = useRouter();
  useEffect(() => {
    let n = 0;
    const id = setInterval(() => {
      n += 1;
      if (n > 30) return clearInterval(id);
      router.refresh();
    }, 3000);
    return () => clearInterval(id);
  }, [router]);
  return null;
}
