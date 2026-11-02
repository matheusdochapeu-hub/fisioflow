# Plan 006: Secure IDOR Email Lookup in `resolveSpreadsheet_` (`Code.gs`)

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
- **Category**: security
- **Planned at**: commit `fd7d31c`, 2026-11-01

## Why this matters

In the multi-tenant architecture, each physiotherapist has an isolated Google Sheet indexed in `_Usuarios`. Currently, `resolveSpreadsheet_` accepts a plain Gmail address as `usuarioId` and searches rows where `rowEmail === email.toLowerCase()`. Consequently, any third party who knows a physiotherapist's email can send `GET ?usuarioId=dr.silva@gmail.com` and retrieve all patient records, medical evolutions, and financial data without needing the secret opaque token (`usr_...`). Restricting email-based lookup exclusively to the `register_user` onboarding action closes this Broken Object Level Authorization (IDOR) vector.

## Current state

- **File**: [`Code.gs`](../Code.gs) — lines 61–100 (`resolveSpreadsheet_`) and lines 566–570 (`doGet`):

```javascript
// Code.gs:70-74
var normalizedId = String(usuarioId).trim().toLowerCase();
var email = String((meta && (meta.email || meta.calendarId)) || (normalizedId.indexOf('@') > -1 ? normalizedId : '')).trim();
var nome = String((meta && (meta.nome || meta.providerName)) || '').trim();
var doc = String((meta && (meta.documento || meta.providerDoc)) || '').trim();

// Code.gs:89-97
for (var i = 1; i < data.length; i++) {
  var rowUid = String(data[i][0]).trim().toLowerCase();
  var rowEmail = String(data[i][1]).trim().toLowerCase();
  if ((rowUid && rowUid === normalizedId) || (email && rowEmail && rowEmail === email.toLowerCase())) {
    foundRowIdx = i + 1;
    foundSheetId = String(data[i][4]).trim();
    break;
  }
}
```

And in `doGet`:
```javascript
// Code.gs:567-568
var usuarioId = (e && e.parameter && (e.parameter.usuarioId || e.parameter.email)) || '';
var targetSs = resolveSpreadsheet_(usuarioId, (e && e.parameter) || {});
```

Notice that `e.parameter.email` is accepted as a query fallback, allowing email-based lookups.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Tests | `node --test test/*.test.js` | all 24+ pass, exit 0 |
| Syntax Check | `node -c Code.gs` | exit 0 (or lint check) |

## Scope

**In scope**:
- [`Code.gs`](../Code.gs) — `resolveSpreadsheet_` and `doGet`

**Out of scope**:
- Any modification to frontend encryption or token generation logic in `atendimentos.html`.
- Any schema changes to `_Usuarios` headers.

## Git workflow

- Branch: `advisor/006-secure-idor-lookup`
- Commit message: `fix(security): restrict spreadsheet resolution to opaque usuarioId token`

## Steps

### Step 1: Restrict `resolveSpreadsheet_` lookup logic

In `Code.gs`, distinguish between registration requests (`meta && meta.action === 'register_user'`) and normal API data requests:
1. For data reads (`doGet`) and data mutations (`doPost` actions other than `register_user`), **only** match against `rowUid === normalizedId`.
2. Do not treat an email as a valid `normalizedId` unless it matches a user whose registered `usuarioId` happens to be that exact string.
3. In `doGet`, remove `|| e.parameter.email` so that callers must supply the secret `usuarioId` token.
4. When `meta && meta.action === 'register_user'`, keep the fallback check on `rowEmail === email.toLowerCase()` so returning users recover their existing spreadsheet rather than duplicating sheets.

**Verify**:
Run `node --test test/*.test.js` to ensure script syntax and postaction validations remain intact.

## Test plan

- Add a unit test in `test/postaction.test.js` or `test/security.test.js` verifying that a mock `resolveSpreadsheet` function rejects email-based lookup when `action !== 'register_user'`.
- Verify all existing unit tests pass: `node --test test/*.test.js`.

## Done criteria

- [ ] `doGet` in `Code.gs` only reads `e.parameter.usuarioId` (no `email` query fallback for data access).
- [ ] `resolveSpreadsheet_` only allows email lookup when `meta && meta.action === 'register_user'`.
- [ ] `node --test test/*.test.js` passes with exit code 0.
- [ ] Status in `plans/README.md` updated to `DONE`.

## STOP conditions

- If `atendimentos.html` is found to rely on passing `email` instead of `usuarioId` in `doGet` (it already uses `getActiveUsuarioId()`), verify frontend callers before altering the backend.
- If existing unit tests fail.

## Maintenance notes

The `usuarioId` generated on client onboarding (`usr_<timestamp>_<random>`) serves as a bearer capability token. In future enterprise tiers, this can be upgraded to signed JWT tokens or Google OAuth ID tokens.
