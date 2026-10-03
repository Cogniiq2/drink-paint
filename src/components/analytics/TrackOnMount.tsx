"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics";
import type { AnalyticsEvent } from "@/lib/analytics/events";

export function TrackOnMount({ event }: { event: AnalyticsEvent }) {
  useEffect(() => {
    track(event);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event.name]);
  return null;
}
