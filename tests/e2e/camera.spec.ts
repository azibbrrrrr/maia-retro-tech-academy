import { test, expect } from "./helpers/test";
import { campusDefinition } from "../../packages/world/unified-campus";
import { debug, diagnostic, position, ready, tools } from "./helpers/walking";

type Camera = { x: number; y: number; width: number; height: number; zoom: number; mode: string };
const screenPoint = (camera: Camera, point: { x: number; y: number }) => ({
  x: (point.x - camera.x - camera.width / 2) * camera.zoom + camera.width / 2,
  y: (point.y - camera.y - camera.height / 2) * camera.zoom + camera.height / 2,
});

for (const viewport of [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
  { width: 844, height: 390 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
]) {
  test(`camera overview fits all campus zones at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await ready(page);
    await debug(page);
    const camera = await diagnostic<Camera>(page, "camera");
    expect(camera.mode).toBe("overview");
    const canvas = (await page.locator("canvas").boundingBox())!;
    const campusCenter = screenPoint(camera, {
      x: campusDefinition.bounds.width / 2,
      y: campusDefinition.bounds.height / 2,
    });
    expect(campusCenter.x).toBeCloseTo(canvas.width / 2, 0);
    expect(campusCenter.y).toBeCloseTo(canvas.height / 2, 0);
    const regions = [
      { id: "campus background", x: 0, y: 0, ...campusDefinition.bounds },
      ...campusDefinition.zones.map((zone) => ({ id: zone.id, ...zone.focusBounds })),
    ];
    for (const region of regions) {
      for (const [corner, point] of Object.entries({
        northwest: { x: region.x, y: region.y },
        northeast: { x: region.x + region.width, y: region.y },
        southwest: { x: region.x, y: region.y + region.height },
        southeast: { x: region.x + region.width, y: region.y + region.height },
      })) {
        const screen = screenPoint(camera, point);
        expect(screen.x, `${region.id} ${corner} at ${viewport.width}x${viewport.height}`).toBeGreaterThanOrEqual(-1);
        expect(screen.x, `${region.id} ${corner} at ${viewport.width}x${viewport.height}`).toBeLessThanOrEqual(canvas.width + 1);
        expect(screen.y, `${region.id} ${corner} at ${viewport.width}x${viewport.height}`).toBeGreaterThanOrEqual(-1);
        expect(screen.y, `${region.id} ${corner} at ${viewport.width}x${viewport.height}`).toBeLessThanOrEqual(canvas.height + 1);
      }
    }
  });
}

test("zoom, pan, actor follow and overview recovery change only the camera", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  await ready(page);
  await debug(page);
  await tools(page);
  const visitor = await position(page);
  const initial = await diagnostic<Camera>(page, "camera");
  await page.getByRole("button", { name: "Touch pan", exact: true }).click();
  await page.getByRole("button", { name: "Zoom in", exact: true }).click();
  await expect.poll(async () => (await diagnostic<Camera>(page, "camera")).zoom).toBeGreaterThan(initial.zoom);
  await page.getByRole("button", { name: "Pan left", exact: true }).click();
  await expect.poll(async () => (await diagnostic<Camera>(page, "camera")).x).not.toBe(initial.x);
  const free = await diagnostic<Camera>(page, "camera");
  expect(free.mode).toBe("free");
  expect(free.zoom).toBeGreaterThan(initial.zoom);
  expect(await position(page)).toEqual(visitor);
  await page.getByLabel("DEMO population").selectOption("20");
  await page.getByLabel("Follow DEMO actor").selectOption("demo-worker-001");
  await expect(page.getByLabel("Camera status")).toHaveAttribute("data-camera-mode", "agent");
  const actorCamera = await diagnostic<Camera>(page, "camera");
  expect(actorCamera.mode).toBe("agent");
  expect(await position(page)).toEqual(visitor);
  await page.getByRole("button", { name: "Follow player", exact: true }).click();
  await expect(page.getByLabel("Camera status")).toHaveAttribute("data-camera-mode", "player");
  await page.getByRole("button", { name: "Overview", exact: true }).click();
  await expect(page.getByLabel("Camera status")).toHaveAttribute("data-camera-mode", "overview");
  expect(await position(page)).toEqual(visitor);
});
