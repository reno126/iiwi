import type { Metadata } from "next";
import { prisma } from "@/lib/db/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Panel | TrueReview",
  description: "Panel główny aplikacji",
};

export async function DashboardPage() {
  const t = await prisma.test.findFirst();

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Panel główny</CardTitle>
          <CardDescription>Informacje z bazy danych i status systemu</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Test połączenia z bazą:{" "}
            <span className="font-semibold text-foreground">
              {t?.text ?? "Brak danych"}
            </span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default DashboardPage;
