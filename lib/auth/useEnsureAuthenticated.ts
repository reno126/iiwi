"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

export interface EnsureAuthenticatedOptions {
  onUnauthenticated?: () => void;
  callbackUrl?: string;
}

export function useEnsureAuthenticated() {
  const { data: session, update } = useSession();
  const router = useRouter();

  const ensureAuthenticated = useCallback(
    async (options?: EnsureAuthenticatedOptions): Promise<boolean> => {
      const isSessionActive = Boolean(session?.user?.id);
      if (isSessionActive) {
        return true;
      }

      async function attemptSessionRefresh(): Promise<boolean> {
        try {
          const refreshed = await update();
          return Boolean(refreshed?.user?.id);
        } catch (err) {
          console.warn("[useEnsureAuthenticated] Błąd podczas próby odświeżenia sesji:", err);
          return false;
        }
      }

      const wasRefreshed = await attemptSessionRefresh();
      if (wasRefreshed) {
        return true;
      }

      function resolveRedirectTargetUrl(): string {
        if (options?.callbackUrl) {
          return options.callbackUrl;
        }
        if (typeof window !== "undefined") {
          return window.location.pathname + window.location.search;
        }
        return "/";
      }

      options?.onUnauthenticated?.();

      const targetUrl = resolveRedirectTargetUrl();
      router.push(`/login?callbackUrl=${encodeURIComponent(targetUrl)}`);
      return false;
    },
    [session, update, router]
  );

  return {
    isAuthenticated: Boolean(session?.user?.id),
    ensureAuthenticated,
  };
}
