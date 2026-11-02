# Plan 010: Network-First App Shell & Update Listener in Service Worker

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat fd7d31c..HEAD -- sw.js atendimentos.html`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: plans/001-verification-baseline.md
- **Category**: perf
- **Planned at**: commit `fd7d31c`, 2026-11-01

## Why this matters

Progressive Web Apps frequently suffer from the "stale client trap": when a maintainer deploys an update (such as bug fixes or new features), users who installed the app or added it to their home screen continue seeing the cached HTML/JS indefinitely until they manually force-refresh or clear site data. Refining the Service Worker strategy to use `network-first` with a fast fallback for HTML pages, combined with a non-intrusive "Nova versão disponível! Clique para atualizar" toast when `reg.waiting` is detected, ensures end users always run the latest version seamlessly.

## Current state

- **File**: [`sw.js`](../sw.js) — lines 55–87:
```javascript
  /* Navegações: network-first com fallback ao app shell em cache (offline). */
  if(req.mode === 'navigate'){
    event.respondWith(
      fetch(req).catch(function(){
        return caches.match('./atendimentos.html').then(function(r){
          return r || caches.match('./index.html');
        });
      })
    );
    return;
  }

  /* Mesmo domínio (app shell / ícones): cache-first. */
  if(url.origin === self.location.origin){
    event.respondWith(
      caches.match(req).then(function(cached){
        return cached || fetch(req).then(function(res){
          var copy = res.clone();
          caches.open(CORE_CACHE).then(function(c){ c.put(req, copy); });
          return res;
        }).catch(function(){ return cached; });
      })
    );
  }
```

- **File**: [`atendimentos.html`](../atendimentos.html) registers `sw.js` on load but does not listen for `updatefound` or `controllerchange` events to notify the user.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Tests | `node --test test/*.test.js` | all 24+ pass, exit 0 |

## Scope

**In scope**:
- [`sw.js`](../sw.js) — refinement of HTML caching strategy.
- [`atendimentos.html`](../atendimentos.html) — Service Worker registration block (listen for `updatefound` / `waiting`).

**Out of scope**:
- Backend Google Apps Script code (`Code.gs`).
- Modifying offline indexedDB document storage.

## Git workflow

- Branch: `advisor/010-sw-update-listener`
- Commit message: `feat(sw): add update detection banner and refine network-first navigation`

## Steps

### Step 1: Harden `sw.js` navigation fetch
Ensure that navigation requests (`req.mode === 'navigate'` or `req.headers.get('accept').includes('text/html')`) always check the network first, update the cache with the fresh response on success, and only fall back to cached HTML if completely offline.

### Step 2: Add update listener in `atendimentos.html`
In the service worker registration code in `atendimentos.html`:
```javascript
navigator.serviceWorker.register('./sw.js').then(function(reg){
  reg.addEventListener('updatefound', function(){
    var newWorker = reg.installing;
    if(!newWorker) return;
    newWorker.addEventListener('statechange', function(){
      if(newWorker.state === 'installed' && navigator.serviceWorker.controller){
        showUpdateBanner();
      }
    });
  });
});
```
Provide a gentle toast with button: `"Uma nova versão do FisioFlow foi instalada. [Atualizar agora]"` that triggers `window.location.reload()`.

### Step 3: Verify test suite
Run: `node --test test/*.test.js`.

## Done criteria

- [ ] HTML document requests are network-first with automatic cache renewal.
- [ ] Service worker update prompt is triggered when a new version is waiting.
- [ ] `node --test test/*.test.js` passes.
- [ ] Status in `plans/README.md` updated to `DONE`.

## STOP conditions

- If service worker caching interferes with Apps Script REST API calls (verified: lines 50–54 explicitly bypass `script.google.com`).
- If existing unit tests fail.
