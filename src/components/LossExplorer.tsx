import React, {useState} from 'react';
import styles from './widgets.module.css';

// Fixed noisy points around y = 0.7x + 0.5
const POINTS: [number, number][] = [
  [-3, -1.8], [-2.2, -0.7], [-1.5, -0.9], [-0.6, 0.3],
  [0.4, 0.6], [1.2, 1.6], [2.1, 1.7], [2.9, 2.8],
];

const W = 460;
const H = 260;
const X_MIN = -4;
const X_MAX = 4;
const Y_MIN = -4;
const Y_MAX = 4;

const toPx = (x: number, y: number): [number, number] => [
  ((x - X_MIN) / (X_MAX - X_MIN)) * W,
  H - ((y - Y_MIN) / (Y_MAX - Y_MIN)) * H,
];

export default function LossExplorer(): React.ReactElement {
  const [slope, setSlope] = useState(-0.5);
  const [intercept, setIntercept] = useState(1.5);

  const predict = (x: number) => slope * x + intercept;
  const mse = POINTS.reduce((s, [x, y]) => s + (predict(x) - y) ** 2, 0) / POINTS.length;
  const best = 0.055; // approx MSE of the least-squares fit

  const [lx0, ly0] = toPx(X_MIN, predict(X_MIN));
  const [lx1, ly1] = toPx(X_MAX, predict(X_MAX));

  return (
    <div className={styles.widget}>
      <svg viewBox={`0 0 ${W} ${H}`} className={styles.plot} role="img" aria-label="Fit a line to points">
        {POINTS.map(([x, y], i) => {
          const [px, py] = toPx(x, y);
          const [, pyHat] = toPx(x, Math.max(Y_MIN, Math.min(Y_MAX, predict(x))));
          return (
            <g key={i}>
              <line x1={px} y1={py} x2={px} y2={pyHat} className={styles.residual} />
              <circle cx={px} cy={py} r={5} className={styles.probe} />
            </g>
          );
        })}
        <line x1={lx0} y1={ly0} x2={lx1} y2={ly1} className={styles.curve} />
      </svg>
      <div className={styles.controls}>
        <label className={styles.control}>
          <span>slope = <strong>{slope.toFixed(2)}</strong></span>
          <input type="range" min={-2} max={2} step={0.05} value={slope} onChange={(e) => setSlope(Number(e.target.value))} />
        </label>
        <label className={styles.control}>
          <span>intercept = <strong>{intercept.toFixed(2)}</strong></span>
          <input type="range" min={-2} max={2} step={0.05} value={intercept} onChange={(e) => setIntercept(Number(e.target.value))} />
        </label>
      </div>
      <p className={styles.statusLine}>
        loss (MSE) = {mse.toFixed(3)}
        {mse < best * 2 && ' · 😻 basically purr-fect'}
        {mse >= best * 2 && mse < 1 && ' · 🙀 getting warm, keep tuning'}
        {mse >= 1 && ' · 😾 the red sticks are judging you'}
      </p>
    </div>
  );
}
