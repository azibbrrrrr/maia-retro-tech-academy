import { test, expect } from "./helpers/test";
import { campusDefinition, imagePixelToWorld } from "../../packages/world/unified-campus";
import { debug, diagnostic, position, ready, walkTo } from "./helpers/walking";

test("reduced motion freezes the single scripted Juliana while keyboard walking remains active", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await ready(page);
  await debug(page);
  const first = await diagnostic<{ x: number; y: number; count: number; frame: number }>(page, "teacher");
  const expected = imagePixelToWorld({ x: 1450, y: 588 });
  expect(first).toMatchObject({ count: 1, frame: 0 });
  expect(first.x).toBeCloseTo(expected.x, 0);
  expect(first.y).toBeCloseTo(expected.y, 0);
  await page.waitForTimeout(600);
  expect(await diagnostic(page, "teacher")).toEqual(first);
  const visitor = await position(page);
  await page.locator("canvas").focus();
  await page.keyboard.down("ArrowLeft");
  await page.waitForTimeout(250);
  await page.keyboard.up("ArrowLeft");
  expect((await position(page)).x).toBeLessThan(visitor.x);
  expect(await diagnostic(page, "teacher")).toEqual(first);
});

test("normal motion animates the stationary teacher without duplicating or moving her", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await ready(page);
  await debug(page);
  const before = await diagnostic<{ x: number; y: number; count: number; frame: number }>(page, "teacher");
  expect(before.count).toBe(1);
  await expect.poll(async () => (await diagnostic<{ frame: number }>(page, "teacher")).frame).not.toBe(before.frame);
  const after = await diagnostic<{ x: number; y: number; count: number; frame: number }>(page, "teacher");
  expect(after.count).toBe(1);
  expect(after.x).toBe(before.x);
  expect(after.y).toBe(before.y);
  const teacher = campusDefinition.npcs[0].point;
  const visitor = await position(page);
  await walkTo(page, campusDefinition.anchors.find((anchor) => anchor.id === "teacher")!.point, "Juliana approach");
  await page.keyboard.press("e");
  await expect(page.getByRole("region", { name: "Ustazah Juliana speech bubble" })).toBeVisible();
  expect((await position(page))).not.toEqual(visitor);
  expect((await diagnostic<{ x: number; y: number; count: number }>(page, "teacher"))).toMatchObject({ count: 1, x: teacher.x, y: teacher.y });
});
