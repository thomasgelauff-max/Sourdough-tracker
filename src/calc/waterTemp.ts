// Water temperature needed to hit a desired dough temperature (DDT).
//
// Instead of the classic "DDT x 3 minus everything" rule of thumb, this uses
// a heat balance: the dough temperature right after mixing is the
// heat-capacity weighted average of the ingredient temperatures, plus the
// temperature rise caused by the mixer. Solve that for the water temperature.
//
// The mixer rise is the one number that is specific to your mixer, mixing
// time and dough. Measure it once: (dough temp after mixing) minus (what the
// heat balance predicts), or just compare dough temp before and after the
// 15 minutes in the KitchenAid.

const CP_WATER = 4.18; // kJ/(kg·K)
const CP_FLOUR = 1.8; // kJ/(kg·K), flour at ~14% moisture

export interface WaterTempInput {
  targetDoughTemp: number; // °C
  flourTemp: number; // °C, usually kitchen temperature
  starterTemp: number; // °C
  mixerRise: number; // °C added by mixing friction
  flourGrams: number; // added flour
  waterGrams: number;
  starterGrams: number;
  starterHydrationPct: number;
}

export interface WaterTempResult {
  waterTemp: number;
  warnings: string[];
}

export function starterHeatCapacity(starterHydrationPct: number): number {
  const w = starterHydrationPct / 100;
  return (CP_FLOUR + w * CP_WATER) / (1 + w);
}

export function computeWaterTemp(i: WaterTempInput): WaterTempResult {
  const warnings: string[] = [];
  const cS = starterHeatCapacity(i.starterHydrationPct);
  const hFlour = i.flourGrams * CP_FLOUR;
  const hStarter = i.starterGrams * cS;
  const hWater = i.waterGrams * CP_WATER;
  const hTotal = hFlour + hStarter + hWater;

  if (hWater <= 0) {
    return { waterTemp: NaN, warnings: ['No water in the recipe.'] };
  }

  const tBeforeMixing = i.targetDoughTemp - i.mixerRise;
  const waterTemp = (tBeforeMixing * hTotal - hFlour * i.flourTemp - hStarter * i.starterTemp) / hWater;

  if (waterTemp < 2) {
    warnings.push('Needs ice water, or less mixing. Consider chilling the flour.');
  } else if (waterTemp > 40) {
    warnings.push('Water above ~40 °C can stress the starter. Aim for a lower dough temperature or warm the flour.');
  }
  return { waterTemp, warnings };
}

/** Inverse: predicted dough temperature after mixing, for a given water temperature. */
export function predictDoughTemp(i: Omit<WaterTempInput, 'targetDoughTemp'> & { waterTemp: number }): number {
  const cS = starterHeatCapacity(i.starterHydrationPct);
  const hFlour = i.flourGrams * CP_FLOUR;
  const hStarter = i.starterGrams * cS;
  const hWater = i.waterGrams * CP_WATER;
  const hTotal = hFlour + hStarter + hWater;
  return (hFlour * i.flourTemp + hStarter * i.starterTemp + hWater * i.waterTemp) / hTotal + i.mixerRise;
}
