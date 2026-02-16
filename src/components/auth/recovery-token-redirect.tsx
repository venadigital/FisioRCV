"use client";

import { useEffect } from "react";

export function RecoveryTokenRedirect() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.pathname === "/reset-password") return;
    if (!window.location.hash) return;

    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const hasAccessToken = Boolean(hashParams.get("access_token"));
    const type = hashParams.get("type");

    if (hasAccessToken && type === "recovery") {
      const nextUrl = `/reset-password${window.location.hash}`;
      window.location.replace(nextUrl);
    }
  }, []);

  return null;
}
