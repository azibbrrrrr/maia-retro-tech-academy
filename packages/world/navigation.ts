import {
  FOOT_BODY,
  sceneCatalog,
  sceneIds,
  type Point,
  type Rect,
  type SceneDefinition,
  type SceneId,
} from "./scenes";
export const NAVIGATION_STEP = 12;
const definition = (scene: SceneId | SceneDefinition) =>
  typeof scene === "string" ? sceneCatalog[scene] : scene;
export const overlaps = (
  a: Pick<Rect, "x" | "y" | "width" | "height">,
  b: Pick<Rect, "x" | "y" | "width" | "height">,
) =>
  a.x < b.x + b.width &&
  a.x + a.width > b.x &&
  a.y < b.y + b.height &&
  a.y + a.height > b.y;
export function isFootClear(
  scene: SceneId | SceneDefinition,
  point: Point,
  occupied: Rect[] = [],
): boolean {
  const room = definition(scene),
    foot = FOOT_BODY.clearance;
  const body = {
    x: point.x + foot.left,
    y: point.y + foot.top,
    width: foot.right - foot.left,
    height: foot.bottom - foot.top,
  };
  return (
    body.x >= 0 &&
    body.y >= 0 &&
    body.x + body.width <= room.bounds.width &&
    body.y + body.height <= room.bounds.height &&
    ![...room.solids, ...occupied].some((solid) => overlaps(body, solid))
  );
}
export function segmentClear(
  scene: SceneId | SceneDefinition,
  start: Point,
  goal: Point,
  occupied: Rect[] = [],
): boolean {
  // Slab intersection with Minkowski-expanded solids checks the entire segment,
  // including sub-grid corners: no sampling gaps or diagonal corner cutting.
  if (
    !isFootClear(scene, start, occupied) ||
    !isFootClear(scene, goal, occupied)
  )
    return false;
  const room = definition(scene),
    foot = FOOT_BODY.clearance;
  return ![...room.solids, ...occupied].some((rect) => {
    const lower = [rect.x - foot.right, rect.y - foot.bottom],
      upper = [
        rect.x + rect.width - foot.left,
        rect.y + rect.height - foot.top,
      ];
    const origin = [start.x, start.y],
      delta = [goal.x - start.x, goal.y - start.y];
    let enter = 0,
      leave = 1;
    for (let axis = 0; axis < 2; axis++) {
      if (delta[axis] === 0) {
        if (origin[axis] <= lower[axis] || origin[axis] >= upper[axis])
          return false;
      } else {
        const a = (lower[axis] - origin[axis]) / delta[axis],
          b = (upper[axis] - origin[axis]) / delta[axis];
        enter = Math.max(enter, Math.min(a, b));
        leave = Math.min(leave, Math.max(a, b));
      }
    }
    return enter < leave;
  });
}
export function findRoute(
  scene: SceneId | SceneDefinition,
  start: Point,
  goal: Point,
  options: { occupied?: Rect[] } = {},
): Point[] | null {
  const room = definition(scene),
    occupied = options.occupied ?? [];
  if (!isFootClear(room, start, occupied) || !isFootClear(room, goal, occupied))
    return null;
  if (segmentClear(room, start, goal, occupied)) return [start, goal];
  const step = NAVIGATION_STEP,
    columns = Math.ceil(room.bounds.width / step),
    rows = Math.ceil(room.bounds.height / step);
  const point = (index: number): Point => ({
    x: (index % columns) * step,
    y: Math.floor(index / columns) * step,
  });
  const nearest = (p: Point): number | undefined => {
    const col = Math.round(p.x / step),
      row = Math.round(p.y / step);
    for (let radius = 0; radius <= 3; radius++)
      for (let y = row - radius; y <= row + radius; y++)
        for (let x = col - radius; x <= col + radius; x++) {
          if (x < 0 || y < 0 || x >= columns || y >= rows) continue;
          const index = y * columns + x;
          if (segmentClear(room, p, point(index), occupied)) return index;
        }
  };
  const source = nearest(start),
    target = nearest(goal);
  if (source === undefined || target === undefined) return null;
  const previous = new Int32Array(columns * rows).fill(-2),
    queue = [source];
  previous[source] = -1;
  for (let head = 0; head < queue.length; head++) {
    const current = queue[head];
    if (current === target) {
      const route: Point[] = [goal];
      let index = current;
      while (index !== -1) {
        route.push(point(index));
        index = previous[index];
      }
      route.push(start);
      route.reverse();
      // Keep real obstacle bends while making browser input traversal economical.
      const simplified: Point[] = [route[0]];
      let from = 0;
      while (from < route.length - 1) {
        let next = route.length - 1;
        while (
          next > from + 1 &&
          !segmentClear(room, route[from], route[next], occupied)
        )
          next--;
        simplified.push(route[next]);
        from = next;
      }
      return simplified;
    }
    const col = current % columns,
      row = Math.floor(current / columns);
    for (const [x, y] of [
      [col + 1, row],
      [col, row + 1],
      [col - 1, row],
      [col, row - 1],
    ]) {
      if (x < 0 || y < 0 || x >= columns || y >= rows) continue;
      const index = y * columns + x;
      if (
        previous[index] !== -2 ||
        !segmentClear(room, point(current), point(index), occupied)
      )
        continue;
      previous[index] = current;
      queue.push(index);
    }
  }
  return null;
}
export interface RouteEvidence {
  scene: SceneId;
  start: string;
  goal: string;
  reachable: boolean;
  distance: number;
  waypoints: Point[];
}
export interface CampusValidation {
  issues: string[];
  reachableScenes: SceneId[];
  routes: RouteEvidence[];
}
export function validateCampus(
  catalog: Record<SceneId, SceneDefinition> = sceneCatalog,
): CampusValidation {
  const issues: string[] = [],
    routes: RouteEvidence[] = [],
    reached = new Set<SceneId>(),
    queue: SceneId[] = ["entrance"];
  while (queue.length) {
    const id = queue.shift()!;
    if (reached.has(id)) continue;
    reached.add(id);
    for (const portal of catalog[id].portals)
      if (catalog[portal.targetScene]) queue.push(portal.targetScene);
  }
  for (const id of sceneIds) {
    const room = catalog[id];
    if (!reached.has(id)) issues.push(`${id}: unreachable from gate`);
    const targets: [string, Point][] = [
      ...Object.entries(room.spawns),
      ...room.anchors.flatMap((anchor): [string, Point][] => [
        [anchor.id, anchor.point],
        ...(anchor.seat
          ? [[`${anchor.id}:seat`, anchor.seat] as [string, Point]]
          : []),
      ]),
      ...room.portals.flatMap((portal): [string, Point][] => [
        [portal.id, portal.approach],
        [
          `${portal.id}:threshold`,
          { x: portal.x + portal.width / 2, y: portal.y + portal.height / 2 },
        ],
      ]),
      ...room.npcs.map((npc): [string, Point] => [npc.id, npc.point]),
    ];
    for (const [name, point] of targets) {
      const path = findRoute(room, room.spawns.entry, point);
      if (!path) issues.push(`${id}:${name}: foot-blocked or unreachable`);
      routes.push({
        scene: id,
        start: "entry",
        goal: name,
        reachable: !!path,
        distance:
          path?.reduce(
            (sum, p, index) =>
              index
                ? sum +
                  Math.hypot(p.x - path[index - 1].x, p.y - path[index - 1].y)
                : 0,
            0,
          ) ?? 0,
        waypoints: path ?? [],
      });
    }
    for (const lane of room.reservedLanes)
      if (room.solids.some((solid) => overlaps(lane, solid)))
        issues.push(`${id}:${lane.id}: solid invades reserved lane`);
    for (const [name, spawn] of Object.entries(room.spawns))
      if (
        room.portals.some((portal) =>
          overlaps(
            { x: spawn.x - 8, y: spawn.y - 6, width: 16, height: 10 },
            portal,
          ),
        )
      )
        issues.push(`${id}:${name}: landing overlaps a portal`);
    for (const portal of room.portals) {
      const target = catalog[portal.targetScene],
        reverse = target?.portals.find((p) => p.id === portal.returnPortal);
      if (
        !target?.spawns[portal.targetSpawn] ||
        !reverse ||
        reverse.targetScene !== id ||
        reverse.returnPortal !== portal.id
      )
        issues.push(`${id}:${portal.id}: missing reciprocal destination`);
      if (room.solids.some((solid) => overlaps(portal, solid)))
        issues.push(`${id}:${portal.id}: transfer painted on a solid`);
    }
  }
  return { issues, reachableScenes: [...reached], routes };
}
