import React, {useId, useState} from 'react';
import styles from './widgets.module.css';

const documents = [
  {id: 'A', title: 'Repair a bicycle tire', terms: ['repair', 'a', 'bicycle', 'tire']},
  {id: 'B', title: 'Bicycle repair tools', terms: ['bicycle', 'repair', 'tools']},
  {id: 'C', title: 'Fix a flat wheel', terms: ['fix', 'a', 'flat', 'wheel']},
];
const queryTerms = ['bicycle', 'repair'];

export default function LucenePostingsLab(): React.ReactElement {
  const controlId = useId();
  const [operator, setOperator] = useState('any');
  const [selectedTerm, setSelectedTerm] = useState('bicycle');
  const results = documents.filter(document => {
    if (operator === 'phrase') {
      return document.terms.some((term, position) =>
        term === queryTerms[0] && document.terms[position + 1] === queryTerms[1]);
    }
    const matches = queryTerms.map(term => document.terms.includes(term));
    return operator === 'all' ? matches.every(Boolean) : matches.some(Boolean);
  });

  return (
    <section className={styles.widget} aria-labelledby={`${controlId}-title`}>
      <h3 className={styles.widgetTitle} id={`${controlId}-title`}>Inside the postings list</h3>
      <div className={styles.controls}>
        <label className={styles.control}>
          Term
          <select value={selectedTerm} onChange={event => setSelectedTerm(event.target.value)}>
            {['bicycle', 'repair', 'flat'].map(term => <option key={term}>{term}</option>)}
          </select>
        </label>
        <label className={styles.control}>
          Query: bicycle repair
          <select value={operator} onChange={event => setOperator(event.target.value)}>
            <option value="any">Any term (OR)</option>
            <option value="all">Both terms (AND)</option>
            <option value="phrase">Exact phrase</option>
          </select>
        </label>
      </div>
      <ul>
        {documents.map(document => <li key={document.id}><strong>{document.id}</strong>: {document.title}</li>)}
      </ul>
      <div className={styles.practiceResult} aria-live="polite">
        <p><strong>{selectedTerm} postings:</strong> {documents
          .filter(document => document.terms.includes(selectedTerm))
          .map(document => `${document.id} @ position ${document.terms.indexOf(selectedTerm)}`)
          .join('; ')}</p>
        <p><strong>Matching documents:</strong> {results.map(document => document.id).join(', ') || 'None'}</p>
      </div>
    </section>
  );
}