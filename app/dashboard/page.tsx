import type { Metadata } from "next";
import { Suspense } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getCachedProductCount } from "@/lib/db/cachedCounters";

export const metadata: Metadata = {
  title: "Panel | TrueReview",
  description: "Panel główny aplikacji",
};

async function DashboardStats() {
  const productCount = await getCachedProductCount();

  return (
    <p className="text-sm text-muted-foreground">
      Status połączenia z bazą:{" "}
      <span className="font-semibold text-foreground">
        Połączono (Liczba produktów: {productCount})
      </span>
    </p>
  );
}

function DashboardStatsSkeleton() {
  return (
    <div className="flex items-center gap-2">
      <Skeleton className="h-4 w-44" />
      <Skeleton className="h-4 w-28" />
    </div>
  );
}

export function DashboardPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Panel główny</CardTitle>
          <CardDescription>Informacje z bazy danych i status systemu</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<DashboardStatsSkeleton />}>
            <DashboardStats />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}

export default DashboardPage;
