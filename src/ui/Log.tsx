import { useState } from 'preact/hooks';
import { newBake, nowLocal, risePct, summarize, type Bake, type FoldKind, type Loaf } from '../calc/bake';
import { FLOUR_LABELS, round } from '../calc/recipe';
import type { AppData } from '../storage/db';
import { OptNumber, Rating, TextField, TimeField } from './fields';

interface Props {
  data: AppData;
  setData: (d: AppData) => void;
}

export function Log({ data, setData }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);
  const open = data.bakes.find((b) => b.id === openId);

  const update = (b: Bake) => setData({ ...data, bakes: data.bakes.map((x) => (x.id === b.id ? b : x)) });

  if (open) {
    return (
      <BakeEditor
        bake={open}
        data={data}
        setData={setData}
        update={update}
        onClose={() => setOpenId(null)}
        onDelete={() => {
          if (!confirm('Delete this bake?')) return;
          setData({ ...data, bakes: data.bakes.filter((b) => b.id !== open.id) });
          setOpenId(null);
        }}
      />
    );
  }

  const start = () => {
    const b = newBake(data.draft, data.temps.kitchenTemp, data.fridgeTemp);
    setData({ ...data, bakes: [b, ...data.bakes] });
    setOpenId(b.id);
  };

  const sorted = [...data.bakes].sort((a, b) => (b.mix.time ?? b.createdAt).localeCompare(a.mix.time ?? a.createdAt));

  return (
    <>
      <section class="card">
        <h2>Bake log</h2>
        <p class="note">A new bake starts from the recipe currently in the Recipe tab ("{data.draft.name}").</p>
        <button class="primary" onClick={start}>
          Start a new bake
        </button>
      </section>
      {sorted.length === 0 && <p class="toast">No bakes logged yet.</p>}
      {sorted.map((b) => {
        const s = summarize(b);
        return (
          <button class="card bake-item" onClick={() => setOpenId(b.id)}>
            <div class="bake-item-head">
              <strong>{formatDate(b.mix.time ?? b.createdAt)}</strong>
              <span class="muted">{b.recipe.name}</span>
            </div>
            <div class="bake-item-stats">
              {s.bulkHours !== undefined && <span>Bulk {round(s.bulkHours, 1)} h</span>}
              {s.bulkEndRisePct !== undefined && <span>Rise {round(s.bulkEndRisePct)}%</span>}
              {s.avgBulkDoughTemp !== undefined && <span>{round(s.avgBulkDoughTemp, 1)} °C</span>}
            </div>
            {b.loaves.map((l, i) => {
              const fh = s.loaves[i].fridgeHours;
              if (fh === undefined && l.shapeRating === undefined) return null;
              return (
                <div class="bake-item-loaf">
                  Loaf {l.label}: {fh !== undefined ? `${round(fh)} h fridge` : 'fridge –'}
                  {l.shapeRating !== undefined && `, shape ${l.shapeRating}/5`}
                  {l.springRating !== undefined && `, spring ${l.springRating}/5`}
                </div>
              );
            })}
          </button>
        );
      })}
    </>
  );
}

function BakeEditor({
  bake: b,
  data,
  setData,
  update,
  onClose,
  onDelete,
}: {
  bake: Bake;
  data: AppData;
  setData: (d: AppData) => void;
  update: (b: Bake) => void;
  onClose: () => void;
  onDelete: () => void;
}) {
  const s = summarize(b);
  const set = <K extends keyof Bake>(k: K, v: Bake[K]) => update({ ...b, [k]: v });
  const setLoaf = (i: number, patch: Partial<Loaf>) =>
    set('loaves', b.loaves.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  const addFold = (kind: FoldKind) => set('folds', [...b.folds, { kind, time: nowLocal() }]);

  const r = b.recipe;
  const flourLine = r.flours.map((f) => `${f.pct}% ${FLOUR_LABELS[f.type].toLowerCase()}`).join(', ');

  return (
    <>
      <div class="row editor-bar">
        <button onClick={onClose}>← All bakes</button>
        <button class="danger" onClick={onDelete}>
          Delete
        </button>
      </div>

      <section class="card">
        <h2>{r.name}</h2>
        <p class="note">
          {r.flourWeight} g flour ({flourLine}), {r.hydrationPct}% water, {r.starterPct}% starter, {r.saltPct}% salt,{' '}
          {r.loaves} loaves.
        </p>
      </section>

      <section class="card">
        <h2>Starter</h2>
        <div class="grid2">
          <TextField label="Feed ratio" placeholder="1:2:2" value={b.starter.feedRatio} onChange={(v) => set('starter', { ...b.starter, feedRatio: v })} />
          <OptNumber label="Starter temp" unit="°C" value={b.starter.temp} onChange={(v) => set('starter', { ...b.starter, temp: v })} />
        </div>
        <TimeField label="Fed at" value={b.starter.feedTime} onChange={(v) => set('starter', { ...b.starter, feedTime: v })} />
        <OptNumber
          label="Time to double"
          unit="h"
          value={b.starter.hoursToDouble}
          onChange={(v) => set('starter', { ...b.starter, hoursToDouble: v })}
          hint="Rubber band at the level after feeding, note when it has doubled."
        />
        {s.starterAgeAtMix !== undefined && <p class="derived">Used {round(s.starterAgeAtMix, 1)} h after feeding.</p>}
      </section>

      <section class="card">
        <h2>Mix</h2>
        <TimeField label="Mixed at" value={b.mix.time} onChange={(v) => set('mix', { ...b.mix, time: v })} />
        <div class="grid2">
          <OptNumber label="Kitchen" unit="°C" value={b.mix.kitchenTemp} onChange={(v) => set('mix', { ...b.mix, kitchenTemp: v })} />
          <OptNumber label="Flour" unit="°C" value={b.mix.flourTemp} onChange={(v) => set('mix', { ...b.mix, flourTemp: v })} hint="Empty = kitchen temp" />
          <OptNumber label="Water" unit="°C" value={b.mix.waterTemp} onChange={(v) => set('mix', { ...b.mix, waterTemp: v })} />
          <OptNumber label="Dough after mixing" unit="°C" value={b.mix.doughTempAfterMix} onChange={(v) => set('mix', { ...b.mix, doughTempAfterMix: v })} />
        </div>
        {s.measuredMixerHeat !== undefined && (
          <div class="derived">
            Mixer heat this bake: <strong>{round(s.measuredMixerHeat, 1)} °C</strong> (calculator uses {data.temps.mixerRise} °C).{' '}
            <button
              class="link"
              onClick={() => setData({ ...data, temps: { ...data.temps, mixerRise: round(s.measuredMixerHeat!, 1) } })}
            >
              Use in calculator
            </button>
          </div>
        )}
      </section>

      <section class="card">
        <h2>Folds</h2>
        {b.folds.map((f, i) => (
          <div class="fold-row">
            <select
              value={f.kind}
              onChange={(e) =>
                set('folds', b.folds.map((x, j) => (j === i ? { ...x, kind: (e.target as HTMLSelectElement).value as FoldKind } : x)))
              }
            >
              <option value="stretch">Stretch & fold</option>
              <option value="coil">Coil fold</option>
            </select>
            <input
              type="datetime-local"
              value={f.time}
              onInput={(e) => set('folds', b.folds.map((x, j) => (j === i ? { ...x, time: (e.target as HTMLInputElement).value } : x)))}
            />
            <button class="link" onClick={() => set('folds', b.folds.filter((_, j) => j !== i))} aria-label="Remove fold">
              ✕
            </button>
          </div>
        ))}
        <div class="row">
          <button onClick={() => addFold('stretch')}>+ Stretch & fold now</button>
          <button onClick={() => addFold('coil')}>+ Coil fold now</button>
        </div>
      </section>

      <section class="card">
        <h2>Bulk fermentation</h2>
        <OptNumber
          label="Aliquot jar start level"
          value={b.aliquotStart}
          onChange={(v) => set('aliquotStart', v)}
          hint="A sample of dough in a straight-sided jar. Note the mark (ml or mm) right after mixing."
        />
        {b.aliquot.map((a, i) => {
          const rp = risePct(b.aliquotStart, a.level);
          const setA = (patch: Partial<typeof a>) => set('aliquot', b.aliquot.map((x, j) => (j === i ? { ...x, ...patch } : x)));
          return (
            <div class="reading">
              <div class="reading-head">
                <input type="datetime-local" value={a.time} onInput={(e) => setA({ time: (e.target as HTMLInputElement).value })} />
                <button class="link" onClick={() => set('aliquot', b.aliquot.filter((_, j) => j !== i))} aria-label="Remove reading">
                  ✕
                </button>
              </div>
              <div class="grid2">
                <OptNumber label="Jar level" value={a.level} onChange={(v) => setA({ level: v ?? 0 })} />
                <OptNumber label="Dough temp" unit="°C" value={a.doughTemp} onChange={(v) => setA({ doughTemp: v })} />
              </div>
              {rp !== undefined && <p class="derived">Rise {round(rp)}%</p>}
            </div>
          );
        })}
        <button
          onClick={() => {
            const prev = b.aliquot[b.aliquot.length - 1];
            set('aliquot', [...b.aliquot, { time: nowLocal(), level: prev?.level ?? b.aliquotStart ?? 0 }]);
          }}
        >
          + Jar reading now
        </button>

        <h3>End of bulk</h3>
        <TimeField label="Bulk ended at" value={b.bulkEnd.time} onChange={(v) => set('bulkEnd', { ...b.bulkEnd, time: v })} />
        <OptNumber label="Dough temp at end" unit="°C" value={b.bulkEnd.doughTemp} onChange={(v) => set('bulkEnd', { ...b.bulkEnd, doughTemp: v })} />
        <dl class="stats">
          <div>
            <dt>Bulk time</dt>
            <dd>{s.bulkHours !== undefined ? `${round(s.bulkHours, 1)} h` : '–'}</dd>
          </div>
          <div>
            <dt>Rise at end</dt>
            <dd>{s.bulkEndRisePct !== undefined ? `${round(s.bulkEndRisePct)}%` : '–'}</dd>
          </div>
          <div>
            <dt>Avg dough temp</dt>
            <dd>{s.avgBulkDoughTemp !== undefined ? `${round(s.avgBulkDoughTemp, 1)} °C` : '–'}</dd>
          </div>
        </dl>
      </section>

      <section class="card">
        <h2>Fridge</h2>
        <OptNumber label="Fridge temp" unit="°C" value={b.fridgeTemp} onChange={(v) => set('fridgeTemp', v)} />
      </section>

      {b.loaves.map((l, i) => (
        <section class="card">
          <h2>Loaf {l.label}</h2>
          <TimeField label="Shaped" value={l.shapeTime} onChange={(v) => setLoaf(i, { shapeTime: v })} />
          <TimeField label="Into the fridge" value={l.fridgeIn} onChange={(v) => setLoaf(i, { fridgeIn: v })} />
          <TimeField label="Out of the fridge" value={l.fridgeOut} onChange={(v) => setLoaf(i, { fridgeOut: v })} />
          <TimeField label="Into the oven" value={l.bakeTime} onChange={(v) => setLoaf(i, { bakeTime: v })} />
          {s.loaves[i].fridgeHours !== undefined && <p class="derived">{round(s.loaves[i].fridgeHours!, 1)} h in the fridge.</p>}
          <OptNumber label="Internal temp at end of bake" unit="°C" value={l.internalTemp} onChange={(v) => setLoaf(i, { internalTemp: v })} />
          <Rating label="Shape" low="spread flat" high="held its shape" value={l.shapeRating} onChange={(v) => setLoaf(i, { shapeRating: v })} />
          <Rating label="Oven spring" low="none" high="great" value={l.springRating} onChange={(v) => setLoaf(i, { springRating: v })} />
          <TextField label="Crumb and other notes" multiline value={l.crumbNotes} onChange={(v) => setLoaf(i, { crumbNotes: v })} />
        </section>
      ))}

      <section class="card">
        <h2>Notes</h2>
        <TextField label="How did the dough feel?" multiline value={b.notes} onChange={(v) => set('notes', v)} />
      </section>
    </>
  );
}

function formatDate(local: string): string {
  const d = new Date(local);
  return Number.isNaN(d.getTime())
    ? local
    : d.toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}
