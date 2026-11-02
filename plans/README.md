# Implementation Plans

Generated for [matheusdochapeu-hub/fisioflow](https://github.com/matheusdochapeu-hub/fisioflow).

Execute in the order below unless dependencies say otherwise. Each executor model: read the plan fully before starting, honor its STOP conditions, run verification gates at each step, and update your status row when done.

## Execution order & status

| Plan | Title | Priority | Effort | Depends on | Status |
|---|---|---|---|---|---|
| [001](001-verification-baseline.md) | Establish Node.js Native Test Verification Baseline | P1 | M | — | DONE |
| [002](002-fix-silent-postaction-error-handling.md) | Fix Silent Apps Script Error Handling in `postAction` | P1 | S | 001 | DONE |
| [003](003-codegs-concurrency-locking.md) | Implement Concurrency Locking & Cascade Deletion in `Code.gs` | P1 | S | 001 | DONE |
| [004](004-bulk-import-and-eliminate-n-plus-one.md) | Bulk Import Endpoint in `Code.gs` & Elimination of N+1 Loop | P1 | S | 001, 003 | DONE |
| [005](005-protect-script-url-and-credentials.md) | Remove Hardcoded Script URL & Protect Setup Configuration | P2 | S | 001 | DONE |
| [006](006-secure-idor-email-lookup-codegs.md) | Secure IDOR Email Lookup in `resolveSpreadsheet_` (`Code.gs`) | P1 | S | 001 | TODO |
| [007](007-cleanup-dead-code-codegs.md) | Cleanup Dead Code and Duplicate Handlers in `Code.gs` | P1 | S | 001 | TODO |
| [008](008-resilient-quick-checkin-mutation-handling.md) | Resilient Quick Check-in & Evolution Mutation Handling | P1 | S | 001, 002 | TODO |
| [009](009-modularize-helpers-for-stable-unit-tests.md) | Modularize Shared Helpers for Clean Unit Testing | P2 | S | 001 | TODO |
| [010](010-network-first-service-worker-app-shell.md) | Network-First App Shell & Update Listener in Service Worker | P2 | S | 001 | TODO |

*Status values: `TODO` | `IN PROGRESS` | `DONE` | `BLOCKED` (with one-line reason) | `REJECTED` (with one-line rationale)*

## Dependency notes

- **006 and 007 (Code.gs)**: Can be executed sequentially or together. Both touch `Code.gs` without altering the frontend API contracts.
- **008 (atendimentos.html)**: Builds on the strict error-handling semantics established in 002.
- **009 (test & helpers)**: Refactors pure utilities into `js/helpers.js` to eliminate regex scraping from `test/helpers.test.js`.
- **010 (sw.js & atendimentos.html)**: Hardens app shell delivery and adds update notification toasts.

## Findings considered and rejected

- *Framework Rewrite (React / Vue / Svelte)*: Considered and rejected; the vanilla JS architecture has zero build step, 0 KB bundle overhead, instant load on mobile, and direct static hosting compatibility.
- *Strict TypeScript Migration*: Not worth the build-step complexity and compiler tooling overhead for a single-page HTML client and Google Apps Script connector.
