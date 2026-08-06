import React, {useState} from 'react';
import styles from './widgets.module.css';

export function FocusSprint(): React.ReactElement {
  const [outcome, setOutcome] = useState('Finish one visible piece');
  const [minutes, setMinutes] = useState(15);
  const [returns, setReturns] = useState(0);

  return (
    <div className={styles.widget}>
      <h3>Build a focus sprint</h3>
      <div className={styles.practiceGrid}>
        <label className={styles.control}>
          One outcome
          <input value={outcome} onChange={(event) => setOutcome(event.target.value)} />
        </label>
        <label className={styles.control}>
          Session: {minutes} minutes
          <input type="range" min="5" max="45" step="5" value={minutes}
            onChange={(event) => setMinutes(Number(event.target.value))} />
        </label>
      </div>
      <div className={styles.practiceResult}>
        <strong>{minutes} minutes:</strong> {outcome || 'Choose one visible outcome.'}
        <br />Phone away. Stray thoughts go on paper. Begin with a two-minute action.
      </div>
      <button type="button" className={styles.button} onClick={() => setReturns(returns + 1)}>
        I noticed and returned
      </button>
      <span className={styles.practiceCounter}> Returns trained: {returns}</span>
    </div>
  );
}

export function RiskExperiment(): React.ReactElement {
  const [question, setQuestion] = useState('Can I make a rough first version?');
  const [hours, setHours] = useState(2);
  const [audience, setAudience] = useState('Private');

  return (
    <div className={styles.widget}>
      <h3>Turn a scary goal into an experiment</h3>
      <label className={styles.control}>
        Question this attempt will answer
        <input value={question} onChange={(event) => setQuestion(event.target.value)} />
      </label>
      <div className={styles.practiceGrid}>
        <label className={styles.control}>
          Time cap: {hours} {hours === 1 ? 'hour' : 'hours'}
          <input type="range" min="1" max="8" value={hours}
            onChange={(event) => setHours(Number(event.target.value))} />
        </label>
        <label className={styles.control}>
          First audience
          <select value={audience} onChange={(event) => setAudience(event.target.value)}>
            <option>Private</option>
            <option>One trusted person</option>
            <option>Small group</option>
            <option>Public</option>
          </select>
        </label>
      </div>
      <div className={styles.practiceResult}>
        <strong>Experiment:</strong> Spend at most {hours} {hours === 1 ? 'hour' : 'hours'} answering
        “{question || 'What can this attempt teach me?'}” Audience: {audience.toLowerCase()}.
        Stop, review the evidence, then choose the next investment.
      </div>
    </div>
  );
}

const ACTIVATION_STEPS = [
  'Stand up',
  'Put on work shoes',
  'Pick up one tool',
  'Prepare the workspace',
  'Work for five minutes',
];

export function ActivationRamp(): React.ReactElement {
  const [step, setStep] = useState(0);
  const complete = step === ACTIVATION_STEPS.length;

  return (
    <div className={styles.widget}>
      <h3>Cross the activation gap one rung at a time</h3>
      <ol className={styles.activationList}>
        {ACTIVATION_STEPS.map((label, index) => (
          <li key={label} className={index < step ? styles.activationDone : ''}>{label}</li>
        ))}
      </ol>
      <button type="button" className={styles.button}
        onClick={() => setStep(complete ? 0 : step + 1)}>
        {complete ? 'Reset ramp' : `Do only this: ${ACTIVATION_STEPS[step]}`}
      </button>
      <p className={styles.statusLine}>
        {complete ? 'Momentum is online. Motivation was optional.' : `${step} of ${ACTIVATION_STEPS.length} transitions crossed.`}
      </p>
    </div>
  );
}

export function SupplementGate(): React.ReactElement {
  const [sleep, setSleep] = useState(false);
  const [basics, setBasics] = useState(false);
  const [review, setReview] = useState(false);
  const ready = sleep && basics && review;

  return (
    <div className={styles.widget}>
      <h3>Before adding a supplement</h3>
      <div className={styles.checkList}>
        <label><input type="checkbox" checked={sleep} onChange={(event) => setSleep(event.target.checked)} /> Sleep and recovery are being addressed.</label>
        <label><input type="checkbox" checked={basics} onChange={(event) => setBasics(event.target.checked)} /> Nutrition, movement, and hydration have a stable baseline.</label>
        <label><input type="checkbox" checked={review} onChange={(event) => setReview(event.target.checked)} /> A pharmacist or clinician has reviewed conditions, medications, and interactions.</label>
      </div>
      <div className={styles.practiceResult}>
        {ready
          ? 'Reasonable next step: choose one candidate, define what success means, and change only one variable.'
          : 'Foundation first. A stack cannot debug an unstable baseline.'}
      </div>
    </div>
  );
}