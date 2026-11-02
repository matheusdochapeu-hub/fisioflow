# Plan 008: Resilient Quick Check-in & Evolution Mutation Handling

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat fd7d31c..HEAD -- atendimentos.html`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: plans/001-verification-baseline.md
- **Category**: bug
- **Planned at**: commit `fd7d31c`, 2026-11-01

## Why this matters

When a physiotherapist completes an appointment, the "Salvar Evolução com Check-in Financeiro" button dispatches two backend mutations: `create` (to record the session fee in `Atendimentos`) and `create_evolution` (to record the clinical notes in `Evolucoes`). Currently, the `create` action is dispatched without `await` and errors are silently swallowed with `console.warn(e)`. The UI shows a green toast `"Evolução e Check-in financeiro registrados!"` even if the attendance write failed on the network. Awaiting both promises and providing graceful error recovery prevents silent data loss during home visits with intermittent connectivity.

## Current state

- **File**: [`atendimentos.html`](../atendimentos.html) — lines 3985–4015:

```javascript
// atendimentos.html:3985-3995
entries.unshift(newEntry);
reconcileSchedulesWithEntries();
renderList();
renderPatientsTab();
renderAgendaTab();
postAction(Object.assign({ action: 'create' }, newEntry)).catch(function(e){ console.warn(e); });
}
showToast('Evolução e Check-in financeiro registrados!', 'ok');
} else {
showToast('Evolução registrada.', 'ok');
}

try{
  await postAction({
    action: 'create_evolution',
    id: id,
    pacienteId: pId,
    // ...
  });
}catch(err){
  console.warn('Evolução mantida localmente (aguardando atualização do Code.gs na planilha):', err);
}
```

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Tests | `node --test test/*.test.js` | all 24+ pass, exit 0 |

## Scope

**In scope**:
- [`atendimentos.html`](../atendimentos.html) — `saveEvolutionModal` function around lines 3970–4020.

**Out of scope**:
- Modifications to `Code.gs` or other tabs.
- Layout changes to the evolution modal form.

## Git workflow

- Branch: `advisor/008-resilient-checkin`
- Commit message: `fix(mutations): await attendance checkin and handle errors during evolution save`

## Steps

### Step 1: Make attendance checkin awaited with proper error handling
In `saveEvolutionModal`, when `alsoCheckin` is true:
1. Wrap the backend calls in a `Promise.all` or sequential `await`:
```javascript
var promises = [
  postAction({
    action: 'create_evolution',
    id: id,
    pacienteId: pId,
    pacienteNome: newEv.pacienteNome,
    data: data,
    hora: hora,
    pa: pa,
    fc: fc,
    estadoClinico: estado,
    condutas: condutas
  })
];

if (alsoCheckin) {
  promises.push(postAction(Object.assign({ action: 'create' }, newEntry)));
}

try {
  await Promise.all(promises);
  showToast(alsoCheckin ? 'Evolução e Check-in sincronizados na planilha!' : 'Evolução sincronizada!', 'ok');
} catch(err) {
  console.error('Erro ao sincronizar na planilha:', err);
  showToast('⚠️ Salvo apenas no aparelho (falha ao gravar na planilha). Verifique a conexão.', 'warn');
}
```
2. Ensure the modal closes properly and local state (`evolutions` and `entries`) remains updated on the screen.

### Step 2: Verify test suite
Run `node --test test/*.test.js`.

## Test plan

- Run existing test suite to ensure helper functions and validation pass.
- Manually trigger an evolution check-in in demo mode or with simulated network offline to verify the warning toast appears instead of silent failure.

## Done criteria

- [ ] `postAction` for `create` attendance is not a dangling fire-and-forget promise.
- [ ] Network failures surface a clear toast to the physiotherapist.
- [ ] `node --test test/*.test.js` passes.
- [ ] Status in `plans/README.md` updated to `DONE`.

## STOP conditions

- If `saveEvolutionModal` syntax errors prevent the modal from closing.
- If existing unit tests fail.
