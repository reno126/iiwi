'use client';

import { signIn } from "next-auth/react";

export default function AuthErrorPage() {
    return (
        <div>
            <p>Nie masz uprawnień dostępu do tej strony.</p>
            <button onClick={() => signIn("google")}>Zaloguj się przez Google</button>
        </div>
    );
}