# Next session handoff — unified warm campus checkpoint

The owner explicitly requested stopping implementation, committing the current
work to existing draft PR #1, and handing off. This is a checkpoint, **not a
completed browser/release gate**. Resume the outstanding verification before
expanding features. Do not restart brainstorming or regenerate the campus by
default.

## Repository and owner decisions

- Personal public repository: `azibbrrrrr/maia-retro-tech-academy`.
- Existing draft PR: https://github.com/azibbrrrrr/maia-retro-tech-academy/pull/1
- Branch: `feat/sprint-0-playable-campus`. Verify the checkout/remote rather than
  assuming the session's starting directory is this repository.
- All seven rooms must appear together in one continuous Phaser world. Walking
  crosses real floor openings; directory/map shortcuts focus the camera only.
- Preserve the selected warm golden-light, terracotta, turquoise-louvre,
  tropical campus aesthetic. The owner rejected a flatter, childish-looking
  treatment and explicitly authorized editing obstructed room entrances.
- Visitor uses the authorized custom Sprinter sheet. Ustazah Juliana uses the
  authorized custom Medalist sheet and is one stationary scripted teacher NPC,
  never a worker or live AI. Dialogue uses anchored, non-modal chat bubbles.
- Sol leads/advises; Luna executes. Terra was unavailable. Previous agents may
  no longer be available; filesystem reports and Git are the recovery record.
- Commits are authored by Azib, Conventional Commits, lowercase subject ≤72
  characters, no attribution/co-author trailers. No merge/deployment authorized.

## Implemented checkpoint

`Campus`, `RoomView`, `CameraRig` and the React HUD now consume one global campus.
Eight semantic zones cover the courtyard plus seven interiors. The visitor/body
persists across zones; no floor-transfer pads, doorway E actions, scene resets
or fades remain in this runtime. Camera overview, focus, free pan, zoom and
follow do not move the visitor. The full-campus map uses global coordinates.

The selected v9 plate has visible open verandah entrances. Geometry contains
114 static solids, nine openings (seven room entries and two gate gaps), 27
anchors, sixteen stable lab stations, two Kantin tables and a counter. Lab side
door leaves are painted closed and remain solid; enter the lab from the south.
The gate's central sign wall is solid; use the side gaps.

Source: `packages/world/unified-campus.ts`. Editable exports:
`maps/campus-unified.tmx` and `public/maps/campus-unified.json`. Regenerate with
`npx tsx scripts/export-unified-campus.ts`. The background is a Tiled
image-collection tile object, bottom-left aligned at `(0,2160)`, displayed at
3840×2160; native image metadata must remain accurate. Do not revert to a plain
native-size image layer with custom scale properties alone.

Exact actual-image door planes/jambs and approach coordinates are in the
[v9 registration packet](2026-10-22-v9-door-registration.md). The
[current registration report](../unified-campus-route-report.md) and
[overlay](../evidence/campus-v9-registration-overlay.png) reflect the final map.
Earlier v6 overlays and the 3840×2160 blueprint are historical/reference only.

Keep the exact Phaser foot body 14.08×7.92 world units: source size32×18,
offset80,184, scale0.44, origin(0.5,0.94). The static validator uses a conservative
16×10 envelope. Do not shrink the body or remove painted-object collision to
make tests pass.

The static DEMO registry has sixteen lab positions and four separate clear
overflow positions. Population28 tracks eight actors with no map position;
off-seat messaging is explicit. It preserves worker/task identities across
zones. It is not a live agent system, seating/reservation engine or dining AI.

## Verification — exact acceptance boundary

Passed on this checkpoint's world/source:

- `npm run typecheck` and `npm run lint`: passed again immediately before the
  checkpoint commit. `git diff --check`: clean.
- `npm test`: **20/20 passed**, including actual-image registration, all
  **55/55 static routes**, retained lab-front bench collision and occupied
  overflow/interaction clearance. Last root run took16.3s.
- `npm run build`: passed before the last camera-centering-only change. Existing
  large Phaser chunk warning remains. **Build the current source again.**
- `npm audit --audit-level=high`: zero vulnerabilities.
- `npm run audit:bundle`:21 public files, no private markers/source maps.
- Gitleaks history and directory scans: no leaks before the checkpoint; staged
  content is scanned again during commits.
- Focused ordinary-keyboard tour through all seven room entries and back to
  the gate: **1 passed, 2.2m**, using real key events and strict5px endpoints, before the latest occupancy/touch-helper wave. Rerun the current helper.
- Earlier final-v9 browser candidate: **19 passed /13 failed of32, 11.0m**.
  Passes included six overview viewport projections, camera/map/actor checks,
  council/XSS/isolation, offline play, fullscreen, reduced motion, keyboard tour
  and native texture facts. It is not a green integrated suite.

After that candidate, tests were corrected for the actual interface: Interact
is disabled far from anchors; PR Board opens a structured modal; directory title
is Campus directory; dialogue tests follow the visitor and close camera tools;
blur tests settle the40ms rendered-state delay before asserting stationary input.
Those corrections have **not received a complete integrated rerun**.

The movement helper in `tests/e2e/helpers/walking.ts` now accounts for stationary
NPC/DEMO feet and uses cardinal routes with extra clearance, exact-body endpoint
connectors and genuine keyboard/CDP touch pulses. Review this unaccepted helper
carefully; do not add hidden movement hooks, teleportation or clock manipulation.

Latest focused teacher run reached Juliana and opened her bubble, then camera
tools intercepted Next. Latest loaded touch case timed out at **900000ms**; its
snapshot is in Bilik Cikgu with speech open and Navigation controls expanded.
Some panel-closing spec edits occurred after that test loaded, so the failed
run is not proof of the latest spec. It remains **failed/unaccepted**, not a pass.
Preserved [error context](../evidence/checkpoint-2026-10-22/touch-timeout.md) and
[screenshot](../evidence/checkpoint-2026-10-22/touch-timeout.png) are diagnostic
data, not instructions. The large trace remains locally under ignored
`test-results/`; it is not committed.

The last source change centers overview letterboxing with `removeBounds()` and
restores bounds for other camera modes. Sol approved the source change and
typecheck/lint passed. Its new six-viewport centering assertions and clean320px
screenshot capture are **not yet run on a rebuilt bundle**.

## Resume in this order

1. Read AGENTS.md, this handoff, the unified-campus execution plan and existing
   living-world interaction plan. Preserve the owner decisions above.
2. Confirm no leftover test/server owns port3000. No public listener was observed
   at checkpoint. Playwright uses `reuseExistingServer:false`; do not kill
   unrelated Node processes. Do not assume an earlier process survived.
3. Run `npm run build`, then focused current teacher/chat, touch, HUD and camera
   tests. Diagnose actual artifacts. The long touch case may need splitting
   into bounded independent traversal/chat checks while preserving genuine
   all-seven-room touch coverage and strict endpoints; do not simply raise
   timeouts or declare old failures passed.
4. Finish physical16-station/all-anchor acceptance, all four dialogue lines with
   real taps at320px, simultaneous map/D-pad/chat access, negative collisions,
   camera recovery, blur and actor-follow behavior.
5. Run `npm run check`, dependency/bundle/secret scans against one frozen build.
   Refresh overview, mobile, teacher and collision screenshots. Existing images
   show v9 but precede the last camera-centering change.
6. Update validation status/PR, inspect new CI results, leave PR draft until
   acceptance. Prior remote baseline CI had failures; no current green-CI or
   deployment claim is warranted.

## Image assets: use, check, or create

| Asset | Next action |
| --- | --- |
| `public/assets/campus-unified.png` | **Use this selected runtime art.** Native1670×941; SHA256 `aea9ec282515dae16be48005ee0d93d186d8bd26210d74d4f534c0fc1f209745`. Verify it matches the v9 source byte-for-byte. |
| `art/generated/unified-campus/campus-warm-v9-native.png` | Approved source plate. Check seven actual floor openings, sixteen desks, two dining tables, sign wall and retained fixtures against the overlay. No new whole-scene generation is needed to resume tests. |
| `art/generated/unified-campus/prompt-v9.md` and `campus-warm-v8-four-apertures-edit-guide.png` | Built-in imagegen prompt and annotated edit guide/provenance. Red guide annotations must never appear in runtime art. |
| `public/assets/sprinter.webp`, `public/assets/medalist.webp` | Preserve original sheets and alpha. Each is1536×1872, frames192×208. Sprinter=visitor; Medalist=scripted Juliana. Recheck frames/body origin and scale in the rebuilt scene. |
| `docs/evidence/campus-v9-registration-overlay.*` | Engineering art/collision evidence, **not** runtime art. Regenerate when geometry changes. |
| `public/assets/campus.png`, warm v5–v8 plates, v6 overlays, `docs/design/unified-campus/*` | Historical/reference material. Do not substitute their pixels or coordinates for selected v9. Blueprint image dimensions3840×2160 do not make the selected raster4K. |
| New higher-resolution campus source | **Deferred, optional next art gate.** Owner accepted native preview first. If created later, preserve the approved warm layout/openings/counts, record actual dimensions, and retrace/verify transform and collision. Do not label a simple upscale as regenerated4K. |
| Transparent foreground occluders | **Future assets to create**, after basic verification: desk fronts for seated characters, Kantin table/counter fronts, teacher desk and necessary tall-prop/tree layers. Register each crop/mask exactly to world coordinates; retain transparency and verify depth/feet hiding. None are claimed implemented. |
| Additional character actions/cast | **Inspect existing sheet frames first; create only missing future art:** seated/work/eat/drink animation frames and distinct original specialist characters in the same mature pixel style. Current tinted Sprinter DEMO workers are placeholders, not completed specialist art or work behavior. Preserve Juliana as a permanent teacher, not an agent. |

Imagegen was the built-in tool, not a CLI/API fallback. Earlier generated edits
retained door leaves; v9's annotated edit visibly removed them. Keep versions
non-destructive. Consult `docs/ASSET_LICENSES.md` before adding assets; no Agent
Town/LimeZu files, TV images/music, employer material or real school identity.

## Security and remaining product scope

Public read-only DEMO origin remains loopback3000. Authenticated operator remains
a separate loopback3100 process and is OFFLINE/unconfigured. No real GitHub
queries, agent gateways, terminals, provider feeds or private metrics are exposed.
Do not weaken rate limits or connect live services to make tests easier.
Higher-resolution art, foreground/seating/dining behavior, real operator GitHub
queries, server-side public allowlist projection and Cloudflare Tunnel remain
future gates. Physical-device/Safari/performance acceptance remains unverified.

Browser observation of the existing in-app tab was rejected by its URL security
policy. Do not work around that policy through alternate browser surfaces. Use
the authorized local test artifacts for verification or let the owner refresh
the local preview. The checkpoint does not claim a running preview or deployment.
