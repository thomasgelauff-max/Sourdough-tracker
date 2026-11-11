import { computeRecipe, FLOUR_LABELS, round, type FlourType, type Recipe } from '../calc/recipe';
import { computeWaterTemp } from '../calc/waterTemp';
import type { AppData, TempSettings } from '../storage/db';
import { NumberField } from './NumberField';

interface Props {
  data: AppData;
  setData: (d: AppData) => void;
}

const ALL_TYPES = Object.keys(FLOUR_LABELS) as FlourType[];

export function Calculator({ data, setData }: Props) {
  const r = data.draft;
  const t = data.temps;
  const setR = (patch: Partial<Recipe>) => setData({ ...data, draft: { ...r, ...patch } });
  const setT = (patch: Partial<TempSettings>) => setData({ ...data, temps: { ...t, ...patch } });

  const res = computeRecipe(r);
  const wt = computeWaterTemp({
    targetDoughTemp: t.targetDoughTemp,
    flourTemp: t.kitchenTemp,
    starterTemp: t.starterTemp,
    mixerRise: t.mixerRise,
    flourGrams: r.flourWeight,
    waterGrams: res.water,
    starterGrams: res.starter,
    starterHydrationPct: r.starterHydrationPct,
  });

  const flourSum = r.flours.reduce((s, f) => s + f.pct, 0);
  const unused = ALL_TYPES.filter((ty) => !r.flours.some((f) => f.type === ty));

  const setFlour = (i: number, pct: number) =>
    setR({ flours: r.flours.map((f, j) => (j === i ? { ...f, pct } : f)) });

  return (
    <>
      <section class="card">
        <h2>Flour</h2>
        <NumberField label="Flour in the bowl" unit="g" value={r.flourWeight} onChange={(v) => setR({ flourWeight: v })} />
        {r.flours.map((f, i) => (
          <div class="flour-row">
            <NumberField label={FLOUR_LABELS[f.type]} unit="%" value={f.pct} onChange={(v) => setFlour(i, v)} />
            {f.type !== 'white' && (
              <button class="link" onClick={() => setR({ flours: r.flours.filter((_, j) => j !== i) })} aria-label="Remove">
                Remove
              </button>
            )}
          </div>
        ))}
        <div class={Math.abs(flourSum - 100) > 0.01 ? 'sum bad' : 'sum'}>Total: {round(flourSum, 1)}%</div>
        {unused.length > 0 && (
          <div class="add-flour">
            {unused.map((ty) => (
              <button class="chip" onClick={() => setR({ flours: [...r.flours, { type: ty, pct: 0 }] })}>
                + {FLOUR_LABELS[ty]}
              </button>
            ))}
          </div>
        )}
      </section>

      <section class="card">
        <h2>Percentages</h2>
        <p class="note">Relative to the flour in the bowl.</p>
        <div class="grid2">
          <NumberField label="Hydration" unit="%" value={r.hydrationPct} onChange={(v) => setR({ hydrationPct: v })} />
          <NumberField label="Salt" unit="%" step={0.1} value={r.saltPct} onChange={(v) => setR({ saltPct: v })} />
          <NumberField label="Starter" unit="%" value={r.starterPct} onChange={(v) => setR({ starterPct: v })} />
          <NumberField
            label="Starter hydration"
            unit="%"
            value={r.starterHydrationPct}
            onChange={(v) => setR({ starterHydrationPct: v })}
          />
          <NumberField label="Loaves" value={r.loaves} onChange={(v) => setR({ loaves: Math.max(1, Math.round(v)) })} />
        </div>
      </section>

      <section class="card result">
        <h2>Weigh out</h2>
        <table>
          <tbody>
            {res.flours.map((f) => (
              <tr>
                <td>{FLOUR_LABELS[f.type]}</td>
                <td class="num">{round(f.grams)} g</td>
              </tr>
            ))}
            <tr>
              <td>Water</td>
              <td class="num">{round(res.water)} g</td>
            </tr>
            <tr>
              <td>Starter</td>
              <td class="num">{round(res.starter)} g</td>
            </tr>
            <tr>
              <td>Salt</td>
              <td class="num">{round(res.salt, 1)} g</td>
            </tr>
            <tr class="total">
              <td>Total dough</td>
              <td class="num">{round(res.totalDough)} g</td>
            </tr>
            <tr>
              <td>Per loaf ({r.loaves})</td>
              <td class="num">{round(res.perLoaf)} g</td>
            </tr>
          </tbody>
        </table>
        <dl class="stats">
          <div>
            <dt>True hydration</dt>
            <dd>{round(res.trueHydrationPct, 1)}%</dd>
          </div>
          <div>
            <dt>Prefermented flour</dt>
            <dd>{round(res.prefermentedFlourPct, 1)}%</dd>
          </div>
          <div>
            <dt>Whole grain</dt>
            <dd>{round(res.wholeGrainPct, 1)}%</dd>
          </div>
        </dl>
        {res.warnings.map((w) => (
          <p class="warn">{w}</p>
        ))}
      </section>

      <section class="card">
        <h2>Dough temperature</h2>
        <div class="grid2">
          <NumberField label="Target dough temp" unit="°C" step={0.5} value={t.targetDoughTemp} onChange={(v) => setT({ targetDoughTemp: v })} />
          <NumberField label="Kitchen / flour" unit="°C" step={0.5} value={t.kitchenTemp} onChange={(v) => setT({ kitchenTemp: v })} />
          <NumberField label="Starter" unit="°C" step={0.5} value={t.starterTemp} onChange={(v) => setT({ starterTemp: v })} />
          <NumberField
            label="Mixer heat"
            unit="°C"
            step={0.5}
            value={t.mixerRise}
            onChange={(v) => setT({ mixerRise: v })}
            hint="Rise from 15 min in the mixer. Measure once and adjust."
          />
        </div>
        <div class="big">
          Water at <strong>{Number.isFinite(wt.waterTemp) ? `${round(wt.waterTemp, 1)} °C` : '–'}</strong>
        </div>
        {wt.warnings.map((w) => (
          <p class="warn">{w}</p>
        ))}
      </section>
    </>
  );
}
