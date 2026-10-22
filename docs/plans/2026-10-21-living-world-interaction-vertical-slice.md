# MAIA Retro-Tech Academy — Living-World Interaction & Layered Rendering Vertical Slice
**Planning date:** 2026-10-21  
**Status:** execution specification only — not implemented  
**Target:** `azibbrrrrr/maia-retro-tech-academy`, PR #1 `feat/sprint-0-playable-campus`  
**Parent contract:** [Multi-Zone Living Campus Handoff](2026-10-20-multi-zone-living-campus-handoff.md), especially navigation-first Section 11  
**Product principle:** **Developer utility is the real product; a physically believable school simulation is its interactive presentation.**

> **Decision:** Retain original pre-rendered HD backdrops *and* implement true interactive layers above them. Do not mistake a flattened environment illustration for the complete render graph. No new art, game code, agent instrumentation, environment animation or remote release is included in this documentation change.

## 1. Why this vertical slice

The approved entrance PR #1 already proves keyboard/touch movement with Phaser 3 and Tiled object collision; its architecture is a basis for gameplay, not yet for rich object interaction. The next **gameplay risk** is whether a worker can convincingly:
1. Walk to a clear path beside a workstation.
2. Occupy a chair, appear **behind the desk front**, sit and type with an animated monitor and accurate task bubble.
3. Stand, release the workstation, exit through a real door, and enter Kantin Akademi.
4. Approach the food counter, receive a prop, walk to a reserved table, sit, **eat/drink**, exchange local simulated chat with another **off-duty** character, then return.
5. Immediately abort the ambient routine if a *real provider work event* arrives; keep the task status and priority visible while motion catches up.
6. Allow the visitor player to follow the route without clipping, control the camera, interact with objects/NPCs, and inspect workers; critical developer information stays reachable directly in Command Mode.

**Smallest proof:** one **Engineering Lab graybox** (4 working desks initially, expandable to 16 without re-authoring runtime), one **Kantin graybox** (counter + 2 tables), plus a bidirectional **door/portal**. Keep the existing entrance and Cikgu scene unchanged. Use mock fixtures initially; do **not** wait for Claude/Codex live telemetry to validate game interactions.

## 2. Source-code review: upstream patterns vs gaps

### Claude-Office — W17ant/Claude-Office (MIT code)
- `hooks/agent-tracker.sh`, `hooks/hooks.json`, `server/sessions.js`, and `server/tasks.js`: real Claude Code session/tool/subagent and task-source patterns.
- `src/officeReducer.ts`, `src/agentManager.ts`: event-to-activity FSM; assigned desk, waypoint walking, basic coffee/water breaks, chat/handoff effects, tasks/permission state.
- `src/components/Character.tsx` + `FurnitureRenderer.tsx`: CSS percent-coordinate sprite presentation and z-index/foreground approximations.
- **Do not overclaim:** this is not a physically simulated seating/eating system, complete autonomous 3D scene, Phaser collider world, or production-safe internet-exposed operator backend. Existing multi-room schema isn't a guarantee that all connected rooms are fully playable in its main UI.
- `NOTICE.md` excludes Dunder Mifflin art from its MIT grant. Do not copy that skin/assets into the public repository.

### Pixel Agents — pixel-agents-hq/pixel-agents (MIT code; review individual assets)
- `webview-ui/src/office/engine/renderer.ts`: shared draw list, furniture/actor foot-based Y sort, chair/character sitting offset.
- `webview-ui/src/office/engine/characters.ts`: reading/typing sprite state and idle wander behavior; `seatPlacement.ts` + `officeState.ts`: stable seat assignment and route planning.
- **Do not overclaim:** an offset character at a chair is not a full sitting/eating timeline, and the editor/Canvas implementation is not a drop-in Phaser scene. Study the design; do not merge the entire render engine.

### Existing MAIA project — the execution base
- `packages/game/Campus.ts`: actual Phaser 3 Arcade foot collider, Tiled geometry, pointer/keyboard/touch game controls, current static teacher and world camera.
- `packages/game/bridge.ts`: typed React/Phaser input + interaction bridge.
- `docs/ARCHITECTURE.md`: strict public `127.0.0.1:3000` vs authenticated loopback operator `127.0.0.1:3100`. Preserve.
- **Gap:** only one scene/plate and simple proximity interactions; no interaction occupation system, seat-specific poses, agent worker registry, postures, room portals, occlusion authoring, environmental animation or real event ingestion.

## 3. Engine ownership and render composition

Use **Phaser 3** as the *single world coordinate system / actor simulation engine*. React remains UI, dialogs, inspector, accessibility, status and command dashboard. Do not duplicate actor position simulation in React CSS.

A recommended per-room render graph:

```text
React HUD, dialogs, tooltips, accessible inspector
Phaser world:
  - overlay effects: thought bubbles, markers, light particles
  - depth-sorted foreground/character/interactive-prop cluster
  - independent animated environment sprites (tree crown, waterfall, fans)
  - pre-rendered STATIC background plate (floor, walls, fixed props, sunlight)
Invisible:
  - Tiled collision/walk graph, feet-based actor colliders
  - semantic object interaction anchors, occupancy, portal graph
```

**Important:** a fixed global "all actors above all furniture" layer is incorrect. Use **foot/baseline depth** to sort nearby actors and props, with explicit overhang foreground masks (desk fascia, counters, shelves, tree crowns, pillars, roof edges) and backgrounds for tall objects where needed.

An illustration scene still has freedom in lighting, but a chair intended for interactive occupancy cannot be a single uneditable painted blob with no separate foreground. The *same visual* may be split into:
- lower/background portion that sits behind the actor;
- front/occluder portion that draws over the actor;
- separate operational sprite if its appearance changes (monitor off/on, fan rotation, serving counter, steam, etc.).

### 3.1 Production art asset contract

Scene assets by ID, e.g.:

```public/assets/scenes/engineering_lab/
  background.webp               # environment plate, no actors or dynamic UI
  foreground.webp               # transparent foreground cutouts, pixel-aligned to background
  occluders.json                 # optional cutout rects/depth/baseline/source regions
  animations/monitor-idle.webp
  animations/monitor-code.webp
  animations/monitor-test.webp
  animations/fan-loop.webp
  scene.json                     # authored, source-controlled Tiled export
maps/engineering_lab.tmx         # editable navigation/collision source
```

**Note:** for objects that alternate from behind to in front of an actor, **one global foreground image is insufficient**. Use individual cutouts with a baseline/Y-depth anchor, or deliberately always-overhead foreground objects. For a bench/desk, separately authored fascia/counterfront occluder is preferable. A transparent crop of exactly aligned painted art is acceptable when it perfectly covers the moving sprite without ghosting; masks must be pixel-registered at all zoom levels. If extracting foreground from already flattened art leaves baked artifacts or doubles translucent shadows, regenerate the background/foreground as separate layers and inspect against a moving avatar.

World coordinates are distinct from HD source texture pixels and browser CSS pixels. One authored `worldWidth/worldHeight` per scene, with scaling from asset pixels to world units and fixed interaction anchors. Every art update must ship together with a reviewed collision+occlusion overlay.

### 3.2 Environment animations

| Effect | Static component | Dynamic component | Collision and interaction |
| --- | --- | --- | --- |
| Tropical tree | Trunk, rooted ground contact, baked shade | transparent swaying canopy loop; sparse falling leaves | trunk collider; canopy masks actor when behind |
| School pond/waterfall | rock, pond bank, static basin | 6–12 frame water/foam loop and light particles | pond blocked to walkers; animation no physics |
| Kantin | counters, stall structure | ceiling fan sprite, food steam, counter highlight | stalls solid, purchase/serve anchor outside counter |
| Engineering lab | desk and room shell | monitor content/status, small LEDs, typing indicator | seat/desk occupancy and approach anchors |
| Courtyard | buildings, pillars, flags | light wind flag movement, occasional leaves | no environmental VFX on the collision graph |

Use seeded or staggered animation phases to avoid synchronized tree/fan loops. Pause or strongly reduce off-camera effects, honor `prefers-reduced-motion`, support lower mobile quality presets, and keep background lighting mostly baked. Animation sprites remain ornamental and cannot change actual provider task states.

## 4. The Interactable object contract

Do **not** implement `if (objectId === "coffee")` chains for every future school object. Define a typed registry that gameplay logic, interaction HUD, pathfinding and visual artist share.

**Suggested TypeScript contract (proposal, not executable implementation):**

```ts
type ActionKind = 'sit' | 'type' | 'read' | 'order_food' | 'eat' | 'drink' | 'chat' | 'stand' | 'inspect';
type ObjectKind = 'workstation' | 'chair' | 'canteen_counter' | 'dining_seat' | 'bench' | 'bookshelf' | 'whiteboard' | 'monitor' | 'npc';
type Vector2 = { x: number; y: number };

interface WorldInteractable {
  id: string;
  roomId: string;
  kind: ObjectKind;
  approachAnchors: Vector2[];       // reachable foot positions on the walk graph
  useAnchor: Vector2;              // world-space sit/stand/render pose baseline
  facing: 'north' | 'south' | 'east' | 'west';
  capacity: number;               // e.g. 1 per chair, separate chair IDs for groups
  supportedActions: ActionKind[];
  collisionObjectIds: string[];   // Tiled source references
  foregroundIds?: string[];       // cutout overlays and explicit sort anchors
  animationSet?: string;          // work_sit, seated_dining, etc.
  defaultState?: string;          // e.g. monitor_off, coffee_idle
}

interface OccupancyReservation {
  objectId: string;
  actorId: string;
  leaseUntil: number;             // monotonic engine time, not persisted wall clock
  activityId: string;
}
```

Every target must validate a route to an **approach anchor** on walkable floor; **useAnchor** can lie at a blocked chair/deskmount spot because a seated actor is snapped there **only after** completing the valid walk+transition. Don't try to pathfind through a solid table to reach a chair.

UI interactions should expose **talk / inspect / sit / view PR** based on the object, context and viewer privileges. Public `inspect` never forwards private raw provider events.

### 4.1 Resource ownership / congestion

- Use a deterministic `ReservationManager` by interactable ID and actor ID.
- Reserve before routing; release on animation end, task preemption, actor despawn, scene unload, error, and timeout.
- Busy seat -> choose next suitable seat; if none -> move to a valid lounge/standing fallback; if no path -> remain safe at current position with a visible "waiting for space" *world* state (distinct from provider waiting-for-permission).
- Do not occupy a narrow emergency corridor for ambient conversations or queues. Social meetups use authored `social_spot` anchors outside main traffic lanes.
- Visual capacity is not real agent capacity. If 20 live tasks exist and 16 lab chairs, the Command dashboard tracks all 20; overflow can appear in secondary rooms/roster with honest location status.

## 5. Behavior architecture: real events own work, game FSM owns choreography

Separate two state machines.

**Work truth FSM** — source is a real Claude/Codex adapter and normalized operational event store:

```text
not_seen -> queued -> running -> waiting_input/waiting_permission -> completed|failed|cancelled
                     \-> stale/unknown/disconnected (observation branch, never "idle")
```

**World behavior FSM** — *only visual simulation*, cannot write back provider status:

```text
OFF_DUTY -> SELECT_GOAL -> RESERVE -> WALK -> ALIGN -> INTERACT
     ^                                            |       |
     |                                            |       v
     +------ RELEASE <- STAND_OR_FINISH <----------+    CONTINUE
             |
             +--- PREEMPTED_BY_REAL_TASK -> FIND_WORK_STATION -> WALK -> SIT -> TYPE/READ/WAIT
```

Priority: **real attention/permission and session state immediately update status surfaces** > work assignment and physical transition > explicit player interactions > ambient idle behavior > environmental effects. Real work events can preempt a character eating even if the eating animation takes a short, visually safe stand-up transition.

### 5.1 Authoritative run sequences

**Computer use (first vertical-slice test):**
1. Confirmed task start in a fixture -> session actor spawned, not just a named role mascot.
2. Reserve available workstation, pathfind to foot-based `approachAnchor`, avoid occupied desks.
3. Rotate to `facing`, play `sit_down` transition; snap feet to `useAnchor`, switch to seated sprite, set depth relative to desk fascia, turn on monitor animation.
4. When tool events indicate read/edit/run tests, change **work bubble and monitor sprite** in place, without traversing room on every small step.
5. Attention/permission -> show alert immediately and pause typing animation. `Disconnected` -> show unknown, never pretend to be idle.
6. Complete -> brief acknowledgement, stand and release station; persist completion in Command Mode.

**Kantin use (ambient mock/role mascot only):**
1. Off-duty status explicitly known -> select `kantin` only if local ambient routine is permitted.
2. Reserve a dining seat before approaching counter. Navigate via collision-safe portal and counter queue anchor.
3. Face the canteen vendor; play order/handover animation with a **fictional** food prop (food is decorative, not financial/accounting state).
4. Walk to table from `approachAnchor`, align+sit and play a 4–8 frame `eating` loop; show food prop/bubble.
5. Nearby second confirmed-off-duty NPC/mascot may face the first and exchange locally scripted dialogue, without generating model calls, reading private prompts or impersonating real work communication.
6. Stand, release seat, clean prop, return home or reroute; if actual work starts, terminate the ambient activity safely and immediately surface the work state.
7. Stale/disconnected worker is **not** eligible for a "confirmed off-duty" routine unless it is a persistent independent role mascot with its own explicit simulated state.

**Cikgu:** keep Ustazah Juliana permanently separate from provider agents. Her personality is a modern primary-school teacher with scripted dialogue in Bilik Cikgu. Static can include marking books, idle turn/head/pen gestures or heart bubble; no work-session identity and no claim of teacher AI autonomy.

### 5.2 Animation state design

Minimum actor animation clips:
- `idle_{dir}`, `walk_{dir}`, `turn_{dir}`;
- `sit_down_{dir}`, `seated_idle_{dir}`, `type_{dir}`, `stand_up_{dir}`;
- `read_{dir}`, `talk_{dir}`, `listen_{dir}`;
- `receive_food_{dir}`, `carry_food_{dir}`, `eat_{dir}`, `drink_{dir}`.

**Phase 1 scope:** front/back orientation variants sufficient to prove poses, but define 4 directional facing metadata from the start. Don't force new AI sprites to satisfy exact frame dimensions without validating the sprite sheets in-engine; can use temporary hand-authored placeholders/procedural art until clips are ready.

Character **foot baseline remains the sort anchor** in all clips; sitting may change sprite visual extents but must not arbitrarily move the navigation collider through a desk.

## 6. Navigation constraints specific to object interaction

Comply with Section 11 of the main handoff (navigation-first). This addendum adds:
- An **interaction approach anchor graph**, not only doorway connectivity. Every object in the registry must have at least one accessible approach anchor, except intentionally non-interactive background art.
- Foot collider route validation through **real Phaser physics**, not screenshot inspection only.
- **Main aisle widths:** initial 4–5 reference 48px tiles; lab aisles 2–3; main lab door 3; smaller doors >=2, all recalibrated to world units and sprite feet.
- Route reachable from entrance to lab, from lab to Kantin, and from return door to all 4 initial desk anchors, 2 kantin seats and counter.
- Animated foreground and fancy environmental VFX must never create invisible walking obstacles.
- Dynamic actor collision uses soft avoidance/reservations where possible so multiple agents do not trap the visitor in a main corridor.

## 7. Integration contract for operational agents

Use **fixtures first** with deterministic timestamps; live provider adapters are a *separate milestone* after the interaction vertical slice passes.

```json
{
  "eventId": "fixture-001",
  "source": "simulator",
  "truth": "observed",
  "provider": "fixture",
  "sessionId": "demo-session-01",
  "agentId": "demo-fixer-01",
  "parentAgentId": "demo-advisor-01",
  "workState": "running",
  "activity": "editing",
  "occurredAt": "2026-10-21T00:00:00Z",
  "visibility": "demo"
}
```

This simulated fixture uses `truth: observed` **within the simulator's own fixture timeline** but remains **visibly DEMO** in all UI surfaces; it must **never** be marketed as proof of an actual Claude/Codex event. For production, use `source: claude_code|codex` with a real signed local source/event ID and ensure source classification and privacy are explicit.

Work-to-animation examples:
- `tool_started(Read/Glob/Grep)` -> seated reading/bubble (derived from observed tool event).
- `tool_started(Edit/Write)` -> seated typing.
- `tool_started(Bash/test)` -> monitor testing state, typing/observe.
- `permission_required` -> visible needs-you badge, typing stops instantly; only private operator workflow may respond.
- `agent_completed` -> finish animation, optional return to advisor; report remains in Command Mode.
- Provider disconnected or last event TTL exceeded -> visibly unknown/stale and do not synthesize completion.

No public event endpoint receives raw prompts, paths, repository names, customer data, access tokens, terminal output, or permission actions. Keep existing separate public/operator loopback services and deny-by-default projection. Do not expose Claude-Office's local service directly via Cloudflare.

## 8. Vertical-slice milestone plan and acceptance tests

### M0 — Interface / collision contract (documentation + graybox)
**[User Story]** As a visitor, I want to walk to every interactable without clipping so I can use the lab and kantin.
**Tasks:** draft `WorldInteractable`, reservations, Tiled anchors; create lab/kantin graybox and portal; instrument collision/path overlay toggle.
**AC:** lab and kantin routes are traversable both directions with WASD/touch; all test object approach anchors reachable; no permanently blocked player spawn; existing PR #1 E2E green.

### M1 — Occlusion and seated working pose
**[User Story]** As an operator, I want a worker to use a desk convincingly while its real work status remains accurate.
**Tasks:** split lab desk foreground art; add dynamic depth/occluders, foot anchors, sit/stand pose frames and animated monitor; mock session/task fixture.
**AC:** visually shows **behind desk fascia / in front of chair** from movement into seat, no popping or double-drawn furniture at 0.75×/1×/1.5× camera zoom; live task state independent of animation; actor can stand, leave, and seat releases.

### M2 — Kantin eating and chat sequence
**[User Story]** As a viewer, I want off-duty workers to actually eat and socialize in a real kantin.
**Tasks:** scripted order sequence, food prop, table seat occupancy, seated eating, paired ambient chat and interruption.
**AC:** reserve -> approach counter -> receive -> walk -> sit -> eat -> talk -> stand -> leave; no object clipping; two workers cannot claim same seat; active task instantly interrupts and removes ambient bubble; chat clearly simulation-only.

### M3 — Environmental life and camera
**[User Story]** As a player, I want the academy to look alive while I freely inspect its rooms.
**Tasks:** one tree canopy+leaf effect, one waterfall/pond loop OR fan loop (choose what exists in the approved art), camera free-pan/follow-agent, viewport and reduced-motion tests.
**AC:** tree occlusion when player walks behind it; environmental loop cannot change collision; 30–60 fps as aspirational device-target, **measure actual baseline** at desktop and iPhone-class/mobile browsers; reduced-motion disables/subdues decorative movement.

### M4 — Real Claude integration proof
**[User Story]** As an operator, I want confirmed Claude Code child work to control desk animation without exposing private data.
**Tasks:** isolated local adapter inspired by Claude-Office, correlation IDs, event normalization, duplicate/out-of-order/stale handling, private WebSocket to operator projection.
**AC:** controlled local Claude session starts child -> actor seat+task bubble -> tool stage -> completed/permission wait -> finish; no fabricated steps; public network capture contains no private task fields or tokens.

### M5 — Extend to whole campus
After M0–M4 pass, duplicate **interaction archetypes**, not bespoke scene code, across Library (books), High Council (PR board), QA Lab (test console), Watchtower (monitors), Bilik Cikgu (scripted teacher), and Dataran Akademi (trees/pond). Then expand lab from four proof desks to 12–16 accessible stations. Codex capability-led adapter is independent and must be verified.

### Test matrix / recorded artifacts

| Test | Required evidence |
| --- | --- |
| Path reachability | Tiled route report and Phaser physics traversal across portals |
| Seated occlusion | Screenshots/video before, during, after sit at multiple zooms |
| Object state | Workstation occupied/released; desk monitor reflects mock test activity |
| Dining and chat | Deterministic playback with two actors and one table, no overlap |
| Preemption | New actual/fixture work interrupts meal, bubble/status changes instantly |
| Stale session | UI explicitly UNKNOWN, no fictional idle coffee scene for real session |
| Environment | Tree foreground masking, leaf/water/fan animation and reduced motion |
| Security | Anonymously accessible payloads contain only approved fields, no private server routes |
| Compatibility | Current Sprint 0 E2E/type/lint/bundle/secret and PR tests remain passing |

## 9. Coding-agent kickoff instruction

> Treat this document as an **implementation specification**, not a description of working features. Read existing PR #1, the approved main handoff Section 11, `packages/game/Campus.ts`, `docs/ARCHITECTURE.md`, and the original-sprite license notes. Do not fork Claude-Office as the new game. Preserve Phaser/Tiled for movement and use Claude-Office/Pixel Agents purely as referenced behavioral/rendering patterns with attribution/licensing review.
>
> **Build first:** a lab + kantin *graybox* and Tiled interaction anchors with a real bidirectional portal, before producing final HD art. Then implement one reusable seat/workstation actor state machine with correct split occlusion, typing animation and reservation release; then a kantin counter/table eating + social routine. Use only DEMO fixture work status until the operator backend's real provider adapter is independently wired and tested. Verify the visitor's walking path and private/public isolation after every milestone. No new environments need to be photorealistic to pass this functional proof.
>
> Record before/after screenshots, collision overlays, deterministic test fixtures, test results, limitations and the exact files changed. Do not claim Codex or Claude live parity without observed evidence.

## 10. Scope controls and explicit exclusions

- Not a MAIA v1.0.1 customer feature. Personal showcase; external workplace/ERP information must not be copied to a public repository.
- No full-body inverse kinematics, dynamic chair rigging, pathfinding for every decorative leaf, multiplayer server authority, AI dialogue for ambient chit-chat, or full-campus 8K preload in first vertical slice.
- No automated permission approval, deployment, git write operation or Claude/Codex task launch from anonymous World Mode.
- No reliance on copyrighted TV show art or unlicensed third-party assets. Use original Malaysian retro-school-inspired artwork and keep license notices for reused code.
- No new PR needed for this planning document; attach to the existing PR #1 conversation and keep feature implementation as later reviewed commits/PRs.
