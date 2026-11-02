# Plan 007: Cleanup Dead Code and Duplicate Handlers in `Code.gs`

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat fd7d31c..HEAD -- Code.gs`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: plans/001-verification-baseline.md
- **Category**: tech-debt
- **Planned at**: commit `fd7d31c`, 2026-11-01

## Why this matters

In `Code.gs`, two actions — `calc_routes_batch` and `test_calendar` — are implemented twice in the `doPost` function. The first implementation sits before `LockService.getScriptLock()` and immediately outputs JSON, while the second implementation sits inside the critical lock section. Because the outer block returns early, the inner block is 100% dead code (~50 lines). Removing these dead branches clarifies the lock boundaries, reduces script size, and prevents maintainers from accidentally modifying the dead code block instead of the live one.

## Current state

- **File**: [`Code.gs`](../Code.gs)
- Outer live handlers (lines 603–656):
```javascript
  /* ---------- Ações de leitura / cálculo externo (executam sem lock de escrita na planilha) ---------- */
  if (body.action === 'calc_routes_batch') {
    // ... Maps API calculation ...
    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  }

  if (body.action === 'test_calendar') {
    // ... Calendar check ...
    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  }
```

- Inner unreachable duplicate handlers (lines 799–812 and 918–952):
```javascript
  // Line 799: Dead duplicate of test_calendar
  } else if (body.action === 'test_calendar') {
    var resolvedTest = resolveUserCalendar_(body.calendarId);
    // ... duplicate code ...

  // Line 918: Dead duplicate of calc_routes_batch
  } else if (body.action === 'calc_routes_batch') {
    var pairs = Array.isArray(body.pairs) ? body.pairs : [];
    // ... duplicate code ...
```

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Tests | `node --test test/*.test.js` | all 24+ pass, exit 0 |

## Scope

**In scope**:
- [`Code.gs`](../Code.gs) — lines 799–812 and lines 918–952

**Out of scope**:
- The outer implementations of `calc_routes_batch` (lines 603–639) and `test_calendar` (lines 641–656) — these are the correct non-blocking implementations and must remain intact.

## Git workflow

- Branch: `advisor/007-cleanup-dead-code`
- Commit message: `refactor(codegs): remove duplicate dead branches for calc_routes_batch and test_calendar`

## Steps

### Step 1: Remove the inner duplicate branch for `test_calendar`
Locate `} else if (body.action === 'test_calendar') {` around line 799 in `Code.gs` and remove the entire `else if` block up to line 812.

### Step 2: Remove the inner duplicate branch for `calc_routes_batch`
Locate `} else if (body.action === 'calc_routes_batch') {` around line 918 in `Code.gs` and remove the entire `else if` block up to line 952.

### Step 3: Verify and run test suite
Ensure that `calc_routes_batch` and `test_calendar` still appear once in `Code.gs` (in the early return section). Run tests:
`node --test test/*.test.js`

## Test plan

- Verify that `postaction.test.js` continues to pass:
  `node --test test/*.test.js`
- Verify that searching for `calc_routes_batch` and `test_calendar` returns exactly 1 occurrence each in `Code.gs`.

## Done criteria

- [ ] Exactly 1 block handles `calc_routes_batch` in `Code.gs` (outside the lock).
- [ ] Exactly 1 block handles `test_calendar` in `Code.gs` (outside the lock).
- [ ] `node --test test/*.test.js` passes with exit code 0.
- [ ] Status in `plans/README.md` updated to `DONE`.

## STOP conditions

- If removing the blocks causes a JavaScript syntax error (mismatched curly braces).
- If the outer blocks at lines 603 and 641 are accidentally modified or deleted.

## Maintenance notes

Keep non-modifying read-only actions (route lookups, calendar queries) outside `LockService` to prevent bottlenecking write operations.
