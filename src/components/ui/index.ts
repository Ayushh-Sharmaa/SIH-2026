/**
 * The design system's public surface.
 *
 * Import from here rather than reaching into individual files, so what the
 * system offers stays visible in one place.
 */

/* ── Layout & typography ─────────────────────────────────────────────────── */
export { default as Container } from './Container';
export type { ContainerProps } from './Container';

export { default as Section } from './Section';
export type { SectionProps, SectionTone, SectionRhythm, SectionPattern } from './Section';

export { default as SectionHeader } from './SectionHeader';
export type { SectionHeaderProps } from './SectionHeader';

export { default as Eyebrow } from './Eyebrow';
export type { EyebrowProps } from './Eyebrow';

export { default as Divider } from './Divider';
export type { DividerProps, DividerVariant } from './Divider';

/* ── Content ─────────────────────────────────────────────────────────────── */
export { default as Card } from './Card';
export type { CardProps } from './Card';

export { default as Badge } from './Badge';
export type { BadgeProps } from './Badge';

export { default as EmptyState } from './EmptyState';
export type { EmptyStateProps } from './EmptyState';

/* ── Overlays & feedback ─────────────────────────────────────────────────── */
export { default as Modal } from './Modal';
export type { ModalProps } from './Modal';

export { ToastProvider, useToast } from './Toast';
export type { ToastTone } from './Toast';

/* ── Iconography ─────────────────────────────────────────────────────────── */
export { default as Icon, STROKE } from './Icon';
export type { IconProps, IconSize } from './Icon';
