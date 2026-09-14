"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

export interface EnsureAuthenticatedOptions {
  /**
   * Callback invoked before redirecting to login.
   * Useful for persisting form drafts or state to localStorage.
   */
  onUnauthenticated?: () => void;
  /**
   * Target URL to redirect after successful login.
   * Defaults to current window.location.pathname + window.location.search.
   */
  callbackUrl?: string;
}

/**
 * Decoupled hook to verify user authentication.
 *
 * If unauthenticated, attempts to refresh the session via NextAuth's `update()`.
 * If refresh is unsuccessful, calls `onUnauthenticated` (e.g. to preserve draft data)
 * and redirects the user to the login page with a `callbackUrl`.
 */
export function useEnsureAuthenticated() {
  const { data: session, update } = useSession();
  const router = useRouter();

  const ensureAuthenticated = useCallback(
    async (options?: EnsureAuthenticatedOptions): Promise<boolean> => {
      // 1. Szybkie sprawdzenie czy sesja jest już aktywna w kontekście klienta
      if (session?.user?.id) {
        return true;
      }

      // 2. Próba cichego odświeżenia sesji (np. logowanie w innej karcie lub wygasły token)
      try {
        const refreshed = await update();
        if (refreshed?.user?.id) {
          return true;
        }
      } catch (err) {
        console.warn("[useEnsureAuthenticated] Błąd podczas próby odświeżenia sesji:", err);
      }

      // 3. Użytkownik jest niezalogowany - wywołaj callback zabezpieczający dane (np. draft w localStorage)
      options?.onUnauthenticated?.();

      // 4. Przekierowanie do strony logowania z zachowaniem callbackUrl
      const targetUrl =
        options?.callbackUrl ||
        (typeof window !== "undefined"
          ? window.location.pathname + window.location.search
          : "/");

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
