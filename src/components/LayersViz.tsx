import React, {useMemo, useState} from 'react';
import styles from './widgets.module.css';

const relu = (z: number) => Math.max(0, z);

const W = 460;
const H = 260;
const X_MIN = -4;
const X_MAX = 4;
const Y_MIN = -3;
const Y_MAX = 3;

const toPx = (x: number, y: number): [number, number] => [
  ((x - X_MIN) / (X_MAX - X_MIN)) * W,
  H - ((y - Y_MIN) / (Y_MAX - Y_MIN)) * H,
];

// Two ReLU neurons, outputs +1 and -1: enough to sculpt a bump
export default function LayersViz(): React.ReactElement {
  const [w1, setW1] = useState(1.0);
  const [b1, setB1] = useState(1.0);
  const [w2, setW2] = useState(1.0);
  const [b2, setB2] = useState(-1.0);

  const combined = (x: number) => relu(w1 * x + b1) - relu(w2 * x + b2);

  const makePath = (fn: (x: number) => number) => {
    const pts: string[] = [];
    for (let i = 0; i <= 200; i++) {
      const x = X_MIN + (i / 200) * (X_MAX - X_MIN);
      const y = Math.max(Y_MIN, Math.min(Y_MAX, fn(x)));
      const [px, py] = toPx(x, y);
      pts.push(`${i === 0 ? 'M' : 'L'}${px.toFixed(1)},${py.toFixed(1)}`);
    }
    return pts.join(' ');
  };

  const pathA = useMemo(() => makePath((x) => relu(w1 * x + b1)), [w1, b1]);
  const pathB = useMemo(() => makePath((x) => -relu(w2 * x + b2)), [w2, b2]);
  const pathSum = useMemo(() => makePath(combined), [w1, b1, w2, b2]);
  const [zx0, zy0] = toPx(X_MIN, 0);
  const [zx1] = toPx(X_MAX, 0);

  return (
    <div className={styles.widget}>
      <svg viewBox={`0 0 ${W} ${H}`} className={styles.plot} role="img" aria-label="Two neurons combining into a bump">
        <line x1={zx0} y1={zy0} x2={zx1} y2={zy0} className={styles.axis} />
        <path d={pathA} className={styles.curveGhost} fill="none" />
        <path d={pathB} className={styles.curveGhost2} fill="none" />
        <path d={pathSum} className={styles.curve} fill="none" />
      </svg>
      <div className={styles.legendRow}>
        <span className={styles.legendGhost}>— neuron A (+)</span>
        <span className={styles.legendGhost2}>— neuron B (−)</span>
        <span className={styles.legendMain}>— team output (A − B)</span>
      </div>
      <div className={styles.controls}>
        <label className={styles.control}>
          <span>A: weight = <strong>{w1.toFixed(1)}</strong></span>
          <input type="range" min={-3} max={3} step={0.1} value={w1} onChange={(e) => setW1(Number(e.target.value))} />
        </label>
        <label className={styles.control}>
          <span>A: bias = <strong>{b1.toFixed(1)}</strong></span>
          <input type="range" min={-3} max={3} step={0.1} value={b1} onChange={(e) => setB1(Number(e.target.value))} />
        </label>
        <label className={styles.control}>
          <span>B: weight = <strong>{w2.toFixed(1)}</strong></span>
          <input type="range" min={-3} max={3} step={0.1} value={w2} onChange={(e) => setW2(Number(e.target.value))} />
        </label>
        <label className={styles.control}>
          <span>B: bias = <strong>{b2.toFixed(1)}</strong></span>
          <input type="range" min={-3} max={3} step={0.1} value={b2} onChange={(e) => setB2(Number(e.target.value))} />
        </label>
      </div>
      <p className={styles.formula}>output = relu(w₁·x + b₁) − relu(w₂·x + b₂)</p>
    </div>
  );
}
