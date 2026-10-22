import { test, expect } from "./helpers/test";
import { writeFileSync } from "node:fs";
import {
  campusDefinition,
  imagePixelToWorld,
  type CampusZoneId,
} from "../../packages/world/unified-campus";
import { createDemoActors, reserveUnifiedDemoActors } from "../../packages/world/unified-actors";
import { debug, diagnostic, directory, position, ready, tools, walkTo, zone } from "./helpers/walking";

test.use({ trace: "off" });

const titles: Record<CampusZoneId, string> = {
  entrance: "School gate",
  high_council: "High Council",
  engineering_lab: "Makmal Kejuruteraan",
  library: "Perpustakaan",
  watchtower: "Watchtower NOC",
  qa_lab: "Makmal QA",
  kantin: "Kantin Akademi",
  cikgu_room: "Bilik Cikgu",
};

async function interact(page: import("@playwright/test").Page, label: string) {
  await page.locator("canvas").focus();
  await page.keyboard.press("e");
  if (label.includes("board")) {
    const panel = page.getByRole("dialog");
    await expect(panel).toContainText("DEMO DATA");
    await page.keyboard.press("Escape");
  } else {
    const bubble = page.getByRole("region", { name: /speech bubble/ });
    await expect(bubble).toContainText(label === "teacher" ? "Ustazah Juliana" : label);
    await page.keyboard.press("Escape");
  }
}

test("global map keeps the registered image alignment and seven room targets at every required viewport", async ({ page }) => {
  for (const viewport of [
    { width: 320, height: 568 },
    { width: 390, height: 844 },
    { width: 844, height: 390 },
    { width: 768, height: 1024 },
    { width: 1440, height: 900 },
    { width: 1920, height: 1080 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await ready(page);
    await expect(page.getByLabel("Camera status")).toHaveAttribute("data-camera-mode", "overview");
    if (viewport.width === 320)
      await page.screenshot({ path: "docs/evidence/unified-campus-overview-320.png" });
    const image = campusDefinition.background;
    expect(image.nativeSize).toEqual({ width: 1670, height: 941 });
    expect(image.imageToWorld.scaleX).toBeCloseTo(3840 / 1670, 8);
    expect(image.imageToWorld.scaleY).toBeCloseTo(2160 / 941, 8);
    for (const room of campusDefinition.zones.filter((candidate) => candidate.id !== "entrance")) {
      const roomShape = page.locator(`.mini-map polygon[aria-label="Focus ${room.title}"]`);
      await expect(roomShape, `${viewport.width}x${viewport.height} should show ${room.id}`).toBeVisible();
    }
    const map = page.locator(".mini-map");
    const mapSize = await map.evaluate((element) => ({ viewBox: element.getAttribute("viewBox"), width: element.querySelector("image")?.getAttribute("width"), height: element.querySelector("image")?.getAttribute("height") }));
    expect(mapSize).toEqual({ viewBox: "0 0 3840 2160", width: "3840", height: "2160" });
    expect(await page.locator("[data-explorer]").getAttribute("cx")).toBe(String((await position(page)).x));
    if (viewport.width === 1920) await page.screenshot({ path: "docs/evidence/unified-campus-overview-1920x1080.png" });
  }
});

test("ordinary keyboard walking crosses each physical doorway into every room and returns to the gate", async ({ page }) => {
  test.setTimeout(600_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await ready(page);
  await page.screenshot({ path: "docs/evidence/unified-campus-gate.png" });
  const visited = new Set<CampusZoneId>(["entrance"]);
  for (const door of campusDefinition.doorways.filter((candidate) => candidate.zones[1] === "entrance" && candidate.zones[0] !== "entrance")) {
    const [inside, outside] = door.approaches;
    await walkTo(page, outside, `${door.id} exterior approach`);
    await zone(page, "entrance");
    await walkTo(page, inside, `${door.id} physical threshold`);
    await zone(page, door.zones[0]);
    visited.add(door.zones[0]);
    await walkTo(page, outside, `${door.id} return threshold`);
    await zone(page, "entrance");
  }
  expect([...visited].sort()).toEqual(["cikgu_room", "engineering_lab", "high_council", "kantin", "library", "qa_lab", "watchtower", "entrance"].sort());
  await walkTo(page, campusDefinition.spawns.entry, "gate return");
  await expect(page.locator("[data-explorer]")).toHaveAttribute("data-scene", "entrance");
  await page.screenshot({ path: "docs/evidence/unified-campus-door-return.png" });
});

test("visitor reaches every lab station and public interaction from the shared gate spawn", async ({ page }) => {
  test.setTimeout(600_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await ready(page);
  await directory(page, titles.engineering_lab);
  await tools(page);
  await page.getByRole("button", { name: "Follow player", exact: true }).click();
  const stations = campusDefinition.anchors.filter((anchor) => anchor.kind === "workstation");
  expect(stations).toHaveLength(16);
  for (const station of stations) {
    await walkTo(page, station.point, station.id);
    await zone(page, "engineering_lab");
    await interact(page, station.label);
  }
  for (const anchor of campusDefinition.anchors.filter((candidate) => candidate.kind !== "workstation")) {
    await walkTo(page, anchor.point, anchor.id);
    await zone(page, anchor.zoneId);
    if (anchor.interaction)
      await interact(page, anchor.interaction === "teacher" ? "teacher" : anchor.interaction === "board" ? "board" : anchor.label);
  }
  await walkTo(page, campusDefinition.spawns.entry, "gate return after station tour");
  await page.screenshot({ path: "docs/evidence/unified-campus-stations-and-interactions.png" });
});

test("camera focus, zoom, follow and overview preserve visitor coordinates and actor identity", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  await ready(page);
  await debug(page);
  const visitor = await position(page);
  await directory(page, titles.cikgu_room);
  await zone(page, "entrance");
  expect(await position(page)).toEqual(visitor);
  await tools(page);
  await page.getByLabel("DEMO population").selectOption("20");
  const actors = await diagnostic<{ id: string; zoneId: CampusZoneId; position: unknown }[]>(page, "actors");
  expect(actors).toHaveLength(20);
  expect(new Set(actors.map((actor) => actor.id)).size).toBe(20);
  expect(actors.filter((actor) => actor.position)).toHaveLength(20);
  await page.getByLabel("Follow DEMO actor").selectOption("demo-worker-001");
  await expect(page.getByLabel("Camera status")).toHaveAttribute("data-camera-mode", "agent");
  await page.getByRole("button", { name: "Zoom in", exact: true }).click();
  await page.getByRole("button", { name: "Pan left", exact: true }).click();
  expect(await position(page)).toEqual(visitor);
  await page.getByRole("button", { name: "Overview", exact: true }).click();
  await expect(page.getByLabel("Camera status")).toHaveAttribute("data-camera-mode", "overview");
  expect(await position(page)).toEqual(visitor);
  const identity = reserveUnifiedDemoActors(createDemoActors(20)).map((actor) => actor.id);
  expect(actors.map((actor) => actor.id)).toEqual(identity);
  await page.getByLabel("DEMO population").selectOption("28");
  const overflow = await diagnostic<{ position: unknown }[]>(page, "actors");
  expect(overflow).toHaveLength(28);
  expect(overflow.filter((actor) => !actor.position)).toHaveLength(8);
  await page.getByLabel("Follow DEMO actor").selectOption("demo-worker-025");
  await expect(page.locator(".selected-actor-status")).toContainText("off-seat; no map position");
  await page.screenshot({ path: "docs/evidence/unified-campus-actor-overview.png" });
});

test("window blur releases held directional input and leaves the visitor stationary", async ({ page }) => {
  await page.goto("/");
  await ready(page);
  await page.locator("canvas").focus();
  const start = await position(page);
  await page.keyboard.down("ArrowRight");
  await expect.poll(async () => position(page)).not.toEqual(start);
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  await page.evaluate(async () => {
    for (let frame = 0; frame < 6; frame++)
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    await new Promise((resolve) => setTimeout(resolve, 50));
  });
  const stopped = await position(page);
  await page.waitForTimeout(180);
  expect(await position(page)).toEqual(stopped);
  await page.keyboard.up("ArrowRight");
});

test("collision overlay records native art texture and a stationary scripted teacher", async ({ page, request }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await ready(page);
  await debug(page);
  const body = await diagnostic<Record<string, number>>(page, "body");
  expect(body.width).toBeCloseTo(14.08, 4);
  expect(body.height).toBeCloseTo(7.92, 4);
  const performance = await diagnostic<{ textures: { key: string; width: number; height: number; bytes: number; filter: string }[] }>(page, "performance");
  const background = performance.textures.find((texture) => texture.key === "campus");
  expect(background).toMatchObject({ width: 1670, height: 941, bytes: 1670 * 941 * 4, filter: "linear" });
  const asset = await request.get("/assets/campus-unified.png");
  expect(asset.ok()).toBe(true);
  const bytes = await asset.body();
  const dims = await page.evaluate(async (base64) => {
    const binary = atob(base64);
    const data = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const bitmap = await createImageBitmap(new Blob([data], { type: "image/png" }));
    return { width: bitmap.width, height: bitmap.height };
  }, bytes.toString("base64"));
  expect(dims).toEqual({ width: 1670, height: 941 });
  const teacher = await diagnostic<{ x: number; y: number; count: number; frame: number }>(page, "teacher");
  expect(teacher.count).toBe(1);
  const nativeTeacher = imagePixelToWorld({ x: 1450, y: 588 });
  expect(teacher.x).toBeCloseTo(nativeTeacher.x, 0);
  expect(teacher.y).toBeCloseTo(nativeTeacher.y, 0);
  writeFileSync("docs/evidence/unified-campus-browser-facts.json", JSON.stringify({ environment: { browser: await page.evaluate(() => navigator.userAgent), platform: process.platform, arch: process.arch, node: process.version, physicalDevice: false, safari: false }, image: { ...dims, bytes: bytes.byteLength }, performance }, null, 2) + "\n");
  await page.screenshot({ path: "docs/evidence/unified-campus-collision-overview.png" });
});
