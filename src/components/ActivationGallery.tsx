import React, {useMemo, useState} from 'react';
import styles from './widgets.module.css';

type Name = 'relu' | 'sigmoid' | 'tanh' | 'linear';

const FNS: Record<Name, (z: number) => number> = {
  relu: (z) => Math.max(0, z),
  sigmoid: (z) => 1 / (1 + Math.exp(-z)),
  tanh: (z) => Math.tanh(z),
  linear: (z) => z,
};

const PERSONALITY: Record<Name, string> = {
  relu: 'The bouncer. Negatives don\u2019t get in. Cheap to compute, works everywhere. The default choice.',
  sigmoid: 'The diplomat. Squashes everything into (0, 1) — perfect when you need a probability.',
  tanh: 'Sigmoid\u2019s cooler sibling. Squashes into (−1, 1), centered at zero. Old-school RNN favorite.',
  linear: 'No activation at all. Stack 100 of these and you still just have… a line. Useless drama-free zone.',
};

const W = 460;
const H = 240;
const X_MIN = -5;
const X_MAX = 5;
const Y_MIN = -2;
const Y_MAX = 2;

const toPx = (x: number, y: number): [number, number] => [
  ((x - X_MIN) / (X_MAX - X_MIN)) * W,
  H - ((y - Y_MIN) / (Y_MAX - Y_MIN)) * H,
];

export default function ActivationGallery(): React.ReactElement {
  const [name, setName] = useState<Name>('relu');
  const [probeX, setProbeX] = useState(1.0);

  const path = useMemo(() => {
    const fn = FNS[name];
    const pts: string[] = [];
    for (let i = 0; i <= 200; i++) {
      const x = X_MIN + (i / 200) * (X_MAX - X_MIN);
      const y = Math.max(Y_MIN, Math.min(Y_MAX, fn(x)));
      const [px, py] = toPx(x, y);
      pts.push(`${i === 0 ? 'M' : 'L'}${px.toFixed(1)},${py.toFixed(1)}`);
    }
    return pts.join(' ');
  }, [name]);

  const y = FNS[name](probeX);
  const [px, py] = toPx(probeX, Math.max(Y_MIN, Math.min(Y_MAX, y)));
  const [zx0, zy0] = toPx(X_MIN, 0);
  const [zx1] = toPx(X_MAX, 0);
  const [ax] = toPx(0, 0);

  return (
    <div className={styles.widget}>
      <div className={styles.buttonRow}>
        {(Object.keys(FNS) as Name[]).map((n) => (
          <button key={n} type="button" className={n === name ? styles.activeButton : styles.button}
            onClick={() => setName(n)}>
            {n}
          </button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className={styles.plot} role="img" aria-label={`${name} activation curve`}>
        <line x1={zx0} y1={zy0} x2={zx1} y2={zy0} className={styles.axis} />
        <line x1={ax} y1={0} x2={ax} y2={H} className={styles.axis} />
        <path d={path} className={styles.curve} fill="none" />
        <circle cx={px} cy={py} r={7} className={styles.probe} />
        <text x={Math.min(px + 12, W - 140)} y={Math.max(py - 12, 16)} className={styles.probeLabel}>
          in: {probeX.toFixed(1)} → out: {y.toFixed(2)}
        </text>
      </svg>
      <label className={styles.control}>
        <span>input = <strong>{probeX.toFixed(1)}</strong></span>
        <input type="range" min={X_MIN} max={X_MAX} step={0.1} value={probeX}
          onChange={(e) => setProbeX(Number(e.target.value))} />
      </label>
      <p className={styles.statusLine}>{PERSONALITY[name]}</p>
    </div>
  );
}
