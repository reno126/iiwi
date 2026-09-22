import type { Metadata } from "next";
import { AddReviewFlow } from "./_components/AddReviewFlow";
import { Heading } from "@/components/ui/heading";
import { PageHeader } from "@/components/ui/page-header";
import { PageContainer } from "@/components/ui/page-container";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Dodaj opinię",
  description: "Dodaj swoją opinię na temat produktu w serwisie TrueReview.",
  path: "/opinie/dodaj",
});

export function NewReviewPage() {
  return (
    <PageContainer size="sm">
      <PageHeader>
        <Heading level={1}>Dodaj opinię</Heading>
      </PageHeader>

      <AddReviewFlow />
    </PageContainer>
  );
}

export default NewReviewPage;
