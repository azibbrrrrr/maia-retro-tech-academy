# MAIA Retro-Tech Academy — Multi-Zone Living Campus & Developer Operations Handoff
**Design revision:** 2026-10-20 · **Status:** approved direction / NOT yet implemented  
**Applies to:** PR #1 (`feat/sprint-0-playable-campus`) and subsequent execution milestones  
**Product weighting:** developer utility first (~80%); entertainment/ambient life second (~20%)  
**Personal public project:** `azibbrrrrr/maia-retro-tech-academy`; NOT part of MAIA v1.0.1's commercial baseline.

> This document is an **execution contract for future work**, not evidence that features below exist. It extends the v2 developer-command-center handoff and supersedes its earlier assumption that the campus requires fully tiled, movable artwork. **The owner confirmed that pre-rendered scene backgrounds are intentional and must be preserved.** The next delivery gate is **navigation-first grayboxing with verified walkable paths** before any new HD environment art is accepted; merely upscaling a concept image does not satisfy gameplay requirements.

## 0. Verified PR #1 baseline: preserve the working foundation
Inspected on 2026-10-20:
- PR #1 currently adds an illustrated original `public/assets/campus.png`, a Phaser `Campus` scene, authored Tiled collision objects in `maps/academy.tmx`/`public/maps/academy.json`, a React HUD, a stationary **Ustazah Juliana / Cikgu** using the authorized Medalist sprite, and a visitor-controlled Sprinter sprite.
- The playable scene is ~1672×941. It has the front entrance/courtyard, High Council classroom, and Bilik Cikgu. The current whiteboard is **DEMO**; agent connections are **OFFLINE**.
- Existing public localhost listener `127.0.0.1:3000` and separate authenticated operator listener `127.0.0.1:3100` are deliberate security boundaries. No live GitHub collector, Claude/Codex telemetry, Cloudflare deployment, or expanded campus exists yet.
- Existing tests/verification are recorded in `docs/REDESIGN.md`; do not present this new design as tested implementation.
- Relevant code/docs: `packages/game/Campus.ts`, `packages/game/bridge.ts`, `packages/world/content.ts`, `apps/public-web/src/App.tsx`, `packages/contracts/board.ts`, `docs/ARCHITECTURE.md`, `docs/SECURITY.md`, `docs/ASSET_LICENSES.md`.
- Preserve licenses and provenance. Do not commit employer data, company secrets, private code, raw prompts, tokens, private repository titles, customer names, or unreleased client operational details.

**Non-goal:** Rebuild the current accepted scene with procedural runtime tiles simply to make props movable. This is a pre-rendered-background RPG; physics and interactions remain separately authored.

## 1. Core product outcome: one operational state, two interfaces
**Command Mode** is the primary daily-use interface: urgent approvals, failed/stale/disconnected agents, running sessions, parent/child delegation tree, authored/open PRs, review requests, failing CI, and since-you-were-away results. It must work without entering World Mode.

**World Mode** is a zoomable, walkable campus that renders the *same* verified agent state as believable working characters and adds NPC/social scenes. Users may move their visitor player or detach the camera and freely pan; click an agent to inspect/follow it. No important action requires walking to a board.

**Definition of actual usefulness:** From the landing/command dashboard the operator can identify what needs their intervention within 30 seconds and navigate to a relevant local session or GitHub PR in <=2 interactions. These are design acceptance targets, not measured claims.

## 2. Campus composition — make the screenshot an entrance, not the whole map
Do **not** squeeze additional desks or the kantin into the existing 1672×941 plate. Retain the existing composition as **Dataran Akademi / Entrance scene**. Add independently illustrated, pre-rendered **connected scene plates** with door/portal triggers and a campus map.

| Scene | Purpose | Planned on-screen capacity | Required interactables |
| --- | --- | --- | --- |
| Dataran Akademi | Arrival, signage, visitor navigation, campus identity | visitors + transient characters | welcome board, directory, room portals |
| Dewan High Council | Planning/advisor supervision, delegation, PR reviews | 3–4 advisor stations | real/private PR board UI, delegation board, attention surface |
| Makmal Kejuruteraan | Main Claude/Codex execution workspace; **biggest indoor scene** | **12–16 workstations** | agent stations, live task board, collaboration table, status inspection |
| Perpustakaan / Research | Research/read/code search/docs activity | 4–6 research positions | research board, shelves, reading tables |
| Watchtower NOC | Operational health, queue/incident overview (optional safe source) | 3–4 monitoring positions | event timeline, alert board |
| QA / Testing Lab | Tests, CI, debugging and review | 4–6 testing positions | CI board, terminal props |
| Kantin Akademi | Off-duty idle life / coffee / meals / chit-chat | 8–12 social seats | service counter, tables, scripted conversations |
| Bilik Cikgu ♡ | Personal static primary-school teacher NPC | 1 permanent NPC | Ustazah Juliana dialogue, heart/emote |
| Optional later: Reconciliation Vault | Financial/stock reconciliation once trustworthy permitted data exists | 3–4 positions | approved discrepancy summaries only |

These are **render-placement targets**, not provider execution quotas. A 12-station room must not cap a 20-worker backend; distribute work across rooms and provide aggregated overflow indicators. Agents outside the camera viewport continue to be tracked.

### 2.1 World navigation and spatial semantics
- Start at entrance. Visitors can walk to physically marked doorways or use an accessible directory shortcut; both lead to the same destination scene/spawn.
- Plan stable scene IDs and independent Tiled scene metadata (e.g. `entrance`, `high_council`, `engineering_lab`, `library`, `watchtower`, `qa_lab`, `kantin`, `cikgu_room`). Keep existing `gate`/`council`/`teacher` aliases or migrate them explicitly with tests.
- Every pre-rendered room plate has a named background asset, matching map dimensions, collision rectangles/polygons, spawn points, interactable anchors, foreground occlusion regions when needed, and camera bounds.
- Door entries have a reachable walkable threshold and a deterministic destination spawn facing clear floor. Avoid teleporting via unmarked decorative doors. Editor/test scripts should validate navigation reachability.
- Multi-scene movement should feel continuous via short transition/fade, not an entire-document navigation/reload.
- Desktop: WASD/arrows, E interact, M directory, click object, wheel/pinch zoom; optional camera follow. Observer Mode: drag-pan without moving player, focus/follow selected agent and re-center player.
- Mobile: touch joystick/D-pad and distinct drag-to-pan toggle, readable tap targets, safe areas and no overlaid controls obscuring doors.
- **Minimap must be an authored logical multi-zone map** with room positions, selected agent and actionable icons—not a shrinking copy of the current background. Provide both whole-campus and current-room navigation.

### 2.2 Pre-rendered background art pipeline (OWNER DECISION)
- **Keep the original generated 2.5D pixel-art/pre-rendered style.** Each new room is a separate environment-only PNG/WebP plate, not one indefinitely expanded master image.
- Preserve the visual grammar of accepted art: Malaysian 1960s-school-inspired cream plaster, terracotta roof tiles, turquoise window louvres, warm wooden floors, tropical palms/trees, afternoon sunlight; add subtle modern monitoring equipment without discarding retro identity.
- Generate clean environment plates with **no UI labels, no characters, no baked-in agent bubbles**. Phaser sprites and React HUD remain runtime layers.
- Retain native/pre-rendered lighting and soft shadows; do not force fully dynamic lighting. For depth, author optional selective foreground masks/crops for tree crowns, pillars, room divider walls and roof edges to render above player when necessary.
- Couple every background revision to geometry review and collision tests. Pre-rendered desks/furniture are fixed environmental art and cannot be dragged without regenerating art + map. Avoid making an editable-world promise.
- Keep camera scaling and collision anchors consistent at 16:9 and mobile aspects. Prefer full-resolution scene plates with lazy loading for off-screen rooms; avoid a single multi-megabyte all-campus texture.
- Characters can have a distinct slightly simpler pixel-pet-inspired style if size, ground-plane, lighting, and outline are consistent. Preserve the authorized Sprinter/Medalist sprite IDs and permission notes from `docs/ASSET_LICENSES.md`; do not mislabel them as first-party ChatGPT assets.

## 3. Character/agent ontology — persistent roles ≠ real sessions
| Entity | Real source of truth | Lifecycle | Interaction |
| --- | --- | --- | --- |
| Visitor Player / Sprinter | local game input | persists while browsing | move, inspect, talk, map, free camera |
| Static NPC / Ustazah Juliana | scripted local content | persists at Bilik Cikgu | talk, teacher-themed idle/heart bubble; **no tools or AI session** |
| Role Mascot / SQL Sage, AC Mechanic, ERPNext, Watcher, Recon etc. | project visual config | may stay off duty | ambient routine; not proof of active work |
| Lead / Advisor / Driver | actual Claude/Codex parent session when observed | active/waiting/done/unknown | planning, handoffs, supervised children |
| Execution Subagent | actual provider child task/session | spawn on observed delegation; finish on observed completion | research, code, test, debug, review |

- A parent can be an **advisor-only** agent while real child executor(s) do code edits. Parent stays near the High Council if no active local execution.
- Each child gets a unique provider+session+agent identity; show parent link in Command Mode and interaction panel.
- Spawn actual worker entity on confirmed start, not from parsing vague prose alone. A role mascot may remain off duty; do not conflate mascot with live worker.
- A stopped real subagent may disappear from the active world after a visible completion dwell, while historical records remain in Command Mode.

## 4. Real events vs game-only behavior (truthfulness contract)
All task status is **OBSERVED**, **DERIVED**, or **AMBIENT**, with provenance and freshness. Never show a real-looking active state from ambient logic.
- **OBSERVED**: session start/stop; tool start/end; provider child spawn/stop; permission prompt; CI result; GitHub review request. Must retain source, timestamp, event ID and correlation.
- **DERIVED**: e.g. Read/Grep/Glob => “Reading / researching”; Edit/Write => “Editing code”; command execution => “Running command”; only when backed by recent observed events; no fabricated percentages.
- **AMBIENT**: “Minum dulu” and kantin movement, simulated social talk, idle pet emotes; explicitly unrelated to real agent progress.
- **UNKNOWN/OFFLINE** is mandatory when session data is stale or disconnected. **Do not collapse unknown into idle.** Approval waiting is different from completed and from normal idle.
- Activity bubbles: prioritize attention/blockers, then observed/derived work, then ambient chit-chat. Clamp length, throttle updates and avoid broadcasting 20 overlapping bubbles.

### 4.1 Agent lifecycle and motion
`discovered -> queued -> working -> waiting_permission/waiting_input -> completed/failed/cancelled` with `unknown/disconnected` as non-terminal observation states. Parent/child relationships have their own lifecycle.
- Start: assign/reuse a permitted workstation; walk there from last location.
- Work: animate sitting/typing/reading. **Never traverse the campus on every tool call**; apply a 10–15s provisional phase hysteresis/dwell, then transition to library/QA only for sustained activity. Critical attention updates must be immediate, even if movement waits.
- Advisor: points to planning board, reads result, watches handoff; does not mimic executor typing if child is doing the work.
- Waiting permission: freeze work pose, show prominent alert in HUD and task detail; no simulated “still coding” animation.
- Completion: unobtrusive acknowledgment, return-to-advisor optional cosmetic animation, persist outcome.
- Off duty: role mascots may wander, sit, visit the kantin, chat or watch a board. Ambient routines interrupt instantly on actual new work and must not consume provider/model tokens or perform network calls.
- Avoid “speaking work results” based on untrusted raw assistant content in public; only curated safe status bubbles.

### 4.2 Provider adapters — capability discovery before implementation promises
- **Claude Code**: explore supported session/subagent hooks, normalized tool events and notifications; verify exact event names/payloads against installed version, including start/end, subagent ID and parent correlation. Handle resume/duplicates/out-of-order/sudden termination.
- **Codex**: evaluate current app-server/SDK/events and client mode actually used; explicitly document whether externally launched sessions or nested child runs can be observed. Polling/partial visibility must be labeled with capability and freshness. Do **not** invent parity with Claude hooks.
- Normalize provider events into a read-only event ingestion boundary; use stable IDs/idempotency, persisted snapshots and bounded WebSocket/SSE fanout.
- Source adapters should fail soft and independently. No event bridge may operate a coding agent from anonymous public input.

Suggested internal event contract (illustrative, to be refined after provider verification):

```json
{
  "event_id": "provider:session:tool-or-event-id",
  "provider": "claude_code",
  "session_id": "opaque-session-key",
  "agent_id": "opaque-agent-key",
  "parent_agent_id": "opaque-parent-or-null",
  "role": "researcher",
  "event_type": "tool_started",
  "activity": "reading",
  "truth": "observed",
  "state": "working",
  "observed_at": "ISO-8601",
  "visibility": "operator_only"
}
```

No file paths, terminal output, prompts, repository secrets, client names or access tokens in public payloads.

## 5. Developer Command Mode — highest priority
Operator view contains:
1. **Needs my attention**: permission/waiting input, blocked/failed work, requested reviews, failing CI; classify with timestamp and direct destination.
2. **Active work tree**: provider, parent advisor -> child executor, task summary, last real event, status freshness, optional workstation location.
3. **GitHub PR queue**: `review-requested:@me` (team reviews only when legitimately mapped); authored open PRs; draft/ready/review state; failing CI; blocked; merged history separate. Avoid counting yourself as the requested reviewer on your own PR. No invented priority/owner.
4. **Since You Were Away**: persisted complete/failed/blocked transitions since last viewed checkpoint, not demo aggregates.
5. **Deep links**: jump into GitHub PR; focus agent in World Mode; local terminal session links only when safely supported inside operator interface.
6. **Status confidence**: connected, disconnected, stale, partial support clearly shown. No “100% complete” without verified steps.

A PR board in the High Council opens the same filtered operational view, not a second independent data store. Current demo board stays clearly **DEMO** until live operator data is functional and authorized.

## 6. Public visitor / private operator boundary
- Preserve separate public `127.0.0.1:3000` and private `127.0.0.1:3100` processes and current deny-by-default routes.
- Public visitors may navigate scenes, talk to Juliana, observe **approved/sanitized** activity and public-safe cards if explicitly enabled. No raw private PRs, employer/customer details, prompts, absolute paths, tokens, system logs, internal endpoints, agent launch/stop tools, or permission approvals.
- The operator-only collector fetches GitHub with least privilege; public projection must be explicit field allowlist, not object spreading/redaction after serialization. Unapproved/private counts must not leak by aggregation.
- Cloudflare Tunnel later exposes **public app only**, not operator, dev server, local CLI gateways, or internal WebSocket. Test route enumeration, Origin/Host handling, forwarded headers and WebSocket authentication before release.
- Clearly label **DEMO**, **LIVE**, and **OFFLINE**. Never let demo data look like live PR or agent activity.
- Cloudflare is a deployment gate after isolation review, not part of this planning commit.

## 7. HUD & accessibility redesign
Replace the static top-row room shortcuts as the *primary* operational navigation with compact:
- site name + current room; mode switch **Command / World**;
- active agents count (verified only), attention badge (highest prominence), review queue count;
- Map/Directory, camera mode (follow player / free pan / follow agent), optional full-screen;
- selected agent task bubble, with accessible inspect/action panel and provenance/last-updated timestamp.
Minimap supports all zones; alert pins can focus the camera and show an operator-only detail panel without walking.
Keep critical alerts visible when focus is elsewhere. Clamp labels and preserve negative space. Mobile HUD should not crowd walkable surfaces.

## 8. Design and implementation tickets
Each user story has explicit acceptance and evidence obligations.

### ST-CAMP-01 — Scene catalog + new connected zones (P0)
**[User Story]** As a visitor I can move beyond the courtyard so I can explore the real academy.
- Define typed scene/portal/anchor manifest and asset loading. Preserve legacy entrance scene and Sprinter / Juliana identity.
- Implement new scene plates + authored collision for engineering lab, high council, kantin, library, Watchtower, QA and teacher room; a room should not require the whole campus plate in memory.
- **AC:** Every portal reachable without shortcuts; no blocked spawn; all eight spaces navigable in keyboard/touch tests; camera pan/follow/zoom and min-map correctly locate them; mobile scene bounds valid.
- **AC:** Background plate updates are paired with collision review and visual evidence.

### ST-CAMP-02 — Agent capacity + stable actor registry (P0)
**[User Story]** As an operator I can see many parallel workers without losing their identity.
- Define role mascot vs actual session actor and workstation reservation / overflow handling.
- **AC:** At least 16 visible engineering stations; 20 concurrent mock workers remain trackable across rooms; stable parent and child IDs; correct despawn/park lifecycle; no duplicate actors from replayed events.

### ST-OPS-01 — Developer attention dashboard (P0)
**[User Story]** As an operator I immediately know which task needs me.
- Implement needs-attention, active tree, recent outcomes, unambiguous state confidence.
- **AC:** Alerts derive from recorded fixtures; unknown != idle; opening board isn't required; click-through <=2 actions; keyboard usable.

### ST-OPS-02 — GitHub PR collector + safe projection (P0)
**[User Story]** As a developer I can separate requested reviews from authored PRs and failed CI.
- Operator GitHub integration with real query semantics, pagination, token handling; explicit separate public DTO only after policy.
- **AC:** No fictitious counts; test draft vs ready, merged exclusion, review requested vs authored, failing CI, pagination and rate limits; private fixtures absent from public network and bundles.

### ST-AGENT-01 — Claude adapter + event provenance (P0)
**[User Story]** As a developer I see actual Claude main and child sessions with observed activity.
- Normalize provider lifecycle/tool/permission hooks; persist idempotent events and last-seen.
- **AC:** Scripted real-hook fixtures and at least one controlled local integration run; duplicate/out-of-order and crash/reconnect cases; no false idle/finish.

### ST-AGENT-02 — Codex adapter + capability report (P1)
**[User Story]** As a developer I can supervise supported Codex tasks without inaccurate parity claims.
- Probe installed Codex surfaces and document limitations before implementation.
- **AC:** Actual supported events have observed evidence; unsupported external runs show limited/unknown rather than made-up detail.

### ST-AGENT-03 — In-world work stages & delegation (P1)
**[User Story]** As an observer I can tell which agent is planning and which child is executing.
- State-to-animation classifier, phase dwell, parent/child UI, priority bubbles.
- **AC:** Advisor remains at council while child runs in lab; agent doesn't cross rooms on every Read/Edit call; permission alert overrides ambient bubble; task outcome remains recorded.

### ST-CAMP-03 — Living workplace routines (P2)
**[User Story]** As a visitor I see off-duty characters in believable social spaces.
- Kantin roles, table occupancy, random-but-bounded wandering, 2-agent chat/emotes, teacher scripted actions.
- **AC:** Ambient routines never synthesize provider progress; interruption on real events; no collisions/stuck agents or inaccessible interactive positions; deterministic tests with seeded random.

### ST-CAMP-04 — UI polish, performance, mobile (P2)
**[User Story]** As a viewer I can explore a large illustrated campus without lag or obstruction.
- Lazy background preload, foreground occlusion masks, bubble culling and throttling, gamepad/mobile touch QA.
- **AC:** Measured render/jank and memory baselines at 4/12/20 visible actors; usable at 320×568 and landscape mobile; reduced motion; keyboard focus safe; no critical alerts hidden.

### ST-SEC-01 — Public Cloudflare launch gate (P2 / security blocker)
**[User Story]** As the owner I can share a fun interactive URL without exposing my development operations.
- Tunnel only the public loopback service; configure approved host/origin policy and safe WebSocket routing.
- **AC:** External negative route/WS tests; no access to operator/admin/terminal/token endpoints; sanitized content and no employer identity leak; rollback runbook; operator not available via tunnel.

## 9. Build sequence and release gates
**This handoff is planning/docs only. Do not imply that these tickets were implemented by the commit.**
1. **Navigation-first design spike (hard gate):** build playable graybox scenes, draw fixed circulation lanes and unobstructed portals, then test traversability and character-foot clearances. Verify multi-scene switching while preserving the current player, dialogue, collision, access controls and existing tests. **Do not create or accept new final HD backgrounds before graybox reachability is proven.**
2. **Command Mode / trustworthy model:** status/event storage, attention queue, review queries, session tree using fixtures; prove utility with game toggled off.
3. **Real instrumentation:** Claude hooks then Codex capability-led adapter. Add last-updated/unknown semantics and unit tests.
4. **World linkage:** 12–16 lab stations, advisor-child separation, camera free pan/agent focus, bubbles and new rooms.
5. **Ambient/visual polish:** kantin, chit-chat, social routines, detailed pre-rendered backgrounds, responsive polish.
6. **Public launch:** complete independent privacy review before any Cloudflare exposure.

Each milestone requires tests, screenshot evidence and exact implementation/provenance claims. Run existing `npm run check`, audit and secret scan and add multi-scene and provider-specific coverage. Do not mark PR #1 as production-ready simply because its illustrated Sprint 0 demo passes.

## 10. Visual design acceptance: final direction
Produce an **original illustrated multi-zone campus concept** compatible with the existing scene: wide Malaysian school courtyard hub with red-tile roofs, cream plaster, turquoise louvres, vibrant trees and golden afternoon light. Show physically distinct, generously sized **engineering lab**, **High Council/PR room**, **Bilik Cikgu ♡**, **library**, **Watchtower**, **QA lab**, and **Kantin** connected by corridors and walkable doors. Character proportions should match scene props. Modern monitors are integrated into old-school wood classrooms. Show a few agent pet characters at desks and idle social mascots in the kantin, plus the visitor explorer and the static teacher NPC. Treat example overlay counts as **DEMO**, never live data.

### Design invariants
- Main engineering room has clearly visible 12–16 stations and navigable aisles.
- Kantin is a distinct social room, not merely a decorative stall.
- High Council visibly accommodates planning/advisors and an interactable PR board.
- Bilik Cikgu is a modern primary-school teacher corner and Juliana remains scripted/stationary.
- The accepted entrance environment is not discarded; **pre-rendered plates stay the canonical visual pipeline**. Produce HD backgrounds **per scene** from approved collision-accurate grayboxes, not as a single enlarged campus JPEG or an unverified 4K upscale.
- Public World Mode retains clear origin/privacy semantics and visible Demo/Offline labels until actual safe event projection ships.

---

## 11. Navigation-first HD scene production — owner-approved execution direction (2026-10-20)

> **Priority:** walking paths and player usability **above** scenic density, resolution, animation, and atmospheric props. **Status: planning only.** No new scene artwork or navigation implementation is created by this documentation commit.

### 11.1 Decision: hybrid pre-rendered visual pipeline

Retain **pre-rendered 2.5D environments**, real Phaser actors and overlays, Tiled geometry, and React UI. The current approved entrance is a valid proof of concept; it is **not** a plan to turn the entire academy into one extremely large image. Do not replace the world with generic procedural tiled visuals solely for editability. Fixed background props may remain fixed, but collisions must always match what the player sees.

The final layering contract for every playable scene:

1. **Environment plate:** detailed static walls, doors, floors, fixed desks, sunlight/shadows, foliage and non-interactive furniture. No characters, UI, labels attached to dynamic state, work bubbles, or real company content baked in.
2. **Navigation/physics data:** precisely authored Tiled floor/walkable regions, solid geometry, door portals, spawn anchors, workstation approach points, NPC interaction anchors, and reachability metadata.
3. **Actors / dynamic scene effects:** visitor, stationary teacher, advisor/session workers, agent bubbles, effects and interaction prompts, with foot-based position and depth sorting.
4. **Foreground occlusion and interface:** authored cutout masks/transparent overlays for tree crowns, roof edges, columns/door frames when needed, plus accessible React status/HUD overlays.

A dynamic object cannot convincingly pass behind a painted tree or pillar unless its image occlusion is handled independently; document intentional visible limitations in simpler scenes.

### 11.2 Graybox first: exact work order

**Do not commission/generate the final high-resolution artwork until every relevant walking route passes geometry checks.**

1. Inventory current main entrance map, backdrop world dimensions, Tiled object layers, player collider, camera zoom, existing e2e walk tests, and accepted character scale.
2. Draft separate **top-down circulation plans** for `engineering_lab`, `high_council`, `cikgu_room`, `kantin`, `library`, `watchtower`, and `qa_lab`; keep current `entrance` and validate existing connections.
3. Lay down primary routes **first**: gate -> courtyard -> connecting corridor -> doorways -> room central aisle -> interaction points. Use a door/portal graph with stable IDs and return paths. Place furniture only after those clearances are reserved.
4. Build real Phaser-loadable **low-detail grayboxes** and Tiled object layers (rectangles/polygons as needed), with temporary colors for walkable/blocked regions; playable transitions should succeed before visual polish.
5. Test reachable endpoints including all room transitions, supervisor desk, PR board, 16 lab desks, Cikgu interaction spot, library tables, QA/Watchtower screens, kantin serving counter and social seating.
6. Only after passing the gate: create environment-only HD room plates consistent with the graybox camera, object anchors, and clearances; re-run tests after integrating art. If artwork visually closes a verified door or introduces a table over a corridor, correct the **art and/or approved geometry together**, never quietly create invisible fake walkways.

### 11.3 Traversal dimensions and movement requirements

Current project has a **48px logical Tiled grid** with authored object-based collision and a foot collider; preserve that convention for preliminary planning, but validate everything against actual sprite dimensions and world units. The existing background size is not assumed to be evenly divisible by 48.

| Circulation element | Initial geometric target | Test |
| --- | --- | --- |
| Primary covered corridor / scene spine | **4–5 logical tiles** clear (~192–240 world px if 1 tile = 48 px) | Player + traversing NPCs do not permanently block each other |
| Secondary corridor | **3 tiles** clear (~144 world px) | Unobstructed from either direction |
| Main engineering lab entrance | **3 tiles** (~144 world px) | Avatar enters/exits without clipping furniture |
| Small room doorway | **>=2 tiles** (~96 world px) | Player collider + tolerance can pass |
| Desk-to-desk access aisle | **2–3 tiles** clear (~96–144 world px) | Every workstation can be approached |
| Portal spawn landing zone | Clear in front of door; not embedded in props, seats or wall | Landing tile valid, reverse portal reachable |

These are **design targets, not physical code-enforced thresholds until measurement**. If sprite collision, perspective, or scene scale shows they are too narrow, increase the targets. A visible empty gap is not enough: physics shapes and scripted paths must agree.

**Critical acceptance:** every visual doorway truly connects; no one-way stuck spawn; no decorative passage falsely presented as open; no impossible desk interaction; no invisible walls across the visible aisle; no emergency controls hidden behind camera crops. Where a room plate is intentionally closed-off, communicate that clearly through art and interaction.

### 11.4 Dynamic pathfinding and congestion

For live agent motion, use a validated walkability graph or navigation grid derived from authoritative collision. Treat desk access points, scene portals, social seating, and the PR board as explicit destination anchors. Actor foot colliders determine final positioning and depth, not their full sprite bounding boxes.

- Validate both **player continuous collision** and **AI actor route planning**; a navigable player path may still be unreachable by a worker if an actor's occupancy reservation is mishandled.
- Keep distinct **static obstacles** (walls, desks, trees) versus **dynamic occupancy** (agents seated/standing, visitor crossing). Do not permanently block a major corridor because one agent has stopped there.
- On collision with an occupied workstation, route to waiting/overflow position without fabricating task failure. Backend work must continue regardless of visual seat availability.
- Pathfinding need not run for every tool call. Give each worker an activity zone, maintain a **10–15 second provisional dwell/hysteresis** before moving between zones, and update urgent work/permission statuses immediately.
- Agent interruptions must cancel planned kantin/social movement; path changes need to be bounded and not cause oscillation.
- For multi-scene visualization, world state persists while scenes are unloaded. Use active-room actors plus optional summary/count badges elsewhere; do not load every HD plate to simulate off-screen work.

### 11.5 Image resolution and sharpness: sample targets, not guaranteed quality

The accepted PR #1 artwork is a **~1672 x 941 px** scene plate. The latest full-campus concept also needs more **designed detail per playable room**, not merely higher pixel counts. Scaling or an AI upscaler to 4K cannot create reliable doorway geometry, legible props, logical room layouts or collision fidelity.

For new per-room master artwork, use these **starting candidates**, adjusted by room bounds and target zoom:

| Intended asset | Planning resolution | Notes |
| --- | --- | --- |
| Typical individual room | **2048 x 1152** | Good minimum for a 16:9 room, if playable framing permits |
| Large Engineering Lab / prominent rooms | **2560 x 1440** or **3072 x 1728** | Larger camera-scrolling world with readable 12–16 workstations |
| High-detail master *only where justified* | **3840 x 2160** | Provide optimized derivatives; not a blanket runtime default |
| Small foreground cutouts | Tight alpha-cropped regions | Reduce texture overhead rather than duplicating a full room |

Do **not** lock all rooms to 16:9. Prefer scene-appropriate aspect ratios and mapping so camera movement, reachable space and architectural layout determine asset dimensions. The dimensions above are reference sizes for planning, not a mandate.

Rendering and camera contracts:

- Keep **world coordinates, rendered image pixel dimensions, and CSS/display pixels conceptually separate**. Calibrate asset scale so a visible doorway's width matches its Tiled collider and actor-foot dimensions; do not assume high-resolution images imply enormous movement coordinates.
- Show a **useful close-up** of each room at default desktop zoom; the entire 3K room need not fit on a single 1440px-wide window. Player-follow, free-pan and minimap expose the rest.
- Author the environment at sufficient *native detail*: distinct desks, chairs, legible circulation and meaningful architectural edges. Preserve visual coherence (warm baked lighting, Malaysian school architecture, turquoise louvres and terracotta roofs).
- Choose filtering **per texture**: pre-rendered painterly/illustrated background can use smooth/linear scaling; intentionally hard-edged low-resolution pixel sprite sheets generally need nearest-neighbor filtering and integer-aligned scale where practical. Review mixed-style character/background proportions at gameplay zoom.
- Optimize delivery (WebP/PNG where justified, lazy-loaded scene plates, proper prefetch before room transitions, release unused textures), measure GPU memory and check WebGL maximum texture compatibility on target devices.
- A 3840 x 2160 RGBA texture has ~31.6 MiB of raw 4-channel texel data before mipmaps/overhead. Do not ship numerous resident 4K plates simultaneously, especially on mobile.

### 11.6 Required scene art handoff package

For **each** approved room, deliver artifacts that can be audited without trusting an image model's geometry:

| Artifact | Requirement |
| --- | --- |
| Navigable graybox | Scene with room bounds, floor, fixed obstacles, reserved walking lanes |
| Tiled source | Editable collision and portal data with named interaction/approach/spawn anchors |
| Route graph report | List of intended start -> goal pairs, clearance constraints, pass/fail reachability |
| Pre-rendered plate | No UI or dynamic characters; must retain agreed graybox doorway and furnishing coordinates |
| Alignment/occlusion evidence | Overlay background with collision paths/spawn points; separate alpha crops for relevant occluders |
| Gameplay evidence | Desktop + narrow mobile screenshots, avatar walking in/out, interaction reach |
| Performance profile | Resolution/texture format, memory cost, scene-load time, frame-time on specified device |
| Provenance note | Original/generated/user-authorized source, permissions and restrictions |

**Do not accept** concept art alone as a production-ready scene. Re-generating a scene may affect alignment; regression checks are mandatory.

### 11.7 Acceptance gate: observable walking success

**Must pass before visual finalization of a scene:**
- Spawn at the main gate and reach every room and return using game movement, not directory teleportation.
- Reach every currently advertised interactable from a valid foot-collider position without violating collisions.
- Enter/exit all room doors on desktop and touch control with no clipped or blocked transition.
- Move along a primary circulation route while mock idle agents occupy typical desks and kantin seats; use clear diversion/wait if path temporarily blocked.
- Walk to 12–16 Engineering Lab desk approach anchors; dense furniture must not create unreachable desks.
- Move through corridors with stable animations; no automatic long-distance room hopping on every tool event.
- Free-pan and player-follow cameras cannot strand the player outside bounds. The minimap shows real room connections and selected agent position.
- Each scene's background plate and collision overlay visibly align after export; photo-pretty image composition does not override geometry.
- Repeat critical path tests at 1440x900, 1280x720, 390x844, 844x390 and 320x568 simulated viewports. Real device/Safari validation remains an additional release gate, not claimed complete.

Suggested test strategy: (1) static connected-component / graph reachability for portals and anchors, (2) Phaser + Playwright traversal through **real collision**, (3) deterministic seeded congestion/idle simulations, (4) screenshot overlays reviewed against backgrounds. Keep the current Sprint 0 route tests green.

### 11.8 Implementation task breakdown

**ST-NAV-01 — Graybox and circulation audit (P0, blocker)**  
**[User Story]** As a visitor, I want to walk from the academy entrance to each room without getting stuck.
- Inventory existing portal/collision/foot-anchor semantics, produce route diagram and per-room grayboxes with path overlays.
- **AC:** all intended room doors/spawns interactable and test-reachable; no final new art commissioned before this passes.

**ST-NAV-02 — Multi-scene collision and portal graph (P0)**  
**[User Story]** As a player, I want reliable doorway transitions while retaining my gameplay context.
- Typed scene manifest, bidirectional portals, spawn coordinates and scene transition handling.
- **AC:** game state preserved through scene switches, deterministic portal return, keyboard/touch movement and tests across all rooms.

**ST-NAV-03 — 16-station engineering circulation (P0)**  
**[User Story]** As a developer, I want active execution agents visible without blocking my access to any lab station.
- Reserve primary aisles, desk approach anchors and worker parking/overflow rules.
- **AC:** >=16 visual desk anchors, all reachable, and 20 mocked running tasks remain trackable across zones without hard UI quota.

**ST-ART-01 — HD room production from locked grayboxes (P1, gated by NAV)**  
**[User Story]** As a player, I want detailed school rooms that look physically walkable at gameplay zoom.
- Render/generate each room plate individually, align environmental shapes to path geometry, audit provenance.
- **AC:** approved background/collider debug overlay match, usable default zoom, no invisible walls or fake doors, per-device scene load/performance measured.

**ST-ART-02 — Occlusion, texture and responsive render quality (P1)**  
**[User Story]** As a player, I want smooth movement under trees and through doorframes on desktop and mobile.
- Optional selective foreground masks, scene-specific filtering, lazy loading and camera tuning.
- **AC:** correct draw order for character feet, no transparent cutout artifacts, stable viewport screenshots/performance evidence.

**ST-NAV-04 — Social and worker navigation simulation (P2)**  
**[User Story]** As a developer, I want workers to move naturally without their animations disrupting actual job visibility.
- Dynamic occupancy, dwell thresholds, deterministic kantin idle routines and instant override on true work.
- **AC:** no spurious work states, no corridor lockups, no idle activity delaying urgent status updates, seeded stress tests.

### 11.9 Execution-agent prompt — run this before generating final art

> You are the senior Phaser 3 RPG engineer and pixel-environment technical artist for `azibbrrrrr/maia-retro-tech-academy`. Read PR #1, `docs/REDESIGN.md`, the existing multi-zone campus handoff and **Section 11 (this navigation-first HD addendum)**. Preserve the existing pre-rendered, warm Malaysian retro-school aesthetic, Sprinter visitor avatar, permanent scripted Ustazah Juliana, separate demo/public and authenticated operator processes, and code/asset licenses.
>
> **First deliverable:** a navigable, measurable graybox for the connected academy, not an illustration. Produce the scene/portal graph, 48px logical reference and actor-foot clearance plan, 12–16 desk anchor map, walkable-lane overlays, collision/door/spawn schema, and tests proving room-to-room and interaction reachability. Keep existing tests passing.
>
> Once graybox tests pass, design **independent HD pre-rendered environment-only scene plates** (starting near 2048×1152 for rooms, or 2560×1440 / 3072×1728 for the lab when justified). Do not assume higher resolution alone improves usable detail. Generate from confirmed object geometry and camera view; keep original doors, desk spacing, aisles, scale and lighting coherent. Use foreground masks selectively, dynamic sprites separately, and ship optimized lazy-loaded derivatives.
>
> **Work in transparent milestones:** report what you actually verified, what you could not observe, and whether each scene meets walking, collision, interaction, resolution and performance acceptance. Never misstate new work as already existing in PR #1. Never expose live private sessions/PR metadata via the public server.


---

## 12. Living-world interaction architecture — next execution track (2026-10-21)

**Approved supplementary handoff:** [Living-World Interaction & Layered Rendering Vertical Slice](2026-10-21-living-world-interaction-vertical-slice.md).

The owner's goal is a believable **simulated workplace**: agents physically approach a chair, sit, type, stand, walk to a kantin counter, collect food, dine at a table, and chat when **off duty**; a player can inspect them and walk past trees and behind desks; foreground masks and ambient effects (leaves, waterfall/pond/fans) create visual depth. These are **not yet implemented**. Existing Sprint 0 only has a single pre-rendered plate, original collision and basic animated Sprinter/Juliana interactions.

### Mandatory implementation split
- **Work truth:** Claude/Codex event + GitHub states, private adapters, attention queue and history (developer utility). A provider work state is never invented by an animation.
- **World truth:** Phaser owns pathfinding, position, room transition, interaction reservations, work and food prop animations, ambient routines, and camera; React owns HUD, inspect panels and command dashboard.
- **Render depth:** Preserve pre-rendered HD backgrounds but separate chair/desk fronts, counters, trees, pillars and roofs into aligned foreground cutouts and/or depth-sorted objects. This is *not* a replacement with a fully tile-painted game.
- **Interaction protocol:** Each interactive object has a collision reference, walkable approach anchor, seated/use anchor, capacity/reservation, accepted actions, facing, clip/pose, and release/interrupt semantics. Animate both character and object (keyboard/monitor, plate, food, steam), not just a chat bubble.
- **Idle social life:** Local deterministic routines only for confirmed-off-duty role mascots; never let a stale/disconnected real provider session appear actively eating as if verified idle.
- **Nav-first hard gate remains:** 48px logical-grid reference, real Phaser/Tiled collision, test from entrance to lab and kantin and all desk/counter/chair anchors before creating detailed art.
- **Public security remains:** no raw prompts, client/private PR information, agent control actions, tokens, or unrestricted local WebSockets through Cloudflare.

### Vertical-slice acceptance
One four-desk **Engineering Lab graybox** and one two-table **Kantin graybox** connected via navigable bidirectional portal; seeded test actors complete `walk -> approach -> sit -> type -> stand -> order -> sit -> eat -> chat -> stand`. Desk fascia and tree foreground correctly mask movement, dining seats cannot double-book, and real work instantly supersedes simulated ambient routines. Environment effects run independently of collision and honor reduced motion.

This is an **interaction-engine feasibility track**, not a substitute for the original **Command Mode + trusted provider instrumentation** product goals. Where scheduling conflicts, maintain developer-utility priority and keep the world simulator behind its own tests and fixtures.

### Build order
1. Source-control interactable, occupancy, Tiled anchor and occlusion metadata; produce playable grayboxes with debug overlays and reachability reports.
2. Build reusable seated workstation interaction and depth-sorted foreground proof.
3. Build interruptible kantin food/eating/chat routines; simulated fixtures clearly marked DEMO.
4. Add 1–2 decorative environment effects with graceful mobile/reduced-motion behavior.
5. Only after passing fixture tests, attach real local Claude Code events (in isolated operator backend) and separately validate Codex capabilities; do not expose control through public app.
6. Expand archetypes to the complete campus and 12–16 lab workstations; preserve initial PR #1 behavior and public/operator split.

**No game code or assets are changed by this handoff update.**

