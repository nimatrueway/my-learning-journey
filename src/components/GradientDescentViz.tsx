import React, {useEffect, useMemo, useRef, useState} from 'react';
import styles from './widgets.module.css';

// Loss surface: a bumpy bowl so high LR can visibly overshoot
const loss = (w: number) => 0.08 * w * w + 0.6 * Math.cos(1.4 * w) + 0.6;
const gradient = (w: number) => 0.16 * w - 0.84 * Math.sin(1.4 * w);

const W = 460;
const H = 240;
const X_MIN = -8;
const X_MAX = 8;
const Y_MIN = -0.6;
const Y_MAX = 6.5;

const toPx = (x: number, y: number): [number, number] => [
  ((x - X_MIN) / (X_MAX - X_MIN)) * W,
  H - ((y - Y_MIN) / (Y_MAX - Y_MIN)) * H,
];

const START_W = 6.5;

export default function GradientDescentViz(): React.ReactElement {
  const [lr, setLr] = useState(0.5);
  const [w, setW] = useState(START_W);
  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState(0);
  const [exploded, setExploded] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const curvePath = useMemo(() => {
    const pts: string[] = [];
    for (let i = 0; i <= 240; i++) {
      const x = X_MIN + (i / 240) * (X_MAX - X_MIN);
      const [px, py] = toPx(x, loss(x));
      pts.push(`${i === 0 ? 'M' : 'L'}${px.toFixed(1)},${py.toFixed(1)}`);
    }
    return pts.join(' ');
  }, []);

  useEffect(() => {
    if (!running) return undefined;
    timer.current = setInterval(() => {
      setW((prev) => {
        const next = prev - lr * gradient(prev);
        if (Math.abs(next) > X_MAX * 1.5) {
          setExploded(true);
          setRunning(false);
          return prev;
        }
        return next;
      });
      setSteps((s) => s + 1);
    }, 120);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [running, lr]);

  const reset = () => {
    setRunning(false);
    setW(START_W);
    setSteps(0);
    setExploded(false);
  };

  const clampedW = Math.max(X_MIN, Math.min(X_MAX, w));
  const [ballX, ballY] = toPx(clampedW, loss(clampedW));
  const converged = !exploded && Math.abs(gradient(w)) < 0.01 && steps > 0;

  return (
    <div className={styles.widget}>
      <svg viewBox={`0 0 ${W} ${H}`} className={styles.plot} role="img" aria-label="Loss curve with descending ball">
        <path d={curvePath} className={styles.curve} fill="none" />
        <circle cx={ballX} cy={ballY - 8} r={8} className={exploded ? styles.ballExploded : styles.ball} />
      </svg>

      <div className={styles.controls}>
        <label className={styles.control}>
          <span>learning rate = <strong>{lr.toFixed(2)}</strong></span>
          <input type="range" min={0.01} max={2.5} step={0.01} value={lr}
            onChange={(e) => setLr(Number(e.target.value))} />
        </label>
        <div className={styles.buttonRow}>
          <button type="button" className={styles.activeButton} onClick={() => setRunning((r) => !r)} disabled={exploded}>
            {running ? 'pause' : 'train'}
          </button>
          <button type="button" className={styles.button} onClick={reset}>reset</button>
        </div>
      </div>

      <p className={styles.statusLine}>
        step {steps} · weight = {w.toFixed(2)} · loss = {loss(clampedW).toFixed(3)}
        {exploded && ' · 💥 the ball flew off — learning rate too high!'}
        {converged && ' · 😸 settled in a valley. nice.'}
      </p>
    </div>
  );
}
