# Approved campus redesign — 2026-10-20

The approved scene is implemented as an actual Phaser world filling the browser
viewport. Original environment art is the backdrop; Sprinter and Medalist are
separate animated sprites. Tiled rectangle objects provide collision for walls,
desks, trees, benches, the welcome board and perimeter. The two open classroom
thresholds and front aisles are physically traversable.

A compact React HUD provides room shortcuts, directory, minimap, D-pad,
proximity-based interaction and browser fullscreen. Desktop 16:9 preserves the
approved composition; mobile zooms and follows the explorer. Juliana remains
stationary with scripted Malay dialogue. Public board data is explicitly DEMO;
agent connections remain offline. Separate public/operator security boundaries
are unchanged.

## Evidence

| Command | Final result |
| --- | --- |
| `npm run check` | Exit 0: typecheck, lint, 5 unit tests, build, bundle scan and 17 browser tests passed |
| `npm run test:e2e` (within check) | 17 passed in 57.9 seconds; no failures |
| `npm run audit:bundle` (within check) | 11 distribution files; no private markers or source maps |
| `npm audit --audit-level=high` | 0 vulnerabilities |
| `.local/bin/gitleaks git --redact` | No leaks |
| `.local/bin/gitleaks dir --redact` | No leaks, including public build |
| `git diff --check` | Exit 0 |

Earlier local browser runs exposed automation latency around narrow waypoints;
press/release timing now runs in the browser and waits for completed render frames
before checking position. Assertions and collision boundaries remain intact.
The final complete run passed after the camera aspect-ratio correction.

- [Desktop campus](evidence/campus-desktop.png)
- [Mobile campus](evidence/campus-mobile.png)
- [Juliana dialogue](evidence/teacher-desktop.png)
- [PR whiteboard](evidence/whiteboard-desktop.png)

Browser tests exercise the full walking route without room shortcuts, actual
wall collision, keyboard/touch input, modal focus and pausing, public-route
isolation, hostile board text, offline behavior and fullscreen entry/exit/error
handling, whole-character proximity clicks and reactive reduced-motion idle
behavior. Viewports checked: 1440×900, 1000×1000, 390×844, 844×390 and 320×568; screenshots
also cover 1280×720. Route control uses browser-side key press/release timing so
external automation latency cannot keep keys held across a narrow doorway.

## Design decisions and limits

- Use the approved original generated scene as a backdrop with real Tiled
  colliders and animated actors. This retains visual fidelity; future furniture
  relocation requires updating both the artwork and geometry.
- Open classroom doorways and reduce furniture to create clear aisles. This
  deliberately adjusts the preview so the map is honestly traversable.
- Reuse the existing dedicated feature checkout; no production checkout is used.
- Astra supplied architecture and geometry guidance, and Sol built the viewport
  shell. Both delegated agents then hit a usage limit. The controller recovered
  their saved work, completed integration and ran verification. Astra subsequently
  completed a read-only final review with no blocking findings. Sol fixed both
  minor findings (whole-character teacher click target and reduced-motion idle
  animation); Astra's scoped follow-up confirmed both addressed without new
  important regressions. The final combined suite passed after these fixes.

No public deployment, Cloudflare tunnel, real GitHub collector, public allowlist
projection or live agent feed exists. Safari, physical devices and sustained
performance are unverified. The Phaser vendor chunk still emits its size warning.
Custom asset permissions are separate from code licensing; see the
[asset registry](ASSET_LICENSES.md).
