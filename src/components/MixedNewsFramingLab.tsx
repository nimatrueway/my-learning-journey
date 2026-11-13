import React, {useState} from 'react';
import styles from './widgets.module.css';

type ScenarioId = 'launch' | 'dinner' | 'incident';
type OpeningMove = 'flawFirst' | 'sugarcoat' | 'proportionate';

const MOVES: {id: OpeningMove; label: string}[] = [
  {id: 'flawFirst', label: 'Automatic flaw-first ("Bad part in sentence one")'},
  {id: 'sugarcoat', label: 'Manipulative spin ("Hide or bury the catch")'},
  {id: 'proportionate', label: 'Proportionate candor ("Match the real headline")'},
];

const SCENARIOS: Record<ScenarioId, {
  label: string;
  reality: string;
  stakes: string;
  outcomes: Record<OpeningMove, {
    script: string;
    listenerAnchor: string;
    honestyCheck: string;
  }>;
}> = {
  launch: {
    label: '80% win, 20% trade-off (work update)',
    reality: 'The new query cache cut page load time in half; migrating one legacy report will take two extra days.',
    stakes: 'A real scheduling trade-off exists, so both facts belong on the table.',
    outcomes: {
      flawFirst: {
        script: '“Bad news first: migrating the legacy report is going to cost us two extra days. On the bright side, the new cache cut page load time in half.”',
        listenerAnchor: 'Sentence one triggers schedule-slip alarm; the 50% speed win arrives while people are already bracing for trouble.',
        honestyCheck: 'Complete facts, distorted proportion (reverse spin). Leading with a 20% cost makes an 80% success sound like a setback.',
      },
      sugarcoat: {
        script: '“Huge win — page loads are twice as fast and we are basically done!” (Leaves the two-day migration unmentioned until someone asks.)',
        listenerAnchor: 'Brief excitement now, followed by eroded trust when the hidden two-day slip surfaces later.',
        honestyCheck: 'Fails candor. This is the salesmanship your gut dislikes: hiding a known cost to collect easy applause.',
      },
      proportionate: {
        script: '“The new cache cut page load time in half. One real trade-off up front: migrating the legacy report will add two days.”',
        listenerAnchor: 'Listeners register that the main goal succeeded, then immediately see the concrete cost with zero fine print.',
        honestyCheck: 'Complete and proportionate. Sentence one matches the 80% reality; sentence two keeps 100% of your candor intact.',
      },
    },
  },
  dinner: {
    label: '90% pleasant, 10% flaw (shared meal)',
    reality: 'A friend picked a great dinner spot and everyone is enjoying the evening; service was 15 minutes slow and your fries arrived lukewarm.',
    stakes: 'No safety, money, or work decision depends on announcing the lukewarm fries right now.',
    outcomes: {
      flawFirst: {
        script: '“Honestly, service took forever and these fries are lukewarm — though the main dish is pretty good.”',
        listenerAnchor: 'The friend who chose the restaurant hears disappointment first; the table shifts from enjoying dinner to defending or apologizing.',
        honestyCheck: 'Factually true, socially deflating. When zero risk is at stake, rushing to name the flaw confuses bluntness with integrity.',
      },
      sugarcoat: {
        script: '“Everything at this table is 10 out of 10, literally perfection!”',
        listenerAnchor: 'Pleasant enough, though invented superlatives can feel performative inside your own head.',
        honestyCheck: 'Unnecessary exaggeration. You do not have to fake perfection to avoid popping the room’s balloon.',
      },
      proportionate: {
        script: '“Really glad you picked this place — this main dish is great.” (Save the fry note unless someone asks whether to order them.)',
        listenerAnchor: 'Shared enjoyment stays intact for a full turn of conversation, and nothing real was hidden.',
        honestyCheck: 'Genuine and generous. Leaving a minor, non-actionable flaw unsaid is hospitality, not corruption.',
      },
    },
  },
  incident: {
    label: '25% silver lining, 75% urgent bug (real risk)',
    reality: 'A billing bug double-charged 40 customers this morning; the fix is ready to deploy and automated refunds are queued.',
    stakes: 'Immediate customer harm and operational urgency are the central facts.',
    outcomes: {
      flawFirst: {
        script: '“We hit a billing bug that double-charged 40 customers this morning. The fix is ready to deploy and automated refunds are queued.”',
        listenerAnchor: 'Attention goes straight to the urgent problem, then lands on a concrete recovery path.',
        honestyCheck: 'Complete and proportionate. Here, bad-news-first works because the problem genuinely is the 75% headline.',
      },
      sugarcoat: {
        script: '“Good news — our automated refund script works super smoothly! Also, 40 customers got billed twice this morning.”',
        listenerAnchor: 'Listeners feel whiplash and immediately wonder what else is being dressed up.',
        honestyCheck: 'Absurd spin. Opening with a silver lining during an active incident makes people distrust the messenger.',
      },
      proportionate: {
        script: '“We hit a billing bug that double-charged 40 customers this morning; the fix is ready to deploy and automated refunds are queued.”',
        listenerAnchor: 'Same direct opening as flaw-first — urgency first, actionable relief second.',
        honestyCheck: 'Notice that proportionate candor agrees with leading with bad news when bad news actually is the headline.',
      },
    },
  },
};

export default function MixedNewsFramingLab(): React.ReactElement {
  const [scenarioId, setScenarioId] = useState<ScenarioId>('launch');
  const [move, setMove] = useState<OpeningMove>('flawFirst');
  const scenario = SCENARIOS[scenarioId];
  const outcome = scenario.outcomes[move];

  return (
    <div className={styles.widget}>
      <h3 className={styles.widgetTitle}>Test the opening sentence against reality</h3>
      <div className={styles.practiceGrid}>
        <fieldset className={styles.segmentedField}>
          <legend>1. Choose the real-world mix</legend>
          {(Object.keys(SCENARIOS) as ScenarioId[]).map((id) => (
            <label key={id} className={styles.inlineCheck}>
              <input
                type="radio"
                name="mixed-news-scenario"
                checked={scenarioId === id}
                onChange={() => setScenarioId(id)}
              />
              {SCENARIOS[id].label}
            </label>
          ))}
        </fieldset>
        <fieldset className={styles.segmentedField}>
          <legend>2. Choose how you open</legend>
          {MOVES.map((item) => (
            <label key={item.id} className={styles.inlineCheck}>
              <input
                type="radio"
                name="mixed-news-move"
                checked={move === item.id}
                onChange={() => setMove(item.id)}
              />
              {item.label}
            </label>
          ))}
        </fieldset>
      </div>
      <div className={`${styles.practiceResult} ${styles.mixedNewsResult}`} aria-live="polite" aria-atomic="true">
        <p><strong>Actual facts:</strong> {scenario.reality}</p>
        <p><strong>Decision stakes:</strong> {scenario.stakes}</p>
        <p><strong>What you say:</strong> {outcome.script}</p>
        <p><strong>Listener’s first anchor:</strong> {outcome.listenerAnchor}</p>
        <p><strong>Honesty &amp; proportion check:</strong> {outcome.honestyCheck}</p>
      </div>
      <p className={styles.statusLine}>
        Compare all three situations: candor means matching the real headline, not putting pain first on autopilot.
      </p>
    </div>
  );
}
