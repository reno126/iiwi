'use client';

import { signIn } from "next-auth/react";

export default function AuthErrorPage() {
    return (
        <div>
            <p>You are not authorized to access this page. </p>
            <button onClick={() => signIn("google")}>Sign in with Google</button>
        </div>
    );
}