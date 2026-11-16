import React, {useId, useState} from 'react';
import styles from './widgets.module.css';

export interface MatrixFieldRow {
  heading: string;
  value: string;
}

export interface MatrixScenario {
  id: string;
  label: string;
  sharedFields: MatrixFieldRow[];
  outcomes: Record<string, MatrixFieldRow[]>;
}

export interface MatrixMove {
  id: string;
  label: string;
}

export interface ScenarioMatrixData {
  title: string;
  scenarioLegend: string;
  moveLegend: string;
  statusLine: string;
  moves: MatrixMove[];
  scenarios: MatrixScenario[];
}

export default function ScenarioMatrixLab({data}: {data: ScenarioMatrixData}): React.ReactElement {
  const groupId = useId();
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [moveIndex, setMoveIndex] = useState(0);

  const scenario = data.scenarios[scenarioIndex] ?? data.scenarios[0];
  const move = data.moves[moveIndex] ?? data.moves[0];
  const outcomeRows = (scenario && move ? scenario.outcomes[move.id] : undefined) ?? [];

  if (!scenario || !move) return <></>;

  return (
    <div className={styles.widget}>
      <h3 className={styles.widgetTitle}>{data.title}</h3>
      <div className={styles.practiceGrid}>
        <fieldset className={styles.segmentedField}>
          <legend>{data.scenarioLegend}</legend>
          {data.scenarios.map((item, idx) => (
            <label key={item.id} className={styles.inlineCheck}>
              <input
                type="radio"
                name={`${groupId}-scenario`}
                checked={scenarioIndex === idx}
                onChange={() => setScenarioIndex(idx)}
              />
              {item.label}
            </label>
          ))}
        </fieldset>
        <fieldset className={styles.segmentedField}>
          <legend>{data.moveLegend}</legend>
          {data.moves.map((item, idx) => (
            <label key={item.id} className={styles.inlineCheck}>
              <input
                type="radio"
                name={`${groupId}-move`}
                checked={moveIndex === idx}
                onChange={() => setMoveIndex(idx)}
              />
              {item.label}
            </label>
          ))}
        </fieldset>
      </div>
      <div className={`${styles.practiceResult} ${styles.matrixLabResult}`} aria-live="polite" aria-atomic="true">
        {scenario.sharedFields.map((row) => (
          <p key={row.heading}><strong>{row.heading}</strong> {row.value}</p>
        ))}
        {outcomeRows.map((row) => (
          <p key={row.heading}><strong>{row.heading}</strong> {row.value}</p>
        ))}
      </div>
      <p className={styles.statusLine}>{data.statusLine}</p>
    </div>
  );
}
