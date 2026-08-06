import React, {useMemo, useState} from 'react';
import styles from './widgets.module.css';

// Train/test points from a wavy underlying function + noise (fixed)
const TRAIN: [number, number][] = [
  [-1.0, -0.35], [-0.78, 0.12], [-0.55, 0.42], [-0.35, 0.25],
  [-0.1, 0.05], [0.12, -0.28], [0.34, -0.42], [0.55, -0.18], [0.78, 0.32], [1.0, 0.58],
];
const TEST: [number, number][] = [
  [-0.9, -0.1], [-0.45, 0.38], [0.0, -0.12], [0.45, -0.35], [0.9, 0.48],
];

const W = 460;
const H = 240;
const X_MIN = -1.15;
const X_MAX = 1.15;
const Y_MIN = -1.2;
const Y_MAX = 1.2;

const toPx = (x: number, y: number): [number, number] => [
  ((x - X_MIN) / (X_MAX - X_MIN)) * W,
  H - ((y - Y_MIN) / (Y_MAX - Y_MIN)) * H,
];

// Ridge-regularized polynomial fit via normal equations + Gaussian elimination
function polyfit(pts: [number, number][], degree: number, lambda: number): number[] {
  const n = degree + 1;
  const A: number[][] = Array.from({length: n}, () => new Array(n + 1).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      let s = 0;
      for (const [x] of pts) s += Math.pow(x, i + j);
      A[i][j] = s + (i === j && i > 0 ? lambda : 0);
    }
    let s = 0;
    for (const [x, y] of pts) s += Math.pow(x, i) * y;
    A[i][n] = s;
  }
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let r = col + 1; r < n; r++) if (Math.abs(A[r][col]) > Math.abs(A[pivot][col])) pivot = r;
    [A[col], A[pivot]] = [A[pivot], A[col]];
    if (Math.abs(A[col][col]) < 1e-12) continue;
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const f = A[r][col] / A[col][col];
      for (let c = col; c <= n; c++) A[r][c] -= f * A[col][c];
    }
  }
  return A.map((row, i) => (Math.abs(row[i]) < 1e-12 ? 0 : row[n] / row[i]));
}

const evalPoly = (coefs: number[], x: number) => coefs.reduce((s, c, i) => s + c * Math.pow(x, i), 0);
const mse = (pts: [number, number][], coefs: number[]) =>
  pts.reduce((s, [x, y]) => s + (evalPoly(coefs, x) - y) ** 2, 0) / pts.length;

export default function OverfitViz({showRegularization = false}: {showRegularization?: boolean}): React.ReactElement {
  const [degree, setDegree] = useState(3);
  const [lambdaExp, setLambdaExp] = useState(-6); // λ = 10^exp, -6 ≈ off

  const lambda = showRegularization ? Math.pow(10, lambdaExp) : 0;
  const {path, trainErr, testErr} = useMemo(() => {
    const coefs = polyfit(TRAIN, degree, lambda);
    const pts: string[] = [];
    for (let i = 0; i <= 200; i++) {
      const x = X_MIN + (i / 200) * (X_MAX - X_MIN);
      const y = Math.max(Y_MIN, Math.min(Y_MAX, evalPoly(coefs, x)));
      const [px, py] = toPx(x, y);
      pts.push(`${i === 0 ? 'M' : 'L'}${px.toFixed(1)},${py.toFixed(1)}`);
    }
    return {path: pts.join(' '), trainErr: mse(TRAIN, coefs), testErr: mse(TEST, coefs)};
  }, [degree, lambda]);

  const gap = testErr / Math.max(trainErr, 1e-6);

  return (
    <div className={styles.widget}>
      <svg viewBox={`0 0 ${W} ${H}`} className={styles.plot} role="img" aria-label="Polynomial fit to noisy points">
        <path d={path} className={styles.curve} fill="none" />
        {TRAIN.map(([x, y], i) => {
          const [px, py] = toPx(x, y);
          return <circle key={`tr${i}`} cx={px} cy={py} r={5} className={styles.probe} />;
        })}
        {TEST.map(([x, y], i) => {
          const [px, py] = toPx(x, y);
          return <circle key={`te${i}`} cx={px} cy={py} r={5} className={styles.testPoint} />;
        })}
      </svg>
      <div className={styles.legendRow}>
        <span className={styles.legendProbe}>● train points (model sees these)</span>
        <span className={styles.legendTest}>● test points (hidden during training)</span>
      </div>
      <div className={styles.controls}>
        <label className={styles.control}>
          <span>model flexibility (poly degree) = <strong>{degree}</strong></span>
          <input type="range" min={1} max={9} step={1} value={degree} onChange={(e) => setDegree(Number(e.target.value))} />
        </label>
        {showRegularization && (
          <label className={styles.control}>
            <span>regularization λ = <strong>{lambda < 1e-5 ? 'off' : lambda.toExponential(0)}</strong></span>
            <input type="range" min={-6} max={0} step={0.5} value={lambdaExp}
              onChange={(e) => setLambdaExp(Number(e.target.value))} />
          </label>
        )}
      </div>
      <p className={styles.statusLine}>
        train error = {trainErr.toFixed(3)} · test error = {testErr.toFixed(3)}
        {gap > 5 && trainErr < 0.05 && ' · 🚨 memorized the train points, flunked the test. Classic overfit.'}
        {gap <= 5 && testErr < 0.06 && ' · 😸 fits the pattern, not the noise. Beautiful.'}
        {trainErr > 0.08 && degree <= 2 && ' · 😿 too stiff to capture the wave (underfitting).'}
      </p>
    </div>
  );
}
