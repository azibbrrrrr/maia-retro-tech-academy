# MAIA Retro-Tech Academy — Multi-Zone Living Campus & Developer Operations Handoff
**Design revision:** 2026-10-20 · **Status:** approved direction / NOT yet implemented  
**Applies to:** PR #1 (\`feat/sprint-0-playable-campus\`) and subsequent execution milestones  
**Product weighting:** developer utility first (~80%); entertainment/ambient life second (~20%)  
**Personal public project:** \`azibbrrrrr/maia-retro-tech-academy\`; NOT part of MAIA v1.0.1's commercial baseline.

> This document is an **execution contract for future work**, not evidence that features below exist. It extends the v2 developer-command-center handoff and supersedes its earlier assumption that the campus requires fully tiled, movable artwork. **The owner confirmed that pre-rendered scene backgrounds are intentional and must be preserved.**

## 0. Verified PR #1 baseline: preserve the working foundation
Inspected on 2026-10-20:
- PR #1 currently adds an illustrated original \`public/assets/campus.png\`, a Phaser \`Campus\` scene, authored Tiled collision objects in \`maps/academy.tmx\`/\`public/maps/academy.json\`, a React HUD, a stationary **Ustazah Juliana / Cikgu** using the authorized Medalist sprite, and a visitor-controlled Sprinter sprite.
- The playable scene is ~1672×941. It has the front entrance/courtyard, High Council classroom, and Bilik Cikgu. The current whiteboard is **DEMO**; agent connections are **OFFLINE**.
- Existing public localhost listener \`127.0.0.1:3000\` and separate authenticated operator listener \`127.0.0.1:3100\` are deliberate security boundaries. No live GitHub collector, Claude/Codex telemetry, Cloudflare deployment, or expanded campus exists yet.
- Existing tests/verification are recorded in \`docs/REDESIGN.md\`; do not present this new design as tested implementation.
- Relevant code/docs: \`packages/game/Campus.ts\`, \`packages/game/bridge.ts\`, \`packages/world/content.ts\`, \`apps/public-web/src/App.tsx\`, \`packages/contracts/board.ts\`, \`docs/ARCHITECTURE.md\`, \`docs/SECURITY.md\`, \`docs/ASSET_LICENSES.md\`.
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
- Plan stable scene IDs and independent Tiled scene metadata (e.g. \`entrance\`, \`high_council\`, \`engineering_lab\`, \`library\`, \`watchtower\`, \`qa_lab\`, \`kantin\`, \`cikgu_room\`). Keep existing \`gate\`/\`council\`/\`teacher\` aliases or migrate them explicitly with tests.
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
- Characters can have a distinct slightly simpler pixel-pet-inspired style if size, ground-plane, lighting, and outline are consistent. Preserve the authorized Sprinter/Medalist sprite IDs and permission notes from \`docs/ASSET_LICENSES.md\`; do not mislabel them as first-party ChatGPT assets.

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
\`discovered -> queued -> working -> waiting_permission/waiting_input -> completed/failed/cancelled\` with \`unknown/disconnected\` as non-terminal observation states. Parent/child relationships have their own lifecycle.
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

\`\`\`json
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
\`\`\`

No file paths, terminal output, prompts, repository secrets, client names or access tokens in public payloads.

## 5. Developer Command Mode — highest priority
Operator view contains:
1. **Needs my attention**: permission/waiting input, blocked/failed work, requested reviews, failing CI; classify with timestamp and direct destination.
2. **Active work tree**: provider, parent advisor -> child executor, task summary, last real event, status freshness, optional workstation location.
3. **GitHub PR queue**: \`review-requested:@me\` (team reviews only when legitimately mapped); authored open PRs; draft/ready/review state; failing CI; blocked; merged history separate. Avoid counting yourself as the requested reviewer on your own PR. No invented priority/owner.
4. **Since You Were Away**: persisted complete/failed/blocked transitions since last viewed checkpoint, not demo aggregates.
5. **Deep links**: jump into GitHub PR; focus agent in World Mode; local terminal session links only when safely supported inside operator interface.
6. **Status confidence**: connected, disconnected, stale, partial support clearly shown. No “100% complete” without verified steps.

A PR board in the High Council opens the same filtered operational view, not a second independent data store. Current demo board stays clearly **DEMO** until live operator data is functional and authorized.

## 6. Public visitor / private operator boundary
- Preserve separate public \`127.0.0.1:3000\` and private \`127.0.0.1:3100\` processes and current deny-by-default routes.
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
1. **Design spike:** verify pre-rendered multi-scene switching while preserving current room, player, dialogue, collision and existing tests. Make rough backgrounds to prove scale and movement before expensive final art.
2. **Command Mode / trustworthy model:** status/event storage, attention queue, review queries, session tree using fixtures; prove utility with game toggled off.
3. **Real instrumentation:** Claude hooks then Codex capability-led adapter. Add last-updated/unknown semantics and unit tests.
4. **World linkage:** 12–16 lab stations, advisor-child separation, camera free pan/agent focus, bubbles and new rooms.
5. **Ambient/visual polish:** kantin, chit-chat, social routines, detailed pre-rendered backgrounds, responsive polish.
6. **Public launch:** complete independent privacy review before any Cloudflare exposure.

Each milestone requires tests, screenshot evidence and exact implementation/provenance claims. Run existing \`npm run check\`, audit and secret scan and add multi-scene and provider-specific coverage. Do not mark PR #1 as production-ready simply because its illustrated Sprint 0 demo passes.

## 10. Visual design acceptance: final direction
Produce an **original illustrated multi-zone campus concept** compatible with the existing scene: wide Malaysian school courtyard hub with red-tile roofs, cream plaster, turquoise louvres, vibrant trees and golden afternoon light. Show physically distinct, generously sized **engineering lab**, **High Council/PR room**, **Bilik Cikgu ♡**, **library**, **Watchtower**, **QA lab**, and **Kantin** connected by corridors and walkable doors. Character proportions should match scene props. Modern monitors are integrated into old-school wood classrooms. Show a few agent pet characters at desks and idle social mascots in the kantin, plus the visitor explorer and the static teacher NPC. Treat example overlay counts as **DEMO**, never live data.

### Design invariants
- Main engineering room has clearly visible 12–16 stations and navigable aisles.
- Kantin is a distinct social room, not merely a decorative stall.
- High Council visibly accommodates planning/advisors and an interactable PR board.
- Bilik Cikgu is a modern primary-school teacher corner and Juliana remains scripted/stationary.
- The accepted entrance environment is not discarded; **pre-rendered plates stay the canonical visual pipeline**.
- Public World Mode retains clear origin/privacy semantics and visible Demo/Offline labels until actual safe event projection ships.
