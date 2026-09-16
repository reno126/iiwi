"use client";

import { useTransition } from "react";
import { signIn } from "next-auth/react";
import { FaGoogle } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

interface GoogleSignInButtonProps {
  callbackUrl?: string;
  disabled?: boolean;
  buttonText?: string;
  pendingText?: string;
  className?: string;
}

export function GoogleSignInButton({
  callbackUrl = "/dashboard",
  disabled = false,
  buttonText = "Zaloguj się przez Google",
  pendingText = "Przekierowywanie...",
  className,
}: GoogleSignInButtonProps) {
  const [isGooglePending, startGoogleTransition] = useTransition();

  const handleGoogleSignIn = () => {
    startGoogleTransition(async () => {
      await signIn("google", { callbackUrl });
    });
  };

  return (
    <Button
      type="button"
      variant="outline"
      className={className ?? "w-full"}
      onClick={handleGoogleSignIn}
      disabled={isGooglePending || disabled}
    >
      {isGooglePending ? (
        <>
          <Spinner className="mr-2 size-4" />
          {pendingText}
        </>
      ) : (
        <>
          <FaGoogle className="mr-2 size-4 text-[#4285F4]" />
          {buttonText}
        </>
      )}
    </Button>
  );
}
