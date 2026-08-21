'use client';

import { ReactNode } from 'react';
import { Sparkles, Users, AlertCircle, RefreshCw, RotateCcw } from 'lucide-react';
import { PremiumButton } from '@/components/motion';

export interface DirectoryEmptyStateProps {
  variant: 'unsearched' | 'no-results' | 'error';
  title?: string;
  description?: string;
  errorMessage?: string;
  onReset?: () => void;
  onRetry?: () => void;
  suggestions?: { label: string; onClick: () => void }[];
  action?: ReactNode;
}

export default function DirectoryEmptyState({
  variant,
  title,
  description,
  errorMessage,
  onReset,
  onRetry,
  suggestions,
  action,
}: DirectoryEmptyStateProps) {
  if (variant === 'unsearched') {
    return (
      <div className="surface-raised rounded-3xl border border-[rgba(209,199,189,0.7)] p-8 text-center shadow-e1 md:p-12">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl border border-[rgba(114,56,61,0.2)] bg-[rgba(114,56,61,0.08)] text-primary">
          <Sparkles className="size-7" />
        </div>
        <h3 className="text-feature font-bold text-foreground">
          {title || 'Find what you need'}
        </h3>
        <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-body md:text-sm">
          {description || 'Use the search controls above to filter by keywords, domain themes, technical skills, or roles.'}
        </p>

        {suggestions && suggestions.length > 0 && (
          <div className="mx-auto mt-6 max-w-lg border-t border-[rgba(209,199,189,0.5)] pt-4">
            <span className="mb-2.5 block text-label font-bold uppercase text-muted">
              Suggested Topics
            </span>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {suggestions.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={s.onClick}
                  className="rounded-full border border-[rgba(209,199,189,0.8)] bg-[rgba(248,246,242,0.8)] px-3 py-1.5 text-xs font-semibold text-body transition-all duration-150 hover:border-primary hover:text-primary"
                >
                  + {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {action && <div className="mt-6 flex justify-center">{action}</div>}
      </div>
    );
  }

  if (variant === 'error') {
    return (
      <div className="surface-raised rounded-3xl border border-[rgba(114,56,61,0.3)] bg-[rgba(114,56,61,0.03)] p-8 text-center shadow-e1 md:p-12">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-[rgba(114,56,61,0.1)] text-primary">
          <AlertCircle className="size-7" />
        </div>
        <h3 className="text-feature font-bold text-foreground">
          {title || 'Request Encountered an Issue'}
        </h3>
        <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-body md:text-sm">
          {errorMessage || description || 'Could not complete the search. Please check your connection and try again.'}
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          {onRetry && (
            <PremiumButton
              size="sm"
              onClick={onRetry}
              className="bg-primary text-on-accent"
            >
              <RefreshCw className="size-3.5" />
              <span>Retry Search</span>
            </PremiumButton>
          )}
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="rounded-xl border border-[rgba(209,199,189,0.8)] bg-[rgba(248,246,242,0.8)] px-4 py-2 text-xs font-bold text-body transition-colors hover:border-primary hover:text-primary"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>
    );
  }

  // variant === 'no-results'
  return (
    <div className="surface-raised rounded-3xl border border-[rgba(209,199,189,0.7)] p-8 text-center shadow-e1 md:p-12">
      <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-[rgba(209,199,189,0.3)] text-muted">
        <Users className="size-7" />
      </div>
      <h3 className="text-feature font-bold text-foreground">
        {title || 'No matching results found'}
      </h3>
      <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-body md:text-sm">
        {description || 'Try broadening your search query or clearing some filters to explore more options.'}
      </p>
      {onReset && (
        <div className="mt-6">
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2 text-xs font-bold text-on-accent transition-opacity hover:opacity-95"
          >
            <RotateCcw className="size-3.5" />
            <span>Reset All Filters</span>
          </button>
        </div>
      )}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}
