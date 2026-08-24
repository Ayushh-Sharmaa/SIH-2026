'use client';

import { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

export interface DirectoryResultsBarProps {
  count: number;
  itemLabel?: string;
  isSearching?: boolean;
  hasActiveFilters?: boolean;
  filterDescription?: string;
  actions?: ReactNode;
}

export default function DirectoryResultsBar({
  count,
  itemLabel = 'results',
  isSearching = false,
  hasActiveFilters = false,
  filterDescription,
  actions,
}: DirectoryResultsBarProps) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 px-1">
      <div className="flex items-center gap-3">
        <h3 className="text-feature font-bold text-foreground">
          {count} {itemLabel} found
        </h3>

        {isSearching && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(114,56,61,0.2)] bg-[rgba(114,56,61,0.06)] px-2.5 py-0.5 text-caption font-semibold text-primary">
            <Loader2 className="size-3 animate-spin" />
            <span>Updating...</span>
          </span>
        )}

        {filterDescription && (
          <span className="hidden text-xs text-muted sm:inline-block">
            — {filterDescription}
          </span>
        )}
      </div>

      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
