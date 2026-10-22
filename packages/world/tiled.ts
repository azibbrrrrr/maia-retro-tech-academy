import type {
  Anchor,
  Portal,
  ReservedLane,
  SceneDefinition,
  SceneId,
} from "./scenes";
// This module is browser-safe. The exporter is a Node-only consumer of this format.
export interface TiledProperty {
  name: string;
  type: string;
  value: string | number | boolean;
}
export interface TiledObject {
  name: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  properties?: TiledProperty[];
}
export interface SceneMap {
  properties: TiledProperty[];
  layers: { name: string; objects?: TiledObject[] }[];
}
export function importScene(map: SceneMap): SceneDefinition {
  const props = (values: TiledProperty[] = []) =>
    Object.fromEntries(
      values.map((property) => [property.name, property.value]),
    );
  const p = props(map.properties),
    objects = (name: string) =>
      map.layers.find((layer) => layer.name === name)?.objects ?? [];
  const point = (object: TiledObject) => ({ x: object.x, y: object.y });
  const rect = (object: TiledObject) => ({
    id: object.name,
    ...point(object),
    width: object.width,
    height: object.height,
  });
  const seats = new Map(
    objects("agent_seats").map((object) => [object.name, point(object)]),
  );
  return {
    id: p.sceneId as SceneId,
    title: p.title as string,
    temporary: p.temporary as boolean,
    bounds: { width: Number(p.worldWidth), height: Number(p.worldHeight) },
    ...(p.background ? { background: String(p.background) } : {}),
    solids: objects("collision").map(rect),
    portals: objects("portals").map((object): Portal => {
      const properties = props(object.properties);
      return {
        ...rect(object),
        label: String(properties.label),
        targetScene: properties.targetScene as SceneId,
        targetSpawn: String(properties.targetSpawn),
        returnPortal: String(properties.returnPortal),
        approach: {
          x: Number(properties.approachX),
          y: Number(properties.approachY),
        },
        activation: "interact",
      };
    }),
    spawns: Object.fromEntries(
      objects("spawn_points").map((object) => [object.name, point(object)]),
    ),
    anchors: objects("approaches").map((object): Anchor => {
      const properties = props(object.properties);
      return {
        id: object.name,
        label: String(properties.label),
        kind: object.type as Anchor["kind"],
        point: point(object),
        ...(seats.has(object.name) ? { seat: seats.get(object.name)! } : {}),
        ...(properties.interaction
          ? { interaction: properties.interaction as Anchor["interaction"] }
          : {}),
      };
    }),
    reservedLanes: objects("reserved_lanes").map((object): ReservedLane => ({
      ...rect(object),
      kind: object.type as ReservedLane["kind"],
      clearance: Number(props(object.properties).clearance),
    })),
    mapPosition: { x: Number(p.mapX), y: Number(p.mapY) },
    npcs: objects("npc_spawns").map((object) => ({
      id: object.name as "npc_cikgu",
      point: point(object),
      approach: String(props(object.properties).approach),
    })),
  };
}
