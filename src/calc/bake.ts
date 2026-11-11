// Bake log model and the numbers derived from it.
// Times are stored as local "YYYY-MM-DDTHH:mm" strings (the format of
// <input type="datetime-local">), so they read the same on any device.

import type { Recipe } from './recipe';
import { predictDoughTemp } from './waterTemp';
import { computeRecipe } from './recipe';

export type FoldKind = 'stretch' | 'coil';

export interface Fold {
  time: string;
  kind: FoldKind;
}

export interface AliquotReading {
  time: string;
  level: number; // jar mark (ml or mm, whatever the jar has)
  doughTemp?: number;
}

export interface Loaf {
  label: string;
  shapeTime?: string;
  fridgeIn?: string;
  fridgeOut?: string;
  bakeTime?: string;
  internalTemp?: number; // °C at end of bake
  shapeRating?: number; // 1 = flat puddle, 5 = holds shape perfectly
  springRating?: number; // 1 = none, 5 = great oven spring
  crumbNotes?: string;
}

export interface Bake {
  id: string;
  createdAt: string;
  recipe: Recipe; // snapshot, so later recipe edits don't rewrite history
  starter: {
    feedRatio?: string; // e.g. "1:2:2"
    feedTime?: string;
    hoursToDouble?: number;
    temp?: number;
  };
  mix: {
    time?: string;
    kitchenTemp?: number;
    flourTemp?: number;
    waterTemp?: number;
    doughTempAfterMix?: number;
  };
  folds: Fold[];
  aliquotStart?: number;
  aliquot: AliquotReading[];
  bulkEnd: {
    time?: string;
    doughTemp?: number;
  };
  fridgeTemp?: number;
  loaves: Loaf[];
  notes?: string;
}

export function newBake(recipe: Recipe, kitchenTemp: number, fridgeTemp = 4): Bake {
  const loaves: Loaf[] = Array.from({ length: Math.max(1, recipe.loaves) }, (_, i) => ({
    label: String.fromCharCode(65 + i),
  }));
  return {
    id: Math.random().toString(36).slice(2) + Date.now().toString(36),
    createdAt: nowLocal(),
    recipe: structuredClone(recipe),
    starter: {},
    mix: { kitchenTemp },
    folds: [],
    aliquot: [],
    bulkEnd: {},
    fridgeTemp,
    loaves,
  };
}

export function nowLocal(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** Hours between two local timestamps, or undefined if either is missing. */
export function hoursBetween(a?: string, b?: string): number | undefined {
  if (!a || !b) return undefined;
  const ms = new Date(b).getTime() - new Date(a).getTime();
  return Number.isFinite(ms) ? ms / 3_600_000 : undefined;
}

export function risePct(start: number | undefined, level: number): number | undefined {
  if (!start || start <= 0) return undefined;
  return ((level - start) / start) * 100;
}

export interface BakeSummary {
  starterAgeAtMix?: number; // hours since feeding when mixed
  bulkHours?: number;
  bulkEndRisePct?: number; // from the last aliquot reading at or before end of bulk
  avgBulkDoughTemp?: number; // mean of all dough temps logged during bulk
  measuredMixerHeat?: number;
  loaves: { label: string; fridgeHours?: number; mixToBakeHours?: number }[];
}

export function summarize(b: Bake): BakeSummary {
  const bulkHours = hoursBetween(b.mix.time, b.bulkEnd.time);

  const sorted = [...b.aliquot].sort((x, y) => x.time.localeCompare(y.time));
  const upToEnd = b.bulkEnd.time ? sorted.filter((r) => r.time <= b.bulkEnd.time!) : sorted;
  const last = upToEnd[upToEnd.length - 1];
  const bulkEndRisePct = last ? risePct(b.aliquotStart, last.level) : undefined;

  const temps = [b.mix.doughTempAfterMix, ...b.aliquot.map((r) => r.doughTemp), b.bulkEnd.doughTemp].filter(
    (t): t is number => typeof t === 'number',
  );
  const avgBulkDoughTemp = temps.length ? temps.reduce((s, t) => s + t, 0) / temps.length : undefined;

  return {
    starterAgeAtMix: hoursBetween(b.starter.feedTime, b.mix.time),
    bulkHours,
    bulkEndRisePct,
    avgBulkDoughTemp,
    measuredMixerHeat: measuredMixerHeat(b),
    loaves: b.loaves.map((l) => ({
      label: l.label,
      fridgeHours: hoursBetween(l.fridgeIn, l.fridgeOut),
      mixToBakeHours: hoursBetween(b.mix.time, l.bakeTime),
    })),
  };
}

/**
 * Mixer heat actually observed in this bake: dough temperature after mixing
 * minus what the ingredient temperatures alone would give.
 */
export function measuredMixerHeat(b: Bake): number | undefined {
  const { waterTemp, doughTempAfterMix } = b.mix;
  const flourTemp = b.mix.flourTemp ?? b.mix.kitchenTemp;
  const starterTemp = b.starter.temp ?? b.mix.kitchenTemp;
  if (waterTemp === undefined || doughTempAfterMix === undefined || flourTemp === undefined || starterTemp === undefined) {
    return undefined;
  }
  const r = computeRecipe(b.recipe);
  const noFriction = predictDoughTemp({
    flourTemp,
    starterTemp,
    waterTemp,
    mixerRise: 0,
    flourGrams: b.recipe.flourWeight,
    waterGrams: r.water,
    starterGrams: r.starter,
    starterHydrationPct: b.recipe.starterHydrationPct,
  });
  return doughTempAfterMix - noFriction;
}
