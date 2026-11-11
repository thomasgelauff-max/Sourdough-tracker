import { useState } from 'preact/hooks';
import type { Recipe } from '../calc/recipe';
import { exportJson, parseImport, type AppData } from '../storage/db';

interface Props {
  data: AppData;
  setData: (d: AppData) => void;
  onReset: () => void;
}

export function DataPanel({ data, setData, onReset }: Props) {
  const [msg, setMsg] = useState('');
  const [name, setName] = useState(data.draft.name);

  const saveTemplate = () => {
    const tpl: Recipe = { ...structuredClone(data.draft), name: name.trim() || 'Untitled' };
    const others = data.templates.filter((t) => t.name !== tpl.name);
    setData({ ...data, draft: tpl, templates: [...others, tpl] });
    setMsg(`Saved "${tpl.name}".`);
  };

  const download = () => {
    const blob = new Blob([exportJson(data)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `sourdough-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const upload = async (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    try {
      setData(parseImport(await file.text()));
      setMsg('Backup restored.');
    } catch (err) {
      setMsg((err as Error).message);
    }
  };

  return (
    <>
      <section class="card">
        <h2>Recipes</h2>
        <label class="field">
          <span class="field-label">Save current recipe as</span>
          <input type="text" value={name} onInput={(e) => setName((e.target as HTMLInputElement).value)} />
        </label>
        <button class="primary" onClick={saveTemplate}>
          Save recipe
        </button>
        {data.templates.length > 0 && (
          <ul class="templates">
            {data.templates.map((t) => (
              <li>
                <span>{t.name}</span>
                <span>
                  <button class="link" onClick={() => { setData({ ...data, draft: structuredClone(t) }); setName(t.name); setMsg(`Loaded "${t.name}".`); }}>
                    Load
                  </button>
                  <button class="link" onClick={() => setData({ ...data, templates: data.templates.filter((x) => x !== t) })}>
                    Delete
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section class="card">
        <h2>Backup</h2>
        <p class="note">Data is stored on this device only. Export a backup now and then.</p>
        <div class="row">
          <button onClick={download}>Export</button>
          <label class="button">
            Import
            <input type="file" accept="application/json" hidden onChange={upload} />
          </label>
          <button
            class="danger"
            onClick={() => {
              if (confirm('Reset everything to defaults? Saved recipes are deleted.')) onReset();
            }}
          >
            Reset
          </button>
        </div>
      </section>
      {msg && <p class="toast">{msg}</p>}
    </>
  );
}
