import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  campusDefinition,
  findRoute,
  imagePixelToWorld,
  pointToZone,
  segmentClear,
  validateCampus,
  worldToImagePixel,
} from "../packages/world/unified-campus";
import {
  exportCampus,
  importCampus,
} from "../packages/world/unified-campus-tiled";

test("selected v9 plate is registered once in the locked 3840×2160 world", () => {
  assert.equal(campusDefinition.id, "academy");
  assert.deepEqual(campusDefinition.bounds, { width: 3840, height: 2160 });
  assert.deepEqual(campusDefinition.background.nativeSize, {
    width: 1670,
    height: 941,
  });
  const image = readFileSync("public/assets/campus-unified.png");
  assert.deepEqual(
    [image.readUInt32BE(16), image.readUInt32BE(20)],
    [1670, 941],
  );
  assert.deepEqual(Object.keys(campusDefinition.background.imageToWorld), [
    "scaleX",
    "scaleY",
    "offsetX",
    "offsetY",
  ]);
  assert.deepEqual(campusDefinition.zones.map(({ id }) => id).sort(), [
    "cikgu_room",
    "engineering_lab",
    "entrance",
    "high_council",
    "kantin",
    "library",
    "qa_lab",
    "watchtower",
  ]);
  assert.equal(
    pointToZone(campusDefinition, imagePixelToWorld({ x: 1400, y: 350 })),
    "qa_lab",
  );
  assert.equal(pointToZone(campusDefinition, { x: 1900, y: 1400 }), "entrance");
});

test("v9 door crossings and all sixteen stations fit the tested foot envelope", () => {
  const report = validateCampus();
  assert.deepEqual(report.issues, []);
  assert.equal(report.routes.length, 55);
  assert.equal(report.routes.filter((route) => route.reachable).length, 55);
  assert.equal(campusDefinition.doorways.length, 9);
  assert.equal(
    campusDefinition.doorways.some((doorway) =>
      ["lab-west", "lab-east"].includes(doorway.id),
    ),
    false,
  );
  const expectedCrossings = [
    ["library-east", [367, 162], [335, 162], [407, 162]],
    ["watchtower-west", [1294, 170], [1315, 170], [1245, 170]],
    ["council-east", [358, 370], [330, 370], [407, 370]],
    ["qa-west", [1312, 376], [1350, 376], [1260, 376]],
    ["kantin-east", [402, 625], [348, 625], [445, 625]],
    ["cikgu-west", [1252, 630], [1286, 630], [1229, 630]],
    ["lab-south", [838, 379], [815, 350], [838, 425]],
  ] as const;
  for (const [id, threshold, inside, outside] of expectedCrossings) {
    const door = campusDefinition.doorways.find(
      (candidate) => candidate.id === id,
    )!;
    for (const [point, expected] of [
      [door.threshold, threshold],
      [door.approaches[0], inside],
      [door.approaches[1], outside],
    ] as const) {
      const native = worldToImagePixel(point);
      assert.ok(Math.abs(native.x - expected[0]) < 0.01, `${id} native x`);
      assert.ok(Math.abs(native.y - expected[1]) < 0.01, `${id} native y`);
    }
    assert.equal(
      pointToZone(campusDefinition, door.approaches[0]),
      door.zones[0],
    );
    assert.equal(pointToZone(campusDefinition, door.approaches[1]), "entrance");
  }
  assert.equal(
    campusDefinition.anchors.filter((anchor) =>
      anchor.id.startsWith("station-"),
    ).length,
    16,
  );
  assert.deepEqual(
    campusDefinition.anchors
      .filter((anchor) => anchor.id.startsWith("station-"))
      .map(({ id }) => id),
    Array.from(
      { length: 16 },
      (_, i) => `station-${String(i + 1).padStart(2, "0")}`,
    ),
  );
  assert.ok(
    campusDefinition.doorways.some(
      (doorway) => doorway.id === "outer-gate-west",
    ),
  );
  assert.ok(
    campusDefinition.doorways.some(
      (doorway) => doorway.id === "outer-gate-east",
    ),
  );
  assert.equal(
    campusDefinition.doorways.some(
      (doorway) => "activation" in doorway || "targetSpawn" in doorway,
    ),
    false,
  );
  const spawn = campusDefinition.spawns.entry;
  for (const anchor of campusDefinition.anchors)
    assert.ok(findRoute(campusDefinition, spawn, anchor.point), anchor.id);
});

test("lab-front beds and benches block the painted ground footprint", () => {
  const segmentStart = imagePixelToWorld({ x: 690, y: 360 });
  const segmentEnd = imagePixelToWorld({ x: 690, y: 430 });
  assert.equal(segmentClear(campusDefinition, segmentStart, segmentEnd), false);
  assert.equal(
    segmentClear(
      campusDefinition,
      imagePixelToWorld({ x: 838, y: 350 }),
      imagePixelToWorld({ x: 838, y: 430 }),
    ),
    true,
  );
  assert.deepEqual(
    campusDefinition.solids
      .filter((solid) => solid.id.startsWith("lab-front-"))
      .map(({ id }) => id),
    [
      "lab-front-bed-west",
      "lab-front-bench-west",
      "lab-front-bench-east",
      "lab-front-bed-east",
    ],
  );
});

test("overflow DEMO bodies keep every interaction approach reachable", async () => {
  const { createDemoActors, reserveUnifiedDemoActors } =
    await import("../packages/world/unified-actors");
  const actors = reserveUnifiedDemoActors(createDemoActors(28));
  const overflow = actors.filter((actor) => actor.placement === "overflow");
  assert.equal(overflow.length, 12);
  assert.equal(overflow.filter((actor) => actor.position).length, 4);
  assert.equal(overflow.filter((actor) => !actor.position).length, 8);
  assert.ok(
    overflow
      .slice(0, 4)
      .every((actor) => actor.anchorId === null && actor.position),
  );

  const feet = overflow.flatMap((actor) =>
    actor.position
      ? [
          {
            id: actor.id,
            x: actor.position.x - 8,
            y: actor.position.y - 6,
            width: 16,
            height: 10,
            kind: "fixture" as const,
          },
        ]
      : [],
  );
  const withActors = {
    ...campusDefinition,
    solids: [...campusDefinition.solids, ...feet],
  };
  for (const foot of feet) {
    assert.ok(
      !campusDefinition.solids.some(
        (solid) =>
          foot.x < solid.x + solid.width &&
          foot.x + foot.width > solid.x &&
          foot.y < solid.y + solid.height &&
          foot.y + foot.height > solid.y,
      ),
      `${foot.id} feet overlap a campus solid`,
    );
  }
  for (const anchor of campusDefinition.anchors.filter(
    (candidate) => candidate.interaction,
  )) {
    assert.ok(
      findRoute(withActors, campusDefinition.spawns.entry, anchor.point),
      `${anchor.id} remains reachable`,
    );
  }
});

test("all sixteen lab footprints and seat centers align with their selected-art desk columns", () => {
  const expectedCenters = [625, 752, 915, 1048];
  const expectedApproaches = [548, 815, 861, 988];
  for (let i = 1; i <= 16; i++) {
    const id = `station-${String(i).padStart(2, "0")}`;
    const index = i - 1;
    const col = index % 4;
    const row = Math.floor(index / 4);
    const anchor = campusDefinition.anchors.find(
      (candidate) => candidate.id === id,
    )!;
    const footprint = campusDefinition.solids.find(
      (solid) => solid.id === `station-footprint-${String(i).padStart(2, "0")}`,
    )!;
    const seat = worldToImagePixel(anchor.seat!);
    const approach = worldToImagePixel(anchor.point);
    const box = worldToImagePixel({ x: footprint.x, y: footprint.y });
    const boxEnd = worldToImagePixel({
      x: footprint.x + footprint.width,
      y: footprint.y + footprint.height,
    });
    assert.ok(Math.abs(seat.x - expectedCenters[col]) < 0.01, `${id} seat x`);
    assert.ok(
      Math.abs(approach.x - expectedApproaches[col]) < 0.01,
      `${id} approach x`,
    );
    assert.ok(
      approach.x < box.x || approach.x > boxEnd.x,
      `${id} approach stands outside its desk footprint`,
    );
    assert.ok(
      Math.abs(seat.y - [157, 217, 276, 336][row]) < 0.01,
      `${id} seat row`,
    );
  }
});

test("validator catches a native-footprint conversion that silently extends past the campus edge", () => {
  const oversized = {
    ...campusDefinition,
    solids: [
      ...campusDefinition.solids,
      {
        ...campusDefinition.solids[0],
        id: "oversized-native-fixture",
        x: campusDefinition.bounds.width - 8,
        width: 24,
      },
    ],
  };
  assert.ok(
    validateCampus(oversized).issues.includes(
      "oversized-native-fixture: collision bounds exceed the campus world",
    ),
  );
});

test("teacher NPC stays body-clear, reachable and separate from its conversation approach", () => {
  const spawn = campusDefinition.spawns.entry;
  const teacher = campusDefinition.anchors.find(
    (anchor) => anchor.interaction === "teacher",
  )!;
  const npc = campusDefinition.npcs.find(
    (candidate) => candidate.id === "npc_cikgu",
  )!;
  assert.ok(findRoute(campusDefinition, spawn, npc.point));
  const overlapping = {
    ...campusDefinition,
    npcs: [{ ...npc, point: teacher.point }],
  };
  assert.ok(
    validateCampus(overlapping).issues.includes(
      "npc_cikgu: NPC foot body overlaps its interaction approach",
    ),
  );
});

test("global Tiled JSON and TMX round trip preserve native background placement", () => {
  const exported = exportCampus(campusDefinition);
  const disk = JSON.parse(
    readFileSync("public/maps/campus-unified.json", "utf8"),
  );
  assert.deepEqual(disk, exported.json);
  assert.deepEqual(importCampus(disk), campusDefinition);
  assert.equal(readFileSync("maps/campus-unified.tmx", "utf8"), exported.tmx);
  const backgroundLayer = disk.layers[0];
  assert.equal(backgroundLayer.name, "background");
  assert.ok(backgroundLayer.type === "objectgroup");
  assert.deepEqual(backgroundLayer.objects[0], {
    id: 1,
    name: "campus-background",
    type: "",
    gid: 1,
    x: campusDefinition.background.imageToWorld.offsetX,
    y:
      campusDefinition.background.imageToWorld.offsetY +
      campusDefinition.bounds.height,
    width: campusDefinition.bounds.width,
    height: campusDefinition.bounds.height,
  });
  assert.deepEqual(disk.tilesets[0].tiles[0], {
    id: 0,
    image: "../assets/campus-unified.png",
    imagewidth: 1670,
    imageheight: 941,
  });
  assert.equal(disk.tilesets[0].objectalignment, "bottomleft");
  assert.match(
    exported.tmx,
    /<object id="1" name="campus-background" type="" gid="1" x="0" y="2160" width="3840" height="2160"><\/object>/,
  );
  assert.match(
    exported.tmx,
    /<image source="\.\.\/public\/assets\/campus-unified\.png" width="1670" height="941"\/>/,
  );
  assert.doesNotMatch(exported.tmx, /<imagelayer/);
  const doorwayLayer = disk.layers.find(
    (layer: { name: string }) => layer.name === "doorways",
  );
  assert.ok(doorwayLayer?.type === "objectgroup");
  assert.equal(doorwayLayer.objects.length, campusDefinition.doorways.length);
  assert.equal(
    disk.layers.filter((layer: { name: string }) => layer.name === "portals")
      .length,
    0,
  );
});
