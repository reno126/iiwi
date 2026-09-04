import type { Metadata } from "next";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/shadcn/utils";

export const metadata: Metadata = {
  title: "Strona główna | TrueReview",
  description: "Serwis opinii i recenzji produktów TrueReview",
};

export async function HomePage() {
  return (
    <div className="container mx-auto flex min-h-[calc(100vh-12rem)] max-w-2xl items-center justify-center px-4 py-8">
      <Card className="w-full text-center">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Witaj w TrueReview</CardTitle>
          <CardDescription className="text-base">
            Odkrywaj i publikuj rzetelne opinie o produktach
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Sprawdź opinie innych użytkowników lub podziel się własnym doświadczeniem.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center gap-4 border-t border-border pt-4">
          <Link
            href="/opinie/dodaj"
            className={cn(buttonVariants({ variant: "default" }))}
          >
            Dodaj opinię
          </Link>
          <Link
            href="/dashboard"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Przejdź do panelu
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}

export default HomePage;
