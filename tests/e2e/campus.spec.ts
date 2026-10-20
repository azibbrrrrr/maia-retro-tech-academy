import { test, expect, type Page } from "@playwright/test";

async function position(page: Page) {
  const marker = page.locator("[data-explorer]");
  return {
    x: Number(await marker.getAttribute("cx")),
    y: Number(await marker.getAttribute("cy")),
  };
}
async function walk(page: Page, key: string, ms: number) {
  await page.locator("canvas").focus();
  await page.keyboard.down(key);
  await page.waitForTimeout(ms);
  await page.keyboard.up(key);
  await page.waitForTimeout(120);
}
async function room(page: Page, name: string) {
  await page.getByRole("button", { name: "Room directory" }).click();
  await page.getByRole("button", { name, exact: true }).click();
}

test("explorer walks, collides with the Tiled wall and opens the actual whiteboard", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Interact", exact: true }),
  ).toBeEnabled();
  await expect(page.locator("canvas")).toBeVisible();
  await expect(page.locator("[data-explorer]")).toHaveAttribute("cx", /\d+/);
  const initial = await position(page);
  await walk(page, "ArrowLeft", 350);
  expect((await position(page)).x).toBeLessThan(initial.x - 30);
  await room(page, "High Council");
  await walk(page, "ArrowLeft", 2000);
  expect((await position(page)).x).toBeGreaterThan(144);
  expect((await position(page)).x).toBeLessThan(170);
  await room(page, "High Council");
  await walk(page, "ArrowUp", 1000);
  await page.keyboard.press("e");
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("dialog")).toContainText("DEMO DATA");
  const paused = await position(page);
  await page.keyboard.down("ArrowDown");
  await page.waitForTimeout(250);
  await page.keyboard.up("ArrowDown");
  expect(await position(page)).toEqual(paused);
  await page.getByRole("tab", { name: "CI & blockers" }).click();
  await expect(page.getByRole("dialog")).toContainText("Example check failed");
  await page.screenshot({
    path: "docs/evidence/whiteboard-desktop.png",
    fullPage: true,
  });
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  expect(errors).toEqual([]);
});

test("teacher remains stationary, offers Malay dialogue and restores gameplay focus", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Interact", exact: true }),
  ).toBeEnabled();
  await room(page, "Bilik Cikgu");
  await walk(page, "ArrowUp", 700);
  await walk(page, "ArrowRight", 350);
  await page.keyboard.press("e");
  await expect(page.getByRole("dialog")).toContainText("Ustazah Juliana");
  await expect(page.getByRole("dialog")).toContainText("Awak dah makan belum?");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toContainText(
    "Jangan kerja sampai lupa rehat.",
  );
  await page.screenshot({
    path: "docs/evidence/teacher-desktop.png",
    fullPage: true,
  });
  await page.keyboard.press("Escape");
  await expect(page.locator("canvas")).toBeFocused();
  await page.keyboard.press("e");
  await expect(page.getByRole("dialog")).toContainText("Ustazah Juliana");
});

test("mobile touch controls move the explorer and tap interaction opens a modal", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Interact", exact: true }),
  ).toBeEnabled();
  await expect(page.locator("canvas")).toBeVisible();
  const initial = await position(page);
  const button = page.getByRole("button", { name: "Move left", exact: true });
  const box = (await button.boundingBox())!;
  const touch = await context.newCDPSession(page);
  await touch.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: box.x + box.width / 2, y: box.y + box.height / 2 }],
  });
  await page.waitForTimeout(400);
  await touch.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  expect((await position(page)).x).toBeLessThan(initial.x - 30);
  await room(page, "High Council");
  const up = await page.getByRole("button", { name: "Move up" }).boundingBox();
  await touch.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: up!.x + 20, y: up!.y + 20 }],
  });
  await page.waitForTimeout(1000);
  await touch.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await page.getByRole("button", { name: "Interact", exact: true }).tap();
  await expect(page.getByRole("dialog")).toContainText("DEMO DATA");
  await page.getByRole("button", { name: "Close panel" }).tap();
  await page.screenshot({
    path: "docs/evidence/campus-mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await context.close();
});

test("visitor walks from gate to both classrooms and back without quick navigation", async ({
  page,
}) => {
  test.setTimeout(90_000);
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Interact", exact: true }),
  ).toBeEnabled();
  await expect(
    page.getByRole("button", { name: "Interact", exact: true }),
  ).toBeEnabled();
  await page.screenshot({
    path: "docs/evidence/campus-desktop.png",
    fullPage: true,
  });
  const axis = async (coordinate: "x" | "y", target: number) => {
    for (let attempt = 0; attempt < 40; attempt++) {
      const current = (await position(page))[coordinate];
      const remaining = target - current;
      if (Math.abs(remaining) <= 15) return;
      const key =
        coordinate === "x"
          ? remaining > 0
            ? "ArrowRight"
            : "ArrowLeft"
          : remaining > 0
            ? "ArrowDown"
            : "ArrowUp";
      await walk(page, key, Math.min(450, (Math.abs(remaining) / 190) * 1000));
    }
    expect(
      Math.abs((await position(page))[coordinate] - target),
    ).toBeLessThanOrEqual(15);
  };
  await axis("y", 576);
  await axis("x", 384);
  await axis("y", 240);
  await page.keyboard.press("e");
  await expect(page.getByRole("dialog")).toContainText("DEMO DATA");
  await page.keyboard.press("Escape");
  await axis("y", 576);
  await axis("x", 1104);
  await axis("y", 300);
  await axis("x", 1170);
  await page.keyboard.press("e");
  await expect(page.getByRole("dialog")).toContainText("Ustazah Juliana");
  await page.keyboard.press("Escape");
  await axis("x", 1104);
  await axis("y", 576);
  await axis("x", 768);
  await axis("y", 888);
  await expect(
    page.getByRole("button", { name: "Interact", exact: true }),
  ).toBeEnabled();
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
  await expect(
    page.getByRole("button", { name: "Interact", exact: true }),
  ).toBeEnabled();
  await room(page, "High Council");
  await walk(page, "ArrowUp", 1000);
  await page.keyboard.press("e");
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
  ]) {
    expect((await request.get(route)).status()).toBe(404);
  }
});

test("the game remains playable when the public board is offline", async ({
  page,
}) => {
  await page.route("**/api/public/board", (route) => route.abort());
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Interact", exact: true }),
  ).toBeEnabled();
  await room(page, "High Council");
  await walk(page, "ArrowUp", 1000);
  await page.keyboard.press("e");
  await expect(page.getByRole("dialog")).toContainText("OFFLINE");
  await page.keyboard.press("Escape");
  const before = await position(page);
  await walk(page, "ArrowDown", 300);
  expect((await position(page)).y).toBeGreaterThan(before.y + 20);
});
