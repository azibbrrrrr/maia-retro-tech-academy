# Approved campus redesign

## Global Constraints

- Deliver the user-approved warm Malaysian school cutaway as a playable full-viewport Phaser 3 + React world, with compact floating charcoal HUD.
- Preserve keyboard/touch movement, collision, stationary Ustazah Juliana, and accessible React dialogue/PR board.
- Use only user-authorized Sprinter and Medalist custom pet sheets plus generated original environment artwork. No unrelated repository assets. Sprinter is player; Medalist is the stationary teacher. Preserve visual identity and alpha.
- Keep public demo on 3000 and authenticated separate operator on 3100. No integrations, tunnels, publishing, or private-data changes.
- Conventional lowercase commits authored by Azib, no attribution trailers.
- Browser tests and builds run sequentially. Runtime validation must include viewport fit, route through both rooms, collisions, keyboard/touch controls and desktop/mobile screenshots.

## Task 1: Full-viewport game shell and floating HUD

Read AGENTS.md and this brief. Work only in apps/public-web/src/App.tsx and style.css plus UI-focused browser assertions as appropriate. Preserve gameplay bridge contract and existing dialog content/semantics.

Replace landing-page header/hero/sidebar/footer with a 100dvh/100vw playable scene, no page scroll. Top left compact charcoal translucent title/location badge with gold DEMO indicator. Top right Cikgu heart, PR Board, Directory [M], fullscreen buttons. Cikgu/PR shortcuts should travel to respective room using existing bridge.visit and focus the canvas; Directory opens existing modal. M toggles directory only outside modal/text focus. Fullscreen toggles documentElement and accurately handles unsupported/rejected APIs and state; accessible label Enter fullscreen / Exit fullscreen. Keep usable on mobile with safe-area insets and touch target minimum44px; do not overlap movement or interact controls.

Bottom left compact translucent D-pad, bottom center near-interaction hint/action, bottom right minimap and small keyboard/offline/demo info. Retain [data-explorer] SVG cx/cy telemetry and accessible control labels (Room directory, Move left/right/up/down, Interact, Close panel, Next dialogue). Minimap dimensions currently1536×1056; scene task will replace geometry. Modals warm charcoal/gold/paper styling, responsive and focus-safe; preserve Escape and Next dialogue Enter behavior. Add screen-reader app heading. Remove placeholder-art/Sprint0 language in welcome; use 'Illustrated campus · Demo board · Agent connections offline'. Screenshot reference provided separately in dispatch. Avoid adding deps.

Run typecheck/lint/build and existing browser suite only if port is available; coordinate with controller before browser. Commit UI change only. Write complete report with exact checks and concerns. Do not spawn agents.

## Task 2: Illustrated playable scene and custom sprites

Integrate controller-provided generated clean environment asset. Inspect it before mapping. Actual floor, walls, furniture, tree planters and courtyard structures need authored Tiled collision geometry. Use image dimensions as world dimensions, store reproducible source in scripts/map.ts, export maps/academy.tmx and public/maps/academy.json. Keep all required named layers and stable object IDs. Use objects for precise colliders when grid48px cannot fit artwork. Provide walkable continuous room thresholds and corridor, no invisible fake doors. Navigation and interactions must follow rendered geometry.

Use the user-authorized Sprinter and Medalist spritesheets (read their manifests and inspect originals), copied as public user-supplied custom assets. Sheets1536×1872, 192×208 cells, 8columns9rows; idle6frames row0, right8 row1, left8 row2, wave4 row3. Preserve transparent alpha and identity, no tint. Use Phaser sprite animation for idle/walk; NPC stationary idle. Collider anchored around feet; do not reuse old sprite offsets. Character scale around 75-100 world px tall, adjusted to scene. Optional generated plate foreground crops only if necessary; do not use image processing to alter character identities.

Replace primitive art/decorate map rendering with background plate, authored physics obstacles, moving sprites and necessary in-world interaction labels. Camera should show full scene on common16:9 desktop viewport, with useful mobile zoom/follow and smooth bounds. Update minimap to current world proportions. Update browser route coordinates to geometry, preserving actual collision and full traversability checks; add viewport no-scroll and fullscreen checks, sprite presence/animation verification if observable without test-only product hooks. Keep semantic behavior unchanged. Update map reachability unit tests for geometry.

Document asset provenance honestly: original generated environment, user supplied authorized custom Sprinter/Medalist, not OpenAI built-in assets. Update notices and stale placeholder docs. Run npm run check, npm audit --audit-level=high, gitleaks git --redact, gitleaks dir --redact. Capture desktop, teacher, board and mobile gameplay. Inspect screenshots. Commit logical changes. Write report with exact checks and known limits. Do not spawn agents.
