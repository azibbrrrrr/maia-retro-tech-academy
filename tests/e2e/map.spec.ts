import { test, expect } from "./helpers/test";
import {
  ready,
  debug,
  diagnostic,
  directory,
  position,
  tools,
} from "./helpers/walking";
import { sceneCatalog } from "../../packages/world/scenes";

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 1280, height: 720 },
  { width: 390, height: 844 },
  { width: 844, height: 390 },
  { width: 320, height: 568 },
]) {
  test(`expanded campus graph leaves interaction reachable at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await ready(page);
    await page
      .getByRole("button", { name: "Show campus connections", exact: true })
      .click();
    await expect(
      page.getByRole("img", {
        name: "Logical campus connections: entrance links all seven rooms",
      }),
    ).toBeVisible();
    const a = (await page
      .getByRole("button", { name: "Interact", exact: true })
      .boundingBox())!;
    const b = (await page
      .getByRole("complementary", { name: "Campus navigation" })
      .boundingBox())!;
    expect(
      a.x + a.width <= b.x ||
        b.x + b.width <= a.x ||
        a.y + a.height <= b.y ||
        b.y + b.height <= a.y,
    ).toBe(true);
    expect(a.y).toBeGreaterThanOrEqual(0);
    expect(a.y + a.height).toBeLessThanOrEqual(viewport.height);
    if (viewport.width === 320)
      await page.screenshot({
        path: "docs/navigation/evidence/logical-map-mobile-320.png",
      });
    await page.getByRole("button", { name: "Interact", exact: true }).click();
    await expect(
      page.getByRole("region", { name: "Welcome directory speech bubble" }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await debug(page);
    const before = await position(page);
    await page.getByRole("button", { name: "Touch pan", exact: true }).click();
    await page.getByRole("button", { name: "Pan right", exact: true }).click();
    expect((await diagnostic<{ mode: string }>(page, "camera")).mode).toBe(
      "free",
    );
    expect(await position(page)).toEqual(before);
    await page
      .getByRole("button", { name: "Follow player", exact: true })
      .click();
    await tools(page);
    await expect(page.getByLabel("Camera status")).toHaveAttribute(
      "data-camera-mode",
      "player",
    );
  });
}

test("navigation maps locate the selected DEMO actor without inventing off-seat coordinates", async ({
  page,
}) => {
  await page.goto("/");
  await ready(page);
  await directory(page, "Makmal Kejuruteraan");
  await tools(page);
  await page.getByLabel("DEMO population").selectOption("4");
  await page.getByLabel("Follow DEMO actor").selectOption("demo-worker-001");

  const local = page.locator('[data-selected-actor="demo-worker-001"]');
  await expect(page.locator(".selected-actor-status")).toContainText(
    "Selected DEMO actor demo-worker-001 is shown in this room map.",
  );
  await expect(local).toHaveAttribute("data-selected-actor", "demo-worker-001");
  await expect(local).toHaveAttribute("cx", "192");
  await expect(local).toHaveAttribute("cy", "240");

  await page.getByLabel("DEMO population").selectOption("20");
  await page.getByLabel("Follow DEMO actor").selectOption("demo-worker-017");
  await page
    .getByRole("button", { name: "Navigation controls", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Show campus connections", exact: true })
    .click();
  const remote = page.locator(
    '[data-selected-actor-id="demo-worker-017"]',
  );
  await expect(remote).toBeVisible();
  await expect(page.locator(".selected-actor-status")).toContainText(
    `Selected DEMO actor demo-worker-017 is in ${sceneCatalog.high_council.title} (off-room).`,
  );
  await expect(remote).toHaveAttribute(
    "data-selected-actor-scene",
    "high_council",
  );
  await expect(
    page.locator('[data-selected-actor="demo-worker-017"]'),
  ).toHaveCount(0);

  await tools(page);
  await page.getByLabel("DEMO population").selectOption("28");
  await page.getByLabel("Follow DEMO actor").selectOption("demo-worker-025");
  await expect(
    page.getByText(
      `Selected DEMO actor demo-worker-025 is off-seat in ${sceneCatalog.engineering_lab.title}; no map coordinate.`,
      { exact: true },
    ),
  ).toBeVisible();
  await expect(
    page.locator('[data-selected-actor="demo-worker-025"]'),
  ).toHaveCount(0);
});
