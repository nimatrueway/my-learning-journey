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

export function PredictionAudit(): React.ReactElement {
  const [fear, setFear] = useState('The next release will blow up in my face');
  const [probability, setProbability] = useState(80);
  const [best, setBest] = useState('');
  const [likely, setLikely] = useState('');
  const audited = best.trim() !== '' && likely.trim() !== '';

  return (
    <div className={styles.widget}>
      <h3>Audit a doom prediction</h3>
      <label className={styles.control}>
        The thing that will surely get worse
        <input value={fear} onChange={(event) => setFear(event.target.value)} />
      </label>
      <div className={styles.practiceGrid}>
        <label className={styles.control}>
          Gut probability: {probability}%
          <input type="range" min="0" max="100" step="5" value={probability}
            onChange={(event) => setProbability(Number(event.target.value))} />
        </label>
        <label className={styles.control}>
          Best case
          <input value={best} placeholder="One way it could go right"
            onChange={(event) => setBest(event.target.value)} />
        </label>
        <label className={styles.control}>
          Most likely case
          <input value={likely} placeholder="The realistic middle ground"
            onChange={(event) => setLikely(event.target.value)} />
        </label>
      </div>
      <div className={styles.practiceResult}>
        <strong>Smoke detector:</strong> “{fear || 'Something vague but definitely terrible'}” at {probability}%.
        <br /><strong>Audit:</strong> {audited
          ? `Worst case is survivable, best case is “${best}”, and the realistic outcome is “${likely}”. Plan for that one.`
          : 'Incomplete — the amygdala filed only the worst-case column. Fill in the other two.'}
      </div>
      <p className={styles.statusLine}>
        {probability >= 60 && !audited
          ? 'A number that high with no evidence is a fire drill, not a forecast.'
          : audited
            ? 'Prediction recalibrated. Vigilance can stand down to advisory mode.'
            : 'Name the best and likely cases to complete the loop your brain skips.'}
      </p>
    </div>
  );
}

const PRAISE_RESPONSES = [
  {label: '“Oh, it was nothing, anyone could have done it”', verdict: 'Deflected. The compliment bounced off and taught your brain the win was fake.'},
  {label: '“Thanks, but there are still so many problems with it”', verdict: 'A thank-you with a self-deprecation chaser is still a deflection.'},
  {label: '“Thank you.” — then stop talking', verdict: 'Anchor holds. The silence is the rep.', correct: true},
];

export function PraiseAnchor(): React.ReactElement {
  const [picked, setPicked] = useState<number | null>(null);
  const [savors, setSavors] = useState(0);

  return (
    <div className={styles.widget}>
      <h3>Someone says: “This is really solid work.”</h3>
      <div className={styles.checkList}>
        {PRAISE_RESPONSES.map((response, index) => (
          <button key={response.label} type="button"
            className={picked === index ? styles.activeButton : styles.button}
            onClick={() => setPicked(index)}>
            {response.label}
          </button>
        ))}
      </div>
      {picked !== null && (
        <div className={styles.practiceResult}>{PRAISE_RESPONSES[picked].verdict}</div>
      )}
      <button type="button" className={styles.button} onClick={() => setSavors(savors + 1)}>
        I stayed with the feeling for 15 seconds
      </button>
      <span className={styles.practiceCounter}> Savoring reps: {savors}</span>
    </div>
  );
}

const HIDDEN_PROCESS = [
  'Three discarded drafts',
  'Two hours of self-doubt',
  'One question they were afraid to ask',
  'A day spent confused before it clicked',
];

export function InsideOutside(): React.ReactElement {
  const [xray, setXray] = useState(false);

  return (
    <div className={styles.widget}>
      <h3>What you see vs. what exists</h3>
      <div className={styles.practiceGrid}>
        <div>
          <strong>Your own work</strong>
          <ul>
            {HIDDEN_PROCESS.map((item) => <li key={item}>{item}</li>)}
            <li>Final polished deliverable</li>
          </ul>
        </div>
        <div>
          <strong>A colleague's work</strong>
          <ul>
            {xray && HIDDEN_PROCESS.map((item) => <li key={item}>{item}</li>)}
            <li>Final polished deliverable</li>
          </ul>
        </div>
      </div>
      <button type="button" className={styles.button} onClick={() => setXray(!xray)}>
        {xray ? 'Remove the X-ray' : 'Apply the same X-ray to your colleague'}
      </button>
      <p className={styles.statusLine}>
        {xray
          ? 'Same mess on both sides. You were comparing your rehearsal footage to their highlight reel.'
          : 'You have full access to your own chaos and only the polished output of everyone else.'}
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