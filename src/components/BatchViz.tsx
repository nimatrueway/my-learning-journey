import React, {useMemo, useState} from 'react';
import styles from './widgets.module.css';

const SAMPLES = ['🐱','🐶','🐱','🐱','🐶','🐱','🐶','🐶','🐱','🐶','🐱','🐱','🐶','🐱','🐶','🐱','🐶','🐶','🐱','🐶','🐱','🐶','🐱','🐶'];

// deterministic shuffle
function shuffled(seed: number): number[] {
  const idx = SAMPLES.map((_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) {
    const r = Math.abs(Math.sin(seed * 999 + i * 7.13)) % 1;
    const j = Math.floor(r * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx;
}

export default function BatchViz(): React.ReactElement {
  const [batchSize, setBatchSize] = useState(4);
  const [epoch, setEpoch] = useState(0);
  const [currentBatch, setCurrentBatch] = useState(0);

  const order = useMemo(() => shuffled(epoch + 1), [epoch]);
  const nBatches = Math.ceil(SAMPLES.length / batchSize);

  const nextBatch = () => {
    if (currentBatch + 1 >= nBatches) {
      setEpoch((e) => e + 1); // reshuffles
      setCurrentBatch(0);
    } else {
      setCurrentBatch((b) => b + 1);
    }
  };

  return (
    <div className={styles.widget}>
      <div className={styles.batchGrid}>
        {order.map((sampleIdx, pos) => {
          const batchOf = Math.floor(pos / batchSize);
          const active = batchOf === currentBatch;
          const seen = batchOf < currentBatch;
          return (
            <span key={pos}
              className={active ? styles.batchCellActive : seen ? styles.batchCellSeen : styles.batchCell}>
              {SAMPLES[sampleIdx]}
            </span>
          );
        })}
      </div>
      <div className={styles.controls}>
        <label className={styles.control}>
          <span>batch size = <strong>{batchSize}</strong></span>
          <input type="range" min={1} max={12} step={1} value={batchSize}
            onChange={(e) => { setBatchSize(Number(e.target.value)); setCurrentBatch(0); }} />
        </label>
        <div className={styles.buttonRow}>
          <button type="button" className={styles.activeButton} onClick={nextBatch}>feed next batch</button>
          <button type="button" className={styles.button}
            onClick={() => { setEpoch(0); setCurrentBatch(0); }}>reset</button>
        </div>
      </div>
      <p className={styles.statusLine}>
        epoch {epoch + 1} · batch {currentBatch + 1}/{nBatches} · one gradient step per batch — {batchSize === 1
          ? 'batch of 1: noisy, chaotic steps'
          : batchSize >= 12
          ? 'big batches: smooth but each step costs more compute'
          : 'the sweet spot lives somewhere in the middle'}
      </p>
    </div>
  );
}
