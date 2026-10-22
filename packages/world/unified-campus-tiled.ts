import type {
  CampusAnchor,
  CampusDefinition,
  CampusDoorway,
  CampusPoint,
  CampusRect,
  CampusSolid,
  CampusZone,
  CampusZoneId,
} from "./unified-campus";

export interface CampusTiledProperty {
  name: string;
  type: "string" | "int" | "float";
  value: string | number;
}
export interface CampusTiledObject {
  id: number;
  name: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  gid?: number;
  point?: true;
  polygon?: { x: number; y: number }[];
  properties?: CampusTiledProperty[];
}
export interface CampusTiledTileset {
  firstgid: number;
  name: string;
  tilewidth: number;
  tileheight: number;
  tilecount: 1;
  columns: 0;
  objectalignment: "bottomleft";
  tiles: { id: 0; image: string; imagewidth: number; imageheight: number }[];
}
export interface CampusTiledMap {
  compressionlevel: -1;
  width: number;
  height: number;
  infinite: false;
  orientation: "orthogonal";
  renderorder: "right-down";
  tiledversion: "1.11.2";
  tilewidth: 48;
  tileheight: 48;
  type: "map";
  version: "1.10";
  nextlayerid: number;
  nextobjectid: number;
  properties: CampusTiledProperty[];
  tilesets: CampusTiledTileset[];
  layers: {
    id: number;
    name: string;
    type: "objectgroup";
    opacity: number;
    visible: true;
    x: number;
    y: number;
    draworder: "topdown";
    objects: CampusTiledObject[];
  }[];
}
const props = (values: CampusTiledProperty[]) =>
  Object.fromEntries(values.map(({ name, value }) => [name, value]));
const property = (
  name: string,
  value: string | number,
): CampusTiledProperty => ({
  name,
  type: typeof value === "number" ? "float" : "string",
  value,
});
const pointObj = (
  id: number,
  name: string,
  type: string,
  point: CampusPoint,
  properties: CampusTiledProperty[] = [],
): CampusTiledObject => ({
  id,
  name,
  type,
  x: point.x,
  y: point.y,
  width: 0,
  height: 0,
  point: true,
  ...(properties.length ? { properties } : {}),
});
const rectObj = (
  id: number,
  name: string,
  type: string,
  rect: CampusRect,
  properties: CampusTiledProperty[] = [],
): CampusTiledObject => ({
  id,
  name,
  type,
  x: rect.x,
  y: rect.y,
  width: rect.width,
  height: rect.height,
  ...(properties.length ? { properties } : {}),
});
function layer(name: string, objects: CampusTiledObject[], id: number) {
  return {
    id,
    name,
    type: "objectgroup" as const,
    opacity: 1,
    visible: true as const,
    x: 0,
    y: 0,
    draworder: "topdown" as const,
    objects,
  };
}
export function exportCampus(campus: CampusDefinition): {
  json: CampusTiledMap;
  tmx: string;
} {
  let nextObject = 1;
  const background = {
    id: nextObject++,
    name: "campus-background",
    type: "",
    gid: 1,
    x: campus.background.imageToWorld.offsetX,
    y: campus.background.imageToWorld.offsetY + campus.bounds.height,
    width: campus.bounds.width,
    height: campus.bounds.height,
  };
  const zones = campus.zones.map((zone) => {
    const xs = zone.polygon.map((p) => p.x),
      ys = zone.polygon.map((p) => p.y),
      x = Math.min(...xs),
      y = Math.min(...ys);
    return {
      id: nextObject++,
      name: zone.id,
      type: "semantic-zone",
      x,
      y,
      width: Math.max(...xs) - x,
      height: Math.max(...ys) - y,
      polygon: zone.polygon.map((p) => ({ x: p.x - x, y: p.y - y })),
      properties: [
        property("title", zone.title),
        property("focusX", zone.focusBounds.x),
        property("focusY", zone.focusBounds.y),
        property("focusWidth", zone.focusBounds.width),
        property("focusHeight", zone.focusBounds.height),
      ],
    };
  });
  const collision = campus.solids.map((solid) =>
    rectObj(nextObject++, solid.id, solid.kind, solid, [
      property("kind", solid.kind),
    ]),
  );
  const doorways = campus.doorways.map((door) =>
    pointObj(nextObject++, door.id, "doorway", door.threshold, [
      property("zoneA", door.zones[0]),
      property("zoneB", door.zones[1]),
      property("approachAX", door.approaches[0].x),
      property("approachAY", door.approaches[0].y),
      property("approachBX", door.approaches[1].x),
      property("approachBY", door.approaches[1].y),
      property("nativeClearWidth", door.nativeClearWidth),
    ]),
  );
  const spawns = [
    pointObj(nextObject++, "entry", "spawn", campus.spawns.entry),
  ];
  const approaches = campus.anchors.map((a) =>
    pointObj(nextObject++, a.id, a.kind, a.point, [
      property("zoneId", a.zoneId),
      property("label", a.label),
      property("interaction", a.interaction ?? ""),
      ...(a.seat
        ? [property("seatX", a.seat.x), property("seatY", a.seat.y)]
        : []),
    ]),
  );
  const npcs = campus.npcs.map((npc) =>
    pointObj(nextObject++, npc.id, "npc", npc.point, [
      property("zoneId", npc.zoneId),
      property("approach", npc.approach),
    ]),
  );
  const layers = [
    layer("background", [background], 2),
    layer("zones", zones, 3),
    layer("collision", collision, 4),
    layer("doorways", doorways, 5),
    layer("spawn_points", spawns, 6),
    layer("approaches", approaches, 7),
    layer("npc_spawns", npcs, 8),
  ];
  const sx = campus.background.imageToWorld.scaleX,
    sy = campus.background.imageToWorld.scaleY;
  const properties: CampusTiledProperty[] = [
    property("campusId", campus.id),
    property("worldWidth", campus.bounds.width),
    property("worldHeight", campus.bounds.height),
    property("nativeImageWidth", campus.background.nativeSize.width),
    property("nativeImageHeight", campus.background.nativeSize.height),
    property("imageScaleX", sx),
    property("imageScaleY", sy),
    property("imageOffsetX", campus.background.imageToWorld.offsetX),
    property("imageOffsetY", campus.background.imageToWorld.offsetY),
    property("backgroundSource", campus.background.src),
  ];
  const json: CampusTiledMap = {
    compressionlevel: -1,
    width: Math.ceil(campus.bounds.width / 48),
    height: Math.ceil(campus.bounds.height / 48),
    infinite: false,
    orientation: "orthogonal",
    renderorder: "right-down",
    tiledversion: "1.11.2",
    tilewidth: 48,
    tileheight: 48,
    type: "map",
    version: "1.10",
    nextlayerid: 9,
    nextobjectid: nextObject,
    properties,
    tilesets: [
      {
        firstgid: 1,
        name: "campus-background",
        tilewidth: campus.background.nativeSize.width,
        tileheight: campus.background.nativeSize.height,
        tilecount: 1,
        columns: 0,
        objectalignment: "bottomleft",
        tiles: [
          {
            id: 0,
            image: "../assets/campus-unified.png",
            imagewidth: campus.background.nativeSize.width,
            imageheight: campus.background.nativeSize.height,
          },
        ],
      },
    ],
    layers,
  };
  const esc = (value: unknown) =>
    String(value)
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  const propertyXml = (items: CampusTiledProperty[]) =>
    `<properties>${items.map((p) => `<property name="${esc(p.name)}" type="${p.type}" value="${esc(p.value)}"/>`).join("")}</properties>`;
  const objectXml = (o: CampusTiledObject) =>
    `<object id="${o.id}" name="${esc(o.name)}" type="${esc(o.type)}"${o.gid === undefined ? "" : ` gid="${o.gid}"`} x="${o.x}" y="${o.y}" width="${o.width}" height="${o.height}">${o.polygon ? `<polygon points="${o.polygon.map((p) => `${p.x},${p.y}`).join(" ")}"/>` : o.point ? "<point/>" : ""}${o.properties?.length ? propertyXml(o.properties) : ""}</object>`;
  const xmlLayers = layers
    .map(
      (l) =>
        `<objectgroup id="${l.id}" name="${l.name}" visible="1">${l.objects.map(objectXml).join("")}</objectgroup>`,
    )
    .join("\n");
  const xmlTilesets = json.tilesets
    .map(
      (tileset) =>
        `<tileset firstgid="${tileset.firstgid}" name="${esc(tileset.name)}" tilewidth="${tileset.tilewidth}" tileheight="${tileset.tileheight}" tilecount="${tileset.tilecount}" columns="${tileset.columns}" objectalignment="${tileset.objectalignment}"><tile id="0"><image source="../public/assets/campus-unified.png" width="${tileset.tiles[0].imagewidth}" height="${tileset.tiles[0].imageheight}"/></tile></tileset>`,
    )
    .join("\n");
  const tmx = `<?xml version="1.0" encoding="UTF-8"?>\n<map version="1.10" tiledversion="1.11.2" orientation="orthogonal" renderorder="right-down" width="${json.width}" height="${json.height}" tilewidth="48" tileheight="48" infinite="0" nextlayerid="${json.nextlayerid}" nextobjectid="${json.nextobjectid}">\n${propertyXml(properties)}\n${xmlTilesets}\n${xmlLayers}\n</map>\n`;
  return { json, tmx };
}
function objectRect(object: CampusTiledObject): CampusRect {
  return {
    x: object.x,
    y: object.y,
    width: object.width,
    height: object.height,
  };
}
export function importCampus(map: CampusTiledMap): CampusDefinition {
  const metadata = props(map.properties),
    find = (name: string) =>
      map.layers.find((l) => l.name === name)?.type === "objectgroup"
        ? (
            map.layers.find((l) => l.name === name) as Extract<
              CampusTiledMap["layers"][number],
              { type: "objectgroup" }
            >
          ).objects
        : [];
  const point = (o: CampusTiledObject): CampusPoint => ({ x: o.x, y: o.y });
  const zones: CampusZone[] = find("zones").map((o) => {
    const p = props(o.properties ?? []),
      poly = (o.polygon ?? []).map((v) => ({ x: o.x + v.x, y: o.y + v.y }));
    return {
      id: o.name as CampusZoneId,
      title: String(p.title),
      polygon: poly,
      focusBounds: {
        x: Number(p.focusX),
        y: Number(p.focusY),
        width: Number(p.focusWidth),
        height: Number(p.focusHeight),
      },
    };
  });
  const solids: CampusSolid[] = find("collision").map((o) => ({
    ...objectRect(o),
    id: o.name,
    kind: o.type as CampusSolid["kind"],
  }));
  const doorways: CampusDoorway[] = find("doorways").map((o) => {
    const p = props(o.properties ?? []);
    return {
      id: o.name,
      zones: [String(p.zoneA), String(p.zoneB)] as [CampusZoneId, CampusZoneId],
      threshold: point(o),
      approaches: [
        { x: Number(p.approachAX), y: Number(p.approachAY) },
        { x: Number(p.approachBX), y: Number(p.approachBY) },
      ],
      nativeClearWidth: Number(p.nativeClearWidth),
    };
  });
  const anchors: CampusAnchor[] = find("approaches").map((o) => {
    const p = props(o.properties ?? []),
      interaction = String(p.interaction);
    return {
      id: o.name,
      zoneId: String(p.zoneId) as CampusZoneId,
      label: String(p.label),
      kind: o.type as CampusAnchor["kind"],
      point: point(o),
      ...(p.seatX !== undefined
        ? { seat: { x: Number(p.seatX), y: Number(p.seatY) } }
        : {}),
      ...(interaction
        ? { interaction: interaction as CampusAnchor["interaction"] }
        : {}),
    };
  });
  const npcObjects = find("npc_spawns");
  return {
    id: String(metadata.campusId) as "academy",
    bounds: {
      width: Number(metadata.worldWidth),
      height: Number(metadata.worldHeight),
    },
    background: {
      src: String(metadata.backgroundSource),
      nativeSize: {
        width: Number(metadata.nativeImageWidth),
        height: Number(metadata.nativeImageHeight),
      },
      imageToWorld: {
        scaleX: Number(metadata.imageScaleX),
        scaleY: Number(metadata.imageScaleY),
        offsetX: Number(metadata.imageOffsetX),
        offsetY: Number(metadata.imageOffsetY),
      },
    },
    zones,
    solids,
    doorways,
    spawns: { entry: point(find("spawn_points")[0]) },
    anchors,
    npcs: npcObjects.map((o) => {
      const p = props(o.properties ?? []);
      return {
        id: o.name as "npc_cikgu",
        zoneId: String(p.zoneId) as "cikgu_room",
        point: point(o),
        approach: String(p.approach) as "teacher",
      };
    }),
  };
}
