import { FOOT_BODY } from "./scenes";

export const CAMPUS_ID = "academy" as const;
export const CAMPUS_NATIVE_SIZE = { width: 1670, height: 941 } as const;
export const CAMPUS_WORLD_SIZE = { width: 3840, height: 2160 } as const;
export const CAMPUS_IMAGE_TO_WORLD = {
  scaleX: 3840 / 1670,
  scaleY: 2160 / 941,
  offsetX: 0,
  offsetY: 0,
} as const;

export const campusZoneIds = [
  "entrance",
  "high_council",
  "engineering_lab",
  "library",
  "watchtower",
  "qa_lab",
  "kantin",
  "cikgu_room",
] as const;
export type CampusZoneId = (typeof campusZoneIds)[number];
export interface CampusPoint {
  x: number;
  y: number;
}
export interface CampusRect extends CampusPoint {
  width: number;
  height: number;
}
export interface CampusZone {
  id: CampusZoneId;
  title: string;
  polygon: CampusPoint[];
  focusBounds: CampusRect;
}
export interface CampusSolid extends CampusRect {
  id: string;
  kind: "wall" | "fixture" | "landscape" | "fence";
}
export interface CampusDoorway {
  id: string;
  zones: [CampusZoneId, CampusZoneId];
  threshold: CampusPoint;
  approaches: [CampusPoint, CampusPoint];
  nativeClearWidth: number;
}
export interface CampusAnchor {
  id: string;
  zoneId: CampusZoneId;
  label: string;
  kind: "workstation" | "interaction" | "seat";
  point: CampusPoint;
  seat?: CampusPoint;
  interaction?: "board" | "teacher" | "welcome" | "fixture";
}
export interface CampusNpc {
  id: "npc_cikgu";
  zoneId: "cikgu_room";
  point: CampusPoint;
  approach: "teacher";
}
export interface CampusDefinition {
  id: "academy";
  bounds: { width: number; height: number };
  background: {
    src: string;
    nativeSize: { width: number; height: number };
    imageToWorld: {
      scaleX: number;
      scaleY: number;
      offsetX: number;
      offsetY: number;
    };
  };
  zones: CampusZone[];
  solids: CampusSolid[];
  doorways: CampusDoorway[];
  spawns: { entry: CampusPoint };
  anchors: CampusAnchor[];
  npcs: CampusNpc[];
}

const sx = CAMPUS_IMAGE_TO_WORLD.scaleX;
const sy = CAMPUS_IMAGE_TO_WORLD.scaleY;
const p = (x: number, y: number): CampusPoint => ({
  x: +(x * sx).toFixed(4),
  y: +(y * sy).toFixed(4),
});
type NativeRect = readonly [
  left: number,
  top: number,
  width: number,
  height: number,
];
/** Convert native image-pixel bounds [left, top, width, height] into world units once. */
function nativeRectToWorld(
  id: string,
  [left, top, width, height]: NativeRect,
  kind: CampusSolid["kind"] = "fixture",
): CampusSolid {
  const a = p(left, top),
    b = p(left + width, top + height);
  return {
    id,
    x: a.x,
    y: a.y,
    width: +(b.x - a.x).toFixed(4),
    height: +(b.y - a.y).toFixed(4),
    kind,
  };
}
const zone = (
  id: CampusZoneId,
  title: string,
  poly: [number, number][],
  box: [number, number, number, number],
): CampusZone => {
  const [x, y, width, height] = box,
    origin = p(x, y),
    extent = p(x + width, y + height);
  return {
    id,
    title,
    polygon: poly.map(([px, py]) => p(px, py)),
    focusBounds: {
      ...origin,
      width: +(extent.x - origin.x).toFixed(4),
      height: +(extent.y - origin.y).toFixed(4),
    },
  };
};
const solid = (
  id: string,
  rect: NativeRect,
  kind: CampusSolid["kind"] = "fixture",
) => nativeRectToWorld(id, rect, kind);
const wall = (id: string, rect: NativeRect) => solid(id, rect, "wall");
type NativeAnchorOptions = {
  kind?: CampusAnchor["kind"];
  seat?: readonly [number, number];
  interaction?: CampusAnchor["interaction"];
};
const anchor = (
  id: string,
  zoneId: CampusZoneId,
  label: string,
  point: readonly [number, number],
  options: NativeAnchorOptions = {},
): CampusAnchor => ({
  id,
  zoneId,
  label,
  point: p(...point),
  kind: options.kind ?? "interaction",
  ...(options.seat ? { seat: p(...options.seat) } : {}),
  ...(options.interaction ? { interaction: options.interaction } : {}),
});
const doorway = (
  id: string,
  zones: [CampusZoneId, CampusZoneId],
  threshold: [number, number],
  approaches: [[number, number], [number, number]],
  nativeClearWidth: number,
): CampusDoorway => ({
  id,
  zones,
  threshold: p(...threshold),
  approaches: [p(...approaches[0]), p(...approaches[1])],
  nativeClearWidth,
});

const zones: CampusZone[] = [
  zone(
    "entrance",
    "Dataran Akademi",
    [
      [0, 0],
      [1670, 0],
      [1670, 941],
      [0, 941],
    ],
    [0, 0, 1670, 941],
  ),
  zone(
    "library",
    "Perpustakaan",
    [
      [66, 52],
      [367, 52],
      [367, 235],
      [66, 235],
    ],
    [48, 30, 380, 226],
  ),
  zone(
    "engineering_lab",
    "Makmal Kejuruteraan",
    [
      [488, 39],
      [1184, 39],
      [1184, 372],
      [488, 372],
    ],
    [476, 24, 720, 370],
  ),
  zone(
    "watchtower",
    "Watchtower NOC",
    [
      [1294, 51],
      [1610, 51],
      [1610, 235],
      [1294, 235],
      [1294, 51],
    ],
    [1252, 28, 370, 230],
  ),
  zone(
    "high_council",
    "Dewan High Council",
    [
      [61, 265],
      [358, 265],
      [358, 451],
      [61, 451],
    ],
    [44, 252, 382, 218],
  ),
  zone(
    "qa_lab",
    "Makmal QA",
    [
      [1312, 264],
      [1611, 264],
      [1611, 451],
      [1312, 451],
    ],
    [1248, 251, 378, 220],
  ),
  zone(
    "kantin",
    "Kantin Akademi",
    [
      [59, 474],
      [402, 474],
      [402, 727],
      [59, 727],
    ],
    [42, 460, 386, 280],
  ),
  zone(
    "cikgu_room",
    "Bilik Cikgu",
    [
      [1252, 474],
      [1612, 474],
      [1612, 718],
      [1252, 718],
    ],
    [1247, 460, 382, 275],
  ),
];

// All dimensions below are traced in the selected native 1670×941 artwork pixels and transformed once.
const solids: CampusSolid[] = [
  // Room envelopes. The listed gaps are physical openings and are intentionally absent from these wall rectangles.
  wall("library-north-wall", [48, 26, 376, 24]),
  wall("library-west-wall", [48, 48, 20, 192]),
  wall("library-east-north-jamb", [356, 48, 23, 88]),
  wall("library-east-south-jamb", [352, 211, 24, 31]),
  wall("library-south-wall", [66, 232, 339, 24]),
  wall("lab-north-wall", [476, 22, 720, 25]),
  wall("lab-west-north", [476, 46, 17, 70]),
  wall("lab-west-closed-leaf", [475, 116, 22, 100]),
  wall("lab-west-south", [476, 216, 17, 158]),
  wall("lab-east-north", [1178, 46, 18, 70]),
  wall("lab-east-closed-leaf", [1177, 116, 24, 100]),
  wall("lab-east-south", [1178, 216, 18, 158]),
  wall("lab-south-west-jamb", [725, 355, 28, 63]),
  wall("lab-south-east-jamb", [916, 355, 29, 63]),
  wall("watchtower-north-wall", [1262, 25, 371, 25]),
  wall("watchtower-east-wall", [1612, 48, 20, 195]),
  wall("watchtower-west-north-jamb", [1280, 48, 27, 90]),
  wall("watchtower-west-south-jamb", [1288, 210, 23, 33]),
  wall("watchtower-south-wall", [1270, 230, 342, 22]),
  wall("council-north-wall", [46, 254, 370, 25]),
  wall("council-west-wall", [46, 277, 20, 174]),
  wall("council-east-north-jamb", [347, 278, 24, 48]),
  wall("council-east-south-jamb", [339, 407, 25, 47]),
  wall("council-south-wall", [64, 449, 337, 24]),
  wall("qa-north-wall", [1255, 253, 377, 27]),
  wall("qa-east-wall", [1613, 278, 20, 176]),
  wall("qa-west-north-jamb", [1298, 278, 27, 55]),
  wall("qa-west-south-jamb", [1304, 411, 22, 43]),
  wall("qa-south-wall", [1270, 449, 343, 24]),
  wall("kantin-north-wall", [42, 458, 376, 25]),
  wall("kantin-west-wall", [42, 482, 20, 247]),
  wall("kantin-east-north-jamb", [396, 482, 24, 86]),
  wall("kantin-east-south-jamb", [384, 687, 26, 47]),
  wall("kantin-south-wall", [63, 724, 340, 23]),
  wall("cikgu-north-wall", [1250, 458, 382, 25]),
  wall("cikgu-east-wall", [1612, 482, 20, 250]),
  wall("cikgu-west-north-jamb", [1237, 482, 22, 89]),
  wall("cikgu-west-south-jamb", [1249, 677, 28, 56]),
  wall("cikgu-south-wall", [1270, 724, 342, 23]),
  // Perimeter and the sign wall: the only gate routes are the visible west/east side gaps.
  wall("north-campus-boundary", [0, 0, 1670, 19]),
  wall("west-campus-boundary", [0, 18, 20, 724]),
  wall("east-campus-boundary", [1650, 18, 20, 724]),
  { ...wall("outer-fence-west", [0, 742, 642, 27]), kind: "fence" },
  { ...wall("outer-fence-east", [1029, 742, 641, 27]), kind: "fence" },
  wall("gate-sign-wall", [665, 719, 344, 103]),
  { ...solid("open-gate-leaf-west", [584, 765, 57, 65], "fence") },
  { ...solid("open-gate-leaf-east", [1030, 765, 57, 65], "fence") },
  // Raised garden beds and fixed benches block their actual ground footprints; tree canopy is not a collider.
  { ...solid("courtyard-garden-west", [519, 446, 261, 230], "landscape") },
  { ...solid("courtyard-garden-east", [892, 446, 259, 230], "landscape") },
  solid("courtyard-bench-west", [659, 620, 76, 30]),
  solid("courtyard-bench-east", [953, 620, 78, 30]),
  solid("tree-trunk-west", [642, 508, 16, 21], "landscape"),
  solid("tree-trunk-east", [996, 508, 16, 21], "landscape"),
  // Library shelving, reading furniture and cabinets.
  solid("library-bookcases", [80, 57, 276, 66]),
  solid("library-reading-table", [145, 151, 180, 84]),
  solid("library-side-cabinet-west", [74, 150, 39, 50]),
  solid("library-lower-jamb-plant", [326, 221, 22, 20], "landscape"),
  // Engineering lab equipment and sixteen real workstation footprints in a stable row-major order.
  solid("lab-north-equipment", [508, 50, 153, 58]),
  solid("lab-north-equipment-center", [669, 50, 338, 58]),
  solid("lab-north-equipment-east", [1015, 50, 146, 58]),
  ...(() => {
    const cols = [
      [586, 663],
      [713, 791],
      [878, 952],
      [1010, 1085],
    ] as const;
    const rows = [
      [119, 180],
      [180, 239],
      [239, 298],
      [298, 359],
    ] as const;
    const items: CampusSolid[] = [];
    for (let row = 0; row < 4; row++)
      for (let col = 0; col < 4; col++) {
        const [x1, x2] = cols[col],
          [y1, y2] = rows[row];
        items.push(
          solid(
            `station-footprint-${String(row * 4 + col + 1).padStart(2, "0")}`,
            [x1, y1, x2 - x1, y2 - y1],
          ),
        );
      }
    return items;
  })(),
  // NOC racks and console footprint.
  solid("watchtower-rack-west", [1280, 57, 50, 88]),
  solid("watchtower-rack-east", [1550, 54, 54, 171]),
  solid("watchtower-console", [1325, 122, 220, 46]),
  solid("watchtower-chair-west", [1380, 163, 35, 44]),
  solid("watchtower-chair-east", [1480, 163, 38, 44]),
  // Council table, seats and side cabinets.
  solid("council-pr-board", [142, 295, 184, 49]),
  solid("council-side-cabinet-west", [70, 326, 39, 90]),
  solid("council-south-jamb-plant", [332, 391, 21, 26], "landscape"),
  solid("council-table", [139, 366, 167, 64]),
  ...[
    [124, 360, 19, 58],
    [297, 360, 20, 58],
    [171, 430, 42, 20],
    [236, 430, 42, 20],
  ].map(([x, y, w, h], i) => solid(`council-chair-${i + 1}`, [x, y, w, h])),
  // QA bench and cabinets.
  solid("qa-board", [1342, 295, 178, 49]),
  solid("qa-retained-stand", [1327, 316, 27, 39]),
  solid("qa-cabinet-east", [1550, 318, 43, 104]),
  solid("qa-test-bench", [1381, 348, 161, 39]),
  solid("qa-lower-console", [1425, 399, 95, 16]),
  // Lab-south planter pots remain fixed ground obstacles between the jambs.
  solid("lab-south-planter-west", [755, 387, 26, 29], "landscape"),
  solid("lab-south-planter-east", [889, 387, 27, 29], "landscape"),
  // Lab-front beds and benches are visible collision footprints below the facade.
  solid("lab-front-bed-west", [493, 389, 163, 27], "landscape"),
  solid("lab-front-bench-west", [658, 383, 64, 40]),
  solid("lab-front-bench-east", [950, 383, 69, 40]),
  solid("lab-front-bed-east", [1020, 389, 165, 27], "landscape"),
  // Kantin counter and exactly two table footprints plus chair solids.
  solid("kantin-counter", [65, 535, 273, 51]),
  solid("kantin-fridge-west", [78, 536, 51, 84]),
  solid("kantin-fridge-east", [348, 537, 45, 82]),
  solid("kantin-table-1", [128, 630, 76, 53]),
  solid("kantin-table-2", [248, 630, 76, 53]),
  solid("kantin-table-1-chair-n", [151, 614, 29, 20]),
  solid("kantin-table-1-chair-s", [151, 680, 29, 23]),
  solid("kantin-table-2-chair-n", [271, 614, 29, 20]),
  solid("kantin-table-2-chair-s", [271, 680, 29, 23]),
  // Cikgu desk, guest seating and shelves. The chair is a registered seat, not an interaction blocker.
  solid("cikgu-blackboard", [1367, 510, 158, 48]),
  solid("cikgu-bookshelf-east", [1523, 518, 73, 101]),
  solid("cikgu-cabinet-west", [1295, 546, 48, 92]),
  solid("cikgu-teacher-desk", [1382, 598, 131, 55]),
  solid("cikgu-visitor-chair", [1407, 651, 35, 40]),
];

const doorways: CampusDoorway[] = [
  doorway(
    "library-east",
    ["library", "entrance"],
    [367, 162],
    [
      [335, 162],
      [407, 162],
    ],
    75,
  ),
  doorway(
    "lab-south",
    ["engineering_lab", "entrance"],
    [838, 379],
    [
      [815, 350],
      [838, 425],
    ],
    106,
  ),
  doorway(
    "watchtower-west",
    ["watchtower", "entrance"],
    [1294, 170],
    [
      [1315, 170],
      [1245, 170],
    ],
    72,
  ),
  doorway(
    "council-east",
    ["high_council", "entrance"],
    [358, 370],
    [
      [330, 370],
      [407, 370],
    ],
    81,
  ),
  doorway(
    "qa-west",
    ["qa_lab", "entrance"],
    [1312, 376],
    [
      [1350, 376],
      [1260, 376],
    ],
    78,
  ),
  doorway(
    "kantin-east",
    ["kantin", "entrance"],
    [402, 625],
    [
      [348, 625],
      [445, 625],
    ],
    119,
  ),
  doorway(
    "cikgu-west",
    ["cikgu_room", "entrance"],
    [1252, 630],
    [
      [1286, 630],
      [1229, 630],
    ],
    106,
  ),
  doorway(
    "outer-gate-west",
    ["entrance", "entrance"],
    [654, 756],
    [
      [654, 824],
      [654, 711],
    ],
    23,
  ),
  doorway(
    "outer-gate-east",
    ["entrance", "entrance"],
    [1019, 756],
    [
      [1019, 824],
      [1019, 711],
    ],
    20,
  ),
];

const anchors: CampusAnchor[] = [];
const deskCenters = [625, 752, 915, 1048];
const approachXs = [548, 815, 861, 988];
const seatYs = [157, 217, 276, 336];
const approachYs = [171, 231, 290, 350];
for (let row = 0; row < 4; row++)
  for (let col = 0; col < 4; col++) {
    const i = row * 4 + col + 1;
    anchors.push(
      anchor(
        `station-${String(i).padStart(2, "0")}`,
        "engineering_lab",
        `DEMO workstation ${i}`,
        [approachXs[col], approachYs[row]],
        {
          kind: "workstation",
          seat: [deskCenters[col], seatYs[row]],
          interaction: "fixture",
        },
      ),
    );
  }
anchors.push(
  anchor("task-board", "engineering_lab", "DEMO task board", [837, 113], {
    interaction: "board",
  }),
  anchor("library-board", "library", "Library / research board", [274, 147], {
    interaction: "board",
  }),
  anchor(
    "watchtower-board",
    "watchtower",
    "Watchtower status board",
    [1445, 174],
    { interaction: "board" },
  ),
  anchor("pr-board", "high_council", "DEMO PR board", [235, 352], {
    interaction: "board",
  }),
  anchor("qa-board", "qa_lab", "QA test board", [1362, 360], {
    interaction: "board",
  }),
  anchor("service-counter", "kantin", "Serving counter approach", [205, 601], {
    interaction: "fixture",
  }),
  anchor("table-1", "kantin", "Kantin table 1 approach", [216, 658], {
    kind: "seat",
  }),
  anchor("table-2", "kantin", "Kantin table 2 approach", [337, 658], {
    kind: "seat",
  }),
  anchor(
    "teacher",
    "cikgu_room",
    "Ustazah Juliana conversation approach",
    [1447, 580],
    { interaction: "teacher" },
  ),
  anchor(
    "visitor-seat",
    "cikgu_room",
    "Teacher room visitor seat",
    [1452, 675],
    { kind: "seat", seat: [1424, 675] },
  ),
  anchor(
    "welcome",
    "entrance",
    "Akademi MAIA welcome sign approach",
    [836, 835],
    { interaction: "welcome" },
  ),
);

export const campusDefinition: CampusDefinition = {
  id: CAMPUS_ID,
  bounds: CAMPUS_WORLD_SIZE,
  background: {
    src: "/assets/campus-unified.png",
    nativeSize: CAMPUS_NATIVE_SIZE,
    imageToWorld: CAMPUS_IMAGE_TO_WORLD,
  },
  zones,
  solids,
  doorways,
  spawns: { entry: p(654, 824) },
  anchors,
  npcs: [
    {
      id: "npc_cikgu",
      zoneId: "cikgu_room",
      point: p(1450, 588),
      approach: "teacher",
    },
  ],
};

export function imagePixelToWorld(point: CampusPoint): CampusPoint {
  return {
    x: CAMPUS_IMAGE_TO_WORLD.offsetX + point.x * sx,
    y: CAMPUS_IMAGE_TO_WORLD.offsetY + point.y * sy,
  };
}
export function worldToImagePixel(point: CampusPoint): CampusPoint {
  return {
    x: (point.x - CAMPUS_IMAGE_TO_WORLD.offsetX) / sx,
    y: (point.y - CAMPUS_IMAGE_TO_WORLD.offsetY) / sy,
  };
}
export function pointToZone(
  campus: CampusDefinition,
  point: CampusPoint,
): CampusZoneId | undefined {
  for (const zone of campus.zones) {
    if (zone.id === "entrance") continue;
    let inside = false;
    const polygon = zone.polygon;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const a = polygon[i],
        b = polygon[j];
      if (
        a.y > point.y !== b.y > point.y &&
        point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x
      )
        inside = !inside;
    }
    if (inside) return zone.id;
  }
  return campus.zones.some((zone) => zone.id === "entrance")
    ? "entrance"
    : undefined;
}

const foot = FOOT_BODY.clearance;
const exactFoot = FOOT_BODY.exact;
const footWidth = foot.right - foot.left;
const footHeight = foot.bottom - foot.top;
export interface CampusRoute {
  points: CampusPoint[];
  distance: number;
}
const overlaps = (a: CampusRect, b: CampusRect) =>
  a.x < b.x + b.width &&
  a.x + a.width > b.x &&
  a.y < b.y + b.height &&
  a.y + a.height > b.y;
function footClear(campus: CampusDefinition, point: CampusPoint): boolean {
  const body = {
    x: point.x + foot.left,
    y: point.y + foot.top,
    width: footWidth,
    height: footHeight,
  };
  return (
    body.x >= 0 &&
    body.y >= 0 &&
    body.x + body.width <= campus.bounds.width &&
    body.y + body.height <= campus.bounds.height &&
    !campus.solids.some((solid) => overlaps(body, solid))
  );
}
function exactBodyAt(point: CampusPoint): CampusRect {
  return {
    x: point.x + exactFoot.left,
    y: point.y + exactFoot.top,
    width: exactFoot.right - exactFoot.left,
    height: exactFoot.bottom - exactFoot.top,
  };
}
export function segmentClear(
  campus: CampusDefinition,
  start: CampusPoint,
  end: CampusPoint,
): boolean {
  if (!footClear(campus, start) || !footClear(campus, end)) return false;
  return !campus.solids.some((solid) => {
    const lowerX = solid.x - foot.right,
      upperX = solid.x + solid.width - foot.left;
    const lowerY = solid.y - foot.bottom,
      upperY = solid.y + solid.height - foot.top;
    const dx = end.x - start.x,
      dy = end.y - start.y;
    let enter = 0,
      leave = 1;
    for (const [origin, delta, lower, upper] of [
      [start.x, dx, lowerX, upperX],
      [start.y, dy, lowerY, upperY],
    ] as const) {
      if (delta === 0) {
        if (origin <= lower || origin >= upper) return false;
      } else {
        const a = (lower - origin) / delta,
          b = (upper - origin) / delta;
        enter = Math.max(enter, Math.min(a, b));
        leave = Math.min(leave, Math.max(a, b));
      }
    }
    return enter < leave;
  });
}
const NAV_STEP = 8;
export function findRoute(
  campus: CampusDefinition,
  start: CampusPoint,
  goal: CampusPoint,
): CampusRoute | null {
  if (!footClear(campus, start) || !footClear(campus, goal)) return null;
  if (segmentClear(campus, start, goal))
    return {
      points: [start, goal],
      distance: Math.hypot(goal.x - start.x, goal.y - start.y),
    };
  const cols = Math.ceil(campus.bounds.width / NAV_STEP),
    rows = Math.ceil(campus.bounds.height / NAV_STEP),
    offset = NAV_STEP / 2,
    point = (i: number): CampusPoint => ({
      x: (i % cols) * NAV_STEP + offset,
      y: Math.floor(i / cols) * NAV_STEP + offset,
    });
  const nearest = (p: CampusPoint): number | undefined => {
    const cx = Math.round((p.x - offset) / NAV_STEP),
      cy = Math.round((p.y - offset) / NAV_STEP);
    for (let radius = 0; radius <= 6; radius++)
      for (let y = cy - radius; y <= cy + radius; y++)
        for (let x = cx - radius; x <= cx + radius; x++) {
          if (x < 0 || y < 0 || x >= cols || y >= rows) continue;
          const i = y * cols + x;
          if (segmentClear(campus, p, point(i))) return i;
        }
  };
  const source = nearest(start),
    target = nearest(goal);
  if (source === undefined || target === undefined) return null;
  const prev = new Int32Array(cols * rows).fill(-2),
    queue = [source];
  prev[source] = -1;
  for (let head = 0; head < queue.length; head++) {
    const current = queue[head];
    if (current === target) {
      const path: CampusPoint[] = [goal];
      let i = current;
      while (i !== -1) {
        path.push(point(i));
        i = prev[i];
      }
      path.push(start);
      path.reverse();
      const simple: CampusPoint[] = [path[0]];
      let from = 0;
      while (from < path.length - 1) {
        let to = path.length - 1;
        while (to > from + 1 && !segmentClear(campus, path[from], path[to]))
          to--;
        simple.push(path[to]);
        from = to;
      }
      const distance = simple
        .slice(1)
        .reduce(
          (sum, p, index) =>
            sum + Math.hypot(p.x - simple[index].x, p.y - simple[index].y),
          0,
        );
      return { points: simple, distance };
    }
    const x = current % cols,
      y = Math.floor(current / cols);
    for (const [nx, ny] of [
      [x + 1, y],
      [x, y + 1],
      [x - 1, y],
      [x, y - 1],
    ]) {
      if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
      const next = ny * cols + nx;
      if (
        prev[next] !== -2 ||
        !segmentClear(campus, point(current), point(next))
      )
        continue;
      prev[next] = current;
      queue.push(next);
    }
  }
  return null;
}
export interface CampusValidation {
  issues: string[];
  routes: { id: string; reachable: boolean; distance: number }[];
}
export function validateCampus(campus = campusDefinition): CampusValidation {
  const issues: string[] = [],
    routes: CampusValidation["routes"] = [],
    start = campus.spawns.entry;
  const inside = (point: CampusPoint) =>
    Number.isFinite(point.x) &&
    Number.isFinite(point.y) &&
    point.x >= 0 &&
    point.y >= 0 &&
    point.x <= campus.bounds.width &&
    point.y <= campus.bounds.height;
  for (const solid of campus.solids) {
    if (
      !Number.isFinite(solid.x) ||
      !Number.isFinite(solid.y) ||
      !Number.isFinite(solid.width) ||
      !Number.isFinite(solid.height) ||
      solid.width <= 0 ||
      solid.height <= 0 ||
      solid.x < 0 ||
      solid.y < 0 ||
      solid.x + solid.width > campus.bounds.width ||
      solid.y + solid.height > campus.bounds.height
    )
      issues.push(`${solid.id}: collision bounds exceed the campus world`);
  }
  for (const anchor of campus.anchors) {
    if (!inside(anchor.point) || (anchor.seat && !inside(anchor.seat)))
      issues.push(`${anchor.id}: anchor point exceeds the campus world`);
  }
  for (const door of campus.doorways)
    if (
      !inside(door.threshold) ||
      door.approaches.some((point) => !inside(point))
    )
      issues.push(`${door.id}: doorway point exceeds the campus world`);
  for (const npc of campus.npcs) {
    if (!inside(npc.point))
      issues.push(`${npc.id}: NPC point exceeds the campus world`);
    const interaction = campus.anchors.find(
      (anchor) =>
        anchor.interaction === npc.approach && anchor.zoneId === npc.zoneId,
    );
    if (
      interaction &&
      overlaps(exactBodyAt(npc.point), exactBodyAt(interaction.point))
    )
      issues.push(`${npc.id}: NPC foot body overlaps its interaction approach`);
  }
  const targets: [string, CampusPoint][] = [
    ...campus.anchors.map(
      ({ id, point }) => [id, point] as [string, CampusPoint],
    ),
    ...campus.npcs.map(({ id, point }) => [id, point] as [string, CampusPoint]),
    ...campus.doorways.flatMap<[string, CampusPoint]>((door) => [
      [`${door.id}:threshold`, door.threshold],
      [`${door.id}:approach-a`, door.approaches[0]],
      [`${door.id}:approach-b`, door.approaches[1]],
    ]),
  ];
  for (const [id, target] of targets) {
    const route = findRoute(campus, start, target);
    routes.push({
      id,
      reachable: !!route,
      distance: route?.distance ?? Infinity,
    });
    if (!route) issues.push(`${id}: no body-clear path from the gate spawn`);
  }
  for (const door of campus.doorways) {
    const [a, b] = door.approaches;
    if (!findRoute(campus, a, door.threshold))
      issues.push(`${door.id}: approach A cannot reach threshold`);
    if (!findRoute(campus, b, door.threshold))
      issues.push(`${door.id}: approach B cannot reach threshold`);
    if (door.nativeClearWidth * Math.min(sx, sy) <= footWidth)
      issues.push(
        `${door.id}: native opening cannot clear the tested foot width`,
      );
  }
  return { issues, routes };
}
