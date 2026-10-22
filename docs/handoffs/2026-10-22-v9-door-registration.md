# V9 actual-source doorway registration packet

**Art decision: GO.** `art/generated/unified-campus/campus-warm-v9-native.png` visibly connects all seven room floors to the campus. No further image edit is requested. Actual source is **1670×941**, SHA-256 `aea9ec282515dae16be48005ee0d93d186d8bd26210d74d4f534c0fc1f209745`. Use global scale x=`3840/1670`, y=`2160/941`; no resampling or 4K claim.

All coordinates below are **native source pixels**, not world units. Rectangles use `[left,top,width,height]`. The listed jamb rectangles are conservative traces of the retained visible wall faces/ground extent at the aperture; their exact numerical endpoints define the geometry update. Door approach A is inside the named room, B is outside. Route verification still follows after export/runtime registration.

## Seven advertised physical doorways

| ID | Actual wall plane | Threshold | Approach A, inside | Approach B, outside | Retained north/west jamb | Retained south/east jamb |
| --- | --- | --- | --- | --- | --- | --- |
| library-east | x367 | (367,162) | (335,162) | (407,162) | [356,48,23,88], ends y136 | [352,211,24,31], starts y211 |
| watchtower-west | x1294 | (1294,170) | (1315,170) | (1245,170) | [1280,48,27,90], ends y138 | [1288,210,23,33], starts y210 |
| council-east | x358 | (358,370) | (330,370) | (407,370) | [347,278,24,48], ends y326 | [339,407,25,47], starts y407 |
| qa-west | x1312 | (1312,376) | (1350,376) | (1260,376) | [1298,278,27,55], ends y333 | [1304,411,22,43], starts y411 |
| kantin-east | x402 | (402,625) | (348,625) | (445,625) | [396,482,24,86], ends y568 | [384,687,26,47], starts y687 |
| cikgu-west | x1252 | (1252,630) | (1286,630) | (1229,630) | [1237,482,22,89], ends y571 | [1249,677,28,56], starts y677 |
| lab-south | y379 | (838,379) | (815,350) | (838,425) | west [725,355,28,63] | east [916,355,29,63] |

The first four are visibly broad new verandah openings. In particular, **x405 is outside the actual Library/Council wall planes, and x1253 is outside the actual NOC/QA wall planes**. Do not retain the old outer-corridor collision rectangles as substitute jambs. Replace the corresponding east/west north/south side-wall segments with the actual retained traces above. Update the semantic zone side boundary to the actual plane (Library max x367; Council max x358; NOC min x1294; QA min x1312; Kantin max x402; Cikgu min x1252), so passing the real opening changes the zone rather than crossing an arbitrary line farther down the hallway. Focus bounds may include camera padding.

The Library and NOC north-to-south jamb separation is 75 and 72 native pixels; Council and QA are 81 and 78. These are **jamb separation measurements**, not a promise that every point beside nearby furniture is clear. Use the listed approach line for the physical crossing, with current exact visitor body/clearance checks.

## Immediate fixture and path corrections

- Remove `library-side-cabinet-east`: v9 shows floor where that cabinet stood. Keep the retained plant to the southwest of the lower jamb solid at its pot/ground footprint; its canopy extends farther than its ground. It does not intersect the y162 crossing. The north bookcase footprint must stop at the actual room edge instead of extending to x410 in the outside corridor: trace its main shelf mass as `[80,57,276,66]` (ends x356,y123), with the north jamb represented separately above. Existing reading-table and west cabinet footprints remain.
- Remove the old `council-east-post [350,330,23,85]`: the middle wall/post is visibly removed in v9. Replace it with the north/south retained jamb traces above. Preserve the small south-jamb plant ground footprint around native `[332,391,21,26]`; the y370 crossing clears it. Keep table/chair footprints. The PR board approach remains `(235,352)`; from `(330,370)` the inside route can use `(330,352)` before reaching that board approach.
- Remove `qa-cabinet-west [1281,323,40,100]`: that old fixture now lies on open verandah floor. Keep the retained small cabinet/plant stand immediately **north and inside** the opening around `[1327,316,27,39]`; it is outside the y376 crossing. The old QA board approach `(1329,320)` now falls on that retained stand; use **QA board approach `(1362,360)`**. The test bench begins at x1381, leaving this approach on visible clear floor.
- Retain NOC north racks, console and chairs. `(1315,170)` stands west of the console x1325 edge and below the north rack. The board approach `(1445,174)` remains between the chairs. The new crossing is through x1294, not the x1253 outside walkway.
- Kantin's y625 crossing avoids the north cabinet/counter and the south plant. Its inside approach is on clear floor east of the second table, rather than on the old cabinet edge. The counter approach `(205,601)` remains reachable by routing below the north cabinet before moving inward; do not require a straight diagonal through that cabinet.
- Cikgu's y630 crossing passes between the retained upper pot/cabinets and lower plant. The inside turning route is `(1286,630) → (1286,645) → (1355,645) → (1355,580)`, then toward the teacher approach. It goes below the west cabinet's y638 extent. Keep teacher native `(1450,588)` and approach `(1447,580)`.
- Lab south has two real tall jambs, not a flat wall ending at y391. Keep their full y355–418 extent as traced above. The two planter pots between the jambs remain solid at ground footprints approximately west `[755,387,26,29]` and east `[889,387,27,29]`; the centered x838 route stays clear. A conservative usable opening between the pots is x783–889 (106 native pixels). Do not advertise the whole old x769–913 range as furniture-free.

## Closed lab side doors

The lab west/east side leaves remain painted closed. **Remove `lab-west` and `lab-east` from advertised physical doorways/route targets.** Keep the wall/closed leaf spans solid:

- west native `[475,116,22,100]`;
- east native `[1177,116,24,100]`.

The lab's accepted physical entrance is `lab-south`. Do not cut invisible side gaps merely to retain the previous nine-door count. With the two outer gate openings there are now nine advertised openings total: seven room entries plus two gate gaps.

## Scope and evidence

The seven doorway crops were inspected at native-grid resolution; diagnostic files are `/tmp/maia-v9-inspect-{library,watchtower,council,qa,kantin,cikgu,lab-south}.png`. Sixteen lab desks and the selected warm composition remain visible. This packet approves the art for registration and supplies the source trace; it does not replace regenerated route checks, runtime actor occupancy checks, actual keyboard/touch traversal, camera/viewports, or U2 acceptance.
