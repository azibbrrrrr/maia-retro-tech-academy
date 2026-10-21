import { test, expect } from "./helpers/test";
import type { Page } from "@playwright/test";
import {
  debug,
  diagnostic,
  directory,
  walkTo,
  ready,
  position,
  pulse,
  tools,
} from "./helpers/walking";

test.use({ viewport: { width: 1280, height: 720 } });
async function worldPoint(page: Page, x: number, y: number) {
  await debug(page);
  const c = await diagnostic<{
    x: number;
    y: number;
    width: number;
    height: number;
    zoom: number;
  }>(page, "camera");
  await page
    .getByRole("button", { name: "Collision diagnostics", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Navigation controls", exact: true })
    .click();
  return {
    x: (x - c.x - c.width / 2) * c.zoom + c.width / 2,
    y: (y - c.y - c.height / 2) * c.zoom + c.height / 2,
  };
}
test("teacher visible head opens dialogue only while visitor is nearby", async ({
  page,
}) => {
  await page.goto("/");
  await ready(page);
  await directory(page, "Bilik Cikgu");
  await tools(page);
  await page.getByRole("button", { name: "Touch pan", exact: true }).click();
  await page.getByRole("button", { name: "Zoom out", exact: true }).click();
  await page.getByRole("button", { name: "Zoom out", exact: true }).click();
  await page
    .getByRole("button", { name: "Navigation controls", exact: true })
    .click();
  let head = await worldPoint(page, 576, 198);
  const canvas = (await page.locator("canvas").boundingBox())!;
  expect(head.x).toBeGreaterThanOrEqual(0);
  expect(head.y).toBeGreaterThanOrEqual(0);
  expect(head.x).toBeLessThanOrEqual(canvas.width);
  expect(head.y).toBeLessThanOrEqual(canvas.height);
  await page.mouse.click(canvas.x + head.x, canvas.y + head.y);
  await expect(
    page.getByRole("region", { name: "Ustazah Juliana speech bubble" }),
  ).not.toBeVisible();
  await walkTo(page, "cikgu_room", { x: 576, y: 324 });
  head = await worldPoint(page, 576, 198);
  await page.mouse.click(canvas.x + head.x, canvas.y + head.y);
  await expect(
    page.getByRole("region", { name: "Ustazah Juliana speech bubble" }),
  ).toContainText("Ustazah Juliana");
});
test("reduced motion freezes idle sprites, teacher stays fixed and walking still works", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await ready(page);
  await directory(page, "Bilik Cikgu");
  const feet = await worldPoint(page, 576, 264),
    visitor = await worldPoint(page, 576, 720);
  const clips = [feet, visitor].map((p) => ({
    x: p.x - 32,
    y: p.y - 66,
    width: 64,
    height: 70,
  }));
  for (const clip of clips) {
    const image = await page.screenshot({ clip });
    await expect
      .poll(async () => !(await page.screenshot({ clip })).equals(image))
      .toBe(true);
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForTimeout(250);
  for (const clip of clips) {
    const image = await page.screenshot({ clip });
    for (const delay of [270, 430]) {
      await page.waitForTimeout(delay);
      expect((await page.screenshot({ clip })).equals(image)).toBe(true);
    }
  }
  await debug(page);
  const first = await diagnostic<{
    x: number;
    y: number;
    count: number;
    frame: number;
  }>(page, "teacher");
  expect(first).toMatchObject({ x: 576, y: 264, count: 1, frame: 0 });
  await page
    .getByRole("button", { name: "Navigation controls", exact: true })
    .click();
  const before = await position(page);
  await pulse(page, "ArrowLeft", 250);
  expect((await position(page)).x).toBeLessThan(before.x - 20);
  await debug(page);
  expect(await diagnostic(page, "teacher")).toEqual(first);
  await page
    .getByRole("button", { name: "Collision diagnostics", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Navigation controls", exact: true })
    .click();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const image = await page.screenshot({ clip: clips[0] });
  await expect
    .poll(
      async () => !(await page.screenshot({ clip: clips[0] })).equals(image),
    )
    .toBe(true);
});
