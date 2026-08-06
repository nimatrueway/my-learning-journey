import React, {useState} from 'react';
import styles from './widgets.module.css';

const relu = (z: number) => Math.max(0, z);

// Fixed weights: x → (h1, h2) → y
const W11 = 2.0;   // x → h1
const B1 = -1.0;
const W12 = -1.0;  // x → h2
const B2 = 1.0;
const V1 = 1.5;    // h1 → y
const V2 = 2.0;    // h2 → y

export default function ForwardPassViz(): React.ReactElement {
  const [x, setX] = useState(1.0);

  const z1 = W11 * x + B1;
  const z2 = W12 * x + B2;
  const h1 = relu(z1);
  const h2 = relu(z2);
  const y = V1 * h1 + V2 * h2;

  const node = (cx: number, cy: number, label: string, value: number, dead: boolean) => (
    <g>
      <circle cx={cx} cy={cy} r={30} className={dead ? styles.nodeDead : styles.node} />
      <text x={cx} y={cy - 4} textAnchor="middle" className={styles.nodeLabel}>{label}</text>
      <text x={cx} y={cy + 14} textAnchor="middle" className={styles.nodeValue}>{value.toFixed(2)}</text>
    </g>
  );

  const edge = (x1: number, y1: number, x2: number, y2: number, label: string) => (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} className={styles.edge} />
      <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 8} textAnchor="middle" className={styles.edgeLabel}>{label}</text>
    </g>
  );

  return (
    <div className={styles.widget}>
      <svg viewBox="0 0 460 240" className={styles.plot} role="img" aria-label="Forward pass through a tiny network">
        {edge(90, 120, 200, 60, `×${W11} +${B1}`)}
        {edge(90, 120, 200, 180, `×${W12} +${B2}`)}
        {edge(260, 60, 370, 120, `×${V1}`)}
        {edge(260, 180, 370, 120, `×${V2}`)}
        {node(60, 120, 'x', x, false)}
        {node(230, 60, 'h₁', h1, h1 === 0)}
        {node(230, 180, 'h₂', h2, h2 === 0)}
        {node(400, 120, 'y', y, false)}
      </svg>
      <label className={styles.control}>
        <span>input x = <strong>{x.toFixed(1)}</strong></span>
        <input type="range" min={-2} max={3} step={0.1} value={x} onChange={(e) => setX(Number(e.target.value))} />
      </label>
      <p className={styles.statusLine}>
        h₁ = relu({W11}·{x.toFixed(1)} + {B1}) = {h1.toFixed(2)} · h₂ = relu({W12}·{x.toFixed(1)} + {B2}) = {h2.toFixed(2)} · y = {V1}·h₁ + {V2}·h₂ = {y.toFixed(2)}
        {(h1 === 0 || h2 === 0) && ' · 😾 a grayed-out neuron is asleep (ReLU output 0)'}
      </p>
    </div>
  );
}
