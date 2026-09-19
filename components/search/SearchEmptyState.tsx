import * as React from "react";
import { memo } from "react";
import { SearchX } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyMedia,
} from "@/components/ui/empty";

interface SearchEmptyStateProps {
  emptyTitle: string;
  emptyDescription: string;
  customEmptyState?: React.ReactNode;
}

const MemoizedSearchEmptyState = memo(function MemoizedSearchEmptyState({
  emptyTitle,
  emptyDescription,
  customEmptyState,
}: SearchEmptyStateProps) {
  if (customEmptyState) {
    return <>{customEmptyState}</>;
  }

  return (
    <Card className="border border-dashed shadow-xs" data-slot="search-empty">
      <CardContent className="p-6">
        <Empty>
          <EmptyMedia variant="icon">
            <SearchX
              className="size-5 text-muted-foreground"
              aria-hidden="true"
            />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>{emptyTitle}</EmptyTitle>
            <EmptyDescription>{emptyDescription}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </CardContent>
    </Card>
  );
});

export function SearchEmptyState(props: SearchEmptyStateProps) {
  return <MemoizedSearchEmptyState {...props} />;
}
