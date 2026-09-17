import React, {useState} from 'react';
import styles from './widgets.module.css';

type Response = 'recheck' | 'return' | 'repair';

const RESPONSES: {id: Response; label: string}[] = [
  {id: 'recheck', label: 'Keep checking until I feel accepted'},
  {id: 'return', label: 'Leave the uncertainty; return to the task'},
  {id: 'repair', label: 'Address the specific communication problem'},
];

const SCENARIOS = [
  {
    id: 'quiet',
    label: 'A quiet chat message',
    observation: 'You post a relevant suggestion. Nobody reacts before the discussion moves on.',
    interpretation: 'Everyone dislikes me, and I should not have contributed.',
    unknown: 'Whether people read it, agreed, were distracted, or had a different preference. No reaction does not settle their opinion of you.',
    responses: {
      recheck: 'Repeatedly counting reactions may keep attention on the uncertainty without answering it. You do not have to feel accepted before following the discussion.',
      return: 'For an optional suggestion, note the current decision and listen to the next speaker. This leaves other people\'s opinions unknown rather than declaring them positive.',
      repair: 'If the suggestion affects a decision that needs an answer, ask once: "Do we need to decide this before moving on?" If no answer is needed, there may be nothing to repair.',
    },
  },
  {
    id: 'clarification',
    label: 'A request to clarify',
    observation: 'A colleague says, "I am not sure which deadline you mean."',
    interpretation: 'I sound foolish; I need to explain why I am usually better at this.',
    unknown: 'Their overall opinion of you. What is known is that the deadline needs clarification.',
    responses: {
      recheck: 'Asking whether you sounded foolish leaves the deadline unclear. Answer the concrete question rather than trying to secure a judgment about your character.',
      return: 'Leaving private opinions unresolved is useful, but a work question still needs an answer. Clarify the deadline, then return to the discussion.',
      repair: 'Try: "I mean the Friday review deadline, not the launch date." A specific correction is enough; it does not need a defense of your worth.',
    },
  },
  {
    id: 'exclusion',
    label: 'Repeated work exclusion',
    observation: 'You are repeatedly left out of planning meetings required for your role, despite asking to be included.',
    interpretation: 'I must be unlikeable, so I should just become more agreeable.',
    unknown: 'The cause and people\'s motives. The repeated access problem and its effect on your work are concrete, regardless of the cause.',
    responses: {
      recheck: 'Trying to become certain that people like you does not restore access. Record relevant examples privately and consider a trusted workplace support channel.',
      return: 'Refocusing may help you get through today, but it should not replace addressing repeated exclusion. Seek a practical remedy and support; this is not just an uncertainty exercise.',
      repair: 'Describe the missed meetings and work impact, and request a concrete inclusion process through a safe channel. Consider a trusted manager, union representative, or appropriate workplace support.',
    },
  },
];

export default function SocialInterpretationLab(): React.ReactElement {
  const [scenario, setScenario] = useState(SCENARIOS[0]);
  const [response, setResponse] = useState<Response>('return');

  return (
    <div className={styles.widget}>
      <h3 className={styles.widgetTitle}>What does the evidence actually call for?</h3>
      <div className={styles.practiceGrid}>
        <fieldset className={styles.segmentedField}>
          <legend>Choose a fictional situation</legend>
          {SCENARIOS.map(item => (
            <label key={item.id} className={styles.inlineCheck}>
              <input type="radio" name="social-scenario" checked={scenario.id === item.id}
                onChange={() => setScenario(item)} />
              {item.label}
            </label>
          ))}
        </fieldset>
        <fieldset className={styles.segmentedField}>
          <legend>Choose your next move</legend>
          {RESPONSES.map(item => (
            <label key={item.id} className={styles.inlineCheck}>
              <input type="radio" name="social-response" checked={response === item.id}
                onChange={() => setResponse(item.id)} />
              {item.label}
            </label>
          ))}
        </fieldset>
      </div>
      <div className={`${styles.practiceResult} ${styles.socialInterpretationResult}`}
        aria-live="polite" aria-atomic="true">
        <p><strong>Observation:</strong> {scenario.observation}</p>
        <p><strong>Added interpretation:</strong> {scenario.interpretation}</p>
        <p><strong>Still unknown:</strong> {scenario.unknown}</p>
        <p><strong>Next-step reasoning:</strong> {scenario.responses[response]}</p>
      </div>
      <p className={styles.statusLine}>
        Compare what is known, what remains uncertain, and which next move serves the task.
      </p>
    </div>
  );
}
