import { mkdir, writeFile } from "node:fs/promises";

// Original blockout. All geometry is expressed in 48 px Tiled coordinates.
const width = 32,
  height = 22,
  tile = 48;
const layer = (name: string, id: number) => ({
  id,
  name,
  type: "tilelayer",
  x: 0,
  y: 0,
  width,
  height,
  opacity: 1,
  visible: true,
  data: Array<number>(width * height).fill(0),
});
const ground = layer("ground", 1);
ground.data.fill(1);
const floors = layer("floors", 2),
  walls = layer("walls", 3),
  collision = layer("collision", 4);
collision.visible = false;
function fill(
  target: typeof ground,
  x: number,
  y: number,
  w: number,
  h: number,
  gid: number,
) {
  for (let row = y; row < y + h; row++)
    for (let col = x; col < x + w; col++) target.data[row * width + col] = gid;
}
fill(floors, 2, 10, 28, 4, 3);
fill(floors, 14, 14, 4, 8, 3);
for (const [left, right, door] of [
  [2, 14, 7],
  [17, 29, 22],
]) {
  fill(floors, left, 2, right - left + 1, 9, 2);
  for (let x = left; x <= right; x++) {
    fill(walls, x, 2, 1, 1, 4);
    if (x !== door && x !== door + 1) fill(walls, x, 10, 1, 1, 4);
  }
  fill(walls, left, 2, 1, 9, 4);
  fill(walls, right, 2, 1, 9, 4);
}
collision.data = walls.data.map((gid) => (gid ? 4 : 0));
// Desk islands, with routes on all sides.
for (const [x, y] of [
  [5, 6],
  [10, 6],
  [19, 6],
  [26, 7],
]) {
  fill(collision, x, y, 2, 1, 4);
}
for (let x = 0; x < width; x++) {
  fill(collision, x, 0, 1, 1, 4);
  fill(collision, x, height - 1, 1, 1, 4);
}
for (let y = 0; y < height; y++) {
  fill(collision, 0, y, 1, 1, 4);
  fill(collision, width - 1, y, 1, 1, 4);
}

const object = (
  id: number,
  name: string,
  x: number,
  y: number,
  type = "point",
) => ({
  id,
  name,
  type,
  x: x * tile,
  y: y * tile,
  width: 0,
  height: 0,
  rotation: 0,
  visible: true,
  point: true,
});
const objects = (
  id: number,
  name: string,
  entries: ReturnType<typeof object>[],
) => ({
  id,
  name,
  type: "objectgroup",
  opacity: 1,
  visible: true,
  x: 0,
  y: 0,
  draworder: "topdown",
  objects: entries,
});
const layers = [
  ground,
  floors,
  walls,
  layer("furniture_back", 5),
  layer("furniture_front", 6),
  layer("overhead", 7),
  collision,
  objects(8, "interaction_zones", [
    object(1, "board_pr_high_council", 8, 4, "board"),
    object(2, "sign_gate", 16, 18, "sign"),
  ]),
  objects(9, "spawn_points", [
    object(3, "spawn_gate", 16, 18.5),
    object(4, "door_council", 8, 8.5),
    object(5, "door_teacher", 23, 8.5),
  ]),
  objects(10, "npc_spawns", [object(6, "npc_cikgu", 25, 5.5, "stationary")]),
  objects(11, "agent_seats", []),
  objects(12, "room_labels", [
    object(7, "High Council", 8, 2.5),
    object(8, "Bilik Cikgu", 23, 2.5),
  ]),
  objects(13, "lights", []),
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
  nextlayerid: 14,
  nextobjectid: 9,
  layers,
  tilesets: [
    {
      firstgid: 1,
      name: "academy",
      tilewidth: tile,
      tileheight: tile,
      tilecount: 4,
      columns: 4,
      image: "../assets/tiles.svg",
      imagewidth: 192,
      imageheight: 48,
      margin: 0,
      spacing: 0,
    },
  ],
};
const tiles = `<svg xmlns="http://www.w3.org/2000/svg" width="192" height="48" shape-rendering="crispEdges">
<path fill="#657451" d="M0 0h48v48H0z"/><path fill="#74825b" d="M8 10h4v4H8zM32 30h6v2h-6zM22 4h2v4h-2z"/>
<path fill="#aa8960" d="M48 0h48v48H48z"/><path stroke="#95754f" stroke-width="2" d="M48 16h48M48 32h48M72 0v16M60 16v16M80 32v16"/>
<path fill="#c8bd98" d="M96 0h48v48H96z"/><path fill="#b7ab85" d="M96 46h48v2H96zM142 0h2v48h-2z"/><path fill="#d9cdae" d="M100 4h36v2h-36z"/>
<path fill="#765438" d="M144 0h48v48h-48z"/><path fill="#e9d9b7" d="M144 0h48v32h-48z"/><path fill="#b8aa88" d="M144 28h48v6h-48z"/><path fill="#473e32" d="M144 43h48v5h-48z"/>
</svg>`;
const xmlLayers = layers
  .map((l) =>
    "data" in l
      ? `<layer id="${l.id}" name="${l.name}" width="${width}" height="${height}" visible="${Number(l.visible)}"><data encoding="csv">${l.data.join(",")}</data></layer>`
      : `<objectgroup id="${l.id}" name="${l.name}">${l.objects.map((o) => `<object id="${o.id}" name="${o.name}" type="${o.type}" x="${o.x}" y="${o.y}"><point/></object>`).join("")}</objectgroup>`,
  )
  .join("\n");
const tmx = `<?xml version="1.0" encoding="UTF-8"?>
<map version="1.10" tiledversion="1.11.2" orientation="orthogonal" renderorder="right-down" width="${width}" height="${height}" tilewidth="48" tileheight="48" infinite="0" nextlayerid="14" nextobjectid="9">
<tileset firstgid="1" name="academy" tilewidth="48" tileheight="48" tilecount="4" columns="4"><image source="../public/assets/tiles.svg" width="192" height="48"/></tileset>
${xmlLayers}
</map>`;
await mkdir("maps", { recursive: true });
await mkdir("public/maps", { recursive: true });
await mkdir("public/assets", { recursive: true });
await writeFile("maps/academy.tmx", tmx);
await writeFile("public/maps/academy.json", JSON.stringify(map));
await writeFile("public/assets/tiles.svg", tiles);
console.info("Generated original Tiled blockout and 4-tile SVG.");
