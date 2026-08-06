import React, {useEffect, useRef, useState} from 'react';
import styles from './widgets.module.css';

// Elongated bowl: steep in w2, shallow in w1 — the classic zigzag ravine
const GRAD = (w1: number, w2: number): [number, number] => [0.3 * w1, 4 * w2];

const W = 460;
const H = 260;
const X_MIN = -10;
const X_MAX = 10;
const Y_MIN = -3.2;
const Y_MAX = 3.2;

const toPx = (x: number, y: number): [number, number] => [
  ((x - X_MIN) / (X_MAX - X_MIN)) * W,
  H - ((y - Y_MIN) / (Y_MAX - Y_MIN)) * H,
];

const START: [number, number] = [-8.5, 2.6];

export default function Descent2D(): React.ReactElement {
  const [lr, setLr] = useState(0.3);
  const [path, setPath] = useState<[number, number][]>([START]);
  const [running, setRunning] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!running) return undefined;
    timer.current = setInterval(() => {
      setPath((prev) => {
        const [w1, w2] = prev[prev.length - 1];
        const [g1, g2] = GRAD(w1, w2);
        const next: [number, number] = [w1 - lr * g1, w2 - lr * g2];
        if (Math.abs(next[1]) > 30 || prev.length > 200) {
          setRunning(false);
          return prev;
        }
        return [...prev, next];
      });
    }, 100);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [running, lr]);

  const reset = () => {
    setRunning(false);
    setPath([START]);
  };

  const last = path[path.length - 1];
  const diverged = Math.abs(last[1]) > 10;
  const converged = !diverged && Math.hypot(...GRAD(last[0], last[1])) < 0.05 && path.length > 1;

  const pathStr = path
    .map(([x, y], i) => {
      const [px, py] = toPx(Math.max(X_MIN, Math.min(X_MAX, x)), Math.max(Y_MIN, Math.min(Y_MAX, y)));
      return `${i === 0 ? 'M' : 'L'}${px.toFixed(1)},${py.toFixed(1)}`;
    })
    .join(' ');
  const [bx, by] = toPx(
    Math.max(X_MIN, Math.min(X_MAX, last[0])),
    Math.max(Y_MIN, Math.min(Y_MAX, last[1])),
  );
  const [cx, cy] = toPx(0, 0);

  // Contour ellipses of 0.15·w1² + 2·w2² = c
  const contours = [0.5, 2, 4.5, 8, 12.5].map((c) => ({
    rx: (Math.sqrt(c / 0.15) / (X_MAX - X_MIN)) * W,
    ry: (Math.sqrt(c / 2) / (Y_MAX - Y_MIN)) * H,
  }));

  return (
    <div className={styles.widget}>
      <svg viewBox={`0 0 ${W} ${H}`} className={styles.plot} role="img" aria-label="Gradient descent on a 2D loss landscape">
        {contours.map((e, i) => (
          <ellipse key={i} cx={cx} cy={cy} rx={e.rx} ry={e.ry} className={styles.contour} fill="none" />
        ))}
        <circle cx={cx} cy={cy} r={4} className={styles.goal} />
        <path d={pathStr} className={styles.trail} fill="none" />
        <circle cx={bx} cy={by} r={7} className={diverged ? styles.ballExploded : styles.ball} />
      </svg>
      <div className={styles.controls}>
        <label className={styles.control}>
          <span>learning rate = <strong>{lr.toFixed(2)}</strong></span>
          <input type="range" min={0.01} max={0.6} step={0.01} value={lr} onChange={(e) => setLr(Number(e.target.value))} />
        </label>
        <div className={styles.buttonRow}>
          <button type="button" className={styles.activeButton} onClick={() => setRunning((r) => !r)}>
            {running ? 'pause' : 'train'}
          </button>
          <button type="button" className={styles.button} onClick={reset}>reset</button>
        </div>
      </div>
      <p className={styles.statusLine}>
        step {path.length - 1} · w = ({last[0].toFixed(2)}, {last[1].toFixed(2)})
        {diverged && ' · 💥 zigzagged into orbit — the steep direction couldn\u2019t handle that step size'}
        {converged && ' · 😸 reached the bottom of the bowl'}
      </p>
    </div>
  );
}
