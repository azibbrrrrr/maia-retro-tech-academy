# Unified campus: one visible world, aligned art and navigation

**Owner direction (2026-10-21):** show every room together in one continuous campus, with the rendered background and walking map aligned. Regenerate the high-resolution image using imagegen before integrating it. This replaces the older independent-room/floor-transfer presentation; its accepted navigation tests remain historical evidence for that version.

**Approved context:** the living-world interaction specification still governs future interactables, reservations, seated occlusion, dining/preemption, environment effects and trusted work status. Those features must use the continuous world rather than reintroducing separate room scenes. Sol leads/advises; Luna executes. Terra is unavailable in this session.

**Checkpoint:** the owner stopped implementation on 2026-10-22. See [next-session handoff](../../handoffs/2026-10-22-next-session.md) for the exact verification boundary and asset inventory. U0/U1 are source-reviewed; U2 is incomplete.

## Shared constraints

- One persistent Phaser world, seven semantic room zones and the central entrance/courtyard. Walking through visible doors changes the derived zone only. No floor-transfer pads, required E doorway actions, fades, player resets or room-loading transitions.
- Default overview fits every room using the smaller viewport/world scale, with a fit-derived minimum zoom. Follow, focus, pan and zoom remain camera actions. Directory controls focus/select places without teleporting the visitor.
- Original high-resolution target was 3840×2160. The built-in generator returned 1672×941, and the owner explicitly chose native-preview integration with higher-resolution art as a later gate. Selected source is `public/assets/campus-unified.png` (warm v9, actual 1670×941), with world 3840×2160 and the same explicitly recorded global affine transform on image, map and geometry. World units are not source pixels; no upscaling is claimed. Keep the existing 14.08×7.92 foot body and custom Sprinter/Medalist assets unless a reviewed change is necessary.
- The map, Tiled collision, actual artwork registration, doors, spawns, desks and interactions share one coordinate contract. Any generation drift must be corrected or traced in actual-image geometry before acceptance.
- Sixteen individually usable lab stations, with four reserved for the later interaction proof; two Kantin tables and a counter; one permanently scripted Juliana. Keep doors and circulation clear before decorative density.
- No baked characters, dialogue/HUD or private/live data in the environment. Preserve non-blocking speech, accessibility, reduced motion, DEMO/OFFLINE provenance, public read-only loopback3000 and authenticated operator loopback3100.
- No deployment or live provider claim. No unlicensed source/art. Conventional commits authored by Azib, lowercase subjects, no attribution trailers.

## U0 — Art and geometry registration

- [x] Create a deterministic 3840×2160 floorplan guide and shared geometry data; Sol reviewed circulation/counts/scale. This remains reference-only after selecting actual artwork.
- [x] Generate with the built-in image tool, inspect actual dimensions/counts and save source/prompt/provenance. Owner rejected a flatter candidate and selected the warm terracotta/lush aesthetic; v5 preserves that style with a minimal sixteen-desk edit; v6–v8 retained ambiguous door panels; the annotated v9 edit creates visibly open verandah entrances while retaining the composition. Native 1672×941 integration accepted; 4K deferred.
- [x] Register actual image pixels to world geometry. Export one editable Tiled map and exact map overlay. Validate every advertised approach and all room connections with the foot envelope; no invisible teleports to conceal blocked artwork. V9 corrects the actual wall planes and apertures; Sol approved the final 114 solids, nine openings and 55/55 static routes. Physical/browser acceptance is tracked separately in U2.

## U1 — Continuous Phaser runtime and matching map

Implementation/source review complete. The final overview-centering change has type/lint and source review only; rebuild and browser assertions remain pending.

- [x] Replace room swapping with one persistent campus view/body space. Semantic room IDs remain for labels and filtering, with stable worker/desk IDs.
- [x] Use full-campus overview on first load and explicit Overview/Follow/Focus controls. Preserve visitor coordinates during camera navigation; allow mobile inspection zoom without losing access to the overview.
- [x] Derive the minimap from the same registered geometry and full-campus bounds, including player/selected-worker location and honest off-seat status.
- [x] Move Juliana and all fixture approaches to their actual art locations. Preserve speech progression/proximity/close/input behavior and safe static DEMO capacity across zones.

## U2 — Observable acceptance

- [ ] Prove actual keyboard and touch walking from the entrance through all seven physical door openings and back, without directory teleports. Reach all sixteen stations, counter, both tables, boards and Juliana.
- [ ] Capture overview and image/collision/map overlays, plus door/desk boundary evidence at fit and inspection zoom. Check all-room visibility at the five existing viewports and a larger desktop viewport.
- [ ] Preserve negative collision/security/proximity tests, mobile simultaneous map/speech/control access, camera recovery, reduced motion and stable actor identity. Migrate intentionally obsolete room-portal assertions explicitly.
- [ ] Measure actual new texture dimensions/bytes, load and frame facts on the named environment; do not reuse the prior plate's performance claims.
- [ ] Run focused proofs, then one integrated validation suite, bundle/dependency/secret scans and Sol review. Report exact successes and remaining device/Safari/art-layer/integration gates; update the existing draft PR.

The background plate alone is not proof of walking, seating, foreground masks or interaction behavior. U0–U2 acceptance precedes the living-world interaction-engine slice in this unified campus.
