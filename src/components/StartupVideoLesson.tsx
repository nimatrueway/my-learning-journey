import React, {useState} from 'react';
import styles from './widgets.module.css';

type ReflectionLens = 'claim' | 'evidence' | 'action';

interface StartupVideoLessonProps {
  videoId: string;
  title: string;
  focus: string;
  tryThis: string;
}

const lensPrompts: Record<ReflectionLens, string> = {
  claim: 'State the strongest claim in one sentence. No founder fog.',
  evidence: 'What customer, product, or company evidence would prove it wrong?',
  action: 'Name one decision you will make differently this week.',
};

export default function StartupVideoLesson({
  videoId,
  title,
  focus,
  tryThis,
}: StartupVideoLessonProps): React.ReactElement {
  const [lens, setLens] = useState<ReflectionLens>('claim');
  const [note, setNote] = useState('');

  return (
    <>
      <details className={styles.videoDisclosure}>
        <summary>Optional: watch the full source video</summary>
        <div className={styles.videoFrame}>
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${videoId}`}
            title={title}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </details>

      <div className={styles.widget}>
        <p><strong>Decision lens:</strong> {focus}</p>
        <p><strong>Try it:</strong> {tryThis}</p>

        <div className={styles.buttonRow} role="group" aria-label="Reflection lens">
          {(['claim', 'evidence', 'action'] as const).map((option) => (
            <button
              key={option}
              type="button"
              className={lens === option ? styles.activeButton : styles.button}
              aria-pressed={lens === option}
              onClick={() => {
                setLens(option);
                setNote('');
              }}>
              {option[0].toUpperCase() + option.slice(1)}
            </button>
          ))}
        </div>

        <label className={styles.reflectionField}>
          <span>{lensPrompts[lens]}</span>
          <textarea
            value={note}
            rows={3}
            placeholder="Make it specific to a real startup or decision."
            onChange={(event) => setNote(event.target.value)}
          />
        </label>
        <p className={styles.statusLine} aria-live="polite">
          {note.trim().length > 0
            ? `${note.trim().split(/\s+/).length} words captured. Specific beats impressive.`
            : 'Your note stays in this browser tab and is not submitted.'}
        </p>
      </div>
    </>
  );
}