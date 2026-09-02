"use client";
import { signIn, signOut, useSession } from "next-auth/react";

export default function AuthButton() {
  const { data: session } = useSession();

  if (session) {
    return (
      <div>
        Zalogowano jako {session.user?.email} <br />
        <button onClick={() => signOut()}>Wyloguj się</button>
      </div>
    );
  }
  return <button onClick={() => signIn("google")}>Zaloguj się przez Google</button>;
}
