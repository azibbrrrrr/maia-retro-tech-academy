import { test, expect } from "./helpers/test";
import { writeFileSync } from "node:fs";
import { sceneIds, sceneCatalog } from "../../packages/world/scenes";
import {
  ready,
  directory,
  debug,
  diagnostic,
  position,
  tools,
} from "./helpers/walking";
test.use({ trace: "off" });
type Camera = {
  x: number;
  y: number;
  width: number;
  height: number;
  zoom: number;
  mode: string;
};
const project = (c: Camera, p: { x: number; y: number }) => ({
  x: (p.x - c.x - c.width / 2) * c.zoom + c.width / 2,
  y: (p.y - c.y - c.height / 2) * c.zoom + c.height / 2,
});
for (const viewport of [
  { width: 1440, height: 900 },
  { width: 1280, height: 720 },
  { width: 390, height: 844 },
  { width: 844, height: 390 },
  { width: 320, height: 568 },
]) {
  test(`actual camera recovers player foot inside viewport across eight rooms at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    test.setTimeout(180_000);
    await page.setViewportSize(viewport);
    await page.goto("/");
    await ready(page);
    await debug(page);
    await page.getByLabel("DEMO population").selectOption("20");
    for (const id of sceneIds) {
      await directory(
        page,
        id === "entrance"
          ? "School gate"
          : id === "high_council"
            ? "High Council"
            : sceneCatalog[id].title,
      );
      await tools(page);
      const before = await position(page);
      for (let i = 0; i < 8; i++)
        await page
          .getByRole("button", { name: "Zoom in", exact: true })
          .click();
      await expect
        .poll(async () =>
          Number(
            await page
              .getByLabel("Camera status")
              .getAttribute("data-camera-zoom"),
          ),
        )
        .toBeCloseTo(1.8, 10);
      for (let i = 0; i < 6; i++)
        await page.getByRole("button", { name: "Pan up", exact: true }).click();
      await expect
        .poll(
          async () =>
            project(await diagnostic<Camera>(page, "camera"), before).y,
        )
        .toBeGreaterThan(viewport.height);
      await page
        .getByLabel("Follow DEMO actor")
        .selectOption("demo-worker-001");
      await expect(page.getByLabel("Camera status")).toHaveAttribute(
        "data-camera-mode",
        "agent",
      );
      if (id === "engineering_lab")
        await expect
          .poll(async () => {
            const c = await diagnostic<Camera>(page, "camera"),
              p = project(c, { x: 192, y: 240 });
            return (
              p.x >= 0 &&
              p.x <= viewport.width &&
              p.y >= 0 &&
              p.y <= viewport.height
            );
          })
          .toBe(true);
      await page
        .getByRole("button", { name: "Follow player", exact: true })
        .click();
      await expect
        .poll(async () => {
          const c = await diagnostic<Camera>(page, "camera"),
            body = await diagnostic<{
              left: number;
              top: number;
              right: number;
              bottom: number;
            }>(page, "body");
          const a = project(c, {
              x: before.x + body.left,
              y: before.y + body.top,
            }),
            b = project(c, {
              x: before.x + body.right,
              y: before.y + body.bottom,
            });
          return (
            a.x >= 0 &&
            a.y >= 0 &&
            b.x <= viewport.width &&
            b.y <= viewport.height
          );
        })
        .toBe(true);
      expect(await position(page)).toEqual(before);
    }
  });
}

test("headless profiles measure distinct scene transfers and texture facts for 4, 12 and 20 DEMO workers", async ({
  page,
  browser,
}, testInfo) => {
  test.setTimeout(120_000);
  await page.goto("/");
  await ready(page);
  await debug(page);
  const facts = [];
  for (const count of [4, 12, 20]) {
    await tools(page);
    await page.getByLabel("DEMO population").selectOption(String(count));
    await directory(page, "School gate");
    await directory(page, sceneCatalog.engineering_lab.title);
    await tools(page);
    await page.waitForTimeout(2300);
    const performance = await diagnostic<{
      frameMs: number;
      transitionMs: number;
    }>(page, "performance");
    const graphics = await page.locator("canvas").evaluate((canvas) => {
      const gl =
        (canvas as HTMLCanvasElement).getContext("webgl") ??
        (canvas as HTMLCanvasElement).getContext("webgl2");
      if (!gl) return { renderer: "unavailable", vendor: "unavailable" };
      const info = gl.getExtension("WEBGL_debug_renderer_info");
      return {
        renderer: String(
          gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER),
        ),
        vendor: String(
          gl.getParameter(info ? info.UNMASKED_VENDOR_WEBGL : gl.VENDOR),
        ),
      };
    });
    const browserFrames = await page.evaluate(async () => {
      const samples: number[] = [];
      let previous: number | undefined;
      for (let i = 0; i <= 120; i++)
        await new Promise<void>((resolve) =>
          requestAnimationFrame((timestamp) => {
            if (previous !== undefined) samples.push(timestamp - previous);
            previous = timestamp;
            resolve();
          }),
        );
      const sorted = [...samples].sort((a, b) => a - b),
        elapsedMs = samples.reduce((a, b) => a + b, 0);
      return {
        frames: samples.length,
        elapsedMs,
        meanFrameMs: elapsedMs / samples.length,
        p95FrameMs: sorted[Math.ceil(sorted.length * 0.95) - 1],
        maxFrameMs: sorted.at(-1)!,
      };
    });
    facts.push({
      population: count,
      trackedWorkers: count,
      inRoomWorkers: (
        await diagnostic<{ sceneId: string; position: unknown }[]>(
          page,
          "actors",
        )
      ).filter((actor) => actor.sceneId === "engineering_lab" && actor.position)
        .length,
      environment: {
        browser: browser.version(),
        mode:
          testInfo.project.use.channel === "chromium"
            ? "Chromium new headless"
            : "Chromium headless shell",
        graphics,
        platform: process.platform,
        arch: process.arch,
        node: process.version,
        physicalDevice: false,
        safari: false,
      },
      performance,
      browserFrames,
      derivedFps: 1000 / browserFrames.meanFrameMs,
    });
  }
  writeFileSync(
    "docs/navigation/evidence/headless-performance.json",
    JSON.stringify(facts, null, 2) + "\n",
  );
  await page
    .getByRole("button", { name: "Collision diagnostics", exact: true })
    .click();
  for (let i = 0; i < 2; i++)
    await page.getByRole("button", { name: "Zoom out", exact: true }).click();
  await page
    .getByRole("button", { name: "Navigation controls", exact: true })
    .click();
  await page.screenshot({
    path: "docs/navigation/evidence/lab-sixteen-congestion-overview.png",
  });
});
