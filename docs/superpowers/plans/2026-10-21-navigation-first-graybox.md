# Navigation-first connected campus implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement task-by-task. Steps use checkbox syntax.

**Goal:** Deliver the first measurable, playable navigation milestone (ST-NAV-01/02/03) before commissioning any new final scene artwork.

**Architecture:** Preserve the existing entrance plate and Phaser 3/React public app. Author seven separate low-detail room grayboxes, a typed catalog with bidirectional portals and foot-based anchors, exported as Tiled JSON/TMX. Use collision-derived route planning for validation and mock occupancy; runtime movement continues through real Arcade collision. Keep world state across room switches, with an authored logical minimap and explicit camera controls.

**Tech Stack:** Existing Phaser 3.90, React 19, TypeScript, Tiled object maps, node:test, Playwright. No new dependencies required.

**Spec:** docs/plans/2026-10-20-multi-zone-living-campus-handoff.md, especially Section 11; owner explicitly requested execution from that direction on 2026-10-21. This plan scopes its first delivery gate; Command Mode, telemetry, live GitHub, HD plates, social life and public launch remain subsequent milestones.

## Global Constraints

- Keep the approved entrance `campus.png`, Sprinter visitor and one stationary scripted Ustazah Juliana identity. Migrate legacy `gate`/`council`/`teacher` aliases explicitly with tests.
- Stable scene IDs: entrance, high_council, engineering_lab, library, watchtower, qa_lab, kantin, cikgu_room.
- Public loopback 3000 read-only DEMO; separate authenticated operator loopback 3100. No private metrics, connectors or session access in public.
- 48px logical reference, exact world bounds independent of tile multiples and image resolution; foot collider dimensions tested against geometry.
- Design clearances: primary192–240, secondary144, small doors>=96, lab door144, aisles96–144 world units. Record measurements and any entrance legacy exception rather than silently inventing clearance.
- At least16 engineering workstation approach anchors, with20 explicitly mocked workers tracked stably across scenes and overflow. Render capacity never caps work capacity. Mock occupancy must not permanently block routes.
- No final new HD artwork until static reachability, real Phaser traversal, touch and interaction gate passes. Grayboxes must be labeled temporary navigation studies.
- Preserve previous tests' movement, collision, dialogue, accessibility, reduced motion, XSS and isolation assertions; update coordinates only for deliberate scene migration.
- All task states DEMO/OFFLINE/AMBIENT only; no simulated activity presented as observed work.
- Owner steering: use chat bubbles, not modal popups, for Juliana and in-world conversations. Speech bubbles follow the speaker/anchor, allow movement, support E/Next/close/Escape and accessible text, and dismiss on separation/scene transition.
- Conventional commits by Azib, lowercase imperative subject <=72 characters, no co-author trailers.

## Review Focus

1. Portal retrigger after landing: require deterministic return spawn outside trigger and no ping-pong.
2. Route planner disagrees with Phaser foot bodies: identical clearance model; real keyboard/touch traversal in each room.
3. Scene changes leak listeners/textures/actors or duplicate teacher: one identity, cleanup, revisits tested.
4. Mobile/free camera hides controls or strands player: follow restore and zoom bounds at1440x900,1280x720,390x844,844x390,320x568.
5. Crowded desks block approach or quota actual tasks: seeded20-actor occupancy test, stable IDs, overflow independent of state.

## Task 1: Author scene geometry and prove static circulation

**Files:** packages/world/scenes.ts (typed catalog), packages/world/navigation.ts (clearance/route graph), packages/world/actors.ts (DEMO occupancy registry), scripts/scenes.ts (Tiled exporters), maps/scenes/_.tmx, public/maps/scenes/_.json, tests/navigation.test.ts, docs/navigation/* (circulation diagram, route report, inventory).

**Interfaces:** Consume entrance public/maps/academy.json as existing collision source. Produce typed SceneId, SceneDefinition, Portal, Anchor, sceneCatalog, resolvePlace(alias), findRoute(scene,start,goal), validateCampus() and deterministic DEMO actor reservation APIs. Write concrete types and export names to the report before Task2. SceneDefinition includes bounds, background optional, solids, portal rectangles with targetScene/targetSpawn/return link, spawns, named interactions/approaches/seats, reserved lanes and map position. Runtime/exporter/tests share geometry; Tiled export roundtrip must match.

- [x] Write and watch failing tests for8scenes, bidirectional graph, every spawn/anchor foot-clear/reachable, wall/desk denial,16labstations,20stable mocked workers/overflow and congestion detours/clear waits.
- [x] Implement circulation before furniture. Seven distinct rooms have suitable station/seat/screen/counter anchors. Entrance portals must sit on real clear floor with visible runtime doorway markers; no invisible portals through painted walls.
- [x] Produce readable circulation diagrams and exact clearance/route report from validation. Export Tiled source +JSON with named collision/portals/spawns/approaches.
- [x] Verify npm test, npm run typecheck, exporter reproducibility and git diff --check. Commit `feat(navigation): define connected graybox campus geometry`.

## Task 2: Integrate playable scene switching, camera and navigation HUD

**Files:** packages/game/Campus.ts, packages/game/bridge.ts, packages/world/content.ts, new game modules as appropriate, apps/public-web/src/App.tsx/style.css, tests/e2e/navigation.spec.ts and existing gameplay tests where migration requires; docs/navigation/* evidence.

**Interfaces:** Consume Task1 catalog/navigation/actors. WorldState reports sceneId, position, camera mode, selected mock actor, current nearby interaction and debug state. Bridge supports visit(scene/legacy alias), interact, camera follow/free/follow-agent, zoom, pan, debug toggle; no network work controls. Migrate dialogue to speech bubbles while preserving the structured DEMO PR board contract; generic anchor bubbles identify rooms/stations as navigation fixtures.

- [x] Write and watch failing browser assertions for real portal switching/return and interaction reach; update legacy alias expectations explicitly when canonical rooms move.
- [x] Render entrance unchanged; draw7actual low-detail room grayboxes from authoritative shapes with labeled portals, obstacles, reserved circulation and anchors. No final art generation. Only Cikgu room contains the teacher sprite/NPC; do not leave a duplicate in entrance.
- [x] Implement clear portal markers activated via proximity E/touch interaction; transitions have fade, zero held input, safe deterministic spawn, retained player identity/state and no document navigation. Directory visits use same canonical destination/spawn and retain aliases.
- [x] Implement follow player/free-pan/follow selected DEMO actor, wheel/pinch zoom and touch pan toggle. Keep navigation controls reachable via compact menu on small screens. Logical whole-campus + room minimap shows actual connections, visitor position and selected DEMO actor location/status, never a thumbnail substitute.
- [x] Add art/collision/route/anchor debug overlays and clearly opt-in20actor DEMO congestion view. Track actors across unloaded rooms without loading room textures. Preserve unknown/offline labels.
- [x] Browser route runner uses ordinary input through real physics, no teleports/body resets/test-only game APIs. Static planner can supply waypoints, but each segment observes rendered reported position and stuck detection. Traverse gate→everyroom→gate, all16desks and required interactions. Genuine touch crossing in/out all7rooms; five viewport checks, paused/focus/revisit/zoom/freepan tests. Keep negative security and sprite/reducedmotion coverage.
- [x] Use anchored, non-blocking speech bubbles for teacher/fixture/welcome conversations. Test movement during conversation, scripted progression, proximity dismissal, anchoring after camera changes and narrow-screen bounds; structured boards/directory remain separately accessible views.
- [x] Run npm run check, dependency/secret/bundle scans. Capture desktop/mobile graybox, logicalmap, overlay, teacher,16station and congestion evidence. Document exact successes and unverified physical device/Safari/HD-art status. Commit `feat(campus): add playable connected navigation grayboxes`.

## Acceptance and next gate

Task2 is complete only with independently reviewed static and real physics evidence. Do not claim HD rooms, live integrations, production readiness or public deployment. Report this navigation milestone and any gate failures; final HD production starts as a subsequent explicit milestone from the locked geometry and reviewed overlays.
