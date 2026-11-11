// Local, on-device storage (IndexedDB via idb-keyval).
// Everything lives in the browser on this device. Use export/import for backups.
import { get, set } from 'idb-keyval';
import { DEFAULT_RECIPE, type Recipe } from '../calc/recipe';
import type { Bake } from '../calc/bake';

export interface TempSettings {
  kitchenTemp: number;
  starterTemp: number;
  targetDoughTemp: number;
  mixerRise: number;
}

export const DEFAULT_TEMPS: TempSettings = {
  kitchenTemp: 20,
  starterTemp: 21,
  targetDoughTemp: 25,
  mixerRise: 6,
};

export interface AppData {
  version: 1;
  draft: Recipe;
  temps: TempSettings;
  templates: Recipe[];
  bakes: Bake[];
  fridgeTemp: number;
}

const KEY = 'sourdough-tracker:v1';

export function defaultData(): AppData {
  return { version: 1, draft: structuredClone(DEFAULT_RECIPE), temps: { ...DEFAULT_TEMPS }, templates: [], bakes: [], fridgeTemp: 4 };
}

export async function loadData(): Promise<AppData> {
  try {
    const d = await get<AppData>(KEY);
    return d && d.version === 1 ? { ...defaultData(), ...d } : defaultData();
  } catch {
    return defaultData();
  }
}

export async function saveData(d: AppData): Promise<void> {
  try {
    await set(KEY, d);
  } catch {
    // Storage can be unavailable (private mode). The app still works, it just won't remember.
  }
}

export function exportJson(d: AppData): string {
  return JSON.stringify(d, null, 2);
}

export function parseImport(text: string): AppData {
  const d = JSON.parse(text);
  if (!d || d.version !== 1 || !d.draft || !Array.isArray(d.templates)) {
    throw new Error('This file is not a Sourdough Tracker backup.');
  }
  return { ...defaultData(), ...d };
}
