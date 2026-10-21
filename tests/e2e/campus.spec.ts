import { test, expect } from "./helpers/test";
import { directory, position, pulse, ready, walkTo } from "./helpers/walking";

async function board(page: import("@playwright/test").Page) {
  await directory(page, "High Council");
  await walkTo(page, "high_council", { x: 576, y: 120 });
  await page.keyboard.press("e");
}
test("explorer walks, collides with the Tiled wall and opens the actual whiteboard", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await ready(page);
  const initial = await position(page);
  await pulse(page, "ArrowLeft", 250);
  expect((await position(page)).x).toBeLessThan(initial.x - 30);
  await board(page);
  await expect(page.getByRole("dialog")).toContainText("DEMO DATA");
  const paused = await position(page);
  await page.keyboard.down("ArrowDown");
  await page.waitForTimeout(250);
  await page.keyboard.up("ArrowDown");
  expect(await position(page)).toEqual(paused);
  await page.getByRole("tab", { name: "CI & blockers" }).click();
  await expect(page.getByRole("dialog")).toContainText("Example check failed");
  await page.screenshot({
    path: "docs/navigation/evidence/whiteboard-desktop.png",
  });
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  expect(errors).toEqual([]);
});
test("teacher remains stationary, offers Malay dialogue and restores gameplay focus", async ({
  page,
}) => {
  await page.goto("/");
  await ready(page);
  await directory(page, "Bilik Cikgu");
  await walkTo(page, "cikgu_room", { x: 576, y: 324 });
  await page.keyboard.press("e");
  await expect(
    page.getByRole("region", { name: "Ustazah Juliana speech bubble" }),
  ).toContainText("Awak dah makan belum?");
  await page.keyboard.press("e");
  await expect(
    page.getByRole("region", { name: "Ustazah Juliana speech bubble" }),
  ).toContainText("Jangan kerja sampai lupa rehat.");
  await page.screenshot({
    path: "docs/navigation/evidence/teacher-desktop.png",
  });
  await page.screenshot({ path: "docs/navigation/evidence/teacher.png" });
  await page.keyboard.press("Escape");
  await expect(page.locator("canvas")).toBeFocused();
  await page.keyboard.press("e");
  await expect(
    page.getByRole("region", { name: "Ustazah Juliana speech bubble" }),
  ).toContainText("Ustazah Juliana");
});
test("mobile touch controls move and touch interaction opens a modal", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  const touch = await context.newCDPSession(page);
  await page.goto("/");
  await ready(page);
  const initial = await position(page);
  const box = (await page
    .getByRole("button", { name: "Move left", exact: true })
    .boundingBox())!;
  await touch.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: box.x + 20, y: box.y + 20 }],
  });
  await page.waitForTimeout(400);
  await touch.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  expect((await position(page)).x).toBeLessThan(initial.x - 30);
  await directory(page, "High Council");
  await walkTo(page, "high_council", { x: 576, y: 120 }, { touch });
  await page.getByRole("button", { name: "Interact", exact: true }).tap();
  await expect(page.getByRole("dialog")).toContainText("DEMO DATA");
  await page.getByRole("button", { name: "Close panel" }).tap();
  await page.screenshot({ path: "docs/navigation/evidence/campus-mobile.png" });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await context.close();
});
test("untrusted board text stays text and public production routes reject private access", async ({
  page,
  request,
}) => {
  const hostile = '<img src=x onerror="window.attacked=true">';
  await page.route("**/api/public/board", (route) =>
    route.fulfill({
      json: {
        mode: "demo",
        source: "Test fixture",
        fetchedAt: null,
        cards: [
          {
            id: "hostile",
            category: "review",
            title: hostile,
            status: "Example",
            description: hostile,
          },
        ],
      },
    }),
  );
  await page.goto("/");
  await ready(page);
  await board(page);
  await expect(page.getByRole("dialog")).toContainText(hostile);
  expect(await page.getByRole("dialog").locator("img").count()).toBe(0);
  expect(await page.evaluate(() => "attacked" in window)).toBe(false);
  for (const route of [
    "/api/operator/board",
    "/gateway",
    "/terminal",
    "/.env",
    "/assets/../apps/operator/app.ts",
    "/assets/%2e%2e/%2e%2e/.env",
  ])
    expect((await request.get(route)).status()).toBe(404);
});
test("game remains playable when public board is offline", async ({ page }) => {
  await page.route("**/api/public/board", (route) => route.abort());
  await page.goto("/");
  await ready(page);
  await board(page);
  await expect(page.getByRole("dialog")).toContainText("OFFLINE");
  await page.keyboard.press("Escape");
  const before = await position(page);
  await pulse(page, "ArrowDown", 300);
  expect((await position(page)).y).toBeGreaterThan(before.y + 20);
});
