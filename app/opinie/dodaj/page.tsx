import type { Metadata } from "next";
import { AddReviewFlow } from "./_components/AddReviewFlow";

export const metadata: Metadata = {
  title: "Dodaj opinię | TrueReview",
  description: "Dodaj swoją opinię na temat produktu",
};

export function NewReviewPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 py-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Dodaj opinię
        </h1>
        <p className="text-sm text-muted-foreground">
          Wybierz produkt z bazy lub dodaj nowy, aby podzielić się swoją opinią.
        </p>
      </div>

      <AddReviewFlow />
    </div>
  );
}

export default NewReviewPage;
