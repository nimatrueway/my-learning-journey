import React, {useMemo, useState} from 'react';
import styles from './widgets.module.css';

const W = 460;
const H = 240;
const STEPS = 100;
const Y_MAX = 3;

// deterministic noise
const noise = (i: number, seed: number) => Math.sin(i * 12.9898 + seed * 78.233) * 0.06;

const toPx = (i: number, y: number): [number, number] => [
  (i / STEPS) * W,
  H - (Math.max(0, Math.min(Y_MAX, y)) / Y_MAX) * H,
];

export default function TrainingSimulator(): React.ReactElement {
  const [lr, setLr] = useState(0.3);
  const [modelSize, setModelSize] = useState(2); // 1=tiny 2=right 3=huge
  const [dataSize, setDataSize] = useState(2);   // 1=tiny 2=plenty

  const {trainPath, valPath, verdict} = useMemo(() => {
    const unstable = lr > 0.85;
    const speed = unstable ? 0 : lr * 2.2;
    const floor = modelSize === 1 ? 0.55 : 0.08; // tiny model can't fit well
    const overfit = (modelSize === 3 ? 0.02 : modelSize === 2 ? 0.004 : 0) * (dataSize === 1 ? 2.5 : 0.4);

    const train: string[] = [];
    const val: string[] = [];
    for (let i = 0; i <= STEPS; i++) {
      let t: number;
      if (unstable) {
        t = 1.5 + 0.9 * Math.sin(i * 1.7) * (i / STEPS) + noise(i, 1) * 8;
      } else {
        t = floor + (2.2 - floor) * Math.exp(-speed * (i / STEPS) * 5) + noise(i, 1);
      }
      const v = unstable ? t + 0.3 : t + 0.05 + overfit * i * (i / STEPS);
      const [tx, ty] = toPx(i, t);
      const [vx, vy] = toPx(i, v);
      train.push(`${i === 0 ? 'M' : 'L'}${tx.toFixed(1)},${ty.toFixed(1)}`);
      val.push(`${i === 0 ? 'M' : 'L'}${vx.toFixed(1)},${vy.toFixed(1)}`);
    }

    let msg: string;
    if (unstable) msg = '💥 loss is bouncing — learning rate too high. Cat on espresso again.';
    else if (modelSize === 1) msg = '😿 both curves plateau high: model too small to learn the pattern (underfitting).';
    else if (overfit > 0.02) msg = '🚨 train loss falls, val loss RISES — the model is memorizing, not learning (overfitting).';
    else if (lr < 0.08) msg = '🐌 converging, but painfully slowly. Bump the learning rate.';
    else msg = '😸 both curves low and close together. This is what good training looks like.';

    return {trainPath: train.join(' '), valPath: val.join(' '), verdict: msg};
  }, [lr, modelSize, dataSize]);

  return (
    <div className={styles.widget}>
      <svg viewBox={`0 0 ${W} ${H}`} className={styles.plot} role="img" aria-label="Simulated training and validation loss curves">
        <path d={trainPath} className={styles.curve} fill="none" />
        <path d={valPath} className={styles.curveVal} fill="none" />
        <text x={8} y={16} className={styles.probeLabel}>loss ↓ good · x-axis: training steps →</text>
      </svg>
      <div className={styles.legendRow}>
        <span className={styles.legendMain}>— train loss</span>
        <span className={styles.legendVal}>— validation loss</span>
      </div>
      <div className={styles.controls}>
        <label className={styles.control}>
          <span>learning rate = <strong>{lr.toFixed(2)}</strong></span>
          <input type="range" min={0.02} max={1.0} step={0.02} value={lr} onChange={(e) => setLr(Number(e.target.value))} />
        </label>
        <div className={styles.control}>
          <span>model size</span>
          <div className={styles.buttonRow}>
            {(['tiny', 'right-sized', 'huge'] as const).map((label, i) => (
              <button key={label} type="button" className={modelSize === i + 1 ? styles.activeButton : styles.button}
                onClick={() => setModelSize(i + 1)}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.control}>
          <span>training data</span>
          <div className={styles.buttonRow}>
            {(['a handful', 'plenty'] as const).map((label, i) => (
              <button key={label} type="button" className={dataSize === i + 1 ? styles.activeButton : styles.button}
                onClick={() => setDataSize(i + 1)}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <p className={styles.statusLine}>{verdict}</p>
    </div>
  );
}
