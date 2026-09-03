import { Suspense } from "react";
import { SignIn } from "@/components/auth/SignIn";
import { authOptions } from "@/lib/auth/authOptions";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

interface LoginPageProps {}

export async function LoginPage({}: LoginPageProps) {
  const session = await getServerSession(authOptions);
  if (session) redirect("/dashboard");

  return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center px-4 py-8">
      <Suspense
        fallback={<Skeleton className="h-[460px] w-full max-w-md rounded-xl" />}
      >
        <SignIn />
      </Suspense>
    </div>
  );
}

export default LoginPage;
