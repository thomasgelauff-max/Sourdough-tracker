import { useEffect, useRef, useState } from 'preact/hooks';
import { defaultData, loadData, saveData, type AppData } from '../storage/db';
import { Calculator } from './Calculator';
import { DataPanel } from './DataPanel';
import { Log } from './Log';

type Tab = 'calc' | 'log' | 'plan' | 'data';

const TABS: { id: Tab; label: string }[] = [
  { id: 'calc', label: 'Recipe' },
  { id: 'log', label: 'Log' },
  { id: 'plan', label: 'Planner' },
  { id: 'data', label: 'Data' },
];

export function App() {
  const [data, setData] = useState<AppData | null>(null);
  const [tab, setTab] = useState<Tab>('calc');
  const saveTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    loadData().then(setData);
  }, []);

  // Debounced autosave.
  useEffect(() => {
    if (!data) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => saveData(data), 300);
  }, [data]);

  if (!data) return <main class="loading">Loading…</main>;

  return (
    <>
      <header class="top">
        <h1>Sourdough Tracker</h1>
        <nav class="tabs">
          {TABS.map((t) => (
            <button class={tab === t.id ? 'tab active' : 'tab'} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </nav>
      </header>
      <main>
        {tab === 'calc' && <Calculator data={data} setData={setData} />}
        {tab === 'log' && <Log data={data} setData={setData} />}
        {tab === 'plan' && <ComingSoon what="The fermentation planner" phase={3} />}
        {tab === 'data' && <DataPanel data={data} setData={setData} onReset={() => setData(defaultData())} />}
      </main>
    </>
  );
}

function ComingSoon({ what, phase }: { what: string; phase: number }) {
  return (
    <section class="card">
      <p>
        {what} arrives in phase {phase}. See <code>docs/PLAN.md</code>.
      </p>
    </section>
  );
}
