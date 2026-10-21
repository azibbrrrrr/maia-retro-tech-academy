# Local runbook

Use Node 24 LTS or Node >=22.12. This repository is independent of any commercial
MAIA installation. Commands below run from this repository's root.

```sh
npm ci
npm run build
npm start
```

Open http://127.0.0.1:3000. Use WASD/arrows to move, E to interact, Escape to close.
The on-screen D-pad supports held touches. Room directory jumps to safe room positions. M opens the directory.
The teacher dialogue advances with its button, Enter or Space.

Gold floor-transfer markers connect the entrance to seven independent temporary
navigation rooms. Approach a marker and press E / Interact; use the south return
transfer in each room. The Navigate menu offers free camera / touch pan, player
follow, wheel/buttons/two-finger zoom and opt-in DEMO populations. Follow player
restores the camera. The room map toggle opens the logical campus graph.

Collision diagnostics and Toggle art are geometry-review tools. The room
grayboxes establish walking lanes before new final HD art; they are not the
finished visual direction. See [navigation inventory](navigation/README.md),
[circulation evidence](navigation/route-report.md) and [runtime evidence](navigation/runtime.md).

Regenerate authored geometry and circulation diagrams with:

```sh
npm run map:generate
npm run scenes:generate
npm test
```

`npm run dev` is a loopback-only frontend development server. Its board API is
absent, so the board honestly shows OFFLINE. Use the production run above for the
complete demo. Never tunnel the development server.

## Optional isolated operator

Use a separate terminal. Set a randomly generated local password of at least
24 characters in an ignored file `.env`:

```text
OPERATOR_PASSWORD=<your locally generated password>
```

Do not use the placeholder literally. Then:

```sh
node --env-file=.env --import tsx apps/operator/main.ts
```

Open http://127.0.0.1:3100 and authenticate as `azib` with that local password.
The operator reports OFFLINE because no GitHub collector exists in Sprint 0.
`npm run operator` also works when the variable is already set in the shell.
Never copy this password into the public UI, git history or a tunnel config.

## Verify

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm run audit:bundle
npx playwright install chromium
npm run test:e2e
npm audit --audit-level=high
npm run audit:secrets
```

The last command requires Gitleaks on PATH. Browser tests start the production
public server themselves and require port 3000 to be free. Screenshots are written
under `docs/evidence`; test traces stay ignored under `test-results`.

Install Gitleaks and enable the staged-secret guard for a new clone:

```sh
git config core.hooksPath .githooks
```

The execution checkout already has this guard configured and an ignored local
Gitleaks binary in `.local/bin`. CI scans the full git history independently.

Map source: `maps/academy.tmx`; runtime export: `public/maps/academy.json`.
`npm run map:generate` rebuilds the image-aligned collision objects and named
interaction/spawn layers from `scripts/map.ts`. The 48 px editing grid is retained;
rectangle objects provide precise foot clearance. Do not overwrite hand-edited
Tiled work without review. The scene fills the viewport; a portrait screen follows
the player while a 16:9 desktop shows the campus composition.

## Stop / recover

Ctrl-C stops each listener. A restart resets visitor position. No visitor
registration, tracking, messages or account persistence exists.
If the board request fails, exploration continues and the panel says OFFLINE.
If assets fail, inspect local build logs and rebuild; no private service is needed.

## Public deployment — not performed

Before configuring Cloudflare, finish the release security gates, verify routes
from another network, and choose a real hostname in an authorized account.
Tunnel credentials must live outside the repository. Only the production public
service at 127.0.0.1:3000 may be forwarded. Port 3100 stays local.
Machine sleep or loss of connectivity makes a local-hosted site unavailable.
