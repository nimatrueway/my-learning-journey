import React, {useState} from 'react';
import styles from './widgets.module.css';

type Shape = 'encoder' | 'decoder' | 'cross';

const SOURCE = ['the', 'cat', 'ate', 'my', 'router'];
const TARGET = ['<s>', 'le', 'chat', 'a', 'mangé'];

interface ShapeConfig {
  label: string;
  rows: string[];
  columns: string[];
  rowTitle: string;
  columnTitle: string;
  allows: (row: number, column: number) => boolean;
  explain: (visible: number, total: number) => string;
}

const SHAPES: Record<Shape, ShapeConfig> = {
  encoder: {
    label: 'Encoder-only (BERT)',
    rows: SOURCE,
    columns: SOURCE,
    rowTitle: 'query: input token',
    columnTitle: 'key: input token',
    allows: () => true,
    explain: (visible, total) =>
      `${visible}/${total} pairs allowed. Every input token sees the whole sentence, left and right. Great for understanding “my router” retroactively — useless for generating text, because the answer is already in the input.`,
  },
  decoder: {
    label: 'Decoder-only (GPT)',
    rows: TARGET,
    columns: TARGET,
    rowTitle: 'query: generated token',
    columnTitle: 'key: generated token',
    allows: (row, column) => column <= row,
    explain: (visible, total) =>
      `${visible}/${total} pairs allowed. The causal mask deletes the upper triangle, so token ${TARGET.length} cannot peek at its own future. That is what makes next-token training honest — and generation possible.`,
  },
  cross: {
    label: 'Cross-attention (encoder–decoder)',
    rows: TARGET,
    columns: SOURCE,
    rowTitle: 'query: generated token',
    columnTitle: 'key/value: encoder output',
    allows: () => true,
    explain: (visible, total) =>
      `${visible}/${total} pairs allowed. Queries come from the decoder, keys and values from the finished encoder. No mask is needed here: the source is fully known, so even output token 1 may read the last source word.`,
  },
};

export default function AttentionMaskViz(): React.ReactElement {
  const [shape, setShape] = useState<Shape>('encoder');
  const config = SHAPES[shape];
  const total = config.rows.length * config.columns.length;
  const visible = config.rows.reduce(
    (count, _, row) => count + config.columns.filter((__, column) => config.allows(row, column)).length,
    0,
  );

  return (
    <div className={styles.widget}>
      <div className={styles.buttonRow} role="group" aria-label="Attention shape">
        {(Object.keys(SHAPES) as Shape[]).map(key => (
          <button
            key={key}
            className={shape === key ? styles.activeButton : styles.button}
            aria-pressed={shape === key}
            onClick={() => setShape(key)}>
            {SHAPES[key].label}
          </button>
        ))}
      </div>

      <p className={styles.stepperTitle}>
        Rows = {config.rowTitle} · columns = {config.columnTitle}
      </p>

      <div className={styles.maskScroll}>
        <table className={styles.maskTable}>
          <thead>
            <tr>
              <td />
              {config.columns.map((token, column) => (
                <th key={column} scope="col">{token}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {config.rows.map((token, row) => (
              <tr key={row}>
                <th scope="row">{token}</th>
                {config.columns.map((columnToken, column) => {
                  const allowed = config.allows(row, column);
                  return (
                    <td
                      key={column}
                      className={allowed ? styles.maskCell : styles.maskCellBlocked}
                      title={`“${token}” ${allowed ? 'may read' : 'is blocked from'} “${columnToken}”`}>
                      {allowed ? '👀' : '✕'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className={styles.statusLine}>{config.explain(visible, total)}</p>
    </div>
  );
}
