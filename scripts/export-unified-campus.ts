import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import {
  campusDefinition,
  validateCampus,
} from "../packages/world/unified-campus";
import { exportCampus } from "../packages/world/unified-campus-tiled";
import { FOOT_BODY } from "../packages/world/scenes";

const exported = exportCampus(campusDefinition);
const assetBytes = await readFile("public/assets/campus-unified.png");
const nativePixels = [assetBytes.readUInt32BE(16), assetBytes.readUInt32BE(20)];
const assetSha256 = createHash("sha256").update(assetBytes).digest("hex");
if (
  nativePixels[0] !== campusDefinition.background.nativeSize.width ||
  nativePixels[1] !== campusDefinition.background.nativeSize.height
)
  throw new Error(
    `Campus artwork is ${nativePixels.join("×")}, expected ${campusDefinition.background.nativeSize.width}×${campusDefinition.background.nativeSize.height}`,
  );
await mkdir("maps", { recursive: true });
await mkdir("public/maps", { recursive: true });
await writeFile(
  "public/maps/campus-unified.json",
  `${JSON.stringify(exported.json, null, 2)}\n`,
);
await writeFile("maps/campus-unified.tmx", exported.tmx);
const validation = validateCampus();
const report = {
  asset: {
    path: "public/assets/campus-unified.png",
    nativePixels,
    sha256: assetSha256,
  },
  world: campusDefinition.bounds,
  imageToWorld: campusDefinition.background.imageToWorld,
  footGeometry: {
    conservativeStaticEnvelopeWorldUnits: [footBodyWidth(), footBodyHeight()],
    actualPhaserBodyWorldUnits: [
      FOOT_BODY.exact.right - FOOT_BODY.exact.left,
      FOOT_BODY.exact.bottom - FOOT_BODY.exact.top,
    ],
  },
  spawn: campusDefinition.spawns.entry,
  issues: validation.issues,
  routeCount: validation.routes.length,
  reachableRouteCount: validation.routes.filter((r) => r.reachable).length,
  routes: validation.routes.map((r) => ({
    ...r,
    distance: Number.isFinite(r.distance)
      ? Number(r.distance.toFixed(2))
      : null,
  })),
  doors: campusDefinition.doorways.map((d) => ({
    id: d.id,
    clearWidthNativePx: d.nativeClearWidth,
    clearWidthWorld: Number(
      (
        d.nativeClearWidth *
        Math.min(
          campusDefinition.background.imageToWorld.scaleX,
          campusDefinition.background.imageToWorld.scaleY,
        )
      ).toFixed(2),
    ),
    residualForFootBody: Number(
      (
        d.nativeClearWidth *
          Math.min(
            campusDefinition.background.imageToWorld.scaleX,
            campusDefinition.background.imageToWorld.scaleY,
          ) -
        16
      ).toFixed(2),
    ),
  })),
  workstationAisles: {
    deskColumnsNativePx: [
      [586, 663],
      [713, 791],
      [878, 952],
      [1010, 1085],
    ],
    seatCenterXNativePx: [625, 752, 915, 1048],
    approachXNativePx: [548, 815, 861, 988],
    nativeColumnGapsPx: [50, 87, 58],
    worldClearWidthsBeforeBody: [50, 87, 58].map((gap) =>
      Number(
        (gap * campusDefinition.background.imageToWorld.scaleX).toFixed(2),
      ),
    ),
    residualAfterClearanceBody: [50, 87, 58].map((gap) =>
      Number(
        (
          gap * campusDefinition.background.imageToWorld.scaleX -
          (FOOT_BODY.clearance.right - FOOT_BODY.clearance.left)
        ).toFixed(2),
      ),
    ),
    rowGapNativePx: [0, 0, 0],
    note: "Desk and chair ground silhouettes are traced as sixteen station footprints. Art footprints touch vertically; approaches use measured side aisles. The minimum inter-column residual after the 16-unit clearance body is reported without claiming more clearance than measured.",
  },
  entrance: {
    route:
      "entry spawn uses the visible west opening around the central sign wall; east opening is separately route checked",
    westOpeningNativePx: 23,
    eastOpeningNativePx: 20,
    gardenSideBypassNativePx: 26,
    note: "The center sign wall remains solid; no route or spawn is placed through it. Garden-bed ground footprints block walking; tree canopy is not treated as a collision.",
  },
  councilEast: {
    doorPlaneNativeX: 358,
    thresholdNative: [358, 370],
    northJambNativeBounds: [347, 278, 24, 48],
    southJambNativeBounds: [339, 407, 25, 47],
    validatedRoutes: [
      "council-east:threshold",
      "council-east:approach-a",
      "council-east:approach-b",
      "pr-board",
    ],
  },
  exports: {
    json: "public/maps/campus-unified.json",
    tmx: "maps/campus-unified.tmx",
    backgroundPlacement:
      "one native-size image-collection tile, drawn by a bottom-left tile object at world x=0,y=2160 with world extent 3840×2160",
    roundTrip: "validated by tests/unified-campus.test.ts",
  },
};
await writeFile(
  "docs/unified-campus-route-report.json",
  `${JSON.stringify(report, null, 2)}\n`,
);
const format = (distance: number) => Number(distance.toFixed(1));
const lines = [
  "# Unified campus v9 registration and static routes",
  "",
  `Source plate: \`${report.asset.path}\`, native ${report.asset.nativePixels.join("×")}, SHA-256 \`${report.asset.sha256}\`.`,
  `World: ${campusDefinition.bounds.width}×${campusDefinition.bounds.height}; source-to-world scales x=${campusDefinition.background.imageToWorld.scaleX.toFixed(8)} and y=${campusDefinition.background.imageToWorld.scaleY.toFixed(8)}. The transform is global; the source plate remains ${report.asset.nativePixels.join("×")} and is not represented as regenerated 4K art.`,
  `Spawn: world (${format(campusDefinition.spawns.entry.x)}, ${format(campusDefinition.spawns.entry.y)}), aligned to the visible west-side gate opening around the solid centre sign wall. Both gate openings are modeled and route checked.`,
  "",
  `Static navigation checks ${report.routeCount} targets from the safe gate spawn: ${report.reachableRouteCount} pass and ${report.routeCount - report.reachableRouteCount} fail. Targets include every anchor, NPC, doorway threshold, and both doorway approaches. Each route uses a conservative ${footBodyWidth()}×${footBodyHeight()} world-unit static clearance envelope around the actual ${report.footGeometry.actualPhaserBodyWorldUnits.join("×")} world-unit Phaser body, against registered walls, furniture, and ground-footprint landscaping. The report has ${validation.issues.length} total issues because it also checks each doorway's approach-to-threshold continuity.`,
  `Validation scope: the prior separate-room navigation baseline completed \`npm run check\` green (12 unit and 45 browser tests, 23.7 minutes) before the unified-campus migration; it is historical evidence for that runtime. Current changed U0 files are covered by the focused \`tests/unified-campus.test.ts\` cases and ${report.reachableRouteCount}/${report.routeCount} static routes. The integrated browser suite is reserved for the post-U1 acceptance pass.`,
  "",
  "| Door / physical opening | Native clear width | World width | Width after clearance envelope |",
  "| --- | ---: | ---: | ---: |",
  ...report.doors.map(
    (d) =>
      `| ${d.id} | ${d.clearWidthNativePx}px | ${d.clearWidthWorld}u | ${d.residualForFootBody}u |`,
  ),
  "",
  `The engineering lab has exactly sixteen stable \`station-01\`…\`station-16\` IDs in four columns and four rows. Actual v9 ground silhouettes are traced at native x bounds ${report.workstationAisles.deskColumnsNativePx.map(([a, b]) => `${a}–${b}`).join(", ")} with seat centers x=${report.workstationAisles.seatCenterXNativePx.join(", ")} and side approaches x=${report.workstationAisles.approachXNativePx.join(", ")}. Inter-column gaps measure ${report.workstationAisles.nativeColumnGapsPx.join(", ")} native pixels; the minimum is ${Math.min(...report.workstationAisles.worldClearWidthsBeforeBody)} world units before the ${FOOT_BODY.clearance.right - FOOT_BODY.clearance.left}-unit clearance body and ${Math.min(...report.workstationAisles.residualAfterClearanceBody)} units after it. Station footprints touch vertically, so no through-row clearance is claimed.`,
  "",
  "Seven room entries have continuous floor crossings to the campus. The Library, Watchtower/NOC, Council and QA openings use the actual inner wall planes from the v9 native-source trace; the closed lab side leaves remain solid and are not listed as doors. The Lab south entrance passes between the two retained jambs and planter footprints. Kantin and Cikgu room crossings use their actual wall gaps. The sign wall across the gate centre remains solid; both visible side openings are modeled separately.",
  "",
  `The Tiled JSON and TMX exports are generated from the same typed \`CampusDefinition\`. Their background uses one image-collection tile at native ${report.asset.nativePixels.join("×")} source dimensions, with a bottom-left aligned tile object placed at (0,2160) and sized 3840×2160 to cover the world. The custom map properties retain the global affine transform. This follows Tiled's [JSON map format](https://doc.mapeditor.org/en/stable/reference/json-map-format/) and [TMX map format](https://doc.mapeditor.org/en/stable/reference/tmx-map-format/) tile-object and image-collection representation; native image-layer dimensions alone are not a scale transform. Export/import equality, background placement and static routes are covered by the focused \`tests/unified-campus.test.ts\` checks.`,
  "",
  "Routes and detailed measured geometry: [`docs/unified-campus-route-report.json`](./unified-campus-route-report.json). Overlay: [`docs/evidence/campus-v9-registration-overlay.png`](./evidence/campus-v9-registration-overlay.png).",
  "",
];
function footBodyWidth() {
  return FOOT_BODY.clearance.right - FOOT_BODY.clearance.left;
}
function footBodyHeight() {
  return FOOT_BODY.clearance.bottom - FOOT_BODY.clearance.top;
}
await mkdir("docs/evidence", { recursive: true });
await writeFile("docs/unified-campus-route-report.md", lines.join("\n"));
console.info(
  `Exported ${campusDefinition.zones.length} zones, ${campusDefinition.solids.length} solids, ${campusDefinition.doorways.length} doorways, ${campusDefinition.anchors.length} anchors; routes ${report.reachableRouteCount}/${report.routeCount}.`,
);
if (validation.issues.length) {
  console.error(validation.issues.join("\n"));
  process.exitCode = 1;
}
