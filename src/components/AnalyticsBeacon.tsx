"use client";

import { useEffect } from "react";

const SESSION_KEY = "px-visit-session";
const RECORDED_KEY = "px-visit-recorded";

function getSessionId() {
  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

export function AnalyticsBeacon({ path = "/" }: { path?: string }) {
  useEffect(() => {
    if (sessionStorage.getItem(RECORDED_KEY)) return;

    const sessionId = getSessionId();
    const payload = {
      sessionId,
      path,
      referrer: document.referrer || null,
    };

    fetch("/api/analytics/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    })
      .then((res) => {
        if (res.ok) sessionStorage.setItem(RECORDED_KEY, "1");
      })
      .catch(() => {
        // ignore analytics failures
      });
  }, [path]);

  return null;
}
