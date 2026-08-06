import React, {useMemo, useState} from 'react';
import styles from './widgets.module.css';

type Activation = 'relu' | 'sigmoid' | 'none';

const ACTIVATIONS: Record<Activation, (z: number) => number> = {
  relu: (z) => Math.max(0, z),
  sigmoid: (z) => 1 / (1 + Math.exp(-z)),
  none: (z) => z,
};

const W = 460;
const H = 260;
const X_MIN = -5;
const X_MAX = 5;
const Y_MIN = -3;
const Y_MAX = 3;

const toPx = (x: number, y: number): [number, number] => [
  ((x - X_MIN) / (X_MAX - X_MIN)) * W,
  H - ((y - Y_MIN) / (Y_MAX - Y_MIN)) * H,
];

export default function NeuronPlayground(): React.ReactElement {
  const [weight, setWeight] = useState(1.0);
  const [bias, setBias] = useState(0.0);
  const [activation, setActivation] = useState<Activation>('relu');
  const [probeX, setProbeX] = useState(1.5);

  const path = useMemo(() => {
    const fn = ACTIVATIONS[activation];
    const pts: string[] = [];
    for (let i = 0; i <= 200; i++) {
      const x = X_MIN + (i / 200) * (X_MAX - X_MIN);
      const y = fn(weight * x + bias);
      const [px, py] = toPx(x, Math.max(Y_MIN, Math.min(Y_MAX, y)));
      pts.push(`${i === 0 ? 'M' : 'L'}${px.toFixed(1)},${py.toFixed(1)}`);
    }
    return pts.join(' ');
  }, [weight, bias, activation]);

  const probeY = ACTIVATIONS[activation](weight * probeX + bias);
  const [probePx, probePy] = toPx(probeX, Math.max(Y_MIN, Math.min(Y_MAX, probeY)));
  const [zeroX0, zeroY0] = toPx(X_MIN, 0);
  const [zeroX1] = toPx(X_MAX, 0);
  const [axisX] = toPx(0, 0);

  return (
    <div className={styles.widget}>
      <svg viewBox={`0 0 ${W} ${H}`} className={styles.plot} role="img" aria-label="Neuron output curve">
        <line x1={zeroX0} y1={zeroY0} x2={zeroX1} y2={zeroY0} className={styles.axis} />
        <line x1={axisX} y1={0} x2={axisX} y2={H} className={styles.axis} />
        <path d={path} className={styles.curve} fill="none" />
        <circle cx={probePx} cy={probePy} r={7} className={styles.probe} />
        <text x={Math.min(probePx + 12, W - 130)} y={Math.max(probePy - 12, 16)} className={styles.probeLabel}>
          in: {probeX.toFixed(1)} → out: {probeY.toFixed(2)}
        </text>
      </svg>

      <div className={styles.controls}>
        <label className={styles.control}>
          <span>weight = <strong>{weight.toFixed(1)}</strong></span>
          <input type="range" min={-3} max={3} step={0.1} value={weight}
            onChange={(e) => setWeight(Number(e.target.value))} />
        </label>
        <label className={styles.control}>
          <span>bias = <strong>{bias.toFixed(1)}</strong></span>
          <input type="range" min={-3} max={3} step={0.1} value={bias}
            onChange={(e) => setBias(Number(e.target.value))} />
        </label>
        <label className={styles.control}>
          <span>input = <strong>{probeX.toFixed(1)}</strong></span>
          <input type="range" min={X_MIN} max={X_MAX} step={0.1} value={probeX}
            onChange={(e) => setProbeX(Number(e.target.value))} />
        </label>
        <div className={styles.control}>
          <span>activation</span>
          <div className={styles.buttonRow}>
            {(Object.keys(ACTIVATIONS) as Activation[]).map((a) => (
              <button key={a} type="button"
                className={a === activation ? styles.activeButton : styles.button}
                onClick={() => setActivation(a)}>
                {a}
              </button>
            ))}
          </div>
        </div>
      </div>
      <p className={styles.formula}>
        output = {activation === 'none' ? '' : `${activation}(`}weight × input + bias{activation === 'none' ? '' : ')'}
      </p>
    </div>
  );
}
