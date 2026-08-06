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

const CONTRIBUTIONS = {
  validate: 'I agree with that approach because it keeps the decision reversible.',
  clarify: 'Which constraint matters most for this decision?',
  update: 'The first pass is complete; the remaining risk is the integration step.',
};

export function MeetingRehearsal(): React.ReactElement {
  const [contribution, setContribution] = useState<keyof typeof CONTRIBUTIONS>('clarify');
  const [qualifier, setQualifier] = useState(true);
  const [attention, setAttention] = useState('speaker');
  const statement = `${qualifier ? 'This might be a dumb question, but ' : ''}${CONTRIBUTIONS[contribution]}`;

  return (
    <div className={styles.widget}>
      <h3>Rehearse your first five minutes</h3>
      <div className={styles.practiceGrid}>
        <label className={styles.control}>
          Contribution
          <select value={contribution}
            onChange={(event) => setContribution(event.target.value as keyof typeof CONTRIBUTIONS)}>
            <option value="validate">Validate and add a reason</option>
            <option value="clarify">Ask a clarifying question</option>
            <option value="update">Give a concise update</option>
          </select>
        </label>
        <label className={styles.control}>
          External attention target
          <select value={attention} onChange={(event) => setAttention(event.target.value)}>
            <option value="speaker">Speaker's actual words</option>
            <option value="decision">Decision being made</option>
            <option value="evidence">Evidence on the table</option>
          </select>
        </label>
      </div>
      <label className={styles.inlineCheck}>
        <input type="checkbox" checked={qualifier}
          onChange={(event) => setQualifier(event.target.checked)} />
        Add a defensive qualifier
      </label>
      <div className={styles.practiceResult}>
        <strong>Say within five minutes:</strong> “{statement}”
        <br /><strong>Then redirect attention to:</strong> {attention === 'speaker'
          ? "the speaker's actual words"
          : attention === 'decision' ? 'the decision being made' : 'the evidence on the table'}.
      </div>
      <p className={styles.statusLine}>
        {qualifier
          ? 'Try switching off the qualifier. The contribution can stand without apologizing for existing.'
          : 'Direct, concise, and complete. Pause instead of filling the silence.'}
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