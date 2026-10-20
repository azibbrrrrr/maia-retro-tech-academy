import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  LOGICAL_TILE,
  sceneCatalog,
  sceneIds,
  type Anchor,
  type Point,
  type SceneDefinition,
} from "../packages/world/scenes";
import { validateCampus } from "../packages/world/navigation";
export interface TiledProperty {
  name: string;
  type: "string" | "int" | "bool" | "float";
  value: string | number | boolean;
}
export interface TiledObject {
  id: number;
  name: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  visible: boolean;
  point?: boolean;
  properties: TiledProperty[];
}
export interface TiledScene {
  width: number;
  height: number;
  tilewidth: number;
  tileheight: number;
  type: string;
  version: string;
  tiledversion: string;
  orientation: string;
  renderorder: string;
  infinite: boolean;
  nextlayerid: number;
  nextobjectid: number;
  properties: TiledProperty[];
  layers: {
    id: number;
    name: string;
    type: string;
    opacity: number;
    visible: boolean;
    x: number;
    y: number;
    draworder: string;
    objects: TiledObject[];
  }[];
  tilesets: never[];
}
const properties = (
  values: Record<string, string | number | boolean | undefined>,
): TiledProperty[] =>
  Object.entries(values)
    .filter(([, value]) => value !== undefined)
    .map(([name, value]) => ({
      name,
      type:
        typeof value === "boolean"
          ? "bool"
          : typeof value === "number"
            ? Number.isInteger(value)
              ? "int"
              : "float"
            : "string",
      value: value!,
    }));
const escape = (value: unknown) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
const xmlProperties = (values: TiledProperty[]) =>
  values.length
    ? `<properties>${values.map((p) => `<property name="${escape(p.name)}" type="${p.type}" value="${escape(p.value)}"/>`).join("")}</properties>`
    : "";
export function exportScene(scene: SceneDefinition): {
  json: TiledScene;
  tmx: string;
} {
  let nextId = 1;
  const object = (
    name: string,
    type: string,
    point: Point,
    width = 0,
    height = 0,
    values: Record<string, string | number | boolean | undefined> = {},
  ): TiledObject => ({
    id: nextId++,
    name,
    type,
    x: point.x,
    y: point.y,
    width,
    height,
    rotation: 0,
    visible: true,
    ...(width === 0 && height === 0 ? { point: true } : {}),
    properties: properties(values),
  });
  const layers = [
    {
      name: "collision",
      objects: scene.solids.map((r) =>
        object(r.id, "solid", r, r.width, r.height),
      ),
    },
    {
      name: "portals",
      objects: scene.portals.map((p) =>
        object(p.id, "portal", p, p.width, p.height, {
          label: p.label,
          targetScene: p.targetScene,
          targetSpawn: p.targetSpawn,
          returnPortal: p.returnPortal,
          approachX: p.approach.x,
          approachY: p.approach.y,
          activation: p.activation,
        }),
      ),
    },
    {
      name: "spawn_points",
      objects: Object.entries(scene.spawns).map(([id, point]) =>
        object(id, "spawn", point),
      ),
    },
    {
      name: "approaches",
      objects: scene.anchors.map((a) =>
        object(a.id, a.kind, a.point, 0, 0, {
          label: a.label,
          interaction: a.interaction,
        }),
      ),
    },
    {
      name: "agent_seats",
      objects: scene.anchors
        .filter((a) => a.seat)
        .map((a) => object(a.id, "seat", a.seat!)),
    },
    {
      name: "reserved_lanes",
      objects: scene.reservedLanes.map((r) =>
        object(r.id, r.kind, r, r.width, r.height, { clearance: r.clearance }),
      ),
    },
    {
      name: "npc_spawns",
      objects: scene.npcs.map((n) =>
        object(n.id, "stationary", n.point, 0, 0, { approach: n.approach }),
      ),
    },
  ].map((layer, index) => ({
    ...layer,
    id: index + 1,
    type: "objectgroup",
    opacity: 1,
    visible: true,
    x: 0,
    y: 0,
    draworder: "topdown",
  }));
  const json: TiledScene = {
    width: Math.ceil(scene.bounds.width / LOGICAL_TILE),
    height: Math.ceil(scene.bounds.height / LOGICAL_TILE),
    tilewidth: LOGICAL_TILE,
    tileheight: LOGICAL_TILE,
    type: "map",
    version: "1.10",
    tiledversion: "1.11.2",
    orientation: "orthogonal",
    renderorder: "right-down",
    infinite: false,
    nextlayerid: layers.length + 1,
    nextobjectid: nextId,
    properties: properties({
      sceneId: scene.id,
      title: scene.title,
      temporary: scene.temporary,
      worldWidth: scene.bounds.width,
      worldHeight: scene.bounds.height,
      background: scene.background,
      mapX: scene.mapPosition.x,
      mapY: scene.mapPosition.y,
    }),
    layers,
    tilesets: [],
  };
  const tmx = `<?xml version="1.0" encoding="UTF-8"?>\n<map version="1.10" tiledversion="1.11.2" orientation="orthogonal" renderorder="right-down" width="${json.width}" height="${json.height}" tilewidth="48" tileheight="48" infinite="0" nextlayerid="${json.nextlayerid}" nextobjectid="${nextId}">\n${xmlProperties(json.properties)}\n${layers.map((l) => `<objectgroup id="${l.id}" name="${l.name}">${l.objects.map((o) => `<object id="${o.id}" name="${escape(o.name)}" type="${o.type}" x="${o.x}" y="${o.y}" width="${o.width}" height="${o.height}">${xmlProperties(o.properties)}${o.point ? "<point/>" : ""}</object>`).join("")}</objectgroup>`).join("\n")}\n</map>\n`;
  return { json, tmx };
}
export async function generateScenes(): Promise<void> {
  const report = validateCampus();
  if (report.issues.length) throw new Error(report.issues.join("\n"));
  await mkdir("maps/scenes", { recursive: true });
  await mkdir("public/maps/scenes", { recursive: true });
  await mkdir("docs/navigation", { recursive: true });
  for (const id of sceneIds) {
    const output = exportScene(sceneCatalog[id]);
    await writeFile(`maps/scenes/${id}.tmx`, output.tmx);
    await writeFile(
      `public/maps/scenes/${id}.json`,
      JSON.stringify(output.json, null, 2) + "\n",
    );
  }
  await writeFile(
    "docs/navigation/routes.json",
    JSON.stringify(report, null, 2) + "\n",
  );
  await writeFile(
    "docs/navigation/route-report.md",
    `# Static circulation evidence\n\nTemporary navigation studies. Static proof only; real Phaser / touch verification is a subsequent gate.\n\n${report.reachableScenes.length}/8 canonical scenes graph-reachable from gate; ${report.routes.length}/${report.routes.length} foot-clear local routes; ${report.issues.length} issues. Every portal has a reciprocal return link and every landing is outside all portal rectangles.\n\n| Scene | Target | Reachable | Distance (world px) |\n| --- | --- | --- | --- |\n${report.routes.map((r) => `| ${r.scene} | ${r.goal} | ${r.reachable ? "PASS" : "FAIL"} | ${r.distance.toFixed(1)} |`).join("\n")}\n\nGenerated by npm run scenes:generate. Routes and full waypoints: [routes.json](routes.json).\n`,
  );
  const clearanceRows: string[] = [];
  for (const scene of Object.values(sceneCatalog)) {
    for (const [id, p] of [
      ...Object.entries(scene.spawns),
      ...scene.anchors.flatMap((anchor): [string, Point][] => [
        [anchor.id, anchor.point],
        ...(anchor.seat
          ? [[`${anchor.id}:seat`, anchor.seat] as [string, Point]]
          : []),
      ]),
      ...scene.portals.map((portal): [string, Point] => [
        portal.id,
        portal.approach,
      ]),
    ]) {
      let left = p.x,
        right = scene.bounds.width - p.x,
        up = p.y,
        down = scene.bounds.height - p.y;
      for (const rect of scene.solids) {
        if (p.y >= rect.y && p.y <= rect.y + rect.height) {
          if (rect.x + rect.width <= p.x)
            left = Math.min(left, p.x - rect.x - rect.width);
          if (rect.x >= p.x) right = Math.min(right, rect.x - p.x);
        }
        if (p.x >= rect.x && p.x <= rect.x + rect.width) {
          if (rect.y + rect.height <= p.y)
            up = Math.min(up, p.y - rect.y - rect.height);
          if (rect.y >= p.y) down = Math.min(down, rect.y - p.y);
        }
      }
      clearanceRows.push(
        `| ${scene.id} | ${id} | ${p.x}, ${p.y} | ${left} / ${right} | ${up} / ${down} | PASS |`,
      );
    }
  }
  await writeFile(
    "docs/navigation/anchor-clearances.md",
    `# Anchor clearance inventory\n\nWorld units; cardinal distances from foot reference to nearest static solid or world edge. Left/right and up/down are raw floor spans, not guaranteed corridor widths along an entire route. Every point passes the asymmetric conservative foot envelope x[-8,+8], y[-6,+4]. Full continuous segment collision validates all route waypoints separately.\n\n| Scene | Anchor | Feet x,y | Left / right | Up / down | Foot clear |\n| --- | --- | --- | --- | --- | --- |\n${clearanceRows.join("\n")}\n`,
  );
  // Room scale is independent of final image size. All overlays use exact world bounds.
  const colors: Record<Anchor["kind"], string> = {
    interaction: "#1d4ed8",
    workstation: "#047857",
    seat: "#9333ea",
    overflow: "#b45309",
  };
  for (const scene of Object.values(sceneCatalog)) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${scene.bounds.width} ${scene.bounds.height}" role="img" aria-label="${escape(scene.title)} temporary circulation study"><rect width="100%" height="100%" fill="#f5f1e7"/>${scene.reservedLanes.map((r) => `<rect x="${r.x}" y="${r.y}" width="${r.width}" height="${r.height}" fill="#ccf1df"/>`).join("")}${scene.solids.map((r) => `<rect x="${r.x}" y="${r.y}" width="${r.width}" height="${r.height}" fill="#676b73"/>`).join("")}${scene.portals.map((p) => `<rect x="${p.x}" y="${p.y}" width="${p.width}" height="${p.height}" fill="#fbbf24"/><text x="${p.x}" y="${p.y - 8}" font-size="16">${escape(p.targetScene)}</text>`).join("")}${scene.anchors.map((a) => `<circle cx="${a.point.x}" cy="${a.point.y}" r="7" fill="${colors[a.kind]}"/><text x="${a.point.x + 10}" y="${a.point.y + 5}" font-size="14">${escape(a.id)}</text>`).join("")}${Object.values(
      scene.spawns,
    )
      .map(
        (p) =>
          `<circle cx="${p.x}" cy="${p.y}" r="10" fill="none" stroke="#dc2626" stroke-width="3"/>`,
      )
      .join(
        "",
      )}<text x="48" y="60" font-size="22">${escape(scene.title)} — TEMPORARY NAVIGATION STUDY</text></svg>\n`;
    await writeFile(`docs/navigation/${scene.id}.svg`, svg);
  }
  console.info(
    `Exported eight Tiled scene pairs; ${report.routes.length} clear routes.`,
  );
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  await generateScenes();
