import React, {useMemo, useState} from 'react';
import styles from './widgets.module.css';

type Strategy = 'greedy' | 'beam' | 'sample';

const PROMPT = ['the', 'cat'];
const MAX_STEPS = 5;

/** A deliberately tiny language model: next-token probabilities keyed by the previous token. */
const MODEL: Record<string, [string, number][]> = {
  cat: [['sat', 0.38], ['slept', 0.22], ['knocked', 0.18], ['stared', 0.12], ['purred', 0.06], ['exploded', 0.04]],
  sat: [['on', 0.55], ['quietly', 0.18], ['down', 0.15], ['beside', 0.08], ['upon', 0.04]],
  slept: [['through', 0.40], ['on', 0.30], ['for', 0.20], ['beside', 0.10]],
  knocked: [['the', 0.50], ['over', 0.28], ['my', 0.15], ['everything', 0.07]],
  stared: [['at', 0.60], ['into', 0.22], ['past', 0.12], ['through', 0.06]],
  purred: [['loudly', 0.45], ['once', 0.30], ['softly', 0.25]],
  exploded: [['politely', 0.50], ['into', 0.30], ['upward', 0.20]],
  on: [['the', 0.70], ['my', 0.20], ['a', 0.10]],
  over: [['the', 0.60], ['my', 0.40]],
  at: [['the', 0.55], ['me', 0.30], ['nothing', 0.15]],
  into: [['the', 0.65], ['glitter', 0.20], ['my', 0.15]],
  through: [['the', 0.70], ['my', 0.30]],
  for: [['hours', 0.60], ['once', 0.25], ['science', 0.15]],
  beside: [['the', 0.55], ['my', 0.45]],
  upon: [['the', 1.0]],
  my: [['laptop', 0.40], ['keyboard', 0.35], ['coffee', 0.25]],
  the: [['keyboard', 0.35], ['laptop', 0.25], ['windowsill', 0.20], ['router', 0.12], ['homework', 0.08]],
  a: [['keyboard', 0.60], ['nap', 0.40]],
};

interface Row {
  label: string;
  value: number;
  detail: string;
}

interface Result {
  tokens: string[];
  rows: Row[];
  caption: string;
}

function candidates(sequence: string[]): [string, number][] {
  return MODEL[sequence[sequence.length - 1]] ?? [];
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function greedy(): Result {
  const tokens = [...PROMPT];
  const rows: Row[] = [];
  for (let step = 0; step < MAX_STEPS; step += 1) {
    const options = candidates(tokens);
    if (options.length === 0) break;
    const [token, probability] = options.reduce((best, option) => (option[1] > best[1] ? option : best));
    tokens.push(token);
    rows.push({
      label: `step ${step + 1}: ${token}`,
      value: probability,
      detail: `${Math.round(probability * 100)}%`,
    });
  }
  return {
    tokens,
    rows,
    caption: 'Greedy always takes the tallest bar. Same input, same output, forever — and any better sentence hiding behind a slightly shorter first step is unreachable.',
  };
}

function sample(temperature: number, topK: number, seed: number): Result {
  const random = mulberry32(seed);
  const tokens = [...PROMPT];
  const rows: Row[] = [];
  for (let step = 0; step < MAX_STEPS; step += 1) {
    const options = [...candidates(tokens)].sort((left, right) => right[1] - left[1]).slice(0, topK);
    if (options.length === 0) break;
    const heated = options.map(([token, probability]) => [token, probability ** (1 / temperature)] as [string, number]);
    const mass = heated.reduce((total, [, weight]) => total + weight, 0);
    let target = random() * mass;
    let picked = heated[heated.length - 1];
    for (const option of heated) {
      target -= option[1];
      if (target <= 0) {
        picked = option;
        break;
      }
    }
    const reshaped = picked[1] / mass;
    const original = options.find(option => option[0] === picked[0])![1];
    tokens.push(picked[0]);
    rows.push({
      label: `step ${step + 1}: ${picked[0]}`,
      value: reshaped,
      detail: `${Math.round(original * 100)}% → ${Math.round(reshaped * 100)}%`,
    });
  }
  return {
    tokens,
    rows,
    caption: `Sampling rolls dice on the reshaped distribution. Bars show the model's own probability → the probability after temperature ${temperature.toFixed(1)} and top-k ${topK}.`,
  };
}

function beam(width: number): Result {
  let beams = [{tokens: [...PROMPT], logProb: 0, done: false}];
  for (let step = 0; step < MAX_STEPS; step += 1) {
    const next = beams.flatMap(current => {
      const options = current.done ? [] : candidates(current.tokens);
      if (options.length === 0) return [{...current, done: true}];
      return options.map(([token, probability]) => ({
        tokens: [...current.tokens, token],
        logProb: current.logProb + Math.log(probability),
        done: false,
      }));
    });
    beams = next.sort((left, right) => right.logProb - left.logProb).slice(0, width);
  }
  const scored = beams
    .map(current => ({
      ...current,
      normalized: current.logProb / Math.max(1, current.tokens.length - PROMPT.length),
    }))
    .sort((left, right) => right.normalized - left.normalized);
  const best = scored[0];
  return {
    tokens: best.tokens,
    rows: scored.map(current => ({
      label: current.tokens.slice(PROMPT.length).join(' '),
      value: Math.exp(current.normalized),
      detail: `${current.normalized.toFixed(2)} avg log-prob`,
    })),
    caption: `Beam search keeps ${width} sentences alive at once and ranks them by length-normalized log-probability. The winner is often duller than the greedy one — high-probability text is, by definition, unsurprising.`,
  };
}

export default function DecodingLab(): React.ReactElement {
  const [strategy, setStrategy] = useState<Strategy>('greedy');
  const [width, setWidth] = useState(3);
  const [temperature, setTemperature] = useState(0.9);
  const [topK, setTopK] = useState(4);
  const [seed, setSeed] = useState(7);

  const result = useMemo(() => {
    if (strategy === 'greedy') return greedy();
    if (strategy === 'beam') return beam(width);
    return sample(temperature, topK, seed);
  }, [strategy, width, temperature, topK, seed]);

  return (
    <div className={styles.widget}>
      <div className={styles.buttonRow} role="group" aria-label="Decoding strategy">
        <button
          className={strategy === 'greedy' ? styles.activeButton : styles.button}
          aria-pressed={strategy === 'greedy'}
          onClick={() => setStrategy('greedy')}>
          Greedy
        </button>
        <button
          className={strategy === 'beam' ? styles.activeButton : styles.button}
          aria-pressed={strategy === 'beam'}
          onClick={() => setStrategy('beam')}>
          Beam
        </button>
        <button
          className={strategy === 'sample' ? styles.activeButton : styles.button}
          aria-pressed={strategy === 'sample'}
          onClick={() => setStrategy('sample')}>
          Sampling
        </button>
      </div>

      <p className={styles.stepperTitle}>Prompt: “{PROMPT.join(' ')}” · {MAX_STEPS} tokens to generate</p>
      <div className={styles.tokenRow}>
        {result.tokens.map((token, index) => (
          <span key={index} className={index < PROMPT.length ? styles.tokenFuture : styles.token}>
            {token}
          </span>
        ))}
      </div>

      <div className={styles.controls}>
        {strategy === 'beam' && (
          <label className={styles.control}>
            Beam width: {width}
            <input type="range" min="2" max="5" value={width} onChange={event => setWidth(Number(event.target.value))} />
          </label>
        )}
        {strategy === 'sample' && (
          <>
            <label className={styles.control}>
              Temperature: {temperature.toFixed(1)}
              <input
                type="range"
                min="0.2"
                max="1.6"
                step="0.1"
                value={temperature}
                onChange={event => setTemperature(Number(event.target.value))} />
            </label>
            <label className={styles.control}>
              Top-k: {topK}
              <input type="range" min="1" max="6" value={topK} onChange={event => setTopK(Number(event.target.value))} />
            </label>
            <button className={styles.button} onClick={() => setSeed(current => current + 1)}>
              Roll again 🎲
            </button>
          </>
        )}
      </div>

      <div className={styles.probList}>
        {result.rows.map((row, index) => (
          <div key={index} className={index === 0 && strategy === 'beam' ? styles.probRowActive : styles.probRow}>
            <span className={styles.probLabel}>{row.label}</span>
            <div className={styles.memoryBarTrack}>
              <div className={styles.memoryBarFill} style={{width: `${Math.min(100, row.value * 100)}%`}} />
            </div>
            <span className={styles.probValue}>{row.detail}</span>
          </div>
        ))}
      </div>

      <p className={styles.statusLine}>{result.caption}</p>
    </div>
  );
}
