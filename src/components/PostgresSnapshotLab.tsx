import React, {useId, useState} from 'react';
import styles from './widgets.module.css';

const stages = [
  'A reads stock = 10; its first snapshot is established.',
  'B updates stock to 9 but has not committed. A reads again.',
  'B commits. A starts another SELECT in the same transaction.',
  'A ends its transaction and reads in a new transaction.',
];

export default function PostgresSnapshotLab(): React.ReactElement {
  const titleId = useId();
  const [isolation, setIsolation] = useState('repeatable');
  const [stage, setStage] = useState(0);
  const seesNewVersion = stage === 3 || (stage === 2 && isolation === 'committed');

  return (
    <section className={styles.widget} aria-labelledby={titleId}>
      <h3 id={titleId} className={styles.widgetTitle}>Snapshot inspection desk</h3>
      <div className={styles.practiceGrid}>
        <label className={styles.control}>
          Reader A isolation
          <select value={isolation} onChange={event => setIsolation(event.target.value)}>
            <option value="repeatable">Repeatable Read</option>
            <option value="committed">Read Committed</option>
          </select>
        </label>
        <label className={styles.control}>
          Schedule step: {stage + 1} of {stages.length}
          <input type="range" min={0} max={stages.length - 1} step={1} value={stage}
            onChange={event => setStage(Number(event.target.value))} />
        </label>
      </div>
      <div className={styles.practiceResult} aria-live="polite" style={{minHeight: '13rem'}}>
        <p>{stages[stage]}</p>
        <p><strong>A reads stock: {seesNewVersion ? 9 : 10}</strong></p>
        <p>{stage === 1 ? 'The new tuple exists, but B is uncommitted. Neither reader can see it.'
          : seesNewVersion ? 'This SELECT uses a snapshot taken after B committed.'
            : 'The reader keeps the version visible to its snapshot, not simply the newest tuple.'}</p>
      </div>
    </section>
  );
}