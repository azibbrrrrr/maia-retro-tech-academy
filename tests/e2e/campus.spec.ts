import { test, expect } from "./helpers/test";
import { campusDefinition } from "../../packages/world/unified-campus";
import { teacher } from "../../packages/world/content";
import { position, pulse, ready, tools, touchPulse, walkTo, zone } from "./helpers/walking";

test("visitor physically reaches the council board and hostile board content stays text", async ({ page }) => {
  const hostile = '<img src=x onerror="window.attacked=true">';
  await page.route("**/api/public/board", (route) => route.fulfill({ json: {
    mode: "demo", source: "Test fixture", fetchedAt: null,
    cards: [
      { id: "hostile", category: "review", title: hostile, status: "Example", description: hostile },
      { id: "blocked-example", category: "blocked", title: "Blocked test fixture", status: "Example check failed", description: "The fixture contains a blocked check." },
    ],
  } }));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await ready(page);
  const board = campusDefinition.anchors.find((anchor) => anchor.id === "pr-board")!;
  await walkTo(page, board.point, board.id);
  await zone(page, "high_council");
  await page.keyboard.press("e");
  const panel = page.getByRole("dialog");
  await expect(panel).toContainText(hostile);
  expect(await panel.locator("img").count()).toBe(0);
  expect(await page.evaluate(() => "attacked" in window)).toBe(false);
  await page.getByRole("tab", { name: "CI & blockers" }).click();
  await expect(panel).toContainText("Example check failed");
  await page.screenshot({ path: "docs/evidence/unified-campus-council-board.png" });
  for (const route of ["/api/operator/board", "/gateway", "/terminal", "/.env", "/assets/../apps/operator/app.ts", "/assets/%2e%2e/%2e%2e/.env"])
    expect((await page.request.get(route)).status()).toBe(404);
});

test("stationary Juliana speaks nearby without blocking walking and close restores keyboard input", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await ready(page);
  const approach = campusDefinition.anchors.find((anchor) => anchor.id === "teacher")!;
  await walkTo(page, approach.point, approach.id);
  await zone(page, "cikgu_room");
  await tools(page);
  await page.getByRole("button", { name: "Follow player", exact: true }).click();
  await page.getByRole("button", { name: "Navigation controls", exact: true }).click();
  const beforeTeacher = await position(page);
  await page.keyboard.press("e");
  const bubble = page.getByRole("region", { name: "Ustazah Juliana speech bubble" });
  await expect(bubble).toContainText("Awak dah makan belum?");
  await bubble.getByRole("button", { name: "Next dialogue" }).click();
  await expect(bubble).toContainText("Jangan kerja sampai lupa rehat.");
  await page.screenshot({ path: "docs/evidence/unified-campus-teacher.png" });
  await bubble.getByRole("button", { name: "Close chat" }).click();
  await expect(bubble).not.toBeVisible();
  await page.locator("canvas").focus();
  await pulse(page, "ArrowRight", 150);
  expect((await position(page)).x).toBeGreaterThan(beforeTeacher.x);
});

test("touch D-pad physically crosses all seven room openings and keeps map and speech controls available", async ({ browser }) => {
  test.setTimeout(900_000);
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await page.goto("/");
  await ready(page);
  for (const door of campusDefinition.doorways.filter((candidate) =>
    candidate.zones.includes("entrance") && candidate.zones.some((zoneId) => zoneId !== "entrance"),
  )) {
    const [inside, outside] = door.approaches;
    const room = door.zones.find((zoneId) => zoneId !== "entrance")!;
    await walkTo(page, outside, `touch ${door.id} exterior`, { touch: cdp });
    await zone(page, "entrance");
    await walkTo(page, inside, `touch ${door.id} threshold`, { touch: cdp });
    await zone(page, room);
    await walkTo(page, outside, `touch ${door.id} return`, { touch: cdp });
    await zone(page, "entrance");
  }
  await walkTo(page, campusDefinition.spawns.entry, "touch return to gate", { touch: cdp });
  const approach = campusDefinition.anchors.find((anchor) => anchor.id === "teacher")!;
  await walkTo(page, approach.point, "touch Juliana approach", { touch: cdp });
  await tools(page);
  await page.getByRole("button", { name: "Follow player", exact: true }).tap();
  await page.getByRole("button", { name: "Navigation controls", exact: true }).tap();
  await page.getByRole("button", { name: "Interact", exact: true }).tap();
  const bubble = page.getByRole("region", { name: "Ustazah Juliana speech bubble" });
  await expect(bubble).toBeVisible();
  expect(teacher.dialogue).toHaveLength(4);
  await expect(page.locator(".mini-map")).toBeVisible();
  await page.locator('.mini-map polygon[aria-label="Focus Bilik Cikgu"]').tap();
  await expect(bubble).toBeVisible();
  await expect(page.getByLabel("Camera status")).toHaveAttribute("data-camera-mode", "free");
  for (const name of ["Interact", "Move up", "Move left", "Move right", "Move down", "Close chat", "Next dialogue"]) {
    const control = page.getByRole("button", { name, exact: true });
    const box = (await control.boundingBox())!;
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(390);
  }
  const before = await position(page);
  await touchPulse(page, cdp, "left", 220);
  expect((await position(page)).x).toBeLessThan(before.x);
  await expect(bubble).toBeVisible();
  for (const line of teacher.dialogue.slice(1)) {
    await bubble.getByRole("button", { name: "Next dialogue" }).tap();
    await expect(bubble).toContainText(line);
  }
  await bubble.getByRole("button", { name: "Close chat" }).tap();
  await expect(bubble).not.toBeVisible();
  await page.getByRole("button", { name: "Interact", exact: true }).tap();
  await expect(bubble).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(bubble).not.toBeVisible();
  await context.close();
});

test("public play remains available with an offline board", async ({ page }) => {
  await page.route("**/api/public/board", (route) => route.abort());
  await page.goto("/");
  await ready(page);
  const board = campusDefinition.anchors.find((anchor) => anchor.id === "pr-board")!;
  await walkTo(page, board.point, board.id);
  await page.keyboard.press("e");
  await expect(page.getByRole("dialog")).toContainText("OFFLINE");
  await page.keyboard.press("Escape");
  const before = await position(page);
  await page.locator("canvas").focus();
  await pulse(page, "ArrowDown", 150);
  expect((await position(page)).y).toBeGreaterThan(before.y);
});
