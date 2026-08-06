import React, {useState} from 'react';
import styles from './widgets.module.css';

// Fixed forward pass: x=2, w=3, b=-4, target=5
// z1 = w·x = 6 → z2 = z1 + b = 2 → a = relu(z2) = 2 → loss = (a − 5)² = 9
const STEPS = [
  {
    node: 'loss = (a − target)² = 9',
    grad: null as string | null,
    blame: 'Forward pass done. Prediction 2, target 5. Loss = 9. Someone must pay. Time to assign blame — backwards.',
  },
  {
    node: 'a (prediction) — grad: ∂loss/∂a = 2(a − target) = −6',
    grad: '−6',
    blame: 'The prediction was too LOW by 3. Gradient −6 says: "increasing a would decrease the loss." Blame flows to whoever made a.',
  },
  {
    node: 'z2 (before ReLU) — grad: −6 × 1 = −6',
    grad: '−6',
    blame: 'ReLU was awake (z2 = 2 > 0), so it passed the blame through unchanged. Local slope = 1. If the cat had been asleep (z2 < 0), blame would stop dead here: slope 0.',
  },
  {
    node: 'b (bias) — grad: −6 × 1 = −6',
    grad: '−6',
    blame: 'z2 = z1 + b, and addition splits blame equally (local slope 1 each way). The bias hears: "nudge yourself UP to fix this."',
  },
  {
    node: 'w (weight) — grad: −6 × x = −6 × 2 = −12',
    grad: '−12',
    blame: 'z1 = w·x, so w\u2019s local slope is x = 2. Blame gets AMPLIFIED by the input. Biggest gradient in the chain — w takes the biggest step. Blame successfully assigned. 🎉',
  },
];

export default function BackpropViz(): React.ReactElement {
  const [step, setStep] = useState(0);

  return (
    <div className={styles.widget}>
      <div className={styles.stepperChain}>
        {['x=2', 'w=3', '×', '+b (−4)', 'relu', 'loss=9'].map((label, i) => (
          <span key={i} className={styles.chainNode}>{label}</span>
        ))}
      </div>
      <div className={styles.stepperCard}>
        <p className={styles.stepperTitle}>
          Step {step} of {STEPS.length - 1}: {STEPS[step].node}
        </p>
        <p>{STEPS[step].blame}</p>
      </div>
      <div className={styles.buttonRow}>
        <button type="button" className={styles.button} disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
          ← back
        </button>
        <button type="button" className={styles.activeButton} disabled={step === STEPS.length - 1}
          onClick={() => setStep((s) => s + 1)}>
          {step === 0 ? 'start blaming →' : 'next →'}
        </button>
        <button type="button" className={styles.button} onClick={() => setStep(0)}>reset</button>
      </div>
      <p className={styles.statusLine}>
        gradients so far: {STEPS.slice(1, step + 1).map((s) => s.grad).join(', ') || '(none yet)'}
      </p>
    </div>
  );
}
