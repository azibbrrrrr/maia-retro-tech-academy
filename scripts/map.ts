import { mkdir, writeFile } from "node:fs/promises";

// Pixel coordinates traced against the approved 1672 × 941 campus illustration.
// Keep the 48 px editing grid; precise collision uses Tiled rectangle objects.
const tile = 48,
  width = 35,
  height = 20;
let nextObject = 1;
const point = (name: string, x: number, y: number, type = "point") => ({
  id: nextObject++,
  name,
  x,
  y,
  type,
  width: 0,
  height: 0,
  rotation: 0,
  visible: true,
  point: true,
});
const points = [
  {
    name: "interaction_zones",
    objects: [
      point("board_pr_high_council", 630, 185, "board"),
      point("sign_gate", 836, 596, "sign"),
    ],
  },
  {
    name: "spawn_points",
    objects: [
      point("spawn_gate", 836, 660),
      point("door_council", 660, 285),
      point("door_teacher", 1380, 310),
    ],
  },
  {
    name: "npc_spawns",
    objects: [point("npc_cikgu", 1380, 265, "stationary")],
  },
  { name: "agent_seats", objects: [] },
  {
    name: "room_labels",
    objects: [point("High Council", 350, 360), point("Bilik Cikgu", 1320, 360)],
  },
  { name: "lights", objects: [] },
];
const rectangles: [string, number, number, number, number][] = [
  ["back walls and shelving", 0, 0, 1672, 205],
  ["council outer wall", 0, 205, 180, 250],
  ["teacher outer wall", 1500, 205, 172, 250],
  ["council corridor partition", 735, 205, 55, 250],
  ["teacher corridor partition", 880, 205, 55, 250],
  ["council front west", 180, 325, 235, 130],
  ["council front east", 540, 325, 195, 130],
  ["teacher front west", 935, 325, 195, 130],
  ["teacher front east", 1265, 325, 235, 130],
  ["council desks and chairs", 350, 210, 210, 90],
  ["teacher desks and chairs", 1120, 210, 165, 90],
  ["council side furniture", 180, 205, 70, 120],
  ["council server cabinet", 690, 205, 45, 35],
  ["teacher side furniture", 1435, 205, 65, 120],
  ["welcome noticeboard and planters", 660, 440, 355, 180],
  ["west trees and benches", 180, 490, 395, 220],
  ["east trees and benches", 1095, 490, 415, 220],
  ["southwest flowerbed", 440, 710, 275, 32],
  ["southeast flowerbed", 953, 710, 267, 32],
  ["school gate and perimeter", 0, 742, 1672, 199],
  ["west boundary", 0, 455, 65, 287],
  ["east boundary", 1600, 455, 72, 287],
];
const collision = rectangles.map(([name, x, y, w, h]) => ({
  id: nextObject++,
  name,
  type: "solid",
  x,
  y,
  width: w,
  height: h,
  rotation: 0,
  visible: true,
}));
const objectLayers = [
  ...["floors", "walls", "furniture_back", "furniture_front", "overhead"].map(
    (name) => ({ name, objects: [] }),
  ),
  { name: "collision", objects: collision },
  ...points,
].map((layer, index) => ({
  ...layer,
  id: index + 2,
  type: "objectgroup",
  opacity: 1,
  visible: layer.name !== "collision",
  x: 0,
  y: 0,
  draworder: "topdown",
}));
const properties = [
  { name: "worldWidth", type: "int", value: 1672 },
  { name: "worldHeight", type: "int", value: 941 },
];
const map = {
  compressionlevel: -1,
  width,
  height,
  infinite: false,
  orientation: "orthogonal",
  renderorder: "right-down",
  tiledversion: "1.11.2",
  tilewidth: tile,
  tileheight: tile,
  type: "map",
  version: "1.10",
  nextlayerid: objectLayers.length + 2,
  nextobjectid: nextObject,
  properties,
  tilesets: [],
  layers: [
    {
      id: 1,
      name: "ground",
      type: "imagelayer",
      x: 0,
      y: 0,
      opacity: 1,
      visible: true,
      image: "../assets/campus.png",
    },
    ...objectLayers,
  ],
};
const xmlLayers = objectLayers
  .map(
    (l) =>
      `<objectgroup id="${l.id}" name="${l.name}" visible="${Number(l.visible)}">${l.objects.map((o) => `<object id="${o.id}" name="${o.name}" type="${o.type}" x="${o.x}" y="${o.y}" width="${o.width}" height="${o.height}">${"point" in o ? "<point/>" : ""}</object>`).join("")}</objectgroup>`,
  )
  .join("\n");
const tmx = `<?xml version="1.0" encoding="UTF-8"?>
<map version="1.10" tiledversion="1.11.2" orientation="orthogonal" renderorder="right-down" width="${width}" height="${height}" tilewidth="${tile}" tileheight="${tile}" infinite="0" nextlayerid="${map.nextlayerid}" nextobjectid="${nextObject}">
<properties>${properties.map((p) => `<property name="${p.name}" type="int" value="${p.value}"/>`).join("")}</properties>
<imagelayer id="1" name="ground"><image source="../public/assets/campus.png" width="1672" height="941"/></imagelayer>
${xmlLayers}
</map>`;
await mkdir("maps", { recursive: true });
await mkdir("public/maps", { recursive: true });
await writeFile("maps/academy.tmx", tmx);
await writeFile("public/maps/academy.json", JSON.stringify(map));
console.info("Generated illustrated Tiled map with 22 precise solid objects.");
