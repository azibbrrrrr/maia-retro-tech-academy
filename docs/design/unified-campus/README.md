# Unified campus U0 floorplan

**Reference only.** This guide was used before selecting the warm v9 artwork. The current runtime source is `public/assets/campus-unified.png` (1670×941), registered to the 3840×2160 world by `packages/world/unified-campus.ts`. Its actual routes and editor map are documented in [the registration report](../../unified-campus-route-report.md). The guide's 1:1 transform, central gate and furniture coordinates below are not the runtime geometry.

This folder contains a fixed-layout diagram reference for a future unified campus plate. It is not generated art, a production map, or an accepted collision layer. The PNG is intended to lock the image generator's composition and countable functional areas before visual art generation.

`campus-contract.json` is the coordinate source of truth; `campus-contract.ts` defines its typed shape. `render_blueprint.py` draws the SVG directly from that contract, and the PNG is a native-size browser render of the SVG.

The logical world and image are both 3840×2160 with a 1:1 transform and no crop or offset. The 48-unit reference grid is 80×45. A 1920×1080 overview therefore fits at 0.5 scale. The current tested visitor foot body stays 14.08×7.92 world units; image resolution does not change its size.

All seven interiors are visible in one continuous floorplan: library upper left, NOC upper right, the largest/deepest engineering lab across the upper center, council and QA at the middle flanks, Kantin and Cikgu on the lower flanks, central courtyard at the bottom center, and a walkable gate above a 120-unit road strip at the bottom. The outer gate opening is 400 units wide and the safe spawn is at world point [1920, 2100], south of the gate and inside the image. Corridor rectangles and explicit openings connect every interior to the courtyard and gate. Openings are floor gaps with no wall segment or scene transition.

The engineering lab has exactly sixteen desks in a four-by-four array. Its 98-unit paired-row gaps, a 230-unit cross aisle, 192-unit side aisles and 432-unit center aisle leave registered chair and use locations. Kantin has exactly two dining tables and a service counter with a separate queue approach. Cikgu has one teacher desk and one visitor approach. Two empty garden circles mark possible aligned foreground tree cutouts without covering a doorway or designated circulation path.

Rectangles use the explicit [x1, y1, x2, y2] encoding, where width and height are endpoint differences. The validator floods the connected floor geometry with the existing 14.08×7.92 visitor body envelope, treating walls and solid furniture as obstacles, and checks all seven rooms plus the registered workstation, counter, and table approaches from the gate spawn.

The contract is provisional geometry for image registration. After image generation, inspect the actual pixels and register collision, doors, aisles, use anchors and any foreground crops to the selected plate. Do not stretch room regions independently or claim that this guide proves walkability in the final image.
