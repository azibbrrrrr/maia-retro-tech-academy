# Asset provenance registry

Reviewed 2026-10-20. Code licensing and artwork permissions are distinct.

| Files | Source | Permission / evidence | Attribution |
| --- | --- | --- | --- |
| `public/assets/campus.png` | Original environment made with built-in image generation for this project | Owner approved the scene and its implementation on 2026-10-20; no borrowed game tilesets | MAIA Retro-Tech Academy / Azib |
| `public/assets/sprinter.webp` | Owner-supplied custom Sprinter pet sprite sheet | Owner explicitly authorized using this existing sprite as the explorer in this public personal project | Custom asset supplied by Azib |
| `public/assets/medalist.webp` | Owner-supplied custom Medalist pet sprite sheet | Owner explicitly authorized using this existing sprite as Ustazah Juliana in this public personal project | Custom asset supplied by Azib |
| Tiled geometry, UI and original procedural spike art | Academy project | Project MIT LICENSE | Azib |
| Template structure | Phaser Studio Inc; pinned in ADR 001 | MIT; `licenses/phaser-template-MIT.txt` | Full notice retained |
| UI font | Operating-system font stack | No font files distributed | Not applicable |

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

Editable collision source is `scripts/map.ts`, with Tiled TMX and JSON exports.
Custom sprites are retained byte-for-byte, including their alpha channels.
Dependencies retain package licenses; build output includes collected notices.
