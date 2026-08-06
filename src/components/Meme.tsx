import React from 'react';
import styles from './widgets.module.css';

export interface MemeProps {
  /** Emoji or short ASCII art shown big */
  visual?: string;
  /** Top line, meme-caption style */
  top?: string;
  /** Bottom line, meme-caption style */
  bottom?: string;
  /** Alternative mode: an entrepreneur quote */
  quote?: string;
  author?: string;
}

/** Attention-reset callout: meme card or quote card. All flavor lives in props, so it's swappable. */
export default function Meme({visual, top, bottom, quote, author}: MemeProps): React.ReactElement {
  if (quote) {
    return (
      <figure className={styles.quoteCard}>
        <blockquote>“{quote}”</blockquote>
        {author && <figcaption>— {author}</figcaption>}
      </figure>
    );
  }
  return (
    <div className={styles.memeCard}>
      {top && <p className={styles.memeCaption}>{top}</p>}
      {visual && <div className={styles.memeVisual}>{visual}</div>}
      {bottom && <p className={styles.memeCaption}>{bottom}</p>}
    </div>
  );
}
