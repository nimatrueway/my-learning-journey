import React, {useState} from 'react';
import styles from './widgets.module.css';

type Mode = 'bottleneck' | 'attention';

const SOURCE = ['the', 'cat', 'knocked', 'the', 'glass', 'off', 'the', 'table'];
const TARGET = ['le', 'chat', 'a', 'fait', 'tomber', 'le', 'verre', 'de', 'la', 'table'];

/** Hand-aligned cross-attention rows: for each French token, how much of each English token it reads. */
const ALIGNMENT: number[][] = [
  [0.62, 0.20, 0.05, 0.04, 0.03, 0.02, 0.02, 0.02],
  [0.10, 0.72, 0.06, 0.03, 0.03, 0.02, 0.02, 0.02],
  [0.04, 0.08, 0.60, 0.04, 0.06, 0.10, 0.04, 0.04],
  [0.03, 0.05, 0.45, 0.03, 0.07, 0.29, 0.04, 0.04],
  [0.02, 0.04, 0.25, 0.02, 0.07, 0.52, 0.04, 0.04],
  [0.10, 0.03, 0.04, 0.55, 0.20, 0.03, 0.03, 0.02],
  [0.03, 0.04, 0.04, 0.12, 0.68, 0.04, 0.03, 0.02],
  [0.03, 0.02, 0.04, 0.03, 0.06, 0.62, 0.12, 0.08],
  [0.04, 0.02, 0.03, 0.05, 0.04, 0.10, 0.55, 0.17],
  [0.02, 0.02, 0.02, 0.03, 0.03, 0.06, 0.14, 0.68],
];

const GARBLED = '▒▒▒';
const EVIDENCE_NEEDED = 0.45;

interface Seq2SeqVizProps {
  initialMode?: Mode;
}

export default function Seq2SeqViz({initialMode = 'bottleneck'}: Seq2SeqVizProps): React.ReactElement {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [step, setStep] = useState(0);
  const [vectorSize, setVectorSize] = useState(256);

  // How sharply one fixed-size context vector still remembers each source word.
  const span = vectorSize / 96;
  const retention = SOURCE.map((_, index) => Math.exp(-(SOURCE.length - 1 - index) / span));
  const evidence = ALIGNMENT.map(row => row.reduce((total, weight, index) => total + weight * retention[index], 0));
  const decoded = TARGET.map((word, index) => (mode === 'attention' || evidence[index] >= EVIDENCE_NEEDED ? word : GARBLED));
  const lost = decoded.filter(word => word === GARBLED).length;

  const weights = ALIGNMENT[step];
  const intensity = mode === 'attention' ? weights : retention;
  const scale = mode === 'attention' ? 1 / Math.max(...weights) : 1;
  const focus = weights.indexOf(Math.max(...weights));

  return (
    <div className={styles.widget}>
      <div className={styles.buttonRow} role="group" aria-label="Decoder input">
        <button
          className={mode === 'bottleneck' ? styles.activeButton : styles.button}
          aria-pressed={mode === 'bottleneck'}
          onClick={() => setMode('bottleneck')}>
          One context vector
        </button>
        <button
          className={mode === 'attention' ? styles.activeButton : styles.button}
          aria-pressed={mode === 'attention'}
          onClick={() => setMode('attention')}>
          Cross-attention
        </button>
      </div>

      <p className={styles.stepperTitle}>
        Encoder input (English) — shading = how much of each word reaches the decoder right now
      </p>
      <div className={styles.tokenRow}>
        {SOURCE.map((word, index) => (
          <span
            key={index}
            className={mode === 'attention' && index === focus ? styles.tokenActive : styles.token}
            style={mode === 'attention' && index === focus
              ? undefined
              : {background: `rgba(37, 194, 160, ${Math.min(1, intensity[index] * scale)})`}}>
            {word}
            <small className={styles.tokenPct}>{Math.round(intensity[index] * 100)}%</small>
          </span>
        ))}
      </div>

      <p className={styles.stepperTitle}>Decoder output (French) — step {step + 1} of {TARGET.length}</p>
      <div className={styles.tokenRow}>
        {decoded.map((word, index) => (
          <span
            key={index}
            className={index === step ? styles.tokenActive : index > step ? styles.tokenFuture : styles.token}>
            {word}
          </span>
        ))}
      </div>

      <div className={styles.controls}>
        <label className={styles.control}>
          Decoding step: {step + 1}
          <input
            type="range"
            min="0"
            max={TARGET.length - 1}
            value={step}
            onChange={event => setStep(Number(event.target.value))} />
        </label>
        {mode === 'bottleneck' && (
          <label className={styles.control}>
            Context vector size: {vectorSize}-d
            <input
              type="range"
              min="64"
              max="1024"
              step="64"
              value={vectorSize}
              onChange={event => setVectorSize(Number(event.target.value))} />
          </label>
        )}
      </div>

      <p className={styles.statusLine}>
        {mode === 'attention'
          ? `Producing “${TARGET[step]}” · reads “${SOURCE[focus]}” at ${Math.round(weights[focus] * 100)}% · all ${SOURCE.length} encoder states stay available, so nothing has to be memorised.`
          : `Producing “${decoded[step]}” · one ${vectorSize}-d vector carries all ${SOURCE.length} words · evidence left for this word: ${Math.round(evidence[step] * 100)}% · ${lost} of ${TARGET.length} output words fall below the ${Math.round(EVIDENCE_NEEDED * 100)}% the decoder needs.`}
      </p>
    </div>
  );
}
