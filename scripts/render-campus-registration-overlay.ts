import { mkdir, readFile, writeFile } from "node:fs/promises";
import {
  campusDefinition,
  findRoute,
  validateCampus,
  worldToImagePixel,
} from "../packages/world/unified-campus";

const native = campusDefinition.background.nativeSize;
const platePath = process.argv[2] ?? "public/assets/campus-unified.png";
const plateLabel = process.argv[3] ?? "v9";
const image = await readFile(platePath);
const pixel = (point: { x: number; y: number }) => worldToImagePixel(point);
const polygon = (points: { x: number; y: number }[]) =>
  points
    .map((p) => `${pixel(p).x.toFixed(2)},${pixel(p).y.toFixed(2)}`)
    .join(" ");
const escape = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
const parts: string[] = [
  `<svg xmlns="http://www.w3.org/2000/svg" width="${native.width}" height="${native.height}" viewBox="0 0 ${native.width} ${native.height}">`,
  `<image href="data:image/png;base64,${image.toString("base64")}" width="${native.width}" height="${native.height}"/>`,
  `<g font-family="system-ui, sans-serif" font-weight="600">`,
];
const textTag = (
  x: number,
  y: number,
  value: string,
  fontSize: number,
  fill = "#ffffff",
) => {
  const width = value.length * fontSize * 0.58 + 4;
  return `<rect x="${x}" y="${y - fontSize + 1}" width="${width}" height="${fontSize + 3}" rx="1.5" fill="#07111f" fill-opacity="0.82"/><text x="${x + 2}" y="${y}" fill="${fill}" font-size="${fontSize}">${escape(value)}</text>`;
};
const validation = validateCampus();
for (const zone of campusDefinition.zones) {
  if (zone.id === "entrance") continue;
  const xy = polygon(zone.polygon);
  parts.push(
    `<polygon points="${xy}" fill="#00d9ff" fill-opacity="0.035" stroke="#3be7ff" stroke-width="2" stroke-dasharray="8 4"/>`,
  );
  const box = pixel({ x: zone.focusBounds.x, y: zone.focusBounds.y });
  parts.push(textTag(box.x + 4, box.y + 14, zone.id, 12, "#d9faff"));
}
const colors = {
  wall: "#ff4f59",
  fixture: "#ffc247",
  landscape: "#7ded75",
  fence: "#d680ff",
};
for (const solid of campusDefinition.solids) {
  const topLeft = pixel({ x: solid.x, y: solid.y });
  const bottomRight = pixel({
    x: solid.x + solid.width,
    y: solid.y + solid.height,
  });
  parts.push(
    `<rect x="${topLeft.x}" y="${topLeft.y}" width="${bottomRight.x - topLeft.x}" height="${bottomRight.y - topLeft.y}" fill="${colors[solid.kind]}" fill-opacity="0.17" stroke="${colors[solid.kind]}" stroke-opacity="0.72" stroke-width="0.8"><title>${escape(solid.id)}</title></rect>`,
  );
}
const spawn = pixel(campusDefinition.spawns.entry);
for (const { id, reachable, distance } of validation.routes) {
  if (!reachable) continue;
  const target =
    campusDefinition.anchors.find((anchor) => anchor.id === id)?.point ??
    campusDefinition.npcs.find((npc) => npc.id === id)?.point ??
    campusDefinition.doorways
      .flatMap((door) => [
        [`${door.id}:threshold`, door.threshold] as const,
        [`${door.id}:approach-a`, door.approaches[0]] as const,
        [`${door.id}:approach-b`, door.approaches[1]] as const,
      ])
      .find(([targetId]) => targetId === id)?.[1];
  if (!target) continue;
  const route = findRoute(
    campusDefinition,
    campusDefinition.spawns.entry,
    target,
  );
  if (!route) continue;
  const councilProof = id === "pr-board" || id.startsWith("council-east:");
  parts.push(
    `<polyline points="${polygon(route.points)}" fill="none" stroke="${councilProof ? "#00f5ff" : "#44b8ff"}" stroke-opacity="${councilProof ? "0.9" : "0.17"}" stroke-width="${councilProof ? "2.2" : "1.2"}" stroke-linecap="round" stroke-linejoin="round"><title>${escape(id)} route ${distance.toFixed(1)} world units</title></polyline>`,
  );
}
for (const door of campusDefinition.doorways) {
  const threshold = pixel(door.threshold),
    a = pixel(door.approaches[0]),
    b = pixel(door.approaches[1]);
  parts.push(
    `<circle cx="${threshold.x}" cy="${threshold.y}" r="4" fill="#35ff8e" stroke="#07111f" stroke-width="1.5"><title>${escape(door.id)} threshold</title></circle>`,
  );
  parts.push(
    `<line x1="${a.x}" y1="${a.y}" x2="${threshold.x}" y2="${threshold.y}" stroke="#35ff8e" stroke-width="1.4" stroke-dasharray="4 2"/><line x1="${threshold.x}" y1="${threshold.y}" x2="${b.x}" y2="${b.y}" stroke="#35ff8e" stroke-width="1.4" stroke-dasharray="4 2"/>`,
  );
  parts.push(textTag(threshold.x + 5, threshold.y - 3, door.id, 9, "#d9ffe8"));
}
for (const anchor of campusDefinition.anchors) {
  const point = pixel(anchor.point);
  const failed = validation.routes.some(
    (route) => route.id === anchor.id && !route.reachable,
  );
  const fill = failed
    ? "#ff4242"
    : anchor.kind === "workstation"
      ? "#65d8ff"
      : "#fff27a";
  parts.push(
    `<circle cx="${point.x}" cy="${point.y}" r="${anchor.kind === "workstation" ? 3 : 4}" fill="${fill}" stroke="#07111f" stroke-width="1"><title>${escape(anchor.id)} · ${escape(anchor.label)}</title></circle>`,
  );
  const label = anchor.id.startsWith("station-")
    ? anchor.id.slice(-2)
    : anchor.id;
  parts.push(
    textTag(
      point.x + 4,
      point.y - 4,
      label,
      anchor.kind === "workstation" ? 8 : 9,
    ),
  );
}
for (const npc of campusDefinition.npcs) {
  const point = pixel(npc.point);
  parts.push(
    `<rect x="${point.x - 4}" y="${point.y - 4}" width="8" height="8" fill="#ff9e42" stroke="#07111f" stroke-width="1.2"><title>${escape(npc.id)} standing point</title></rect>${textTag(point.x + 5, point.y + 11, npc.id, 9, "#fff2d8")}`,
  );
}
parts.push(
  `<path d="M${spawn.x - 6},${spawn.y}h12 M${spawn.x},${spawn.y - 6}v12" stroke="#35ff8e" stroke-width="2.5"/>${textTag(spawn.x + 8, spawn.y + 4, "safe spawn", 10, "#d9ffe8")}`,
);
const title = `${plateLabel} source-pixel registration · red walls · amber fixtures · green ground collision · purple fence · blue routes · cyan Council proofs · green thresholds · red anchor marks a failed route`;
parts.push(textTag(8, 20, title, 12));
parts.push("</g></svg>");
await mkdir("docs/evidence", { recursive: true });
await writeFile(
  `docs/evidence/campus-${plateLabel}-registration-overlay.svg`,
  parts.join("\n"),
);
console.info(
  `Wrote ${campusDefinition.solids.length} footprint overlays, ${campusDefinition.anchors.length} anchors, and ${validation.routes.filter((route) => route.reachable).length}/${validation.routes.length} static routes.`,
);
