"use client";

import { useEffect } from "react";
import { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";

interface ClientSessionProviderProps {
  children: React.ReactNode;
  session: Session | null;
}

export function ClientSessionProvider({
  children,
  session,
}: ClientSessionProviderProps) {
  useEffect(() => {
    document.body.setAttribute("data-hydrated", "true");
  }, []);

  return <SessionProvider session={session}>{children}</SessionProvider>;
}
