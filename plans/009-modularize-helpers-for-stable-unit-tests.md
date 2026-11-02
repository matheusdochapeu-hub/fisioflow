# Plan 009: Modularize Shared Helpers for Clean Unit Testing

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat fd7d31c..HEAD -- test/helpers.test.js atendimentos.html`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: plans/001-verification-baseline.md
- **Category**: tests
- **Planned at**: commit `fd7d31c`, 2026-11-01

## Why this matters

Currently, `test/helpers.test.js` imports pure functions (`parseValor`, `formatDateBR`, `initials`, `escapeHtml`, `timeStrToMin`, etc.) by reading `atendimentos.html` from disk, applying regular expressions, and constructing runtime closures with `new Function(...)`. This regex extraction is brittle: any harmless whitespace adjustment or inner brace addition in `atendimentos.html` breaks tests with `Function parseValor not found`. Moving pure, stateless calculation helpers into a standalone UMD file (`js/helpers.js`) enables standard Node.js `require()` imports in tests while preserving 100% offline compatibility in the browser via `<script src="js/helpers.js">`.

## Current state

- **File**: [`test/helpers.test.js`](../test/helpers.test.js) — lines 6–23:
```javascript
// Extract pure helper functions directly from atendimentos.html to avoid divergence
const html = fs.readFileSync(path.join(__dirname, '../atendimentos.html'), 'utf-8');

function extractFn(name) {
  const regex = new RegExp(`function ${name}\\([\\s\\S]*?\\n}`);
  const match = html.match(regex);
  if (!match) throw new Error(`Function ${name} not found in atendimentos.html`);
  return new Function(`return (${match[0]})`)();
}
```

- **File**: [`atendimentos.html`](../atendimentos.html) defines all utilities inline within a 9,400-line `<script>` block.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Tests | `node --test test/*.test.js` | all 24+ pass, exit 0 |

## Scope

**In scope**:
- Create `js/helpers.js` with pure stateless utilities.
- Update `atendimentos.html` to load `<script src="js/helpers.js"></script>`.
- Update `test/helpers.test.js` to `require('../js/helpers.js')`.
- Add `'./js/helpers.js'` to `CORE_ASSETS` in `sw.js`.

**Out of scope**:
- Moving stateful DOM manipulation or UI rendering functions. Only pure, deterministic calculations and formatters are in scope.

## Git workflow

- Branch: `advisor/009-modularize-helpers`
- Commit message: `refactor(tests): extract pure helper utilities into js/helpers.js for direct require`

## Steps

### Step 1: Create `js/helpers.js`
Create `js/helpers.js` containing a Universal Module Definition (UMD) wrapping the pure functions:
- `parseValor(val)`
- `formatDateBR(iso)`
- `initials(name)`
- `escapeHtml(str)`
- `getPatientDisplayName(p)`
- `getPatientLegalName(p)`
- `timeStrToMin(tStr)`
- `minToTimeStr(totalMin)`
- `formatDurationFriendly(min)`
- `calcFuelMetrics(km, kmPerLiter, pricePerLiter)`
- `buildGoogleMapsDirUrl(origin, dest, waypoint)`
- `formatDistanceKm(km)`

### Step 2: Include `js/helpers.js` in `atendimentos.html` and `sw.js`
1. In `atendimentos.html`, add `<script src="js/helpers.js"></script>` before the main inline script.
2. In `sw.js`, add `'./js/helpers.js'` to `CORE_ASSETS`.

### Step 3: Refactor `test/helpers.test.js`
Replace lines 6–23 in `test/helpers.test.js` with:
```javascript
const {
  parseValor,
  formatDateBR,
  initials,
  escapeHtml,
  getPatientDisplayName,
  getPatientLegalName,
  timeStrToMin,
  minToTimeStr,
  formatDurationFriendly,
  calcFuelMetrics,
  buildGoogleMapsDirUrl,
  formatDistanceKm
} = require('../js/helpers.js');
```

### Step 4: Run test suite
Execute: `node --test test/*.test.js`. Confirm all tests execute cleanly without regex scraping.

## Done criteria

- [ ] `js/helpers.js` exists and is loadable in Node.js and browser environments.
- [ ] `test/helpers.test.js` contains no regex scraping or `new Function()` invocations.
- [ ] `node --test test/*.test.js` passes with exit code 0.
- [ ] Status in `plans/README.md` updated to `DONE`.

## STOP conditions

- If any helper logic diverges between the standalone file and `atendimentos.html`.
- If browser loading fails or offline Service Worker fails to precache `js/helpers.js`.
