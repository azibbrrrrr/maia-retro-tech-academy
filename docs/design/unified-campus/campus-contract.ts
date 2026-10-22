/** Typed shape for the U0 floorplan data; see campus-contract.json for values. */
export type Point = [number, number];
export type Rect = [x1: number, y1: number, x2: number, y2: number];

export interface CampusRoom {
  id: string;
  label: string;
  rect: Rect;
  fill: string;
  zoneType: "interior" | "open-space" | "entry";
  function: string;
}

export interface CampusDoor {
  id: string;
  zoneId: string;
  wall: "north" | "east" | "south" | "west" | "south-boundary";
  segment: [number, number, number, number];
  width: number;
  opensTo: string;
}

export interface Workstation {
  id: string;
  zoneId: "engineering_lab";
  row: 1 | 2 | 3 | 4;
  column: 1 | 2 | 3 | 4;
  deskRect: Rect;
  chairRect: Rect;
  approachRect: Rect;
  usePoint: Point;
  approachHeading: "north" | "east" | "south" | "west";
}

export interface CampusContract {
  schemaVersion: string;
  status: string;
  coordinateContract: {
    worldBounds: Rect;
    worldUnits: string;
    origin: "top-left";
    axes: { x: "right"; y: "down" };
    imageBounds: Rect;
    nativeImagePixels: [3840, 2160];
    transform: string;
    imageOffset: Point;
    scale: 1;
    crop: null;
    overviewFitScale: number;
    grid: { spacing: 48; columns: 80; rows: 45 };
    footBody: [14.08, 7.92];
    footBodySource: string;
  };
  siteIntent: {
    campusIsContinuous: true;
    normalMovementSceneHops: false;
    interiorsVisibleInOverview: true;
    treeCutoutFriendly: true;
  };
  rooms: CampusRoom[];
  walkablePaths: Array<{
    id: string;
    rect: Rect;
    width: number | null;
    role: string;
  }>;
  doors: CampusDoor[];
  wallSegments: Array<{
    zoneId: string;
    from: Point;
    to: Point;
    thickness: number;
  }>;
  workstations: Workstation[];
  fixtures: Array<{
    id: string;
    zoneId: string;
    kind: string;
    rect: Rect;
    solid: boolean;
  }>;
  useAnchors: Array<{
    id: string;
    zoneId: string;
    purpose: string;
    point: Point;
  }>;
  treeCutoutCandidates: Array<{
    id: string;
    center: Point;
    radius: number;
    clearOfPaths: boolean;
    purpose: string;
  }>;
  connectivity: {
    root: string;
    edges: [string, string][];
    rule: string;
  };
  labAisles: Array<{
    id: string;
    rect: Rect;
    clearWidth: number;
    preferredMinimum: number;
  }>;
  labAisles: Array<{
    id: string;
    rect: Rect;
    orientation: "horizontal" | "vertical";
    clearance: number;
    preferredMinimum: number;
  }>;
  notes: string[];
}

// Consumers can validate the checked-in JSON against this schema before using it.
