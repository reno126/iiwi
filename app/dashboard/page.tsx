import type { Metadata } from "next";
import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/authOptions";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { userDashboardGet } from "@/serverActions/userDashboardGet";
import { Card } from "@/components/ui/card";
import { PageContainer } from "@/components/ui/page-container";
import { UserProfileCard } from "./_components/UserProfileCard";
import { UserProductStats } from "./_components/UserProductStats";
import { UserShopStats } from "./_components/UserShopStats";
import { DashboardActions } from "./_components/DashboardActions";
import { DashboardSkeleton } from "./_components/DashboardSkeleton";
import { DASHBOARD_MESSAGES } from "./constants";

export const metadata: Metadata = buildPageMetadata({
  title: DASHBOARD_MESSAGES.pageTitle,
  description: DASHBOARD_MESSAGES.pageDescription,
  path: "/dashboard",
  noIndex: true,
});

async function DashboardContent() {
  const data = await userDashboardGet();

  if (!data) {
    redirect("/login?callbackUrl=/dashboard");
  }

  return (
    <div className="space-y-6">
      <UserProfileCard
        name={data.user.name}
        email={data.user.email}
        createdAt={data.user.createdAt}
      />

      <Card className="space-y-6 p-5 shadow-xs sm:p-6">
        <UserProductStats
          totalReviewedProducts={data.totalReviewedProducts}
          reviewedProducts={data.reviewedProducts}
        />

        <div className="border-t border-border pt-6">
          <UserShopStats reviewedShops={data.reviewedShops} />
        </div>
      </Card>

      <DashboardActions />
    </div>
  );
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login?callbackUrl=/dashboard");
  }

  return (
    <PageContainer size="md">
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </PageContainer>
  );
}
