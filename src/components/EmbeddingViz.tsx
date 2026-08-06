import React, {useState} from 'react';
import styles from './widgets.module.css';

// Hand-placed 2D "embedding" coordinates
const WORDS: {word: string; x: number; y: number}[] = [
  {word: 'cat', x: 0.8, y: 0.75}, {word: 'kitten', x: 0.9, y: 0.85}, {word: 'dog', x: 0.55, y: 0.8},
  {word: 'puppy', x: 0.62, y: 0.9}, {word: 'tiger', x: 0.95, y: 0.55},
  {word: 'car', x: -0.8, y: 0.5}, {word: 'truck', x: -0.9, y: 0.4}, {word: 'bicycle', x: -0.6, y: 0.65},
  {word: 'pizza', x: -0.2, y: -0.8}, {word: 'sushi', x: -0.05, y: -0.9}, {word: 'burger', x: -0.35, y: -0.85},
  {word: 'keyboard', x: 0.5, y: -0.5}, {word: 'mouse', x: 0.65, y: -0.35},
];

const W = 460;
const H = 300;
const toPx = (x: number, y: number): [number, number] => [((x + 1.1) / 2.2) * W, H - ((y + 1.1) / 2.2) * H];

const cosine = (a: {x: number; y: number}, b: {x: number; y: number}) => {
  const dot = a.x * b.x + a.y * b.y;
  return dot / (Math.hypot(a.x, a.y) * Math.hypot(b.x, b.y));
};

export default function EmbeddingViz(): React.ReactElement {
  const [picked, setPicked] = useState<number[]>([0, 1]); // cat & kitten

  const toggle = (i: number) => {
    setPicked((prev) => {
      if (prev.includes(i)) return prev.filter((p) => p !== i);
      return [...prev.slice(-1), i]; // keep max 2
    });
  };

  const sim = picked.length === 2 ? cosine(WORDS[picked[0]], WORDS[picked[1]]) : null;
  const verdict =
    sim === null ? 'pick two words' :
    sim > 0.95 ? 'practically the same word wearing different fur' :
    sim > 0.7 ? 'clearly related — same neighborhood' :
    sim > 0.2 ? 'acquaintances at best' :
    sim > -0.3 ? 'basically strangers' : 'opposite corners of meaning-space';

  return (
    <div className={styles.widget}>
      <svg viewBox={`0 0 ${W} ${H}`} className={styles.plot} role="img" aria-label="Words as points in 2D space">
        {picked.length === 2 && (() => {
          const [a, b] = picked.map((i) => toPx(WORDS[i].x, WORDS[i].y));
          return <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} className={styles.residual} />;
        })()}
        {WORDS.map((w, i) => {
          const [px, py] = toPx(w.x, w.y);
          const on = picked.includes(i);
          return (
            <g key={w.word} onClick={() => toggle(i)} style={{cursor: 'pointer'}}>
              <circle cx={px} cy={py} r={on ? 9 : 6} className={on ? styles.probe : styles.embedDot} />
              <text x={px + 10} y={py + 4} className={styles.probeLabel}>{w.word}</text>
            </g>
          );
        })}
      </svg>
      <p className={styles.statusLine}>
        {picked.length === 2 && (
          <>similarity({WORDS[picked[0]].word}, {WORDS[picked[1]].word}) = {sim!.toFixed(2)} · {verdict}</>
        )}
        {picked.length !== 2 && 'click two words to measure how "close in meaning" they are'}
      </p>
    </div>
  );
}
