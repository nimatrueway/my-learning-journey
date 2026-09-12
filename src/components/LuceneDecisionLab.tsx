import React, {useId, useState} from 'react';
import styles from './widgets.module.css';

interface Decision {
  label: string;
  result: string;
  cost: string;
}

export default function LuceneDecisionLab({title, label, choices}: {
  title: string;
  label: string;
  choices: Decision[];
}): React.ReactElement {
  const titleId = useId();
  const [selected, setSelected] = useState(0);
  const decision = choices[selected];

  return (
    <section className={styles.widget} aria-labelledby={titleId}>
      <h3 id={titleId} className={styles.widgetTitle}>{title}</h3>
      <label className={styles.control}>
        {label}
        <select value={selected} onChange={event => setSelected(Number(event.target.value))}>
          {choices.map((choice, index) => <option key={choice.label} value={index}>{choice.label}</option>)}
        </select>
      </label>
      <div className={styles.practiceResult} aria-live="polite">
        <p><strong>Outcome:</strong> {decision.result}</p>
        <p><strong>Tradeoff:</strong> {decision.cost}</p>
      </div>
    </section>
  );
}