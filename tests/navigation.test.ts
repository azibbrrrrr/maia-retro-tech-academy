import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// Missing navigation modules are an absent feature, reported as an assertion.
const path = "../packages/world/scenes.ts";
const world = await import(path).catch(() => null);

test("campus catalog supplies eight reachable canonical rooms", async () => {
  assert.ok(world, "connected campus catalog has not been implemented");
  assert.deepEqual(Object.keys(world.sceneCatalog).sort(), [
    "cikgu_room",
    "engineering_lab",
    "entrance",
    "high_council",
    "kantin",
    "library",
    "qa_lab",
    "watchtower",
  ]);
  const { validateCampus } = await import("../packages/world/navigation");
  const report = validateCampus();
  assert.deepEqual(report.issues, []);
  assert.equal(report.reachableScenes.length, 8);
  assert.ok(report.routes.length > 90);
});

test("legacy destinations resolve to canonical rooms with one teacher identity", () => {
  assert.ok(world);
  assert.equal(world.resolvePlace("gate"), "entrance");
  assert.equal(world.resolvePlace("council"), "high_council");
  assert.equal(world.resolvePlace("teacher"), "cikgu_room");
  assert.equal(world.resolvePlace("unknown"), undefined);
  assert.equal(world.resolvePlace("constructor"), undefined);
  assert.equal(world.resolvePlace("__proto__"), undefined);
  const teachers = Object.values(world.sceneCatalog).flatMap(
    (scene: unknown) => (scene as { npcs: { id: string }[] }).npcs,
  );
  assert.deepEqual(
    teachers.map((npc) => npc.id),
    ["npc_cikgu"],
  );
});

test("foot routes reject walls and desks and support real detours and clear waits", async () => {
  assert.ok(world);
  const { findRoute, isFootClear, segmentClear } =
    await import("../packages/world/navigation");
  const lab = world.sceneCatalog.engineering_lab;
  assert.equal(isFootClear(lab, { x: 5, y: 200 }), false);
  assert.equal(findRoute(lab, lab.spawns.entry, { x: 150, y: 160 }), null);
  const start = { x: 768, y: 850 },
    goal = { x: 768, y: 200 };
  const occupied = [
    { id: "temporary-worker", x: 648, y: 480, width: 240, height: 48 },
  ];
  const route = findRoute(lab, start, goal, { occupied });
  assert.ok(route);
  assert.ok(route.some((p) => p.x < 640 || p.x > 896));
  for (let i = 1; i < route.length; i++)
    assert.ok(segmentClear(lab, route[i - 1], route[i], occupied));
  assert.equal(
    findRoute(lab, start, goal, {
      occupied: [
        { id: "temporary-wall", x: 24, y: 480, width: 1488, height: 48 },
      ],
    }),
    null,
  );
  assert.ok(
    findRoute(lab, start, goal),
    "clearing occupancy restores the route",
  );
});

test("twenty DEMO workers retain task identity across sixteen seats and overflow", async () => {
  assert.ok(world);
  const { createDemoActors, reserveDemoWorkstations, planActorRoute } =
    await import("../packages/world/actors");
  assert.equal(
    createDemoActors(10001).length,
    10001,
    "visual capacity never caps the DEMO task registry",
  );
  const actors = createDemoActors(20);
  const reserved = reserveDemoWorkstations(actors);
  assert.equal(reserved.length, 20);
  assert.equal(
    reserved.filter((actor) => actor.placement === "station").length,
    16,
  );
  assert.equal(
    reserved.filter((actor) => actor.placement === "overflow").length,
    4,
  );
  assert.deepEqual(reserveDemoWorkstations(actors), reserved);
  assert.equal(new Set(reserved.map((actor) => actor.sceneId)).size, 3);
  const larger = reserveDemoWorkstations(createDemoActors(28));
  assert.deepEqual(larger.slice(0, 20), reserved);
  assert.equal(larger.length, 28);
  assert.equal(larger.filter((actor) => actor.position === null).length, 4);
  assert.equal(new Set(reserved.map((actor) => actor.id)).size, 20);
  assert.ok(
    reserved.every(
      (actor) =>
        actor.provenance === "DEMO" && actor.workState === "demo-running",
    ),
  );
  const lab = world.sceneCatalog.engineering_lab;
  assert.equal(
    lab.anchors.filter((a: { kind: string }) => a.kind === "workstation")
      .length,
    16,
  );
  const waiting = planActorRoute(
    "engineering_lab",
    lab.spawns.entry,
    lab.anchors[0].point,
    [{ id: "blocked", x: 24, y: 480, width: 1488, height: 48 }],
  );
  assert.equal(waiting.status, "wait");
  if (waiting.status === "wait") {
    assert.deepEqual(waiting.position, { x: 144, y: 888 });
  }
});

test("Tiled JSON and TMX retain authoritative room bounds, collision and portals", async () => {
  assert.ok(world);
  const { exportScene } = await import("../scripts/scenes");
  for (const scene of Object.values(
    world.sceneCatalog,
  ) as import("../packages/world/scenes").SceneDefinition[]) {
    const output = exportScene(scene);
    const disk = JSON.parse(
      readFileSync(`public/maps/scenes/${scene.id}.json`, "utf8"),
    );
    assert.deepEqual(disk, output.json);
    const objectIds = output.json.layers.flatMap((layer) =>
      layer.objects.map((object) => object.id),
    );
    assert.ok(
      objectIds.every((id) => Number.isInteger(id) && id > 0),
      "Tiled object IDs must be positive numeric IDs",
    );
    assert.equal(new Set(objectIds).size, objectIds.length);

    assert.equal(
      readFileSync(`maps/scenes/${scene.id}.tmx`, "utf8"),
      output.tmx,
    );
    const { importScene } = await import("../packages/world/tiled");
    assert.deepEqual(importScene(disk), scene);
    const collisions = disk.layers.find(
      (layer: { name: string }) => layer.name === "collision",
    )!.objects!;
    assert.deepEqual(
      collisions.map(
        ({
          name,
          x,
          y,
          width,
          height,
        }: {
          name: string;
          x: number;
          y: number;
          width: number;
          height: number;
        }) => ({ id: name, x, y, width, height }),
      ),
      scene.solids,
    );
    const portals = disk.layers.find(
      (layer: { name: string }) => layer.name === "portals",
    )!.objects!;
    assert.equal(portals.length, scene.portals.length);
    assert.equal(
      disk.properties.find((p: { name: string }) => p.name === "worldWidth")!
        .value,
      scene.bounds.width,
    );
    assert.equal(
      disk.properties.find((p: { name: string }) => p.name === "worldHeight")!
        .value,
      scene.bounds.height,
    );
  }
});

test("occupied seats leave every lab approach and reserved lane usable", async () => {
  assert.ok(world);
  const { createDemoActors, reserveDemoWorkstations, actorOccupancy } =
    await import("../packages/world/actors");
  const { findRoute, overlaps } = await import("../packages/world/navigation");
  const occupied = actorOccupancy(
    reserveDemoWorkstations(createDemoActors(20)),
    "engineering_lab",
  );
  const lab = world.sceneCatalog.engineering_lab;
  for (const lane of lab.reservedLanes)
    assert.equal(
      occupied.some((body) => overlaps(body, lane)),
      false,
    );
  for (const station of lab.anchors.filter(
    (anchor: { kind: string }) => anchor.kind === "workstation",
  )) {
    assert.ok(
      findRoute(lab, lab.spawns.entry, station.point, { occupied }),
      station.id,
    );
  }
});

test("validation rejects a blocked approach, a doorway on a wall and a retrigger landing", async () => {
  assert.ok(world);
  const { validateCampus } = await import("../packages/world/navigation");
  const catalog = structuredClone(world.sceneCatalog);
  catalog.library.spawns.entry = { x: 576, y: 810 };
  catalog.qa_lab.portals[0].x = 0;
  catalog.engineering_lab.anchors[0].point = { x: 150, y: 160 };
  const issues = validateCampus(catalog).issues;
  assert.ok(
    issues.some((issue) => issue.includes("library:entry: landing overlaps")),
  );
  assert.ok(
    issues.some((issue) =>
      issue.includes("qa_lab:qa_lab-to-entrance: transfer painted"),
    ),
  );
  assert.ok(
    issues.some((issue) =>
      issue.includes("engineering_lab:station-01: foot-blocked"),
    ),
  );
});
