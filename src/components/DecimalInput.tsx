import React, {useEffect, useRef, useState} from 'react';

interface DecimalInputProps {
  id: string;
  value: number;
  onChange: (value: number) => void;
}

const format = (value: number): string => (Number.isFinite(value) ? String(value) : '');

/** Free-text numeric field without spinner buttons. Unparseable text reports NaN. */
export default function DecimalInput({id, value, onChange}: DecimalInputProps): React.ReactElement {
  const [text, setText] = useState(() => format(value));
  const focused = useRef(false);

  // Sync external changes (sliders, unit switches, restored state) unless the learner is typing.
  useEffect(() => {
    if (!focused.current) setText(format(value));
  }, [value]);

  return (
    <input id={id} type="text" inputMode="decimal" autoComplete="off" value={text}
      onFocus={() => { focused.current = true; }}
      onBlur={() => {
        focused.current = false;
        setText(format(value));
      }}
      onChange={(event) => {
        const next = event.target.value;
        setText(next);
        const normalized = next.trim().replace(',', '.');
        onChange(/^-?(\d+\.?\d*|\.\d+)$/.test(normalized) ? Number(normalized) : Number.NaN);
      }} />
  );
}
