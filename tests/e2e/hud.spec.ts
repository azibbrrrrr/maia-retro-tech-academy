import { test, expect } from "./helpers/test";

test("HUD shortcuts travel to rooms and directory pauses movement until Escape", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Interact", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Cikgu ♥", exact: true }).click();
  await expect(page.locator("canvas")).toBeFocused();
  await expect(page.locator("[data-explorer]")).toHaveAttribute(
    "data-scene",
    "cikgu_room",
  );
  await page.waitForTimeout(350);
  await page.getByRole("button", { name: "PR Board", exact: true }).click();
  await expect(page.locator("canvas")).toBeFocused();
  await expect(page.locator("[data-explorer]")).toHaveAttribute(
    "data-scene",
    "high_council",
  );
  await page.waitForTimeout(350);
  await page.keyboard.press("m");
  await expect(page.getByRole("dialog")).toContainText("Room directory");
  await page.keyboard.press("m");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("canvas")).toBeFocused();
  await page
    .getByRole("button", { name: "Room directory", exact: true })
    .click();
  await page.getByRole("button", { name: "School gate", exact: true }).click();
  await expect(page.locator("canvas")).toBeFocused();
});

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 1280, height: 720 },
  { width: 390, height: 844 },
  { width: 844, height: 390 },
  { width: 320, height: 568 },
]) {
  test(`viewport ${viewport.width}×${viewport.height} fills the screen with reachable separated controls`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await expect(
      page.getByRole("button", { name: "Interact", exact: true }),
    ).toBeEnabled();
    const canvas = await page.locator("canvas").boundingBox();
    expect(canvas).toMatchObject({
      x: 0,
      y: 0,
      width: viewport.width,
      height: viewport.height,
    });
    expect(
      await page.evaluate(() => ({
        width: document.documentElement.scrollWidth,
        height: document.documentElement.scrollHeight,
      })),
    ).toEqual(viewport);
    const labels = [
      "Move left",
      "Move right",
      "Move up",
      "Move down",
      "Interact",
      "Room directory",
      "Cikgu ♥",
      "PR Board",
      "Enter fullscreen",
    ];
    const controls = [];
    for (const name of labels) {
      const button = page.getByRole("button", { name, exact: true });
      await expect(button).toBeVisible();
      const box = (await button.boundingBox())!;
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
      expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
      controls.push(box);
    }
    for (let i = 0; i < controls.length; i++) {
      for (let j = i + 1; j < controls.length; j++) {
        const a = controls[i],
          b = controls[j];
        expect(
          a.x + a.width <= b.x ||
            b.x + b.width <= a.x ||
            a.y + a.height <= b.y ||
            b.y + b.height <= a.y,
        ).toBe(true);
      }
    }
    await page
      .getByRole("button", { name: "Room directory", exact: true })
      .click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Close panel" }),
    ).toBeInViewport();
    await page.keyboard.press("Tab");
    expect(
      await page
        .getByRole("dialog")
        .evaluate((dialog) => dialog.contains(document.activeElement)),
    ).toBe(true);
  });
}

test("fullscreen rejection reports the failure without claiming fullscreen", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Element.prototype.requestFullscreen = async () => {
      throw new Error("denied");
    };
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Enter fullscreen" }).click();
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "Fullscreen could not be opened" }),
  ).toContainText("Fullscreen could not be opened");
  await expect(
    page.getByRole("button", { name: "Enter fullscreen" }),
  ).toHaveAttribute("aria-pressed", "false");
});

test("unsupported fullscreen stays disabled with an explanation", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(Element.prototype, "requestFullscreen", {
      value: undefined,
    });
  });
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Enter fullscreen" }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Enter fullscreen" }),
  ).toHaveAttribute("title", "Fullscreen is not supported in this browser");
});

test("fullscreen controls reflect actual entry and exit", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Enter fullscreen" }).click();
  await expect(
    page.getByRole("button", { name: "Exit fullscreen" }),
  ).toHaveAttribute("aria-pressed", "true");
  expect(await page.evaluate(() => document.fullscreenElement !== null)).toBe(
    true,
  );
  await page.getByRole("button", { name: "Exit fullscreen" }).click();
  await expect(
    page.getByRole("button", { name: "Enter fullscreen" }),
  ).toHaveAttribute("aria-pressed", "false");
  expect(await page.evaluate(() => document.fullscreenElement)).toBeNull();
});
