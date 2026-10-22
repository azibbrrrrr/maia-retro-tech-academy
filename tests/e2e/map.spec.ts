import { test, expect } from "./helpers/test";
import { campusDefinition } from "../../packages/world/unified-campus";
import { debug, diagnostic, position, ready, tools } from "./helpers/walking";

test("global map uses the registered campus transform and focuses a room without moving the visitor", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  await ready(page);
  await debug(page);
  const before = await position(page);
  const initialCamera = await diagnostic<{ x: number; y: number; zoom: number; mode: string }>(page, "camera");
  const map = page.locator(".mini-map");
  await expect(map).toHaveAttribute("viewBox", "0 0 3840 2160");
  await expect(map.locator("image")).toHaveAttribute("href", campusDefinition.background.src);
  await expect(map.locator("image")).toHaveAttribute("width", "3840");
  await expect(map.locator("image")).toHaveAttribute("height", "2160");
  await expect(map.locator("polygon")).toHaveCount(7);
  const room = campusDefinition.zones.find((candidate) => candidate.id === "cikgu_room")!;
  await map.getByRole("button", { name: `Focus ${room.title}` }).click();
  await expect(page.getByLabel("Camera status")).toHaveAttribute("data-camera-mode", "free");
  expect(await position(page)).toEqual(before);
  const focusedCamera = await diagnostic<{ x: number; y: number; zoom: number; mode: string }>(page, "camera");
  expect(focusedCamera).not.toEqual(initialCamera);
  await tools(page);
  await page.getByRole("button", { name: "Overview", exact: true }).click();
  await expect(page.getByLabel("Camera status")).toHaveAttribute("data-camera-mode", "overview");
  expect(await position(page)).toEqual(before);
  await page.screenshot({ path: "docs/evidence/unified-campus-map-alignment.png" });
});

test("selected worker is marked at its global station and off-seat workers have no fabricated map marker", async ({ page }) => {
  await page.goto("/");
  await ready(page);
  await debug(page);
  await tools(page);
  await page.getByLabel("DEMO population").selectOption("4");
  await page.getByLabel("Follow DEMO actor").selectOption("demo-worker-001");
  const actor = page.locator('[data-selected-actor="demo-worker-001"]');
  await expect(actor).toBeVisible();
  const station = campusDefinition.anchors.find((anchor) => anchor.id === "station-01")!;
  await expect(actor).toHaveAttribute("cx", String(station.seat!.x));
  await expect(actor).toHaveAttribute("cy", String(station.seat!.y));
  await page.getByLabel("DEMO population").selectOption("28");
  await page.getByLabel("Follow DEMO actor").selectOption("demo-worker-025");
  await expect(page.locator(".selected-actor-status")).toContainText("off-seat; no map position");
  await expect(page.locator('[data-selected-actor="demo-worker-025"]')).toHaveCount(0);
  await expect(page.locator("[data-explorer]")).toHaveAttribute("data-scene", "entrance");
});
