# Navigation-first campus milestone — 2026-10-21

This milestone follows Section 11 of the [owner-approved living-campus handoff](plans/2026-10-20-multi-zone-living-campus-handoff.md). It establishes a playable navigation gate before new HD room artwork. The entrance retains its approved image; seven additional spaces are deliberately low-detail navigation studies. Public data remains DEMO and agent sources remain OFFLINE.

## What can be inspected

- Eight canonical spaces with reciprocal, explicitly marked floor transfers.
- One typed geometry source exported to editable Tiled TMX and browser JSON.
- Sixteen engineering desk approaches, reserved primary/secondary lanes and separate worker seats.
- Opt-in DEMO populations, stable actor/task IDs and off-room/off-seat overflow independent of work status.
- Logical campus/room maps, player follow/free pan/DEMO actor follow and collision diagnostics.
- One permanent scripted Juliana in Bilik Cikgu. Conversations use anchored speech bubbles following the owner's latest request.

[Geometry inventory](navigation/README.md) · [circulation report](navigation/route-report.md) · [runtime guide and evidence](navigation/runtime.md)

## Verification gate

| Check                                      | Current evidence                                                                                                     |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| Static geometry                            | 8 scenes / 120 routes; no reported issues                                                                            |
| Source/export agreement                    | 28 generated artifacts byte-reproducible; all 8 TMX layer/property trees independently matched JSON                  |
| Entrance preservation                      | All 22 original collision objects and IDs unchanged                                                                  |
| Unit/security baseline                     | 12 tests passed at geometry commit `2bec57c`                                                                         |
| Full runtime, speech bubbles and traversal | `npm run check`: 12 unit tests and 45 browser tests passed (23.7 min); bounded corrections verified separately below |
| Independent implementation review          | Geometry approved; Sol accepted runtime and whole local navigation milestone at `741266e`; no open findings          |
| Public deployment                          | None                                                                                                                 |

The complete baseline run includes typecheck, lint, production build and bundle audit. Review corrections receive focused verification before final acceptance; that revision and the baseline run are recorded separately. Intermediate failed or interrupted runs are not green acceptance evidence.

## Exact local verification

- `npm run check`: typecheck, lint, 12 unit/static/security tests, production build, 19-file public bundle audit and 45 Chromium browser tests passed (23.7 minutes). This completed baseline predates the bounded map/speech review corrections.
- `npx playwright test tests/e2e/map.spec.ts tests/e2e/speech.spec.ts tests/e2e/sprite.spec.ts --grep 'navigation maps locate|speech bubbles follow|320px touch chat|teacher visible head'`: 7 focused cases passed (33.6 seconds) at `4700c366`. They cover local/off-room/off-seat actor map states, post-open pan/zoom at four speech viewports, all four teacher lines via real touch, movement/Close/welcome bounds and distant/nearby teacher clicks.
- Post-correction `npm run typecheck`, `npm run lint`, `npm test` (12/12), `npm run build` and `npm run audit:bundle` passed. `npm audit --audit-level=high` reported zero vulnerabilities. Repository-local Gitleaks history, directory and staged-diff scans found no leaks; `git diff --check` passed.
- At `741266e`, `npx playwright test tests/e2e/map.spec.ts tests/e2e/speech.spec.ts --grep 'expanded campus graph|320px touch chat' --reporter=line` passed 6 cases (13.7 seconds): five map viewports and the 320px open-chat/expanded-map touch flow. Typecheck, lint, build, bundle and staged/history secret checks also passed. The baseline long traversal suite was not repeated for these UI-only changes. CI for the final pushed commit is reported by [PR #1 checks](https://github.com/azibbrrrrr/maia-retro-tech-academy/pull/1/checks); a local baseline is not a claim of final-head CI success.

The browser walkthrough uses real keyboard/touch physics for all seven room round trips and 59 room approaches, including all 16 desks. Five viewport cases repeat portal/camera recovery; real touch traverses all seven links both ways. Camera projections, physical wall denial, transition input clearing, room cleanup, reduced motion and public/operator security have separate assertions. Directory-based setup is kept separate from movement-based route proof.

## Measured headless baseline

[Raw measurements](navigation/evidence/headless-performance.json) record Chromium 156 new headless / Playwright 1.64.1 on Apple M3, macOS arm64, Node 25.9.0, ANGLE Metal renderer. Each sample follows a distinct entrance-to-lab transfer and warmup, then 120 consecutive browser animation frames.

| Tracked DEMO workers | In lab | Mean raw frame interval | p95     | Transfer |
| -------------------- | ------ | ----------------------- | ------- | -------- |
| 4                    | 4      | 16.6650 ms              | 16.7 ms | 299.0 ms |
| 12                   | 12     | 16.6658 ms              | 16.8 ms | 296.5 ms |
| 20                   | 16     | 16.6658 ms              | 16.7 ms | 295.4 ms |

These are headless scheduling and transfer measurements, not physical mobile FPS or GPU render timings. In-room counts include off-camera instances. The three existing textures total 29,296,544 estimated RGBA bytes (27.94 MiB), excluding renderer overhead/mipmaps/compression. There are no additional room background textures. The existing Phaser chunk-size warning remains (1196.46 kB minified / 318.59 kB gzip).

## Implementation decisions and tradeoffs

- Reused the existing dedicated feature checkout and PR #1 to continue the owner's work. This shares the checkout with any concurrent editor, so changes were checked before commits.
- Delivered navigation before HD art, Command Mode, telemetry and deployment. The tradeoff is intentionally temporary room visuals until their geometry is accepted.
- Migrated `gate`, `council`, `teacher` to canonical scenes and kept Juliana only in `cikgu_room`. Existing coordinate-based tests required migration while retaining behavior assertions.
- Used seven visible clear-floor transfer pads from the entrance hub, preserving the accepted painted architecture and collision. The tradeoff is explicit floor transitions until future architectural artwork is aligned.
- Chose a 1536×1152 lab graybox with validated 240/144-unit spines, 144-unit doorway and 120-unit desk gaps. Future HD pixel dimensions remain independent; art alignment may require a reviewed iteration.

## Subsequent CI result

The historical separate-room revision `ee085d4` subsequently completed Linux CI with 42 browser cases passing and 5 failing (39.2 minutes); both provenance jobs passed. Failures involved timed movement displacement, long-route deadlines and touch traversal. Local baseline/focused successes above remain local evidence, not final-head CI success. The owner has since replaced that presentation with the continuous-campus direction; its tests and geometry require a new acceptance run.

## Updated execution direction

The owner subsequently approved the [living-world interaction vertical slice](plans/2026-10-21-living-world-interaction-vertical-slice.md) in [PR comment 6318675933](https://github.com/azibbrrrrr/maia-retro-tech-academy/pull/1#issuecomment-6318675933). Preserve this connected navigation baseline while first proving four workstation archetypes, two Kantin tables and a direct bidirectional door. Typed interactables/reservations, separate work and choreography state, seated desk occlusion, dining/preemption and reduced-motion environment effects precede detailed art expansion. These features are not implemented by the navigation milestone. Sol now leads/advises, with Luna executing; Terra is unavailable in this session.

## Outstanding release gates

- Independent HD environment plates for each room, aligned overlays, selective foreground occlusion and measured final texture/load/frame performance.
- Command Mode, real authorized GitHub queries and server-side public allowlist projection.
- Capability-verified provider observation, provenance/freshness, supervised task tree and later ambient routines.
- Physical mobile devices, Safari and sustained device performance. Headless Chromium measurements are not evidence for those devices.
- Separate public-origin security release review and verified Cloudflare exposure. The authenticated operator remains localhost-only; no tunnel exists.
