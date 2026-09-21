"use client";

import { createContext, useContext } from "react";
import type { UseCombinedReviewFormReturn } from "./useCombinedReviewForm";

const CombinedReviewFormContext =
  createContext<UseCombinedReviewFormReturn | null>(null);

interface CombinedReviewFormProviderProps {
  value: UseCombinedReviewFormReturn;
  children: React.ReactNode;
}

export function CombinedReviewFormProvider({
  value,
  children,
}: CombinedReviewFormProviderProps) {
  return (
    <CombinedReviewFormContext.Provider value={value}>
      {children}
    </CombinedReviewFormContext.Provider>
  );
}

export function useCombinedReviewFormContext(): UseCombinedReviewFormReturn {
  const context = useContext(CombinedReviewFormContext);
  if (!context) {
    throw new Error(
      "useCombinedReviewFormContext must be used within a CombinedReviewFormProvider",
    );
  }
  return context;
}
