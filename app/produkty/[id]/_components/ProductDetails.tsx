"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { ProductWithReviews } from "@/serverActions/productGetById";
import { Card, CardContent } from "@/components/ui/card";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { ProductOverviewCard } from "./ProductOverviewCard";
import { ProductReviewsSection } from "./ProductReviewsSection";
import { Heading } from "@/components/ui/heading";
import { SectionHeader } from "@/components/ui/page-header";
import { PageContainer } from "@/components/ui/page-container";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { getReviewDraft } from "@/lib/storage/reviewDraftStorage";

import { PRODUCT_DETAILS_MESSAGES } from "../constants";

export { PRODUCT_DETAILS_MESSAGES };

export interface ProductDetailsProps {
  product: ProductWithReviews;
}

export function ProductDetails({ product }: ProductDetailsProps) {
  const router = useRouter();
  const [isReviewFormOpen, setIsReviewFormOpen] = useState(() => {
    const draft = getReviewDraft();
    return Boolean(
      draft?.type === "REVIEW_EXISTING_PRODUCT" &&
        draft.productId === product.id,
    );
  });

  useEffect(() => {
    function scrollToReviewFormIfDraftExists() {
      const draft = getReviewDraft();
      const hasDraftForCurrentProduct =
        draft?.type === "REVIEW_EXISTING_PRODUCT" &&
        draft.productId === product.id;

      if (!hasDraftForCurrentProduct) {
        return;
      }

      const reviewFormElement = document.getElementById("review-form");
      reviewFormElement?.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    scrollToReviewFormIfDraftExists();
  }, [product.id]);

  const handleOpenReviewForm = useCallback(() => {
    setIsReviewFormOpen(true);
  }, []);

  const handleReviewSuccess = useCallback(() => {
    setIsReviewFormOpen(false);
    router.refresh();
  }, [router]);

  const handleCancelReview = useCallback(() => {
    setIsReviewFormOpen(false);
  }, []);

  return (
    <PageContainer size="lg" className="gap-8">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/produkty" />}>
              {PRODUCT_DETAILS_MESSAGES.productsBreadcrumb}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{product.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <ProductOverviewCard
        product={product}
        onAddReview={handleOpenReviewForm}
        isReviewFormOpen={isReviewFormOpen}
      />

      {isReviewFormOpen ? (
        <section
          id="review-form"
          aria-labelledby="review-form-heading"
          className="space-y-4"
        >
          <SectionHeader bordered={true}>
            <Heading id="review-form-heading" level={2} size="xl">
              {PRODUCT_DETAILS_MESSAGES.formHeading}
            </Heading>
          </SectionHeader>
          <Card className="border p-6 shadow-sm">
            <CardContent className="p-0">
              <ReviewForm
                productId={product.id}
                product={product}
                onSuccess={handleReviewSuccess}
                onCancel={handleCancelReview}
                autoFocus
              />
            </CardContent>
          </Card>
        </section>
      ) : (
        <ProductReviewsSection
          reviews={product.reviews}
          onOpenReviewForm={handleOpenReviewForm}
          isReviewFormOpen={isReviewFormOpen}
        />
      )}
    </PageContainer>
  );
}
