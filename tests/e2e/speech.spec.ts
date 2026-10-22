import { test, expect } from "./helpers/test";
import { campusDefinition } from "../../packages/world/unified-campus";
import { teacher as teacherContent } from "../../packages/world/content";
import { debug, diagnostic, position, ready, tools, walkTo, zone } from "./helpers/walking";

test("teacher dialogue opens only at its physical approach, follows camera, and closes while play continues", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/");
  await ready(page);
  const teacher = campusDefinition.anchors.find((anchor) => anchor.id === "teacher")!;
  await debug(page);
  const initialCamera = await diagnostic<{ x: number; y: number; width: number; height: number; zoom: number }>(page, "camera");
  const canvas = (await page.locator("canvas").boundingBox())!;
  const npc = campusDefinition.npcs[0].point;
  const npcHitCenter = { x: npc.x, y: npc.y - 42 };
  const farX = (npcHitCenter.x - initialCamera.x - initialCamera.width / 2) * initialCamera.zoom + initialCamera.width / 2;
  const farY = (npcHitCenter.y - initialCamera.y - initialCamera.height / 2) * initialCamera.zoom + initialCamera.height / 2;
  await page.mouse.click(canvas.x + farX, canvas.y + farY);
  await expect(page.getByRole("region", { name: "Ustazah Juliana speech bubble" })).not.toBeVisible();
  await page.getByRole("button", { name: "Collision diagnostics", exact: true }).click();
  await walkTo(page, teacher.point, "teacher conversation approach");
  await zone(page, "cikgu_room");
  await tools(page);
  await page.getByRole("button", { name: "Follow player", exact: true }).click();
  await page.keyboard.press("e");
  const bubble = page.getByRole("region", { name: "Ustazah Juliana speech bubble" });
  await expect(bubble.getByRole("log")).toContainText("Awak dah makan belum?");
  await page.keyboard.press("e");
  await expect(bubble).toContainText("Jangan kerja sampai lupa rehat.");
  const beforeCamera = Number(await page.locator("[data-speech-tail]").getAttribute("data-anchor-x"));
  await page.getByRole("button", { name: "Zoom in", exact: true }).click();
  await expect.poll(async () => Number(await page.locator("[data-speech-tail]").getAttribute("data-anchor-x"))).not.toBe(beforeCamera);
  await page.getByRole("button", { name: "Navigation controls", exact: true }).click();
  for (const name of ["Next dialogue", "Close chat"]) {
    const box = (await bubble.getByRole("button", { name }).boundingBox())!;
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
  }
  const beforeWalk = await position(page);
  await page.locator("canvas").focus();
  await page.keyboard.down("ArrowLeft");
  await page.waitForTimeout(150);
  await page.keyboard.up("ArrowLeft");
  expect((await position(page)).x).toBeLessThan(beforeWalk.x);
  await expect(bubble).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(bubble).not.toBeVisible();
  await page.screenshot({ path: "docs/evidence/unified-campus-teacher-speech.png" });
});

test("320px touch layout keeps the map and conversation controls in view", async ({ browser }) => {
  test.setTimeout(180_000);
  const context = await browser.newContext({ viewport: { width: 320, height: 568 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  await page.goto("/");
  await ready(page);
  const teacher = campusDefinition.anchors.find((anchor) => anchor.id === "teacher")!;
  await walkTo(page, teacher.point, "narrow-screen teacher approach");
  await tools(page);
  await page.getByRole("button", { name: "Follow player", exact: true }).tap();
  await page.getByRole("button", { name: "Navigation controls", exact: true }).tap();
  await page.getByRole("button", { name: "Interact", exact: true }).tap();
  const bubble = page.getByRole("region", { name: "Ustazah Juliana speech bubble" });
  await expect(bubble).toBeVisible();
  expect(teacherContent.dialogue).toHaveLength(4);
  await expect(page.locator(".mini-map")).toBeVisible();
  const box = (await bubble.boundingBox())!;
  expect(box.x).toBeGreaterThanOrEqual(8);
  expect(box.y).toBeGreaterThanOrEqual(8);
  expect(box.x + box.width).toBeLessThanOrEqual(312);
  expect(box.y + box.height).toBeLessThanOrEqual(560);
  for (const name of ["Interact", "Move up", "Move left", "Move right", "Move down", "Close chat", "Next dialogue"]) {
    const button = page.getByRole("button", { name, exact: true });
    const buttonBox = (await button.boundingBox())!;
    expect(buttonBox.width).toBeGreaterThanOrEqual(44);
    expect(buttonBox.height).toBeGreaterThanOrEqual(44);
    expect(buttonBox.x).toBeGreaterThanOrEqual(0);
    expect(buttonBox.x + buttonBox.width).toBeLessThanOrEqual(320);
    expect(buttonBox.y).toBeGreaterThanOrEqual(0);
    expect(buttonBox.y + buttonBox.height).toBeLessThanOrEqual(568);
  }
  for (const line of teacherContent.dialogue.slice(1)) {
    await bubble.getByRole("button", { name: "Next dialogue" }).tap();
    await expect(bubble).toContainText(line);
    await expect(page.locator(".mini-map")).toBeVisible();
  }
  await bubble.getByRole("button", { name: "Close chat" }).tap();
  await expect(bubble).not.toBeVisible();
  await expect(page.locator(".mini-map")).toBeVisible();
  await page.screenshot({ path: "docs/evidence/unified-campus-teacher-speech-320.png" });
  await context.close();
});
