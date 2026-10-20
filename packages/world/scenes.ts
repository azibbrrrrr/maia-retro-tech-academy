import academy from "../../public/maps/academy.json";

export const sceneIds = [
  "entrance",
  "high_council",
  "engineering_lab",
  "library",
  "watchtower",
  "qa_lab",
  "kantin",
  "cikgu_room",
] as const;
export type SceneId = (typeof sceneIds)[number];
export interface Point {
  x: number;
  y: number;
}
export interface Rect extends Point {
  id: string;
  width: number;
  height: number;
}
export interface Anchor {
  id: string;
  label: string;
  kind: "interaction" | "workstation" | "seat" | "overflow";
  point: Point;
  seat?: Point;
  interaction?: "board" | "teacher" | "welcome" | "fixture";
}
export interface Portal extends Rect {
  label: string;
  targetScene: SceneId;
  targetSpawn: string;
  returnPortal: string;
  approach: Point;
  activation: "interact";
}
export interface ReservedLane extends Rect {
  kind: "primary" | "secondary";
  clearance: number;
}
export interface SceneDefinition {
  id: SceneId;
  title: string;
  temporary: boolean;
  bounds: { width: number; height: number };
  background?: string;
  solids: Rect[];
  portals: Portal[];
  spawns: Record<string, Point>;
  anchors: Anchor[];
  reservedLanes: ReservedLane[];
  mapPosition: Point;
  npcs: { id: "npc_cikgu"; point: Point; approach: string }[];
}
// Phaser 3.90 Body.updateFromGameObject: sprite position + scale*(offset-displayOrigin).
export const FOOT_BODY = {
  frame: { width: 192, height: 208 },
  origin: { x: 0.5, y: 0.94 },
  scale: 0.44,
  source: { width: 32, height: 18, offsetX: 80, offsetY: 184 },
  exact: { left: -7.04, top: -5.0688, right: 7.04, bottom: 2.8512 },
  clearance: { left: -8, top: -6, right: 8, bottom: 4 },
} as const;
export const LOGICAL_TILE = 48;
const solid = (
  id: string,
  x: number,
  y: number,
  width: number,
  height: number,
): Rect => ({ id, x, y, width, height });
const fixture = (
  id: string,
  label: string,
  x: number,
  y: number,
  kind: Anchor["kind"] = "interaction",
): Anchor => ({ id, label, kind, point: { x, y }, interaction: "fixture" });
const destinations: {
  id: Exclude<SceneId, "entrance">;
  title: string;
  x: number;
  y: number;
  returnPoint: Point;
  map: Point;
}[] = [
  {
    id: "high_council",
    title: "Dewan High Council",
    x: 630,
    y: 265,
    returnPoint: { x: 630, y: 310 },
    map: { x: 0, y: 0 },
  },
  {
    id: "engineering_lab",
    title: "Makmal Kejuruteraan",
    x: 662,
    y: 654,
    returnPoint: { x: 744, y: 694 },
    map: { x: 1, y: 0 },
  },
  {
    id: "library",
    title: "Perpustakaan",
    x: 300,
    y: 265,
    returnPoint: { x: 300, y: 310 },
    map: { x: -1, y: 0 },
  },
  {
    id: "watchtower",
    title: "Watchtower NOC",
    x: 476,
    y: 385,
    returnPoint: { x: 476, y: 435 },
    map: { x: -1, y: 1 },
  },
  {
    id: "qa_lab",
    title: "Makmal QA",
    x: 1020,
    y: 265,
    returnPoint: { x: 1020, y: 310 },
    map: { x: 1, y: 1 },
  },
  {
    id: "kantin",
    title: "Kantin Akademi",
    x: 1200,
    y: 385,
    returnPoint: { x: 1200, y: 435 },
    map: { x: -1, y: 2 },
  },
  {
    id: "cikgu_room",
    title: "Bilik Cikgu",
    x: 1370,
    y: 265,
    returnPoint: { x: 1370, y: 310 },
    map: { x: 1, y: 2 },
  },
];
function room(destination: (typeof destinations)[number]): SceneDefinition {
  const lab = destination.id === "engineering_lab";
  const width = lab ? 1536 : 1152,
    height = lab ? 1152 : 864,
    center = width / 2;
  const definition: SceneDefinition = {
    id: destination.id,
    title: destination.title,
    temporary: true,
    bounds: { width, height },
    solids: [
      solid("north-wall", 0, 0, width, 24),
      solid("west-wall", 0, 24, 24, height - 24),
      solid("east-wall", width - 24, 24, 24, height - 24),
      solid("south-west-wall", 24, height - 24, center - 96, 24),
      solid("south-east-wall", center + 72, height - 24, center - 96, 24),
    ],
    portals: [
      {
        id: `${destination.id}-to-entrance`,
        label: "Entrance / return",
        x: center - 72,
        y: height - 72,
        width: 144,
        height: 36,
        targetScene: "entrance",
        targetSpawn: `from_${destination.id}`,
        returnPortal: `entrance-to-${destination.id}`,
        approach: { x: center, y: height - 96 },
        activation: "interact",
      },
    ],
    spawns: { entry: { x: center, y: height - 144 } },
    anchors: [],
    reservedLanes: [
      {
        id: "central-spine",
        x: center - 120,
        y: 96,
        width: 240,
        height: height - 120,
        kind: "primary",
        clearance: 240,
      },
      {
        id: "south-cross-aisle",
        x: 24,
        y: height - 240,
        width: width - 48,
        height: 144,
        kind: "secondary",
        clearance: 144,
      },
    ],
    mapPosition: destination.map,
    npcs: [],
  };
  if (lab) {
    for (let row = 0; row < 4; row++)
      for (let col = 0; col < 4; col++) {
        const index = row * 4 + col + 1,
          x = [120, 384, 960, 1224][col],
          y = 144 + row * 192;
        definition.solids.push(solid(`desk-${index}`, x, y, 144, 72));
        definition.anchors.push({
          id: `station-${String(index).padStart(2, "0")}`,
          label: `DEMO workstation ${index}`,
          kind: "workstation",
          point: { x: x + 72, y: y + 126 },
          seat: { x: x + 72, y: y + 96 },
          interaction: "fixture",
        });
      }
    [144, 408, 1128, 1392].forEach((x, index) =>
      definition.anchors.push(
        fixture(
          `overflow-${index + 1}`,
          `DEMO overflow ${index + 1}`,
          x,
          888,
          "overflow",
        ),
      ),
    );
    definition.anchors.push(
      fixture("task-board", "DEMO task board", center, 120),
    );
  } else if (destination.id === "cikgu_room") {
    definition.solids.push(solid("teacher-desk", 192, 168, 192, 72));
    definition.anchors.push(
      {
        ...fixture("teacher", "Ustazah Juliana", center, 324),
        interaction: "teacher",
      },
      fixture("visitor-seat", "Visitor seat", 288, 324, "seat"),
    );
    definition.npcs.push({
      id: "npc_cikgu",
      point: { x: center, y: 264 },
      approach: "teacher",
    });
  } else {
    const count =
      destination.id === "kantin" ? 8 : destination.id === "qa_lab" ? 6 : 4;
    for (let index = 0; index < count; index++) {
      const col = index % 2,
        row = Math.floor(index / 2),
        x = col ? 816 : 144,
        y = destination.id === "kantin" ? 120 + row * 120 : 144 + row * 144;
      definition.solids.push(solid(`fixture-${index + 1}`, x, y, 192, 48));
      definition.anchors.push(
        fixture(
          `position-${index + 1}`,
          `${destination.id === "kantin" ? "Social seat" : destination.id === "library" ? "Reading table" : destination.id === "watchtower" ? "Monitoring screen" : destination.id === "qa_lab" ? "QA terminal" : "Advisor station"} ${index + 1}`,
          x + 96,
          y + 84,
          destination.id === "kantin" ? "seat" : "interaction",
        ),
      );
    }
    definition.anchors.push({
      ...fixture(
        destination.id === "high_council"
          ? "pr-board"
          : destination.id === "kantin"
            ? "service-counter"
            : "room-board",
        destination.id === "high_council"
          ? "DEMO PR board"
          : destination.id === "kantin"
            ? "Serving counter"
            : "DEMO room board",
        center,
        120,
      ),
      interaction: destination.id === "high_council" ? "board" : "fixture",
    });
    if (destination.id === "high_council" || destination.id === "library")
      definition.anchors.push(
        fixture("overflow-1", "DEMO overflow 1", 144, 540, "overflow"),
        fixture("overflow-2", "DEMO overflow 2", 1008, 540, "overflow"),
      );
    if (destination.id === "high_council")
      definition.anchors.push(
        fixture("supervisor-desk", "Supervisor desk", 240, 372),
      );
  }
  return definition;
}
const entrance: SceneDefinition = {
  id: "entrance",
  title: "Dataran Akademi",
  temporary: false,
  background: "/assets/campus.png",
  bounds: { width: 1672, height: 941 },
  solids: academy.layers
    .find((layer) => layer.name === "collision")!
    .objects!.map((object) =>
      solid(object.name, object.x, object.y, object.width, object.height),
    ),
  portals: destinations.map((destination) => ({
    id: `entrance-to-${destination.id}`,
    label: destination.title,
    x: destination.x - (destination.id === "engineering_lab" ? 72 : 48),
    y: destination.y - 16,
    width: destination.id === "engineering_lab" ? 144 : 96,
    height: 32,
    targetScene: destination.id,
    targetSpawn: "entry",
    returnPortal: `${destination.id}-to-entrance`,
    approach: destination.returnPoint,
    activation: "interact",
  })),
  spawns: Object.fromEntries([
    ["entry", { x: 836, y: 660 }],
    ...destinations.map((d) => [`from_${d.id}`, d.returnPoint]),
  ]),
  anchors: [
    {
      ...fixture("welcome", "Welcome directory", 836, 672),
      interaction: "welcome",
    },
  ],
  reservedLanes: [],
  mapPosition: { x: 0, y: 1 },
  npcs: [],
};
export const sceneCatalog: Record<SceneId, SceneDefinition> =
  Object.fromEntries([
    ["entrance", entrance],
    ...destinations.map((destination) => [destination.id, room(destination)]),
  ]) as Record<SceneId, SceneDefinition>;
export function resolvePlace(alias: string): SceneId | undefined {
  const legacy: Record<string, SceneId> = {
    gate: "entrance",
    council: "high_council",
    teacher: "cikgu_room",
  };
  return (
    (Object.hasOwn(legacy, alias) ? legacy[alias] : undefined) ??
    (sceneIds.includes(alias as SceneId) ? (alias as SceneId) : undefined)
  );
}
