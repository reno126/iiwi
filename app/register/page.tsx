import type { Metadata } from "next";
import { Suspense } from "react";
import { Register } from "./_components/Register";
import { authOptions } from "@/lib/auth/authOptions";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Utwórz konto",
  description: "Zarejestruj nowe konto w serwisie TrueReview.",
  path: "/register",
  noIndex: true,
});

export async function RegisterPage() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/dashboard");

  return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center px-4 py-8">
      <Suspense
        fallback={<Skeleton className="h-115 w-full max-w-md rounded-xl" />}
      >
        <Register />
      </Suspense>
    </div>
  );
}

export default RegisterPage;
