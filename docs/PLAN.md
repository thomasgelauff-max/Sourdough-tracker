# Sourdough Tracker: App Plan

Status: Phases 0, 1 and 2 built. Next: Phase 3 (planner).

## Goal

A small, phone-friendly app that:

1. Turns a recipe in baker's percentages into gram weights.
2. Plans bulk fermentation for **two loaves from one bulk**, each with its own bake time, so the long-hold loaf does not overproof in the fridge.
3. Logs every bake so the planner gets calibrated to this specific starter, flour, kitchen and fridge.

Fixed facts so far: always two loaves from one bulk, fridge at a stable ~4 °C, dough and oven temperature measured with a probe, bulk on the kitchen counter. Units are grams and °C only.

House recipe (preloaded default):
- 800 g flour in the bowl: 80% white, 20% a mix of whole wheat and rye depending on what is at hand (default 10/10).
- Starter 15–25% (default 20%), at 100% hydration.
- Hydration 60–70% (default 65%), salt 2%.
- 15 minutes in a KitchenAid with the spiral hook, then stretch-and-folds or coil folds depending on the dough.

Two things this recipe implies for the planner:
- 15 minutes of machine mixing heats the dough noticeably. The water temperature helper includes a "mixer heat" term to account for it, which should be measured once and then calibrated from the log.
- 20% starter is on the high side. It makes bulk fast and the window to end it narrow. The log will show whether dropping to ~10% gives more control, especially for the loaf that stays in the fridge longest.

## Core idea behind the planner

Fermentation slows in the fridge but does not stop. With one shared bulk, the bulk end point should suit the loaf with the **longest** fridge hold. The loaf that bakes sooner then gets extra proofing at room temperature (before it goes in the fridge, or after it comes out) to catch up. That is much easier to fix than an overproofed loaf.

"Is bulk done?" is answered with an **aliquot jar**: a small sample of dough in a straight-sided jar, marked at the start. The app works with a target **rise %**, which depends on dough temperature and the planned fridge time. Clock time is only an estimate of when that rise will be reached.

## Measuring starter activity without chasing the peak

The peak is hard to pin down because the very active phase is a long plateau. Instead, log two things that are easy to observe:

- **Time to double**: feed, put a rubber band at the level, note the time when it has doubled. Note the starter temperature and feed ratio (e.g. 1:2:2).
- **Hours since feeding at use**: when you take starter for the dough.

Time to double at a known temperature is a good, repeatable proxy for strength. It is optional input: the app works without it and uses a default.

## Phases

Each phase ends with something usable in the kitchen.

### Phase 0: Setup
- Static web app: Vite + TypeScript, Preact for the UI (small and simple).
- Data stored locally in the browser (IndexedDB), with JSON export/import as a backup.
- Installable on the phone as a PWA, works offline.
- Hosted for free on GitHub Pages.
- Unit tests (Vitest) for all calculation logic.

### Phase 1: Recipe calculator
- Flour blend: white, whole wheat, rye, spelt, other. Enter as % of total flour.
- Hydration %, salt %, starter (inoculation) % of flour, starter hydration %.
- True totals: includes the flour and water inside the starter.
- Number of loaves and target dough weight per loaf → gram weights per ingredient.
- Save recipes as templates.
- Desired dough temperature helper: suggests water temperature from a heat balance of flour, starter and water temperatures plus mixer heat.
- Decimal commas accepted (Dutch keyboards).

### Phase 2: Bake log (the notepad)
One entry per bake, with a timeline you fill in as you go:
- Recipe snapshot (copied from Phase 1, so later edits do not change history).
- Starter: feed ratio, time to double (optional), hours since feeding at use.
- Mix time and dough temperature at mix; kitchen temperature.
- Aliquot jar readings (time, rise %) during bulk, optional.
- End of bulk: time, dough temperature, rise %.
- Per loaf: shaping time, fridge in, fridge out, bake time, internal temperature at end of bake.
- Folds: type (stretch-and-fold or coil) and times.
- Outcome per loaf: shape/spread rating (1–5), oven spring rating, crumb notes, free text.
- List view and simple per-bake summary (total bulk time, fridge hours per loaf).

### Phase 3: Planner v1 (rule-based)
Inputs: recipe, mix time (or desired bake times to work backwards), expected dough temperature, starter strength, fridge temperature, planned bake time for loaf A and loaf B.

Outputs:
- **Target aliquot rise %** to end bulk, based on dough temperature (from the Sourdough Framework's guidance, values kept editable) and adjusted down for long fridge holds.
- **Estimated time** to reach that rise, using a temperature-dependent rate, with faster rates for higher whole grain and rye shares and higher inoculation.
- **Timeline per loaf**: shape, fridge in, fridge out, any room-temperature proof, bake.
- **Warnings**: e.g. "Loaf B holds 48 h at 4 °C: end bulk earlier or shape B tighter" or "Loaf A will be underproofed: give it ~1 h on the counter before baking".
- Live mode during bulk: enter an aliquot reading and the estimate updates.

The model is deliberately simple and labelled as an estimate. All constants are visible and editable.

### Phase 4: Calibration from the log
- Compare predicted vs actual bulk time and rise for logged bakes.
- Fit one or two personal correction factors (e.g. "your dough ferments 1.2× faster than the default") from recent bakes.
- Link outcome ratings to fridge hours and bulk rise %, to show where your loaves start losing shape.

### Phase 5: Later, if wanted
- Photos per loaf.
- Charts of temperatures and rise across a bake.
- Reminders/notifications for the next step.
- Sync between devices.

## Open points
- None right now.
