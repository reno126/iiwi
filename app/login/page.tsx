import type { Metadata } from "next";
import { Suspense } from "react";
import { authOptions } from "@/lib/auth/authOptions";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { SignIn } from "./_components/SignIn";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Logowanie",
  description: "Zaloguj się do swojego konta w serwisie TrueReview.",
  path: "/login",
  noIndex: true,
});

export async function LoginPage() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/dashboard");

  return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center px-4 py-8">
      <Suspense
        fallback={<Skeleton className="h-115 w-full max-w-md rounded-xl" />}
      >
        <SignIn />
      </Suspense>
    </div>
  );
}

export default LoginPage;
