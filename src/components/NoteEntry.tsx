import React from 'react';
import styles from './noteEntry.module.css';

export interface NoteEntryProps {
  /** Entry kind: drives the accent color and icon. */
  kind: 'do' | 'dont';
  /** ISO date, e.g. "2026-10-14". */
  date: string;
  /** Short lesson title. */
  title: string;
  /** Description and optional confidential context, as Markdown. */
  children: React.ReactNode;
}

/**
 * Styled "📎 Context" section for confidential spans inside a NoteEntry.
 * The children are typically a {/* LOCKED-START/END *\/} span; the panel
 * layout is identical whether the span is locked (redaction blob) or
 * unlocked (decrypted text), so the page doesn't jump.
 */
export function NoteContext({children}: {children: React.ReactNode}): React.ReactElement {
  return (
    <div className={styles.context}>
      <span className={styles.contextLabel}>📎 Context</span>
      <div className={styles.contextBody}>{children}</div>
    </div>
  );
}

const KINDS = {
  do: {icon: '✅', className: 'do'},
  dont: {icon: '🚫', className: 'dont'},
} as const;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2026-10-14" -> "14 Oct 2026" (parsed by hand: no timezone drift). */
function formatDate(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number);
  if (!year || !month || !day || month < 1 || month > 12) return iso;
  return `${day} ${MONTHS[month - 1]} ${year}`;
}

/**
 * Compact dated note entry for the Notes collection: one header line
 * (icon + title + date), description directly below. Built for long
 * accumulating lists — no field labels, no wasted lines.
 */
export default function NoteEntry({kind, date, title, children}: NoteEntryProps): React.ReactElement {
  const {icon, className} = KINDS[kind];
  return (
    <section className={`${styles.entry} ${styles[className]}`}>
      <header className={styles.header}>
        <span className={styles.title}>{icon} {title}</span>
        <time className={styles.date} dateTime={date}>{formatDate(date)}</time>
      </header>
      <div className={styles.body}>{children}</div>
    </section>
  );
}
