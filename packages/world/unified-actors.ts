import {
  CAMPUS_ID,
  campusDefinition,
  imagePixelToWorld,
  type CampusPoint,
  type CampusZoneId,
} from "./unified-campus";

export interface DemoActor {
  id: string;
  taskId: string;
  provenance: "DEMO";
  workState: "demo-running";
  campusId: typeof CAMPUS_ID;
  zoneId: CampusZoneId;
  /** Kept as a semantic alias for existing labels and integrations. */
  sceneId: CampusZoneId;
  placement: "station" | "overflow";
  anchorId: string | null;
  position: CampusPoint | null;
}

export function createDemoActors(count = 20): DemoActor[] {
  if (!Number.isSafeInteger(count) || count < 0)
    throw new RangeError("DEMO actor count must be a nonnegative safe integer");
  return Array.from({ length: count }, (_, index) => ({
    id: `demo-worker-${String(index + 1).padStart(3, "0")}`,
    taskId: `demo-task-${String(index + 1).padStart(3, "0")}`,
    provenance: "DEMO" as const,
    workState: "demo-running" as const,
    campusId: CAMPUS_ID,
    zoneId: "engineering_lab" as const,
    sceneId: "engineering_lab" as const,
    placement: "overflow" as const,
    anchorId: null,
    position: null,
  }));
}

/** Reserve the sixteen authored lab seats and four clear auxiliary anchors. */
export function reserveUnifiedDemoActors(
  actors: readonly DemoActor[],
): DemoActor[] {
  const stations = campusDefinition.anchors
    .filter((anchor) => anchor.id.startsWith("station-") && anchor.seat)
    .map((anchor) => ({
      anchorId: anchor.id,
      zoneId: anchor.zoneId,
      position: anchor.seat!,
      placement: "station" as const,
    }));
  // These are clear standing positions, not interaction or seat anchors. Keep
  // the overflow actors visible without putting their immovable feet on a
  // table, door lane, workstation approach, or the welcome sign approach.
  const overflow = [
    { zoneId: "kantin", point: imagePixelToWorld({ x: 80, y: 685 }) },
    { zoneId: "kantin", point: imagePixelToWorld({ x: 380, y: 685 }) },
    { zoneId: "cikgu_room", point: imagePixelToWorld({ x: 1290, y: 690 }) },
    { zoneId: "entrance", point: imagePixelToWorld({ x: 740, y: 880 }) },
  ].map(({ zoneId, point }) => ({
    anchorId: null,
    zoneId: zoneId as CampusZoneId,
    position: point,
    placement: "overflow" as const,
  }));
  const slots = [...stations, ...overflow];
  return [...actors]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((actor, index) => {
      const slot = slots[index];
      const zoneId = slot?.zoneId ?? "engineering_lab";
      return {
        ...actor,
        campusId: CAMPUS_ID,
        zoneId,
        sceneId: zoneId,
        placement: slot?.placement ?? "overflow",
        anchorId: slot?.anchorId ?? null,
        position: slot ? { ...slot.position } : null,
      };
    });
}
