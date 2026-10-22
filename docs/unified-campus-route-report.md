# Unified campus v9 registration and static routes

Source plate: `public/assets/campus-unified.png`, native 1670×941, SHA-256 `aea9ec282515dae16be48005ee0d93d186d8bd26210d74d4f534c0fc1f209745`.
World: 3840×2160; source-to-world scales x=2.29940120 and y=2.29543039. The transform is global; the source plate remains 1670×941 and is not represented as regenerated 4K art.
Spawn: world (1503.8, 1891.4), aligned to the visible west-side gate opening around the solid centre sign wall. Both gate openings are modeled and route checked.

Static navigation checks 55 targets from the safe gate spawn: 55 pass and 0 fail. Targets include every anchor, NPC, doorway threshold, and both doorway approaches. Each route uses a conservative 16×10 world-unit static clearance envelope around the actual 14.08×7.92 world-unit Phaser body, against registered walls, furniture, and ground-footprint landscaping. The report has 0 total issues because it also checks each doorway's approach-to-threshold continuity.
Validation scope: the prior separate-room navigation baseline completed `npm run check` green (12 unit and 45 browser tests, 23.7 minutes) before the unified-campus migration; it is historical evidence for that runtime. Current changed U0 files are covered by the focused `tests/unified-campus.test.ts` cases and 55/55 static routes. The integrated browser suite is reserved for the post-U1 acceptance pass.

| Door / physical opening | Native clear width | World width | Width after clearance envelope |
| --- | ---: | ---: | ---: |
| library-east | 75px | 172.16u | 156.16u |
| lab-south | 106px | 243.32u | 227.32u |
| watchtower-west | 72px | 165.27u | 149.27u |
| council-east | 81px | 185.93u | 169.93u |
| qa-west | 78px | 179.04u | 163.04u |
| kantin-east | 119px | 273.16u | 257.16u |
| cikgu-west | 106px | 243.32u | 227.32u |
| outer-gate-west | 23px | 52.79u | 36.79u |
| outer-gate-east | 20px | 45.91u | 29.91u |

The engineering lab has exactly sixteen stable `station-01`…`station-16` IDs in four columns and four rows. Actual v9 ground silhouettes are traced at native x bounds 586–663, 713–791, 878–952, 1010–1085 with seat centers x=625, 752, 915, 1048 and side approaches x=548, 815, 861, 988. Inter-column gaps measure 50, 87, 58 native pixels; the minimum is 114.97 world units before the 16-unit clearance body and 98.97 units after it. Station footprints touch vertically, so no through-row clearance is claimed.

Seven room entries have continuous floor crossings to the campus. The Library, Watchtower/NOC, Council and QA openings use the actual inner wall planes from the v9 native-source trace; the closed lab side leaves remain solid and are not listed as doors. The Lab south entrance passes between the two retained jambs and planter footprints. Kantin and Cikgu room crossings use their actual wall gaps. The sign wall across the gate centre remains solid; both visible side openings are modeled separately.

The Tiled JSON and TMX exports are generated from the same typed `CampusDefinition`. Their background uses one image-collection tile at native 1670×941 source dimensions, with a bottom-left aligned tile object placed at (0,2160) and sized 3840×2160 to cover the world. The custom map properties retain the global affine transform. This follows Tiled's [JSON map format](https://doc.mapeditor.org/en/stable/reference/json-map-format/) and [TMX map format](https://doc.mapeditor.org/en/stable/reference/tmx-map-format/) tile-object and image-collection representation; native image-layer dimensions alone are not a scale transform. Export/import equality, background placement and static routes are covered by the focused `tests/unified-campus.test.ts` checks.

Routes and detailed measured geometry: [`docs/unified-campus-route-report.json`](./unified-campus-route-report.json). Overlay: [`docs/evidence/campus-v9-registration-overlay.png`](./evidence/campus-v9-registration-overlay.png).
