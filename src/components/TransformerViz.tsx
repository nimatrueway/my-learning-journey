import React, {useState} from 'react';
import styles from './widgets.module.css';

const STAGES = [
  {
    title: '1. Tokens go in',
    visual: '"the cat sat" → [the] [cat] [sat]',
    caption: 'Text is chopped into tokens. Each token is about to become a vector.',
  },
  {
    title: '2. Embeddings + position',
    visual: '[the]→(0.2, −1.1, …)  [cat]→(0.9, 0.4, …)  [sat]→(−0.3, 0.8, …)',
    caption: 'Each token becomes a big vector (its "meaning coordinates"), plus a tag saying WHERE in the sentence it sits — because to a transformer, word order isn\u2019t free.',
  },
  {
    title: '3. Self-attention',
    visual: '[cat] 👁→ [the] 12% · [cat] 61% · [sat] 27%',
    caption: 'Every token looks at every other token and asks "how relevant are you to me?" — then blends their vectors accordingly. This is the superpower from lesson 5.3.',
  },
  {
    title: '4. MLP (feed-forward)',
    visual: 'each vector → tiny 2-layer network → richer vector',
    caption: 'After gathering context, each token gets private thinking time: a small neural network (the kind from Module 1!) transforms it further.',
  },
  {
    title: '5. Repeat ×N',
    visual: '[attention → MLP] × 12 … × 96',
    caption: 'Stack that attention+MLP block N times. GPT-scale models: ~96 layers. Same block, over and over. Transformers are boringly repetitive — that\u2019s why they scale.',
  },
  {
    title: '6. Predict the next token',
    visual: '"the cat sat" → on: 62% · quietly: 11% · down: 9% …',
    caption: 'The final vector becomes scores over the whole vocabulary. Sample one, append it, repeat. That\u2019s literally all "text generation" is.',
  },
];

export default function TransformerViz(): React.ReactElement {
  const [stage, setStage] = useState(0);
  const s = STAGES[stage];

  return (
    <div className={styles.widget}>
      <div className={styles.stepperChain}>
        {STAGES.map((st, i) => (
          <span key={i} className={i === stage ? styles.chainNodeActive : styles.chainNode}
            onClick={() => setStage(i)} style={{cursor: 'pointer'}}>
            {i + 1}
          </span>
        ))}
      </div>
      <div className={styles.stepperCard}>
        <p className={styles.stepperTitle}>{s.title}</p>
        <p className={styles.stepperVisual}>{s.visual}</p>
        <p>{s.caption}</p>
      </div>
      <div className={styles.buttonRow}>
        <button type="button" className={styles.button} disabled={stage === 0} onClick={() => setStage((v) => v - 1)}>← back</button>
        <button type="button" className={styles.activeButton} disabled={stage === STAGES.length - 1}
          onClick={() => setStage((v) => v + 1)}>next →</button>
      </div>
    </div>
  );
}
