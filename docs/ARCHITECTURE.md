# Architecture — navigation milestone

The browser is a Vite-built React application hosting one persistent Phaser 3.90
world. `Campus` keeps the visitor, input and transition state; `RoomView` replaces
room-local graphics, bodies, colliders and interaction zones as the visitor moves
between eight canonical spaces. `CameraRig` owns player follow, free pan, DEMO
actor follow and bounded zoom. Room switches do not reload the document.

`packages/world/scenes.ts` is the authoritative geometry catalog, using a 48 px
logical reference. Its Tiled TMX/JSON exports contain solids, reciprocal portals,
safe spawns, reserved circulation and interaction approaches. The approved
entrance image and original 22 collision objects remain; seven new rooms are
explicitly temporary navigation studies. Arcade Physics drives actual keyboard
and touch movement with the independently checked 14.08 × 7.92 visitor foot body.

The typed bridge reports world/camera/interaction snapshots to React. Juliana,
welcome and fixture conversations use anchored, non-blocking speech bubbles;
walking stays active. The structured PR board and directory remain accessible
HTML dialogs that pause gameplay. Input belongs to the focused canvas and clears
on blur, cancellation and transition. Explicit floor transfers require a fresh
interaction; directory shortcuts offer a separate accessible route.

The opt-in DEMO registry preserves stable worker/task identities across unloaded
room views. It currently allocates static placements and overflow; it is not a
live provider, a time-based reservation manager or a worker behavior scheduler.
The room map and whole-campus graph expose the authoritative layout. Debug
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

The [approved living-world interaction plan](plans/2026-10-21-living-world-interaction-vertical-slice.md) adds typed interactables, temporal reservations, separate work/world state, seated foreground occlusion and interruptible dining. These are subsequent implementation gates. A future simulation owner must outlive disposable room views; React must not simulate actor positions or author provider truth.

Real GitHub collection and public allowlist projection remain future work. No server
accepts raw agent events yet. Later collectors must provide a deny-by-default
projection with hostile private fixtures and no private counts. Offline output
must never be substituted with live-looking demo results.

ADRs: [upstream](ADR/001-upstream.md), [origin isolation](ADR/002-origins.md).
