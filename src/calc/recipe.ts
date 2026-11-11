// Baker's percentage calculator.
// Convention: all percentages are relative to the ADDED flour (the flour you
// weigh into the bowl), which is how the recipe is usually written down.
// The flour and water inside the starter are reported separately and folded
// into the "true" totals.

export type FlourType = 'white' | 'wholewheat' | 'rye' | 'spelt' | 'other';

export const FLOUR_LABELS: Record<FlourType, string> = {
  white: 'White (bread) flour',
  wholewheat: 'Whole wheat',
  rye: 'Rye',
  spelt: 'Spelt',
  other: 'Other',
};

export interface FlourShare {
  type: FlourType;
  pct: number; // share of added flour, 0-100
}

export interface Recipe {
  name: string;
  flourWeight: number; // g of added flour
  flours: FlourShare[];
  hydrationPct: number; // water / added flour
  saltPct: number;
  starterPct: number; // inoculation: starter / added flour
  starterHydrationPct: number; // water / flour inside the starter
  loaves: number;
}

export const DEFAULT_RECIPE: Recipe = {
  name: 'House loaf',
  flourWeight: 800,
  flours: [
    { type: 'white', pct: 80 },
    { type: 'wholewheat', pct: 10 },
    { type: 'rye', pct: 10 },
  ],
  hydrationPct: 65,
  saltPct: 2,
  starterPct: 20,
  starterHydrationPct: 100,
  loaves: 2,
};

export interface RecipeResult {
  flours: { type: FlourType; grams: number }[];
  water: number;
  salt: number;
  starter: number;
  starterFlour: number;
  starterWater: number;
  totalFlour: number;
  totalWater: number;
  trueHydrationPct: number;
  wholeGrainPct: number; // whole wheat + rye + spelt share of total flour
  prefermentedFlourPct: number; // starter flour / total flour
  totalDough: number;
  perLoaf: number;
  warnings: string[];
}

export function computeRecipe(r: Recipe): RecipeResult {
  const warnings: string[] = [];
  const flourSum = r.flours.reduce((s, f) => s + f.pct, 0);
  if (Math.abs(flourSum - 100) > 0.01) {
    warnings.push(`Flour shares add up to ${round(flourSum, 1)}%, not 100%.`);
  }

  const flours = r.flours.map((f) => ({ type: f.type, grams: (r.flourWeight * f.pct) / 100 }));
  const water = (r.flourWeight * r.hydrationPct) / 100;
  const salt = (r.flourWeight * r.saltPct) / 100;
  const starter = (r.flourWeight * r.starterPct) / 100;
  const starterFlour = starter / (1 + r.starterHydrationPct / 100);
  const starterWater = starter - starterFlour;

  const totalFlour = r.flourWeight + starterFlour;
  const totalWater = water + starterWater;
  const trueHydrationPct = totalFlour > 0 ? (totalWater / totalFlour) * 100 : 0;
  const prefermentedFlourPct = totalFlour > 0 ? (starterFlour / totalFlour) * 100 : 0;

  // The starter's own flour is assumed to be white for this figure.
  const wholeGrainGrams = flours
    .filter((f) => f.type === 'wholewheat' || f.type === 'rye' || f.type === 'spelt')
    .reduce((s, f) => s + f.grams, 0);
  const wholeGrainPct = totalFlour > 0 ? (wholeGrainGrams / totalFlour) * 100 : 0;

  const totalDough = r.flourWeight + water + salt + starter;
  const perLoaf = r.loaves > 0 ? totalDough / r.loaves : totalDough;

  if (r.saltPct > 0 && (r.saltPct < 1.5 || r.saltPct > 2.5)) {
    warnings.push('Salt is usually between 1.8% and 2.2% of flour.');
  }
  if (r.starterPct > 25) {
    warnings.push('Above 25% starter, bulk gets fast and the window to end it gets narrow.');
  }

  return {
    flours,
    water,
    salt,
    starter,
    starterFlour,
    starterWater,
    totalFlour,
    totalWater,
    trueHydrationPct,
    wholeGrainPct,
    prefermentedFlourPct,
    totalDough,
    perLoaf,
    warnings,
  };
}

export function round(n: number, digits = 0): number {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
}
