import React, {useMemo, useState} from 'react';
import styles from './widgets.module.css';

// Toy BPE-ish vocab: greedy longest-match. Real tokenizers learn merges from data.
const VOCAB = [
  'ing', 'tion', 'ther', 'the', 'cat', 'dog', 'learn', 'deep', 'net', 'work',
  'train', 'token', 'iz', 'er', 'est', 'ly', 'un', 're', 'de', 'able',
  'is', 'a', 'an', 'in', 'on', 'at', 'ed', 's', ' ',
];

const COLORS = ['#25c2a0', '#ffd93d', '#ff6b6b', '#6b9bff', '#c78bff', '#ffa94d'];

function tokenize(text: string): string[] {
  const tokens: string[] = [];
  let i = 0;
  const lower = text.toLowerCase();
  while (i < lower.length) {
    let matched = '';
    for (const v of VOCAB) {
      if (lower.startsWith(v, i) && v.length > matched.length) matched = v;
    }
    if (!matched) matched = lower[i];
    tokens.push(matched);
    i += matched.length;
  }
  return tokens;
}

export default function TokenizerViz(): React.ReactElement {
  const [text, setText] = useState('the cat is untrainable, deep learning is not');
  const tokens = useMemo(() => tokenize(text), [text]);

  return (
    <div className={styles.widget}>
      <input className={styles.textInput} value={text} onChange={(e) => setText(e.target.value)}
        placeholder="type anything…" />
      <div className={styles.tokenRow}>
        {tokens.map((t, i) => (
          <span key={i} className={styles.tokenChunk} style={{background: COLORS[i % COLORS.length]}}>
            {t === ' ' ? '␣' : t}
          </span>
        ))}
      </div>
      <p className={styles.statusLine}>
        {tokens.length} tokens · common chunks like "the", "learn", "ing" get one token; rare words shatter into pieces.
        (Toy vocab — real tokenizers learn ~50,000+ chunks from data, same greedy idea.)
      </p>
    </div>
  );
}
