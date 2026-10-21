import { test, expect } from "./helpers/test";
import { writeFileSync } from "node:fs";
import {
  sceneCatalog,
  sceneIds,
  FOOT_BODY,
  type SceneId,
} from "../../packages/world/scenes";
import {
  actorOccupancy,
  createDemoActors,
  reserveDemoWorkstations,
} from "../../packages/world/actors";
import {
  walkTo,
  scene,
  ready,
  directory,
  position,
  debug,
  diagnostic,
  tools,
  pulse,
} from "./helpers/walking";

// Continuous gameplay tracing records every animated frame and distorts the
// long traversal/performance run. Keep explicit screenshots and position-rich
// failures here; short regression suites retain their configured failure traces.
test.use({ trace: "off" });

test("floor transfer opens the lab and explicit return clears held input", async ({
  page,
}) => {
  await page.goto("/");
  await ready(page);
  await expect(page.locator("[data-explorer]")).toHaveAttribute(
    "data-scene",
    "entrance",
  );
  await page.locator("canvas").focus();
  await page.keyboard.down("ArrowLeft");
  await page.waitForTimeout(750);
  await page.keyboard.up("ArrowLeft");
  await page.keyboard.press("e");
  await expect(page.locator("[data-explorer]")).toHaveAttribute(
    "data-scene",
    "engineering_lab",
  );
  await expect(
    page.getByText("Temporary navigation study", { exact: true }),
  ).toBeVisible();
  await page.waitForTimeout(320);
  await page.keyboard.down("ArrowDown");
  await page.waitForTimeout(260);
  await page.keyboard.press("e");
  await expect(page.locator("[data-explorer]")).toHaveAttribute(
    "data-scene",
    "entrance",
  );
  await page.waitForTimeout(350);
  const landing = await position(page);
  await page.waitForTimeout(300);
  expect(await position(page)).toEqual(landing);
  await page.evaluate(() =>
    document.querySelector("canvas")!.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "ArrowDown",
        repeat: true,
        bubbles: true,
      }),
    ),
  );
  await page.waitForTimeout(200);
  expect(await position(page)).toEqual(landing);
  await page.keyboard.up("ArrowDown");
  await pulse(page, "ArrowDown", 100);
  expect((await position(page)).y).toBeGreaterThan(landing.y + 10);
  expect(page.url()).toBe("http://127.0.0.1:3000/");
});

// Missing collision, wrong map exports, unreachable anchors or a stalled input
// path fail these routes at their observed position, never via a game test hook.

test("gate visits all seven rooms, every required anchor and all sixteen desks through real physics", async ({
  page,
}) => {
  test.setTimeout(600_000);
  await page.goto("/");
  await ready(page);
  await page.screenshot({
    path: "docs/navigation/evidence/entrance-desktop.png",
  });
  for (const id of sceneIds.filter((id) => id !== "entrance")) {
    console.info(`Real-input route: entrance → ${id} → entrance`);
    const pad = sceneCatalog.entrance.portals.find(
      (p) => p.targetScene === id,
    )!;
    await walkTo(page, "entrance", pad.approach);
    await page.keyboard.press("e");
    await scene(page, id);
    await expect(
      page.getByText("Temporary navigation study", { exact: true }),
    ).toBeVisible();
    for (const anchor of sceneCatalog[id].anchors) {
      console.info(`Interaction route: ${id}/${anchor.id}`);
      await walkTo(page, id, anchor.point);
      await page.keyboard.press("e");
      const interaction =
        anchor.interaction === "board"
          ? page.getByRole("dialog")
          : page.getByRole("region", { name: /speech bubble/ });
      await expect(interaction).toBeVisible();
      await expect(interaction).toContainText(
        anchor.interaction === "teacher"
          ? "Ustazah Juliana"
          : anchor.interaction === "board"
            ? "DEMO DATA"
            : anchor.label,
      );
      await page.keyboard.press("Escape");
      await expect(page.locator("canvas")).toBeFocused();
    }
    if (id === "engineering_lab")
      await page.screenshot({
        path: "docs/navigation/evidence/lab-sixteen.png",
      });
    await walkTo(page, id, sceneCatalog[id].portals[0].approach);
    await page.keyboard.press("e");
    await scene(page, "entrance");
    await walkTo(page, "entrance", sceneCatalog.entrance.spawns.entry);
  }
});

test("genuine touch crosses every room portal in both directions without quick travel", async ({
  browser,
}) => {
  test.setTimeout(360_000);
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  const touch = await context.newCDPSession(page);
  await page.goto("/");
  await ready(page);
  for (const id of sceneIds.filter((id) => id !== "entrance")) {
    console.info(`Real-input route: entrance → ${id} → entrance`);
    const pad = sceneCatalog.entrance.portals.find(
      (p) => p.targetScene === id,
    )!;
    await walkTo(page, "entrance", pad.approach, { touch });
    await page.getByRole("button", { name: "Interact", exact: true }).tap();
    await scene(page, id);
    await walkTo(page, id, sceneCatalog[id].portals[0].approach, { touch });
    await page.getByRole("button", { name: "Interact", exact: true }).tap();
    await scene(page, "entrance");
  }
  await page.screenshot({
    path: "docs/navigation/evidence/entrance-mobile.png",
  });
  await context.close();
});

test("live Arcade foot diagnostics match declared transform and real wall collision", async ({
  page,
}) => {
  await page.goto("/");
  await ready(page);
  await directory(page, "High Council");
  await debug(page);
  const body = await diagnostic<Record<string, number>>(page, "body");
  writeFileSync(
    "docs/navigation/evidence/live-foot-body.json",
    JSON.stringify(
      {
        environment: "headless Chromium on host",
        actual: body,
        declared: FOOT_BODY,
      },
      null,
      2,
    ) + "\n",
  );
  expect(body.width).toBeCloseTo(14.08, 4);
  expect(body.height).toBeCloseTo(7.92, 4);
  for (const k of ["left", "top", "right", "bottom"] as const)
    expect(body[k]).toBeCloseTo(FOOT_BODY.exact[k], 4);
  await page
    .getByRole("button", { name: "Navigation controls", exact: true })
    .click();
  await walkTo(page, "high_council", { x: 576, y: 48 });
  await pulse(page, "ArrowUp", 500);
  expect((await position(page)).y).toBeGreaterThan(28);
  expect((await position(page)).y).toBeLessThan(31);
  await debug(page);
  await page.screenshot({
    path: "docs/navigation/evidence/collision-overlay.png",
  });
});

test("twenty DEMO workers leave all sixteen desks approachable and overflow stays tracked across rooms", async ({
  page,
}) => {
  test.setTimeout(360_000);
  await page.goto("/");
  await ready(page);
  await directory(page, sceneCatalog.engineering_lab.title);
  await debug(page);
  await page.getByLabel("DEMO population").selectOption("20");
  const workers = await diagnostic<{ id: string; sceneId: SceneId }[]>(
    page,
    "actors",
  );
  expect(workers).toHaveLength(20);
  expect(new Set(workers.map((a) => a.id)).size).toBe(20);
  expect(workers.filter((a) => a.sceneId !== "engineering_lab")).toHaveLength(
    4,
  );
  await page
    .getByRole("button", { name: "Navigation controls", exact: true })
    .click();
  const occupied = actorOccupancy(
    reserveDemoWorkstations(createDemoActors(20)),
    "engineering_lab",
  );
  for (const anchor of sceneCatalog.engineering_lab.anchors.filter(
    (a) => a.kind === "workstation",
  )) {
    console.info(`Occupied approach: ${anchor.id}`);
    await walkTo(page, "engineering_lab", anchor.point, { occupied });
    await page.keyboard.press("e");
    await expect(
      page.getByRole("region", { name: /speech bubble/ }),
    ).toContainText(anchor.label);
    await page.keyboard.press("Escape");
  }
  await page.screenshot({
    path: "docs/navigation/evidence/lab-congestion20.png",
  });
  await directory(page, "High Council");
  await tools(page);
  expect(
    (await diagnostic<{ id: string }[]>(page, "actors")).map((a) => a.id),
  ).toEqual(workers.map((a) => a.id));
  await page.getByLabel("DEMO population").selectOption("28");
  const overflow = await diagnostic<{ position: unknown }[]>(page, "actors");
  expect(overflow.filter((a) => !a.position)).toHaveLength(4);
  await directory(page, sceneCatalog.library.title);
  await tools(page);
  expect(await diagnostic<unknown[]>(page, "actors")).toHaveLength(28);
  await page
    .getByRole("button", { name: "Navigation controls", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Show campus connections", exact: true })
    .click();
  await page.screenshot({ path: "docs/navigation/evidence/logical-map.png" });
});

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 1280, height: 720 },
  { width: 390, height: 844 },
  { width: 844, height: 390 },
  { width: 320, height: 568 },
]) {
  test(`all seven portal round trips and camera recovery at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    test.setTimeout(360_000);
    await page.setViewportSize(viewport);
    await page.goto("/");
    await ready(page);
    for (const id of sceneIds.filter((id) => id !== "entrance")) {
      await walkTo(
        page,
        "entrance",
        sceneCatalog.entrance.portals.find((p) => p.targetScene === id)!
          .approach,
      );
      await page.keyboard.press("e");
      await scene(page, id);
      const before = await position(page);
      await tools(page);
      await page.getByLabel("DEMO population").selectOption("20");
      await page
        .getByLabel("Follow DEMO actor")
        .selectOption("demo-worker-001");
      await expect(page.getByLabel("Camera status")).toHaveAttribute(
        "data-camera-mode",
        "agent",
      );
      await page
        .getByRole("button", { name: "Follow player", exact: true })
        .click();
      await page.getByRole("button", { name: "Zoom in", exact: true }).click();
      await page.getByRole("button", { name: "Pan left", exact: true }).click();
      await expect(page.getByLabel("Camera status")).toHaveAttribute(
        "data-camera-mode",
        "free",
      );
      expect(await position(page)).toEqual(before);
      await page
        .getByRole("button", { name: "Follow player", exact: true })
        .click();
      await expect(page.getByLabel("Camera status")).toHaveAttribute(
        "data-camera-mode",
        "player",
      );
      await page
        .getByRole("button", { name: "Navigation controls", exact: true })
        .click();
      if (viewport.width === 320 && id === "engineering_lab")
        await page.screenshot({
          path: "docs/navigation/evidence/lab-mobile-320.png",
        });
      await walkTo(page, id, sceneCatalog[id].portals[0].approach);
      await page.keyboard.press("e");
      await scene(page, "entrance");
      await walkTo(page, "entrance", sceneCatalog.entrance.spawns.entry);
    }
  });
}

test("two-finger pinch and touch pan change camera without moving visitor", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await page.goto("/");
  await ready(page);
  await debug(page);
  await page
    .getByRole("button", { name: "Navigation controls", exact: true })
    .click();
  const before = await position(page);
  const initial = Number(
    await page.getByLabel("Camera status").getAttribute("data-camera-zoom"),
  );
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [
      { x: 150, y: 360, id: 1 },
      { x: 240, y: 360, id: 2 },
    ],
  });
  for (let i = 1; i <= 5; i++) {
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [
        { x: 150 - i * 8, y: 360, id: 1 },
        { x: 240 + i * 8, y: 360, id: 2 },
      ],
    });
    await page.waitForTimeout(35);
  }
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await expect
    .poll(async () =>
      Number(
        await page.getByLabel("Camera status").getAttribute("data-camera-zoom"),
      ),
    )
    .toBeGreaterThan(initial + 0.15);
  expect(await position(page)).toEqual(before);
  await tools(page);
  await page.getByRole("button", { name: "Touch pan", exact: true }).click();
  const camera = await diagnostic<{ x: number }>(page, "camera");
  await page
    .getByRole("button", { name: "Navigation controls", exact: true })
    .click();
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: 190, y: 360, id: 1 }],
  });
  for (let i = 1; i <= 5; i++) {
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: 190 - i * 15, y: 360, id: 1 }],
    });
    await page.waitForTimeout(35);
  }
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await tools(page);
  await expect
    .poll(async () => (await diagnostic<{ x: number }>(page, "camera")).x)
    .toBeGreaterThan(camera.x + 20);
  expect(await position(page)).toEqual(before);
  await page
    .getByRole("button", { name: "Follow player", exact: true })
    .click();
  await expect(page.getByLabel("Camera status")).toHaveAttribute(
    "data-camera-mode",
    "player",
  );
  await context.close();
});

test("zoom clamps, blur releases movement and repeated room visits do not leak bodies", async ({
  page,
}) => {
  test.setTimeout(120_000);
  await page.goto("/");
  await ready(page);
  await debug(page);
  const counts = [];
  for (let i = 0; i < 4; i++) {
    await directory(page, "Bilik Cikgu");
    await tools(page);
    counts.push(
      await diagnostic<{ objects: number; staticBodies: number }>(
        page,
        "performance",
      ),
    );
    await directory(page, "School gate");
  }
  expect(new Set(counts.map((c) => c.objects)).size).toBe(1);
  expect(new Set(counts.map((c) => c.staticBodies)).size).toBe(1);
  await tools(page);
  await page.mouse.move(650, 350);
  await page.mouse.wheel(0, -10000);
  await expect
    .poll(async () =>
      Number(
        await page.getByLabel("Camera status").getAttribute("data-camera-zoom"),
      ),
    )
    .toBe(1.8);
  await page.mouse.wheel(0, 10000);
  await expect
    .poll(async () =>
      Number(
        await page.getByLabel("Camera status").getAttribute("data-camera-zoom"),
      ),
    )
    .toBe(0.4);
  await page
    .getByRole("button", { name: "Follow player", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Navigation controls", exact: true })
    .click();
  await page.locator("canvas").focus();
  await page.keyboard.down("ArrowRight");
  await page.waitForTimeout(200);
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  await page.waitForTimeout(150);
  const stopped = await position(page);
  await page.waitForTimeout(250);
  expect(await position(page)).toEqual(stopped);
  await page.keyboard.up("ArrowRight");
});
