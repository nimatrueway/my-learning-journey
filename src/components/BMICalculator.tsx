import React, {useId} from 'react';
import {bmiForAgeBoy, bmiForAgeGirl} from '@site/src/data/cdcBmiForAge';
import {formatPercentile, interpolate, percentileFor, valueAtZ} from '@site/src/lib/growthLms';
import DecimalInput from './DecimalInput';
import InfantGrowthCalculator from './InfantGrowthCalculator';
import usePersistentState from './usePersistentState';
import styles from './widgets.module.css';

const SCALE_MIN = 10;
const SCALE_MAX = 40;

const PERCENTILE_95_Z = 1.644853627;
// CDC 2000 LMS curves are unreliable above the 97th percentile; CDC's extended charts use % of the 95th instead.
const LMS_PERCENTILE_CEILING = 97;

type CalculatorMode = 'bmi' | 'baby';
type BmiSex = 'girl' | 'boy';

const isCalculatorMode = (value: unknown): value is CalculatorMode => value === 'bmi' || value === 'baby';
const isBmiSex = (value: unknown): value is BmiSex => value === 'girl' || value === 'boy';
const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

function getAdultCategory(bmi: number): string {
  if (bmi < 18.5) return 'Below the healthy-weight range';
  if (bmi < 25) return 'Healthy-weight range';
  if (bmi < 30) return 'Overweight range';
  return 'Obesity range';
}

function getChildCategory(percentile: number, percentOf95th: number): string {
  if (percentile < 5) return 'Underweight range (below the 5th percentile)';
  if (percentile < 85) return 'Healthy-weight range (5th to below 85th)';
  if (percentile < 95) return 'Overweight range (85th to below 95th)';
  if (percentOf95th >= 120) return 'Severe obesity range (120%+ of the 95th percentile)';
  return 'Obesity range (95th percentile or above)';
}

export default function BMICalculator(): React.ReactElement {
  const [mode, setMode] = usePersistentState<CalculatorMode>('calculator:body-measures:mode', 'bmi', isCalculatorMode);
  const ageId = useId();
  const heightId = useId();
  const weightId = useId();
  const [age, setAge] = usePersistentState('calculator:body-measures:bmi:age', 30, isFiniteNumber);
  const [height, setHeight] = usePersistentState('calculator:body-measures:bmi:height', 175, isFiniteNumber);
  const [weight, setWeight] = usePersistentState('calculator:body-measures:bmi:weight', 70, isFiniteNumber);
  const [sex, setSex] = usePersistentState<BmiSex>('calculator:body-measures:bmi:sex', 'girl', isBmiSex);

  const valid = age >= 2 && age <= 120 && height >= 50 && height <= 250
    && weight >= 10 && weight <= 400;
  const bmi = valid ? weight / ((height / 100) ** 2) : null;
  const adult = age >= 20;
  const child = bmi !== null && !adult ? (() => {
    const ageMonths = age * 12;
    const rows = sex === 'girl' ? bmiForAgeGirl : bmiForAgeBoy;
    const percentile = percentileFor(rows, ageMonths, bmi);
    const percentOf95th = (bmi / valueAtZ(interpolate(rows, ageMonths), PERCENTILE_95_Z)) * 100;
    return {percentile, percentOf95th};
  })() : null;
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
      {age < 20 && (
        <fieldset className={`${styles.segmentedField} ${styles.bmiSexField}`}>
          <legend>Sex used by CDC BMI-for-age chart (ages 2-19)</legend>
          <div className={styles.buttonRow}>
            {(['girl', 'boy'] as const).map((option) => (
              <button key={option} type="button"
                className={sex === option ? styles.activeButton : styles.button}
                aria-pressed={sex === option} onClick={() => setSex(option)}>
                {option === 'girl' ? 'Girl' : 'Boy'}
              </button>
            ))}
          </div>
        </fieldset>
      )}
      <div className={styles.practiceGrid}>
        <label className={styles.control} htmlFor={ageId}>
          Age (years)
          <span className={styles.numericControlRow}>
            <DecimalInput id={ageId} value={age} onChange={setAge} />
            <input type="range" min="2" max="120" step="0.1" value={Number.isFinite(age) ? age : 2}
              aria-label="Age slider"
              onChange={(event) => setAge(Number(event.target.value))} />
          </span>
        </label>
        <label className={styles.control} htmlFor={heightId}>
          Height (cm)
          <span className={styles.numericControlRow}>
            <DecimalInput id={heightId} value={height} onChange={setHeight} />
            <input type="range" min="30" max="250" step="0.1" value={Number.isFinite(height) ? height : 30}
              aria-label="Height slider"
              onChange={(event) => setHeight(Number(event.target.value))} />
          </span>
        </label>
        <label className={styles.control} htmlFor={weightId}>
          Weight (kg)
          <span className={styles.numericControlRow}>
            <DecimalInput id={weightId} value={weight} onChange={setWeight} />
            <input type="range" min="1" max="400" step="0.1" value={Number.isFinite(weight) ? weight : 1}
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
          <div className={child ? `${styles.bmiResultGrid} ${styles.bmiResultGridThree}` : styles.bmiResultGrid}>
            <div>
              <span className={styles.bmiResultLabel}>BMI</span>
              <strong className={styles.bmiResultValue}>{bmi.toFixed(1)}</strong>
            </div>
            {child && (
              <div>
                <span className={styles.bmiResultLabel}>BMI-for-age percentile</span>
                <strong className={styles.bmiResultValue}>
                  {child.percentile > LMS_PERCENTILE_CEILING ? `>${LMS_PERCENTILE_CEILING}th` : formatPercentile(child.percentile)}
                </strong>
              </div>
            )}
            <div>
              <span className={styles.bmiResultLabel}>{adult ? 'Adult screening range' : 'CDC screening range'}</span>
              <strong className={styles.bmiResultText}>
                {adult
                  ? getAdultCategory(bmi)
                  : child && getChildCategory(child.percentile, child.percentOf95th)}
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
            {adult ? <>
              <strong>Population percentile: not calculated</strong>
              <p>Adult BMI is interpreted with fixed screening thresholds, not an age percentile.</p>
            </> : child && <>
              <strong>CDC BMI-for-age, {sex === 'girl' ? 'girls' : 'boys'} at {(age * 12).toFixed(0)} months</strong>
              <p>
                Percentile is calculated from the CDC 2000 BMI-for-age LMS reference, interpolated at the exact age.
                {child.percentile >= 95
                  ? ` This BMI is ${child.percentOf95th.toFixed(0)}% of the 95th percentile; above the 97th, CDC uses this measure because the 2000 curves understate extreme values.`
                  : ' One measurement is a snapshot; the trend across repeated measurements matters more.'}
              </p>
            </>}
          </div>
        </div>
      )}
      </>}
    </section>
  );
}