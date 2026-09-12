import React, {useId, useState} from 'react';
import styles from './widgets.module.css';

const vectors = [
  {id: 'A', title: 'Bicycle repair tools', coordinates: [0.8, 0.6]},
  {id: 'B', title: 'Fix a flat wheel', coordinates: [1, 0]},
  {id: 'D', title: 'Database index guide', coordinates: [0, 1]},
  {id: 'E', title: 'Bicycle tire repair', coordinates: [0.9, 0.1]},
];

export default function LuceneScoreLab({mode}: {mode: 'bm25' | 'vector' | 'fusion' | 'evaluation'}): React.ReactElement {
  const titleId = useId();
  const [lengthWeight, setLengthWeight] = useState(0.75);
  const [frequency, setFrequency] = useState(8);
  const [angle, setAngle] = useState(0);
  const [depth, setDepth] = useState(3);
  const [useVectors, setUseVectors] = useState(true);
  const [ranking, setRanking] = useState('A,E,B');

  let title: string;
  let controls: React.ReactNode;
  let output: React.ReactNode;
  if (mode === 'bm25') {
    title = 'Term frequency meets field length';
    const termWeight = (count: number, length: number) =>
      count / (count + 1.2 * (1 - lengthWeight + lengthWeight * length / 100));
    const shortScore = termWeight(1, 40);
    const longScore = termWeight(frequency, 400);
    controls = <>
      <label className={styles.control}>Length normalization b: {lengthWeight.toFixed(2)}
        <input type="range" min="0" max="1" step="0.05" value={lengthWeight} onChange={event => setLengthWeight(Number(event.target.value))} />
      </label>
      <label className={styles.control}>Long article term frequency: {frequency}
        <input type="range" min="1" max="20" step="1" value={frequency} onChange={event => setFrequency(Number(event.target.value))} />
      </label>
    </>;
    output = <>
      <p>Short article (40 tokens, frequency 1): <strong>{shortScore.toFixed(3)}</strong></p>
      <meter aria-label="Short article term weight" min={0} max={1} value={shortScore} />
      <p>Long article (400 tokens): <strong>{longScore.toFixed(3)}</strong></p>
      <meter aria-label="Long article term weight" min={0} max={1} value={longScore} />
    </>;
  } else if (mode === 'vector') {
    title = 'A two-dimensional query';
    const radians = angle * Math.PI / 180;
    const query = [Math.cos(radians), Math.sin(radians)];
    const scored = vectors.map(document => ({
      ...document,
      cosine: (query[0] * document.coordinates[0] + query[1] * document.coordinates[1]) /
        Math.hypot(...document.coordinates),
    })).sort((first, second) => second.cosine - first.cosine || first.id.localeCompare(second.id));
    controls = <label className={styles.control}>Query angle: {angle} degrees
      <input type="range" min="0" max="90" step="5" value={angle} onChange={event => setAngle(Number(event.target.value))} />
    </label>;
    output = <>
      <p>Query: [{query.map(value => value.toFixed(3)).join(', ')}]</p>
      <ol>{scored.map(document => <li key={document.id}>
        {document.id}: {document.title} · cosine {document.cosine.toFixed(3)}
      </li>)}</ol>
    </>;
  } else if (mode === 'fusion') {
    title = 'Fuse two ranked lists';
    const lists = [(['A', 'E']).slice(0, depth), ...(useVectors ? [(['B', 'E', 'A']).slice(0, depth)] : [])];
    const scores = new Map<string, number>();
    for (const list of lists) {
      list.forEach((id, rankIndex) => scores.set(id, (scores.get(id) ?? 0) + 1 / (60 + rankIndex + 1)));
    }
    const fused = [...scores].sort(([firstId, firstScore], [secondId, secondScore]) =>
      secondScore - firstScore || firstId.localeCompare(secondId));
    controls = <>
      <label className={styles.control}>Candidates per branch: {depth}
        <input type="range" min="1" max="3" step="1" value={depth} onChange={event => setDepth(Number(event.target.value))} />
      </label>
      <label><input type="checkbox" checked={useVectors} onChange={event => setUseVectors(event.target.checked)} /> Include vector branch</label>
    </>;
    output = <>
      <p>Lexical: {lists[0].join(', ')}. Vector: {useVectors ? lists[1].join(', ') : 'off'}.</p>
      <ol>{fused.map(([id, score]) => <li key={id}>{id}: RRF {score.toFixed(6)}</li>)}</ol>
    </>;
  } else {
    title = 'Same candidates, different usefulness';
    const grades: Record<string, number> = {A: 1, B: 3, D: 0, E: 2};
    const selected = ranking.split(',');
    const dcg = selected.reduce((total, id, index) => total + (2 ** grades[id] - 1) / Math.log2(index + 2), 0);
    const idealDcg = [3, 2, 1].reduce((total, grade, index) => total + (2 ** grade - 1) / Math.log2(index + 2), 0);
    const relevantRetrieved = selected.filter(id => grades[id] >= 2).length;
    controls = <label className={styles.control}>Top-three order
      <select value={ranking} onChange={event => setRanking(event.target.value)}>
        <option value="A,E,B">A, E, B</option>
        <option value="B,E,A">B, E, A</option>
        <option value="A,E,D">A, E, D</option>
      </select>
    </label>;
    output = <>
      <p>Grades: A=1, B=3, E=2, D=0. Binary relevance: grade 2 or 3.</p>
      <p>Precision@3: {(relevantRetrieved / 3).toFixed(3)} · Recall@3: {(relevantRetrieved / 2).toFixed(3)}</p>
      <p>nDCG@3: {(dcg / idealDcg).toFixed(3)}</p>
    </>;
  }

  return <section className={styles.widget} aria-labelledby={titleId}>
    <h3 className={styles.widgetTitle} id={titleId}>{title}</h3>
    <div className={styles.controls}>{controls}</div>
    <div className={styles.practiceResult} aria-live="polite">{output}</div>
  </section>;
}