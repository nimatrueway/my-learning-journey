import React, {useState} from 'react';
import styles from './widgets.module.css';

export interface QuizOption {
  text: string;
  correct?: boolean;
  /** Shown when this option is picked: roast for wrong, hype for right */
  feedback: string;
}

export default function Quiz({question, options}: {question: string; options: QuizOption[]}): React.ReactElement {
  const [picked, setPicked] = useState<number | null>(null);
  const done = picked !== null && options[picked].correct;

  return (
    <div className={styles.quiz}>
      <p className={styles.quizQuestion}>🧠 {question}</p>
      <div className={styles.quizOptions}>
        {options.map((opt, i) => {
          const isPicked = picked === i;
          let cls = styles.quizOption;
          if (isPicked) cls = opt.correct ? styles.quizCorrect : styles.quizWrong;
          return (
            <button key={i} type="button" className={cls} disabled={done}
              onClick={() => setPicked(i)}>
              {opt.text}
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <p className={options[picked].correct ? styles.quizFeedbackGood : styles.quizFeedbackBad}>
          {options[picked].correct ? '✅ ' : '❌ '}
          {options[picked].feedback}
        </p>
      )}
    </div>
  );
}
