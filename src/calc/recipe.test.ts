import { describe, expect, it } from 'vitest';
import { computeRecipe, DEFAULT_RECIPE } from './recipe';
import { computeWaterTemp, predictDoughTemp } from './waterTemp';

describe('computeRecipe', () => {
  it('computes gram weights for the default house loaf', () => {
    const r = computeRecipe(DEFAULT_RECIPE);
    expect(r.flours.map((f) => f.grams)).toEqual([640, 80, 80]);
    expect(r.water).toBe(520);
    expect(r.salt).toBe(16);
    expect(r.starter).toBe(160);
    expect(r.starterFlour).toBe(80);
    expect(r.starterWater).toBe(80);
    expect(r.totalFlour).toBe(880);
    expect(r.totalWater).toBe(600);
    expect(r.trueHydrationPct).toBeCloseTo(68.18, 2);
    expect(r.totalDough).toBe(1496);
    expect(r.perLoaf).toBe(748);
    expect(r.warnings).toEqual([]);
  });

  it('handles a stiff starter', () => {
    const r = computeRecipe({ ...DEFAULT_RECIPE, starterHydrationPct: 60 });
    expect(r.starterFlour).toBeCloseTo(100, 6);
    expect(r.starterWater).toBeCloseTo(60, 6);
  });

  it('warns when flour shares do not add up', () => {
    const r = computeRecipe({ ...DEFAULT_RECIPE, flours: [{ type: 'white', pct: 90 }] });
    expect(r.warnings[0]).toMatch(/90%/);
  });
});

describe('computeWaterTemp', () => {
  const base = {
    flourTemp: 20,
    starterTemp: 22,
    mixerRise: 6,
    flourGrams: 800,
    waterGrams: 520,
    starterGrams: 160,
    starterHydrationPct: 100,
  };

  it('round-trips with predictDoughTemp', () => {
    const { waterTemp } = computeWaterTemp({ ...base, targetDoughTemp: 25 });
    expect(predictDoughTemp({ ...base, waterTemp })).toBeCloseTo(25, 6);
  });

  it('needs cooler water when the mixer adds more heat', () => {
    const low = computeWaterTemp({ ...base, targetDoughTemp: 25, mixerRise: 3 }).waterTemp;
    const high = computeWaterTemp({ ...base, targetDoughTemp: 25, mixerRise: 9 }).waterTemp;
    expect(high).toBeLessThan(low);
  });

  it('warns when ice water would be needed', () => {
    const r = computeWaterTemp({ ...base, targetDoughTemp: 22, flourTemp: 26, mixerRise: 12 });
    expect(r.warnings.length).toBe(1);
  });
});
