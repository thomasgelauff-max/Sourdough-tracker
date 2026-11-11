import { useEffect, useState } from 'preact/hooks';

interface Props {
  label: string;
  value: number;
  onChange: (v: number) => void;
  unit?: string;
  step?: number;
  hint?: string;
}

// Keeps its own text so a half-typed "6" or "" doesn't snap back while editing.
export function NumberField({ label, value, onChange, unit, step = 1, hint }: Props) {
  const [text, setText] = useState(String(value));
  useEffect(() => {
    if (Number(text.replace(',', '.')) !== value) setText(String(value));
  }, [value]);

  return (
    <label class="field">
      <span class="field-label">{label}</span>
      <span class="field-input">
        <input
          type="text"
          inputMode="decimal"
          value={text}
          step={step}
          onInput={(e) => {
            const t = (e.target as HTMLInputElement).value;
            setText(t);
            const n = Number(t.replace(',', '.'));
            if (t.trim() !== '' && Number.isFinite(n)) onChange(n);
          }}
        />
        {unit && <span class="unit">{unit}</span>}
      </span>
      {hint && <span class="hint">{hint}</span>}
    </label>
  );
}
