import { describe, expect, it } from 'vitest';
import { hoursBetween, newBake, nowLocal, risePct, summarize } from './bake';
import { DEFAULT_RECIPE } from './recipe';

describe('bake helpers', () => {
  it('formats local time for datetime-local inputs', () => {
    expect(nowLocal(new Date(2026, 10, 12, 7, 5))).toBe('2026-11-12T07:05');
  });

  it('computes hours between timestamps, across midnight', () => {
    expect(hoursBetween('2026-11-12T21:30', '2026-11-13T09:00')).toBe(11.5);
    expect(hoursBetween(undefined, '2026-11-13T09:00')).toBeUndefined();
  });

  it('computes aliquot rise', () => {
    expect(risePct(50, 75)).toBe(50);
    expect(risePct(undefined, 75)).toBeUndefined();
  });

  it('creates one loaf per loaf in the recipe', () => {
    expect(newBake(DEFAULT_RECIPE, 20).loaves.map((l) => l.label)).toEqual(['A', 'B']);
  });
});

describe('summarize', () => {
  const b = newBake(DEFAULT_RECIPE, 20);
  b.starter = { feedTime: '2026-11-12T08:00', temp: 21 };
  b.mix = { time: '2026-11-12T13:00', kitchenTemp: 20, waterTemp: 18, doughTempAfterMix: 25 };
  b.aliquotStart = 50;
  b.aliquot = [
    { time: '2026-11-12T15:00', level: 60, doughTemp: 25 },
    { time: '2026-11-12T17:30', level: 85, doughTemp: 24 },
    { time: '2026-11-12T19:00', level: 95 }, // after bulk end, must be ignored
  ];
  b.bulkEnd = { time: '2026-11-12T17:30', doughTemp: 24 };
  b.loaves[0] = { ...b.loaves[0], fridgeIn: '2026-11-12T18:00', fridgeOut: '2026-11-13T09:00', bakeTime: '2026-11-13T09:30' };
  b.loaves[1] = { ...b.loaves[1], fridgeIn: '2026-11-12T18:00', fridgeOut: '2026-11-14T09:00' };
  const s = summarize(b);

  it('derives bulk duration and starter age', () => {
    expect(s.bulkHours).toBe(4.5);
    expect(s.starterAgeAtMix).toBe(5);
  });

  it('uses the last reading up to end of bulk', () => {
    expect(s.bulkEndRisePct).toBe(70);
  });

  it('averages dough temperatures logged during bulk', () => {
    expect(s.avgBulkDoughTemp).toBeCloseTo((25 + 25 + 24 + 24) / 4, 6);
  });

  it('derives per-loaf fridge hours', () => {
    expect(s.loaves.map((l) => l.fridgeHours)).toEqual([15, 39]);
    expect(s.loaves[0].mixToBakeHours).toBe(20.5);
  });

  it('measures mixer heat from the observed dough temperature', () => {
    // Ingredients alone give about 19.1 °C, so the mixer added about 5.9 °C.
    expect(s.measuredMixerHeat).toBeGreaterThan(5);
    expect(s.measuredMixerHeat).toBeLessThan(7);
  });
});
