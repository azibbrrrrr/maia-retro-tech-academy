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
  // Keep press/release timing inside the browser so automation IPC latency
  // cannot hold a direction longer than requested at a narrow threshold.
  await page.evaluate(
    async ({ key, ms }) => {
      const canvas = document.querySelector("canvas")!;
      canvas.dispatchEvent(
        new KeyboardEvent("keydown", { key, bubbles: true }),
      );
      await new Promise((resolve) => setTimeout(resolve, ms));
      canvas.dispatchEvent(new KeyboardEvent("keyup", { key, bubbles: true }));
      await new Promise((resolve) => setTimeout(resolve, 150));
    },
    { key, ms },
  );
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
  await page.locator("canvas").focus();
  await page.keyboard.down("ArrowLeft");
  await expect
    .poll(async () => (await position(page)).x, { timeout: 15000 })
    .toBeLessThan(initial.x - 30);
  await page.keyboard.up("ArrowLeft");
  await room(page, "High Council");
  await page.locator("canvas").focus();
  await page.keyboard.down("ArrowUp");
  await expect
    .poll(async () => (await position(page)).y, { timeout: 15000 })
    .toBeLessThan(218);
  await page.waitForTimeout(400);
  await page.keyboard.up("ArrowUp");
  expect((await position(page)).y).toBeGreaterThan(205);
  expect((await position(page)).y).toBeLessThan(218);
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
  test.setTimeout(180_000);
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
    await page.locator("canvas").focus();
    await page.evaluate(
      async ({ coordinate, target }) => {
        const canvas = document.querySelector("canvas")!;
        const delay = (ms: number) =>
          new Promise((resolve) => setTimeout(resolve, ms));
        const read = () =>
          Number(
            document
              .querySelector("[data-explorer]")!
              .getAttribute(coordinate === "x" ? "cx" : "cy"),
          );
        for (let attempt = 0; attempt < 80; attempt++) {
          const remaining = target - read();
          if (Math.abs(remaining) <= 4) return;
          const key =
            coordinate === "x"
              ? remaining > 0
                ? "ArrowRight"
                : "ArrowLeft"
              : remaining > 0
                ? "ArrowDown"
                : "ArrowUp";
          canvas.dispatchEvent(
            new KeyboardEvent("keydown", { key, bubbles: true }),
          );
          await delay(
            Math.min(450, Math.max(40, (Math.abs(remaining) / 190) * 1000)),
          );
          canvas.dispatchEvent(
            new KeyboardEvent("keyup", { key, bubbles: true }),
          );
          // Let physics postUpdate and the minimap report finish after release.
          // Wall-clock timers alone can fire before a frame on a busy renderer.
          for (let frame = 0; frame < 6; frame++) {
            await new Promise<void>((resolve) =>
              requestAnimationFrame(() => resolve()),
            );
          }
          await delay(100);
        }
        throw new Error(
          `Walking route blocked at ${coordinate}=${read()}, target=${target}`,
        );
      },
      { coordinate, target },
    );
  };
  for (const [coordinate, target] of [
    ["x", 620],
    ["y", 475],
    ["x", 475],
    ["y", 312],
    ["x", 660],
    ["y", 250],
  ] as const)
    await axis(coordinate, target);
  await page.keyboard.press("e");
  await expect(page.getByRole("dialog")).toContainText("DEMO DATA");
  await page.keyboard.press("Escape");
  for (const [coordinate, target] of [
    ["y", 312],
    ["x", 475],
    ["y", 475],
    ["x", 620],
    ["y", 660],
    ["x", 1040],
    ["y", 475],
    ["x", 1200],
    ["y", 312],
    ["x", 1380],
  ] as const)
    await axis(coordinate, target);
  await page.keyboard.press("e");
  await expect(page.getByRole("dialog")).toContainText("Ustazah Juliana");
  await page.keyboard.press("Escape");
  for (const [coordinate, target] of [
    ["x", 1200],
    ["y", 475],
    ["x", 1040],
    ["y", 660],
    ["x", 836],
  ] as const)
    await axis(coordinate, target);
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
