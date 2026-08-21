'use client';

import { ReactNode, type FormEvent } from 'react';
import { Search, RotateCcw, X } from 'lucide-react';
import { PremiumButton } from '@/components/motion';

export interface DirectorySearchDeckProps {
  heading?: string;
  subheading?: string;
  searchValue: string;
  onSearchChange: (val: string) => void;
  searchPlaceholder?: string;
  onSubmit: (e: FormEvent) => void;
  onReset: () => void;
  hasActiveFilters: boolean;
  activeFiltersCount?: number;
  isSearching?: boolean;
  suggestions?: { label: string; onClick: () => void }[];
  children?: ReactNode;
  extraActions?: ReactNode;
}

export default function DirectorySearchDeck({
  heading = 'Search & Refine',
  subheading,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search by name, skills, keyword, or track...',
  onSubmit,
  onReset,
  hasActiveFilters,
  activeFiltersCount = 0,
  isSearching = false,
  suggestions,
  children,
  extraActions,
}: DirectorySearchDeckProps) {
  return (
    <div className="surface-raised relative rounded-3xl border border-[rgba(209,199,189,0.75)] p-5 shadow-e2 sm:p-7 md:p-8">
      {/* Top Header Row */}
      <div className="mb-5 flex items-center justify-between border-b border-[rgba(209,199,189,0.5)] pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-[rgba(114,56,61,0.08)] text-primary">
            <Search className="size-4" strokeWidth={2} />
          </div>
          <div>
            <h2 className="text-feature font-bold text-foreground">
              {heading}
            </h2>
            {subheading && (
              <p className="text-xs text-muted">
                {subheading}
              </p>
            )}
          </div>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[rgba(209,199,189,0.7)] bg-[rgba(248,246,242,0.7)] px-3 py-1.5 text-xs font-bold text-primary transition-colors hover:border-primary hover:bg-[rgba(114,56,61,0.06)]"
          >
            <RotateCcw className="size-3.5" />
            <span>Reset ({activeFiltersCount})</span>
          </button>
        )}
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        {/* Primary Search Bar */}
        <div className="relative">
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full rounded-2xl border border-[rgba(209,199,189,0.85)] bg-[rgba(248,246,242,0.7)] py-3 pl-11 pr-24 text-sm text-foreground outline-none transition-[border-color,box-shadow,background-color] duration-200 placeholder:text-muted focus:border-primary focus:bg-[rgba(248,246,242,0.98)] focus:shadow-[0_0_0_4px_rgba(114,56,61,0.12)] md:text-base"
          />
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted" />

          {searchValue && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-muted transition-colors hover:bg-[rgba(209,199,189,0.4)] hover:text-foreground"
              aria-label="Clear search input"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* Filter Grid (Custom Controls Slot) */}
        {children && <div className="pt-1">{children}</div>}

        {/* Quick Suggestion Tags */}
        {suggestions && suggestions.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-t border-[rgba(209,199,189,0.5)] pt-4">
            <span className="text-label font-bold uppercase text-muted">
              Popular:
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.label}
                  type="button"
                  onClick={suggestion.onClick}
                  className="rounded-full border border-[rgba(209,199,189,0.8)] bg-[rgba(248,246,242,0.75)] px-3 py-1 text-xs font-semibold text-body transition-all duration-150 hover:border-primary hover:bg-[rgba(114,56,61,0.06)] hover:text-primary"
                >
                  + {suggestion.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Action Controls Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[rgba(209,199,189,0.5)] pt-4">
          <div className="flex items-center gap-2">
            {extraActions}
          </div>

          <div className="flex items-center gap-2.5 ml-auto">
            {hasActiveFilters && (
              <PremiumButton
                type="button"
                variant="glass"
                size="sm"
                onClick={onReset}
              >
                Clear Filters
              </PremiumButton>
            )}
            <PremiumButton
              type="submit"
              size="sm"
              loading={isSearching}
              className="min-w-[120px] bg-primary text-on-accent"
            >
              <Search className="size-4" />
              <span>Search</span>
            </PremiumButton>
          </div>
        </div>
      </form>
    </div>
  );
}
