import React, {useState} from 'react';
import styles from './widgets.module.css';

const TOKENS = ['The', 'cat', 'drank', 'the', 'milk', 'because', 'it', 'was', 'thirsty'];

// Hand-crafted attention rows (who each word "looks at"), rows sum to 1
const ATTENTION: number[][] = [
  [0.70, 0.20, 0.02, 0.02, 0.02, 0.01, 0.01, 0.01, 0.01],
  [0.15, 0.60, 0.10, 0.02, 0.05, 0.02, 0.02, 0.02, 0.02],
  [0.03, 0.30, 0.45, 0.02, 0.14, 0.02, 0.02, 0.01, 0.01],
  [0.02, 0.02, 0.04, 0.60, 0.28, 0.01, 0.01, 0.01, 0.01],
  [0.02, 0.10, 0.20, 0.15, 0.47, 0.02, 0.02, 0.01, 0.01],
  [0.02, 0.05, 0.10, 0.02, 0.05, 0.60, 0.06, 0.05, 0.05],
  [0.03, 0.55, 0.05, 0.02, 0.15, 0.05, 0.10, 0.02, 0.03],
  [0.02, 0.10, 0.05, 0.02, 0.05, 0.05, 0.15, 0.46, 0.10],
  [0.02, 0.30, 0.15, 0.01, 0.05, 0.05, 0.20, 0.10, 0.12],
];

export default function AttentionViz(): React.ReactElement {
  const [selected, setSelected] = useState(6); // "it"
  const weights = ATTENTION[selected];
  const strongest = weights
    .map((w, i) => ({w, i}))
    .filter(({i}) => i !== selected)
    .sort((a, b) => b.w - a.w)[0];

  return (
    <div className={styles.widget}>
      <p className={styles.stepperTitle}>Click any word to see what it pays attention to:</p>
      <div className={styles.tokenRow}>
        {TOKENS.map((t, i) => (
          <span key={i}
            onClick={() => setSelected(i)}
            className={i === selected ? styles.tokenActive : styles.token}
            style={i !== selected ? {background: `rgba(37, 194, 160, ${weights[i]})`} : undefined}>
            {t}
            <small className={styles.tokenPct}>{i === selected ? '👁' : `${Math.round(weights[i] * 100)}%`}</small>
          </span>
        ))}
      </div>
      <p className={styles.statusLine}>
        "{TOKENS[selected]}" attends most to "{TOKENS[strongest.i]}" ({Math.round(strongest.w * 100)}%)
        {selected === 6 && ' — the network resolves "it" → "cat" by LOOKING, not by remembering. No fading memory required.'}
      </p>
    </div>
  );
}
