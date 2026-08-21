'use client';

import { ReactNode } from 'react';
import { Container } from '@/components/ui';
import { Aurora, Counter, Reveal, SplitText } from '@/components/motion';

export interface DirectoryHeroProps {
  eyebrow: string;
  title: string;
  description: string;
  totalCount: number;
  totalCountLabel: string;
  activeFiltersCount: number;
  activeFiltersLabel?: string;
  actions?: ReactNode;
}

export default function DirectoryHero({
  eyebrow,
  title,
  description,
  totalCount,
  totalCountLabel,
  activeFiltersCount,
  activeFiltersLabel = 'filters active',
  actions,
}: DirectoryHeroProps) {
  return (
    <section className="section-dune relative overflow-hidden border-b border-[rgba(209,199,189,0.5)]">
      <Aurora variant="warm" spotlight={false} />
      <Container
        width="wide"
        className="relative flex flex-col gap-6 py-10 lg:flex-row lg:items-end lg:justify-between"
      >
        <div className="max-w-2xl">
          <Reveal direction="none" blur={false}>
            <span className="text-label font-bold uppercase tracking-widest text-primary">
              {eyebrow}
            </span>
          </Reveal>
          <SplitText
            as="h1"
            text={title}
            className="mt-2 text-title font-semibold tracking-tight text-foreground"
            delay={0.06}
          />
          <Reveal delay={0.2} className="mt-2.5">
            <p className="text-sm leading-relaxed text-body">
              {description}
            </p>
          </Reveal>
          {actions && <div className="mt-4 flex items-center gap-3">{actions}</div>}
        </div>

        <Reveal direction="left" delay={0.15}>
          <div className="surface-raised flex items-center gap-5 rounded-2xl border border-[rgba(209,199,189,0.7)] px-5 py-4 shadow-e1">
            <div>
              <div className="text-2xl font-extrabold tracking-tight text-foreground tabular lg:text-3xl">
                <Counter to={totalCount} duration={1.1} />
              </div>
              <div className="text-label uppercase text-muted mt-0.5">
                {totalCountLabel}
              </div>
            </div>
            <div className="h-10 w-px bg-[rgba(172,156,141,0.45)]" />
            <div>
              <div className="text-2xl font-extrabold tracking-tight text-primary tabular lg:text-3xl">
                <Counter to={activeFiltersCount} duration={1.1} />
              </div>
              <div className="text-label uppercase text-muted mt-0.5">
                {activeFiltersLabel}
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
