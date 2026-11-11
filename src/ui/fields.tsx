import { useEffect, useState } from 'preact/hooks';
import { nowLocal } from '../calc/bake';

// Number input where empty means "not measured".
export function OptNumber({
  label,
  value,
  onChange,
  unit,
  hint,
}: {
  label: string;
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  unit?: string;
  hint?: string;
}) {
  const [text, setText] = useState(value === undefined ? '' : String(value));
  useEffect(() => {
    const cur = text.trim() === '' ? undefined : Number(text.replace(',', '.'));
    if (cur !== value) setText(value === undefined ? '' : String(value));
  }, [value]);
  return (
    <label class="field">
      <span class="field-label">{label}</span>
      <span class="field-input">
        <input
          type="text"
          inputMode="decimal"
          value={text}
          onInput={(e) => {
            const t = (e.target as HTMLInputElement).value;
            setText(t);
            if (t.trim() === '') return onChange(undefined);
            const n = Number(t.replace(',', '.'));
            if (Number.isFinite(n)) onChange(n);
          }}
        />
        {unit && <span class="unit">{unit}</span>}
      </span>
      {hint && <span class="hint">{hint}</span>}
    </label>
  );
}

// Date-time with a big "Now" button, for logging with doughy hands.
export function TimeField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string | undefined;
  onChange: (v: string | undefined) => void;
}) {
  return (
    <label class="field">
      <span class="field-label">{label}</span>
      <span class="field-input">
        <input
          type="datetime-local"
          value={value ?? ''}
          onInput={(e) => onChange((e.target as HTMLInputElement).value || undefined)}
        />
        <button type="button" class="now" onClick={(e) => { e.preventDefault(); onChange(nowLocal()); }}>
          Now
        </button>
      </span>
    </label>
  );
}

export function TextField({
  label,
  value,
  onChange,
  multiline,
  placeholder,
}: {
  label: string;
  value: string | undefined;
  onChange: (v: string | undefined) => void;
  multiline?: boolean;
  placeholder?: string;
}) {
  const handler = (e: Event) => onChange((e.target as HTMLInputElement).value || undefined);
  return (
    <label class="field">
      <span class="field-label">{label}</span>
      {multiline ? (
        <textarea rows={3} value={value ?? ''} placeholder={placeholder} onInput={handler} />
      ) : (
        <input type="text" value={value ?? ''} placeholder={placeholder} onInput={handler} />
      )}
    </label>
  );
}

export function Rating({
  label,
  value,
  onChange,
  low,
  high,
}: {
  label: string;
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  low: string;
  high: string;
}) {
  return (
    <div class="field">
      <span class="field-label">{label}</span>
      <div class="rating" role="radiogroup" aria-label={label}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            type="button"
            role="radio"
            aria-checked={value === n}
            class={value === n ? 'active' : ''}
            onClick={() => onChange(value === n ? undefined : n)}
          >
            {n}
          </button>
        ))}
      </div>
      <span class="hint">
        1 = {low}, 5 = {high}
      </span>
    </div>
  );
}
