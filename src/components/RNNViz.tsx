import React, {useState} from 'react';
import styles from './widgets.module.css';

const SENTENCE = ['The', 'cat', 'knocked', 'the', 'glass', 'off', 'the', 'table', 'because', 'it', 'was', 'bored'];
const DECAY = 0.55;

export default function RNNViz(): React.ReactElement {
  const [step, setStep] = useState(0); // how many words consumed

  // memory strength of each consumed word after `step` steps
  const strengths = SENTENCE.map((_, i) =>
    i < step ? Math.pow(DECAY, step - 1 - i) : 0,
  );

  return (
    <div className={styles.widget}>
      <div className={styles.tokenRow}>
        {SENTENCE.map((w, i) => (
          <span key={i}
            className={i === step - 1 ? styles.tokenActive : i < step ? styles.token : styles.tokenFuture}>
            {w}
          </span>
        ))}
      </div>
      <div className={styles.memoryBars}>
        {SENTENCE.map((w, i) => (
          <div key={i} className={styles.memoryBarRow}>
            <span className={styles.memoryBarLabel}>{w}</span>
            <div className={styles.memoryBarTrack}>
              <div className={styles.memoryBarFill} style={{width: `${strengths[i] * 100}%`}} />
            </div>
          </div>
        ))}
      </div>
      <div className={styles.buttonRow}>
        <button type="button" className={styles.activeButton} disabled={step >= SENTENCE.length}
          onClick={() => setStep((s) => s + 1)}>
          read next word
        </button>
        <button type="button" className={styles.button} onClick={() => setStep(0)}>reset</button>
      </div>
      <p className={styles.statusLine}>
        {step === 0 && 'the hidden state starts empty — press "read next word"'}
        {step > 0 && step < SENTENCE.length && `hidden state after "${SENTENCE[step - 1]}" — older words fade by ×${DECAY} each step`}
        {step >= SENTENCE.length && '🙀 by the time we hit "bored", "cat" is nearly gone. Who was bored? The glass?? THIS is the RNN memory problem.'}
      </p>
    </div>
  );
}
