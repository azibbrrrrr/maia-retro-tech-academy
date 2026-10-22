# Security boundary and release gates

Sprint 0 contains no private connector or control plane. Demo cards are selected
server-side from fixed public educational content; the public server cannot query
operator state. Neither service accepts mutation requests.

Public HTTP routes:

- `GET/HEAD /`
- `GET/HEAD /healthz`
- `GET/HEAD /api/public/board`
- `GET/HEAD /assets/*`, `/maps/*`, `/dependency-notices.txt`

All other paths return 404; mutation methods return 405. No SPA catch-all exposes
operator paths. Responses set CSP, no-sniff and no-referrer; no CORS grants exist.
Operator responses are no-store and reject framing. Both servers have bounded
request bodies and rate limits. Tokens never enter the browser.

The bundled board uses React text rendering, not HTML injection. Fixture titles
are deliberately tested with malicious HTML. No external URLs are accepted by
the demo DTO. A future real board needs validated GitHub URLs and a strict
allowlisted public serializer before live upstream objects may be used.

## Verification coverage

- Public endpoints cannot retrieve operator routes, local files, source maps or
  credentials. Unknown and encoded traversal routes are checked.
- Operator without password fails to start; missing authentication returns 401;
  foreign Host, public Origin, cross-site and forwarded requests return 403.
- Real touch events, keyboard movement, Tiled wall collision and complete campus
  route are exercised by Chromium. Dialogs pause movement and restore focus.
- Build contents are scanned for private fixture values and local environment
  identifiers. Gitleaks scans history and release source.
- Locked dependencies are audited; asset provenance is documented separately.

## Not yet release-approved

No external HTTPS/tunnel test, real GitHub least-privilege credential review,
private-to-public projection test, live feed validation, load test or independent
mobile-device performance measurement has been completed. No deployment exists.
Do not expose a Vite development server or operator listener via a tunnel.
