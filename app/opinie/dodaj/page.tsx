import type { Metadata } from "next";
import { AddReviewFlow } from "./_components/AddReviewFlow";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Dodaj opinię",
  description: "Dodaj swoją opinię na temat produktu w serwisie TrueReview.",
  path: "/opinie/dodaj",
});

export function NewReviewPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Dodaj opinię
        </h1>
      </div>

      <AddReviewFlow />
    </div>
  );
}

export default NewReviewPage;
