# Architecture — continuous campus

The browser is a Vite-built React application hosting one persistent Phaser 3.90
world. `Campus` keeps the visitor and input; `RoomView` retains the whole campus
art, bodies, colliders and interactions while the visitor crosses semantic zones.
`CameraRig` owns the default all-room overview, zone focus, player follow, free
pan, DEMO actor follow and bounded zoom. Camera navigation preserves the visitor's
coordinates. Walking through an opening changes the derived zone only.

`packages/world/unified-campus.ts` is the authoritative global geometry. The
1670×941 source image uses one explicit affine transform into the 3840×2160
world; zones, solid ground footprints, doorway thresholds, approaches, NPC and
spawn use that same transform. Its Tiled JSON/TMX exports show the background as
a correctly sized image-collection tile object. Arcade Physics drives keyboard
and touch movement with the unchanged 14.08 × 7.92 visitor foot body. Static
route validation uses a conservative 16×10 clearance envelope. The old
`scenes.ts` catalogs and room exports remain historical navigation studies.

The typed bridge reports world/camera/interaction snapshots to React. Juliana,
welcome and fixture conversations use anchored, non-blocking speech bubbles;
walking stays active. The structured PR board and directory remain accessible
HTML dialogs that pause gameplay. Input belongs to the focused canvas and clears
on blur, cancellation and pause. The directory and map focus the camera rather
than transferring the visitor. No doorway action, fade or scene swap is needed.

The DEMO registry preserves stable worker/task identities across zone crossings.
It allocates sixteen static lab placements and four separate overflow positions;
additional tracked actors have explicitly absent map positions. It is not a
live provider, a time-based reservation manager or a worker behavior scheduler.
The full-campus map exposes the same global layout and actor positions. Debug
controls report actual physics, camera, texture and lifecycle facts.

## Physical boundary

| Process  | Bind           | Files / inputs          | Routes                                                    |
| -------- | -------------- | ----------------------- | --------------------------------------------------------- |
| Public   | 127.0.0.1:3000 | `dist/public`, demo DTO | `/`, `/healthz`, `/api/public/board`, assets/maps/notices |
| Operator | 127.0.0.1:3100 | local password only     | authenticated `/`, `/api/operator/board`                  |

The public entry point never imports the operator app. The browser build starts
at `apps/public-web`; there is no operator build in `dist/public`. There is no
shared collector, gateway, private cache, proxy or event socket. Only explicitly
registered public static prefixes are served; unknown URLs are JSON 404s.

The operator currently reports OFFLINE / not configured, with no counts. It uses
Basic authentication over the loopback interface, constant-time credential
comparison, exact Host/Origin checks, Fetch Metadata checks, and refuses forwarded
headers. It must not be forwarded to a network or public tunnel. Future remote
operator access requires a separate authentication design.

## Deferred contracts

The [approved living-world interaction plan](plans/2026-10-21-living-world-interaction-vertical-slice.md) adds typed interactables, temporal reservations, separate work/world state, seated foreground occlusion and interruptible dining. These are subsequent implementation gates. A future simulation owner must outlive camera and semantic-zone changes; React must not simulate actor positions or author provider truth.

Real GitHub collection and public allowlist projection remain future work. No server
accepts raw agent events yet. Later collectors must provide a deny-by-default
projection with hostile private fixtures and no private counts. Offline output
must never be substituted with live-looking demo results.

ADRs: [upstream](ADR/001-upstream.md), [origin isolation](ADR/002-origins.md).
