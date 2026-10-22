import { sceneCatalog, type Point, type Rect, type SceneId } from "./scenes";
import { findRoute, isFootClear, overlaps } from "./navigation";
export interface DemoActor {
  id: string;
  taskId: string;
  provenance: "DEMO";
  workState: "demo-running";
  sceneId: SceneId;
  placement: "station" | "overflow";
  anchorId: string | null;
  position: Point | null;
}
export function createDemoActors(count = 20): DemoActor[] {
  if (!Number.isSafeInteger(count) || count < 0)
    throw new RangeError("DEMO actor count must be a nonnegative safe integer");
  return Array.from({ length: count }, (_, index) => ({
    id: `demo-worker-${String(index + 1).padStart(3, "0")}`,
    taskId: `demo-task-${String(index + 1).padStart(3, "0")}`,
    provenance: "DEMO",
    workState: "demo-running",
    sceneId: "engineering_lab",
    placement: "overflow",
    anchorId: null,
    position: null,
  }));
}
export function reserveDemoWorkstations(
  actors: readonly DemoActor[],
): DemoActor[] {
  const room = sceneCatalog.engineering_lab;
  const stations = room.anchors
    .filter((anchor) => anchor.kind === "workstation")
    .map((anchor) => ({
      sceneId: room.id,
      anchor,
      placement: "station" as const,
    }));
  const overflow = [
    sceneCatalog.high_council,
    sceneCatalog.library,
    room,
  ].flatMap((scene) =>
    scene.anchors
      .filter((anchor) => anchor.kind === "overflow")
      .map((anchor) => ({
        sceneId: scene.id,
        anchor,
        placement: "overflow" as const,
      })),
  );
  const slots = [...stations, ...overflow];
  // Sorting immutable identities makes reservation independent of render/update order.
  const allocation = new Map(
    [...actors]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((actor, index) => {
        const slot = slots[index];
        return [
          actor.id,
          {
            ...actor,
            sceneId: slot?.sceneId ?? "engineering_lab",
            placement: slot?.placement ?? "overflow",
            anchorId: slot?.anchor.id ?? null,
            position: slot
              ? { ...(slot.anchor.seat ?? slot.anchor.point) }
              : null,
          },
        ];
      }),
  );
  return actors.map((actor) => allocation.get(actor.id)!);
}
export function actorOccupancy(
  actors: readonly DemoActor[],
  sceneId: SceneId,
): Rect[] {
  return actors
    .filter((actor) => actor.sceneId === sceneId && actor.position)
    .map((actor) => ({
      id: actor.id,
      x: actor.position!.x - 8,
      y: actor.position!.y - 6,
      width: 16,
      height: 10,
    }));
}
export type ActorRoute =
  | { status: "move"; route: Point[] }
  | {
      status: "wait";
      position: Point;
      reason: "temporary-occupancy" | "static-unreachable";
    };
export function planActorRoute(
  scene: SceneId,
  start: Point,
  goal: Point,
  occupied: Rect[] = [],
): ActorRoute {
  const route = findRoute(scene, start, goal, { occupied });
  if (route) return { status: "move", route };
  const room = sceneCatalog[scene];
  // A blocked actor yields at a clear overflow anchor instead of parking in a lane.
  const outsideLane = (point: Point) =>
    !room.reservedLanes.some((lane) =>
      overlaps({ x: point.x - 8, y: point.y - 6, width: 16, height: 10 }, lane),
    );
  const wait =
    isFootClear(room, start, occupied) && outsideLane(start)
      ? start
      : room.anchors
          .filter((a) => a.kind === "overflow")
          .map((a) => a.point)
          .find(
            (p) => outsideLane(p) && !!findRoute(room, start, p, { occupied }),
          );
  return {
    status: "wait",
    position: wait ?? start,
    reason: findRoute(room, start, goal)
      ? "temporary-occupancy"
      : "static-unreachable",
  };
}
