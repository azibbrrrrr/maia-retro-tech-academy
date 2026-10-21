# Asset provenance registry

Reviewed 2026-10-22. Code licensing and artwork permissions are distinct.

| Files                                                                                        | Source                                                                      | Permission / evidence                                                                                                                                                                 | Attribution                    |
| -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| `public/assets/campus.png`                                                                   | Original environment made with built-in image generation for this project   | Owner approved the scene and its implementation on 2026-10-20; no borrowed game tilesets                                                                                              | MAIA Retro-Tech Academy / Azib |
| `public/assets/campus-unified.png`, `art/generated/unified-campus/campus-warm-v9-native.png` | Original built-in imagegen edit of the owner-selected warm project campus | Owner selected this aesthetic, accepted native-preview integration and explicitly authorized clearing obstructed entrances; actual selected source 1670×941, no upscale; [submitted prompt](../art/generated/unified-campus/prompt-v9.md). Retained versions record the sixteen-desk and entrance edits. | MAIA Retro-Tech Academy / Azib |
| `public/assets/sprinter.webp`                                                                | Owner-supplied custom Sprinter pet sprite sheet                             | Owner explicitly authorized using this existing sprite as the explorer in this public personal project                                                                                | Custom asset supplied by Azib  |
| `public/assets/medalist.webp`                                                                | Owner-supplied custom Medalist pet sprite sheet                             | Owner explicitly authorized using this existing sprite as Ustazah Juliana in this public personal project                                                                             | Custom asset supplied by Azib  |
| Tiled geometry, UI and original procedural spike art                                         | Academy project                                                             | Project MIT LICENSE                                                                                                                                                                   | Azib                           |
| Navigation grayboxes and `docs/navigation/*.svg` circulation diagrams                        | Original project geometry/code, exported for the navigation-first milestone | Project MIT LICENSE; temporary studies, not final HD environment art                                                                                                                  | Azib                           |
| Template structure                                                                           | Phaser Studio Inc; pinned in ADR 001                                        | MIT; `licenses/phaser-template-MIT.txt`                                                                                                                                               | Full notice retained           |
| UI font                                                                                      | Operating-system font stack                                                 | No font files distributed                                                                                                                                                             | Not applicable                 |

The custom character sheets are supplied assets, not OpenAI's built-in companion
art. Their project-specific reuse authorization does not establish a separate
blanket license for third-party commercial redistribution. The code's MIT license
does not expand these asset permissions. No real photos, school identity or
biographical data are included. The teacher is a fictional scripted character.

Environment generation used the owner's custom character sheets as style
references and an owner-supplied layout screenshot as a composition reference.
The approved generated concept was edited into a clean environment: interface
and characters removed, both classroom entrances opened, furniture reduced to
leave traversable aisles. The final asset contains scenery only; live Phaser
sprites, collision and React controls are separate. No Agent Town source,
purchased tilesets, TV imagery, music or employer assets were used.

Environment prompt summary: “Preserve the warm Malaysian school cutaway, cream
plaster, timber classrooms, turquoise louvres, tropical courtyard and afternoon
light. Remove UI and characters. Keep actual open classroom thresholds and clear
front-room aisles. Preserve the approved scene composition.”

The entrance collision source is `scripts/map.ts`. The connected graybox catalog
is `packages/world/scenes.ts`; `npm run scenes:generate` exports editable Tiled
TMX/JSON, route evidence and original circulation diagrams. No new final HD room
plates or foreground masks are included in this navigation milestone.
Custom sprites are retained byte-for-byte, including their alpha channels.
Dependencies retain package licenses; build output includes collected notices.

The unified v9 plate is an environment-only preview with sixteen lab desks and open verandah entrances. It preserves the owner-preferred golden light, terracotta, turquoise louvres and tropical detail. It is not a 4K asset; source pixels and logical world units are distinct. Higher-resolution production and exact foreground layers remain later gates. Its geometry registration and runtime acceptance are recorded separately. No characters, UI, provider content or third-party game assets are baked into the plate. The input guide's red rectangles are engineering annotations and do not appear in the selected art.
