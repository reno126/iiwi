import type { Metadata } from "next";
import { AuthErrorCard } from "./_components/AuthErrorCard";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Błąd uwierzytelniania",
  description: "Wystąpił problem z dostępem do wybranej strony.",
  path: "/auth/error",
  noIndex: true,
});

export function AuthErrorPage() {
  return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center px-4 py-8">
      <AuthErrorCard />
    </div>
  );
}

export default AuthErrorPage;
