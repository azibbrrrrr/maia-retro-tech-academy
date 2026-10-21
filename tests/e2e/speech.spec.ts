import { test, expect } from "./helpers/test";
import {
  ready,
  directory,
  walkTo,
  position,
  pulse,
  debug,
  diagnostic,
  tools,
} from "./helpers/walking";
import { teacher } from "../../packages/world/content";

test("Juliana speaks in an anchored non-blocking bubble with E and Next continuation", async ({
  page,
}) => {
  await page.goto("/");
  await ready(page);
  await directory(page, "Bilik Cikgu");
  await walkTo(page, "cikgu_room", { x: 576, y: 324 });
  await page.keyboard.press("e");
  const bubble = page.getByRole("region", {
    name: "Ustazah Juliana speech bubble",
  });
  await expect(bubble).toBeVisible();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(bubble.getByRole("log")).toContainText("Awak dah makan belum?");
  await expect(page.locator("canvas")).toBeFocused();
  await page.keyboard.press("e");
  await expect(bubble).toContainText("Jangan kerja sampai lupa rehat.");
  await bubble.getByRole("button", { name: "Next dialogue" }).click();
  await expect(bubble).toContainText("Belajar sikit-sikit");
  for (const name of ["Next dialogue", "Close chat"]) {
    const b = (await bubble.getByRole("button", { name }).boundingBox())!;
    expect(b.width).toBeGreaterThanOrEqual(44);
    expect(b.height).toBeGreaterThanOrEqual(44);
  }
  const before = await position(page);
  await pulse(page, "ArrowRight", 200);
  expect((await position(page)).x).toBeGreaterThan(before.x + 20);
  await expect(bubble).toBeVisible();
  await page.screenshot({ path: "docs/navigation/evidence/teacher-chat.png" });
  await pulse(page, "ArrowRight", 600);
  await expect(bubble).not.toBeVisible();
  await walkTo(page, "cikgu_room", { x: 576, y: 324 });
  await page.keyboard.press("e");
  await expect(bubble).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(bubble).not.toBeVisible();
});
for (const viewport of [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
  { width: 844, height: 390 },
  { width: 320, height: 568 },
]) {
  test(`speech bubbles follow the speaker and clamp at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await ready(page);
    await directory(page, "Bilik Cikgu");
    await walkTo(page, "cikgu_room", { x: 576, y: 324 });
    await debug(page);
    const c = await diagnostic<{
      x: number;
      y: number;
      width: number;
      height: number;
      zoom: number;
    }>(page, "camera");
    await page
      .getByRole("button", { name: "Navigation controls", exact: true })
      .click();
    await page.locator("canvas").focus();
    await page.keyboard.press("e");
    const bubble = page.getByRole("region", {
      name: "Ustazah Juliana speech bubble",
    });
    await expect(bubble).toBeVisible();
    const b = (await bubble.boundingBox())!;
    expect(b.x).toBeGreaterThanOrEqual(8);
    expect(b.y).toBeGreaterThanOrEqual(8);
    expect(b.x + b.width).toBeLessThanOrEqual(viewport.width - 8);
    expect(b.y + b.height).toBeLessThanOrEqual(viewport.height - 8);
    const tail = page.locator("[data-speech-tail]");
    expect(Number(await tail.getAttribute("data-anchor-x"))).toBeCloseTo(
      (576 - c.x - c.width / 2) * c.zoom + c.width / 2,
      0,
    );
    expect(Number(await tail.getAttribute("data-anchor-y"))).toBeCloseTo(
      (182 - c.y - c.height / 2) * c.zoom + c.height / 2,
      0,
    );
    const initialAnchorX = Number(await tail.getAttribute("data-anchor-x"));
    await tools(page);
    await page.getByRole("button", { name: "Touch pan", exact: true }).click();
    await page.getByRole("button", { name: "Zoom in", exact: true }).click();
    await page.getByRole("button", { name: "Pan right", exact: true }).click();
    await expect
      .poll(async () => (await diagnostic<{ x: number }>(page, "camera")).x)
      .not.toBe(c.x);
    await expect
      .poll(
        async () => (await diagnostic<{ zoom: number }>(page, "camera")).zoom,
      )
      .toBeGreaterThan(c.zoom);
    const movedCamera = await diagnostic<{
      x: number;
      y: number;
      width: number;
      height: number;
      zoom: number;
    }>(page, "camera");
    const movedTailX = Number(await tail.getAttribute("data-anchor-x"));
    expect(movedTailX).not.toBeCloseTo(initialAnchorX, 0);
    expect(movedTailX).toBeCloseTo(
      (576 - movedCamera.x - movedCamera.width / 2) *
        movedCamera.zoom +
        movedCamera.width / 2,
      0,
    );
    expect(Number(await tail.getAttribute("data-anchor-y"))).toBeCloseTo(
      (182 - movedCamera.y - movedCamera.height / 2) *
        movedCamera.zoom +
        movedCamera.height / 2,
      0,
    );
    const movedBubble = (await bubble.boundingBox())!;
    expect(movedBubble.x).toBeGreaterThanOrEqual(8);
    expect(movedBubble.y).toBeGreaterThanOrEqual(8);
    expect(movedBubble.x + movedBubble.width).toBeLessThanOrEqual(
      viewport.width - 8,
    );
    expect(movedBubble.y + movedBubble.height).toBeLessThanOrEqual(
      viewport.height - 8,
    );
    await page
      .getByRole("button", { name: "Navigation controls", exact: true })
      .click();
    await page.getByRole("button", { name: "Close chat" }).click();
    await expect(bubble).not.toBeVisible();
  });
}

test("welcome and fixture bubbles allow touch walking, retarget and clear on scene transfer", async ({
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
  await page.getByRole("button", { name: "Interact", exact: true }).tap();
  await expect(
    page.getByRole("region", { name: "Welcome directory speech bubble" }),
  ).toContainText("Selamat datang");
  const before = await position(page);
  const { touchPulse } = await import("./helpers/walking");
  await touchPulse(page, touch, "left", 200);
  expect((await position(page)).x).toBeLessThan(before.x - 20);
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await directory(page, "Makmal Kejuruteraan");
  await expect(
    page.getByRole("region", { name: /speech bubble/ }),
  ).not.toBeVisible();
  await walkTo(page, "engineering_lab", { x: 192, y: 270 }, { touch });
  await page.getByRole("button", { name: "Interact", exact: true }).tap();
  await expect(
    page.getByRole("region", { name: "DEMO workstation 1 speech bubble" }),
  ).toBeVisible();
  await walkTo(page, "engineering_lab", { x: 456, y: 270 }, { touch });
  await page.getByRole("button", { name: "Interact", exact: true }).tap();
  await expect(
    page.getByRole("region", { name: "DEMO workstation 2 speech bubble" }),
  ).toBeVisible();
  await page.screenshot({
    path: "docs/navigation/evidence/fixture-chat-mobile.png",
  });
  await directory(page, "Bilik Cikgu");
  await expect(
    page.getByRole("region", { name: /speech bubble/ }),
  ).not.toBeVisible();
  await context.close();
});

test("320px touch chat keeps movement and interaction controls reachable", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 320, height: 568 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  const touch = await context.newCDPSession(page);
  await page.goto("/");
  await ready(page);
  await directory(page, "Bilik Cikgu");
  await walkTo(page, "cikgu_room", { x: 576, y: 324 }, { touch });
  await page.getByRole("button", { name: "Interact", exact: true }).tap();
  const bubble = page.getByRole("region", {
    name: "Ustazah Juliana speech bubble",
  });
  await expect(bubble).toBeVisible();
  const graph = page.getByRole("img", {
    name: "Logical campus connections: entrance links all seven rooms",
  });
  const mapToggle = page.getByRole("button", {
    name: "Show campus connections",
    exact: true,
  });
  await mapToggle.tap();
  await expect(graph).toBeVisible();
  type Box = NonNullable<Awaited<ReturnType<typeof bubble.boundingBox>>>;
  const overlaps = (a: Box, b: Box) =>
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y;
  const verifyBubbleReachability = async (activeBubble: typeof bubble) => {
    const bubbleBox = (await activeBubble.boundingBox())!;
    expect(bubbleBox.x).toBeGreaterThanOrEqual(8);
    expect(bubbleBox.y).toBeGreaterThanOrEqual(8);
    expect(bubbleBox.x + bubbleBox.width).toBeLessThanOrEqual(312);
    expect(bubbleBox.y + bubbleBox.height).toBeLessThanOrEqual(560);
    for (const name of [
      "Interact",
      "Move up",
      "Move left",
      "Move right",
      "Move down",
    ]) {
      const control = page.getByRole("button", { name, exact: true });
      const box = (await control.boundingBox())!;
      expect(
        overlaps(bubbleBox, box),
        `${name} should remain reachable while ${await activeBubble.getAttribute("aria-label")} is open`,
      ).toBe(false);
    }
    const mapToggleBox = (await page.locator(".map-toggle").boundingBox())!;
    expect(
      overlaps(bubbleBox, mapToggleBox),
      "the map toggle should remain reachable while speech is open",
    ).toBe(false);
    const interaction = (await page
      .getByRole("button", { name: "Interact", exact: true })
      .boundingBox())!;
    const map = (await page
      .getByRole("complementary", { name: "Campus navigation" })
      .boundingBox())!;
    expect(
      overlaps(interaction, map),
      "Interact should remain clear of the expanded campus map",
    ).toBe(false);
    expect(
      overlaps(bubbleBox, map),
      "the open speech bubble should remain clear of the navigation panel",
    ).toBe(false);
  };
  await verifyBubbleReachability(bubble);
  await page.getByRole("button", { name: "Show room map", exact: true }).tap();
  await expect(graph).not.toBeVisible();
  await expect(page.locator(".mini-map")).toBeVisible();
  await verifyBubbleReachability(bubble);
  await page
    .getByRole("button", { name: "Show campus connections", exact: true })
    .tap();
  await expect(graph).toBeVisible();
  await verifyBubbleReachability(bubble);
  for (let line = 0; line < teacher.dialogue.length; line++) {
    await expect(bubble).toContainText(teacher.dialogue[line]);
    await verifyBubbleReachability(bubble);
    if (line === teacher.dialogue.length - 1) break;
    if (line % 2 === 0)
      await page.getByRole("button", { name: "Interact", exact: true }).tap();
    else await bubble.getByRole("button", { name: "Next dialogue" }).tap();
  }
  await page.screenshot({
    path: "docs/navigation/evidence/teacher-chat-mobile-320.png",
  });
  const before = await position(page);
  const { touchPulse } = await import("./helpers/walking");
  await touchPulse(page, touch, "left", 180);
  expect((await position(page)).x).toBeLessThan(before.x - 10);
  await expect(bubble).toBeVisible();
  await bubble.getByRole("button", { name: "Close chat" }).tap();
  await expect(bubble).not.toBeVisible();
  await page.getByRole("button", { name: "About MAIA academy" }).tap();
  const welcome = page.getByRole("region", {
    name: "MAIA welcome speech bubble",
  });
  await expect(welcome).toBeVisible();
  await verifyBubbleReachability(welcome);
  await welcome.getByRole("button", { name: "Close chat" }).tap();
  await context.close();
});
