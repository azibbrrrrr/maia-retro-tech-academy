# Architecture — Sprint 0

The browser is a Vite-built React application hosting one Phaser 3.90 scene.
`Campus` loads a 32 × 22 Tiled JSON map on a 48 px grid. The invisible collision
layer drives Arcade Physics, including walls and furniture. The teacher has a
static physics body. The independent visitor has normalized movement and a foot
collider. The camera follows the visitor; rooms have two-tile entrances.

`packages/world/content.ts` separates scripted teacher dialogue and room IDs
from rendering. A typed in-memory bridge carries position and interaction events
between Phaser and React. Native HTML dialogs trap focus; gameplay stops while
one is open. Input belongs to the focused canvas and is cleared on window blur.
Pointer cancellation releases touch movement. A room directory offers an
accessible alternate route without removing the walkable campus.

## Physical boundary

| Process | Bind | Files / inputs | Routes |
| --- | --- | --- | --- |
| Public | 127.0.0.1:3000 | `dist/public`, demo DTO | `/`, `/healthz`, `/api/public/board`, assets/maps/notices |
| Operator | 127.0.0.1:3100 | local password only | authenticated `/`, `/api/operator/board` |

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

Real GitHub collection and public allowlist projection are Sprint 3. No server
accepts raw agent events yet. Later collectors must provide a deny-by-default
projection with hostile private fixtures and no private counts. Offline output
must never be substituted with live-looking demo results.

ADRs: [upstream](ADR/001-upstream.md), [origin isolation](ADR/002-origins.md).
