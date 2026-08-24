'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface DirectoryPaginationProps {
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
  currentPage?: number;
  totalPages?: number;
  itemSummary?: string;
  onPageChange?: (page: number) => void;
}

export default function DirectoryPagination({
  onPrevious,
  onNext,
  hasPrevious = false,
  hasNext = false,
  currentPage,
  totalPages,
  itemSummary,
  onPageChange,
}: DirectoryPaginationProps) {
  // If no navigation is possible and no summary, don't render empty bar
  if (!hasPrevious && !hasNext && !itemSummary) return null;

  const handlePrev = () => {
    if (onPrevious) {
      onPrevious();
    } else if (onPageChange && currentPage !== undefined) {
      onPageChange(Math.max(1, currentPage - 1));
    }
  };

  const handleNext = () => {
    if (onNext) {
      onNext();
    } else if (onPageChange && currentPage !== undefined) {
      onPageChange(totalPages ? Math.min(totalPages, currentPage + 1) : currentPage + 1);
    }
  };

  return (
    <div className="mt-10 flex flex-col items-center justify-center gap-3 pt-6 sm:flex-row">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handlePrev}
          disabled={!hasPrevious}
          className="inline-flex items-center gap-1.5 rounded-xl border border-[rgba(209,199,189,0.8)] bg-[rgba(248,246,242,0.75)] px-4 py-2 text-caption font-bold text-foreground transition-all duration-200 hover:border-primary hover:bg-[rgba(114,56,61,0.06)] hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[rgba(209,199,189,0.8)] disabled:hover:bg-[rgba(248,246,242,0.75)] disabled:hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          <span>Previous</span>
        </button>

        {itemSummary ? (
          <span className="rounded-xl border border-[rgba(209,199,189,0.7)] bg-[rgba(248,246,242,0.8)] px-4 py-2 text-caption font-bold text-foreground">
            {itemSummary}
          </span>
        ) : currentPage !== undefined ? (
          <span className="rounded-xl border border-[rgba(209,199,189,0.7)] bg-[rgba(248,246,242,0.8)] px-4 py-2 text-caption font-bold text-foreground">
            {totalPages && totalPages > 1 ? `Page ${currentPage} of ${totalPages}` : `Page ${currentPage}`}
          </span>
        ) : null}

        <button
          type="button"
          onClick={handleNext}
          disabled={!hasNext}
          className="inline-flex items-center gap-1.5 rounded-xl border border-[rgba(209,199,189,0.8)] bg-[rgba(248,246,242,0.75)] px-4 py-2 text-caption font-bold text-foreground transition-all duration-200 hover:border-primary hover:bg-[rgba(114,56,61,0.06)] hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[rgba(209,199,189,0.8)] disabled:hover:bg-[rgba(248,246,242,0.75)] disabled:hover:text-foreground"
        >
          <span>Next</span>
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}
