import React, {useId, useState} from 'react';
import InfantGrowthCalculator from './InfantGrowthCalculator';
import styles from './widgets.module.css';

const SCALE_MIN = 10;
const SCALE_MAX = 40;

function getAdultCategory(bmi: number): string {
  if (bmi < 18.5) return 'Below the healthy-weight range';
  if (bmi < 25) return 'Healthy-weight range';
  if (bmi < 30) return 'Overweight range';
  return 'Obesity range';
}

export default function BMICalculator(): React.ReactElement {
  const [mode, setMode] = useState<'bmi' | 'baby'>('bmi');
  const ageId = useId();
  const heightId = useId();
  const weightId = useId();
  const [age, setAge] = useState(30);
  const [height, setHeight] = useState(175);
  const [weight, setWeight] = useState(70);

  const valid = age >= 2 && age <= 120 && height >= 50 && height <= 250
    && weight >= 10 && weight <= 400;
  const bmi = valid ? weight / ((height / 100) ** 2) : null;
  const adult = age >= 20;
  const marker = bmi === null
    ? 0
    : Math.min(100, Math.max(0, ((bmi - SCALE_MIN) / (SCALE_MAX - SCALE_MIN)) * 100));

  return (
    <section className={styles.widget} aria-labelledby="bmi-calculator-title">
      <h2 id="bmi-calculator-title" className={styles.widgetTitle}>Metric body calculator</h2>
      <div className={styles.buttonRow} role="group" aria-label="Calculator mode">
        <button type="button" className={mode === 'bmi' ? styles.activeButton : styles.button}
          aria-pressed={mode === 'bmi'} onClick={() => setMode('bmi')}>BMI (age 2+)</button>
        <button type="button" className={mode === 'baby' ? styles.activeButton : styles.button}
          aria-pressed={mode === 'baby'} onClick={() => setMode('baby')}>Baby growth (&lt;2)</button>
      </div>

      {mode === 'baby' ? <InfantGrowthCalculator /> : <>
      <div className={styles.practiceGrid}>
        <label className={styles.control} htmlFor={ageId}>
          Age (years)
          <span className={styles.numericControlRow}>
            <input id={ageId} type="number" min="2" max="120" step="0.1" value={age}
              onChange={(event) => setAge(Number(event.target.value))} />
            <input type="range" min="2" max="120" step="0.1" value={age}
              aria-label="Age slider"
              onChange={(event) => setAge(Number(event.target.value))} />
          </span>
        </label>
        <label className={styles.control} htmlFor={heightId}>
          Height (cm)
          <span className={styles.numericControlRow}>
            <input id={heightId} type="number" min="30" max="250" step="0.1" value={height}
              onChange={(event) => setHeight(Number(event.target.value))} />
            <input type="range" min="30" max="250" step="0.1" value={height}
              aria-label="Height slider"
              onChange={(event) => setHeight(Number(event.target.value))} />
          </span>
        </label>
        <label className={styles.control} htmlFor={weightId}>
          Weight (kg)
          <span className={styles.numericControlRow}>
            <input id={weightId} type="number" min="1" max="400" step="0.1" value={weight}
              onChange={(event) => setWeight(Number(event.target.value))} />
            <input type="range" min="1" max="400" step="0.1" value={weight}
              aria-label="Weight slider"
              onChange={(event) => setWeight(Number(event.target.value))} />
          </span>
        </label>
      </div>

      {!valid || bmi === null ? (
        <p className={styles.bmiWarning} role="alert">
          Enter age 2-120, height 50-250 cm, and weight 10-400 kg.
        </p>
      ) : (
        <div aria-live="polite">
          <div className={styles.bmiResultGrid}>
            <div>
              <span className={styles.bmiResultLabel}>BMI</span>
              <strong className={styles.bmiResultValue}>{bmi.toFixed(1)}</strong>
            </div>
            <div>
              <span className={styles.bmiResultLabel}>{adult ? 'Adult screening range' : 'Interpretation'}</span>
              <strong className={styles.bmiResultText}>
                {adult
                  ? getAdultCategory(bmi)
                  : 'Use an age- and sex-specific BMI growth reference'}
              </strong>
            </div>
          </div>

          {adult && (
            <div className={styles.bmiChart} aria-label={`BMI ${bmi.toFixed(1)} on the adult BMI category scale`}>
              <div className={styles.bmiBands} aria-hidden="true">
                <span className={styles.bmiBandLow}>Below 18.5</span>
                <span className={styles.bmiBandHealthy}>18.5-24.9</span>
                <span className={styles.bmiBandHigh}>25-29.9</span>
                <span className={styles.bmiBandObesity}>30+</span>
                <span className={styles.bmiMarker} style={{left: `${marker}%`}}>
                  <span>{bmi.toFixed(1)}</span>
                </span>
              </div>
              <div className={styles.bmiTicks} aria-hidden="true">
                <span>10</span><span>18.5</span><span>25</span><span>30</span><span>40+</span>
              </div>
            </div>
          )}

          <div className={styles.bmiPercentileNote}>
            <strong>Population percentile: not calculated</strong>
            <p>
              {adult
                ? 'Adult BMI is interpreted with fixed screening thresholds, not an age percentile.'
                : 'A valid percentile for ages 2-19 requires age in months, sex-specific reference data, and an official growth chart. Age, height, and weight alone are not enough.'}
            </p>
          </div>
        </div>
      )}
      </>}
    </section>
  );
}