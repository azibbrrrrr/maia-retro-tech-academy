# Sprint 0 execution ledger

Scope: ST-001 provenance/public foundation; ST-002 playable technical slice;
ST-003 physical service isolation. Later sprints remain separate acceptance work.

- ST-001 foundation: `c1b4f46`; public personal owner verified; bootstrap CI green.
- Preflight: public browser consumes only demo DTOs, never operator objects.
  Both listeners bind loopback; private routes exist in a separate module/process.
- Decision: use new sibling repository (current MAIA folder is empty), clean
  history and feature branch. No production checkout or shared worktree is involved.
- Decision: retain Phaser 3.90.0 although current official template uses Phaser 4,
  because the handoff explicitly specifies Phaser 3. Migration cost deferred.
- Decision: use Ustazah Juliana as the fictional display name requested directly
  by the owner; retain Cikgu as the classroom label. No identifying biography.
- Dependency resolution: TypeScript 7 exceeds the linter's supported peer range;
  pin supported TypeScript 5.9.3 instead of bypassing peer checks.
- Final art, real GitHub collection, live events and tunneling remain behind
  Sprint 0's exit gate. Current images are original procedural placeholders.

## Final local evidence — 2026-10-20

| Command / check | Observed result |
| --- | --- |
| `npm run typecheck` | Exit 0 |
| `npm run lint` | Exit 0 |
| `npm test` | 5 passed, 0 failed |
| `npm run build` | Exit 0; Phaser chunk warning retained |
| `npm run audit:bundle` | 8 distribution files scanned; no private markers or source maps |
| `npm run test:e2e` | 6 passed, 0 failed; final local run 41.4 seconds |
| `npm audit --audit-level=high` | 0 vulnerabilities |
| `gitleaks git --redact` | No leaks |
| `gitleaks dir --redact` | No leaks, including built public distribution |
| Actual operator listener on 127.0.0.1:3100 | Unauthenticated 401; authenticated OFFLINE 200; public Origin 403; foreign Host 403 |

`npm run check` runs the typecheck, lint, Node tests, production build, bundle
scan and browser suite together. Browser tests use the production server, not
Vite. Desktop viewport is 1280 × 720; touch viewport is 390 × 844 with browser
touch events. These are emulated browser checks, not physical device claims.

Screenshots: [courtyard](evidence/campus-desktop.png),
[whiteboard](evidence/whiteboard-desktop.png),
[teacher](evidence/teacher-desktop.png), [mobile](evidence/campus-mobile.png).

## Corrections verified during implementation

- Initial service tests failed against empty route tables, then passed after
  actual demo routes, auth and origin isolation were implemented.
- Browser spike initially failed for absent canvas; real scene resolved it.
- Directory reopening could discard an early movement key, and short E presses
  could disappear between frames. Focus-scoped native key events resolved both.
- Enter originally activated the dialog's Close button. Focus now moves to
  Next dialogue after the native modal opens; regression passes.
- Rate-limit plugin registration originally missed synchronous routes.
  Awaited registration and an explicit request hook now return 429 on request
  181. Authentication attempts share the operator's bounded request hook.
- The full walking-route test now corrects its position after short movement
  segments rather than assuming host scheduling cannot overshoot a doorway.
- The initial static-file dependency audit found an advisory; updated to
  patched `@fastify/static` 10.1.6. The final audit has no vulnerabilities.

## Independent review

One independent read-only review found no critical security defect. Two important
verification findings were fixed: the bundle scan is now required by CI and
`npm run check`; every browser navigation waits for the loaded scene before
interacting. The final full local suite passed after these changes.

Minor deferred: the stationary teacher's collider is approximately 14 px lower
than the intended foot anchor. Align it during the character-art milestone; the
current body still prevents overlap but the approach clearance is slightly
larger below the sprite.

## Acceptance and remaining work

- ST-001: personal public repository, provenance audit, independent history,
  secret guard, CI and safe documents.
- ST-002: actual keyboard/touch explorer, Tiled collision, camera, continuous
  classroom route, stationary teacher and React demo board.
- ST-003: physically separate loopback listeners, operator auth, negative
  route/origin tests and browser-bundle boundary.

Next ticket: ST-004 campus expansion, followed by ST-005/006 interaction and
character polish. Final art/animation, real GitHub review queries, public
allowlist projection, optional live events and Cloudflare deployment remain
unimplemented. No external HTTPS acceptance or tunnel security gate has passed.
Safari, physical mobile performance, 60 fps targets, memory endurance and load
behavior are unverified. The Phaser vendor chunk is 1.20 MB minified / 319 kB gzip;
the build emits its normal >500 kB warning. No claim of final release readiness.
