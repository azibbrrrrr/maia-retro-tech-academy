import { test, expect, type Page } from "@playwright/test";

// At this desktop viewport the complete campus fits, with a tiny vertical crop.
// Map visible world coordinates into the canvas without accessing scene internals.
async function worldPoint(page: Page, x: number, y: number) {
  const box = (await page.locator("canvas").boundingBox())!;
  const scale = Math.max(box.width / 1672, box.height / 941);
  return {
    x: box.x + (box.width - 1672 * scale) / 2 + x * scale,
    y: box.y + (box.height - 941 * scale) / 2 + y * scale,
  };
}

test.use({ viewport: { width: 1280, height: 720 } });

test("teacher's visible head opens dialogue only while the explorer is nearby", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Interact", exact: true }),
  ).toBeEnabled();
  const head = await worldPoint(page, 1380, 193);
  await page.mouse.click(head.x, head.y);
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.getByRole("button", { name: "Cikgu ♥", exact: true }).click();
  await page.mouse.click(head.x, head.y);
  await expect(page.getByRole("dialog")).toContainText("Ustazah Juliana");
});

test("reduced motion freezes both idle characters and still allows walking", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Interact", exact: true }),
  ).toBeEnabled();
  const clips = await Promise.all(
    [
      { x: 836, y: 660 },
      { x: 1380, y: 265 },
    ].map(async ({ x, y }) => {
      const feet = await worldPoint(page, x, y);
      return { x: feet.x - 34, y: feet.y - 72, width: 68, height: 77 };
    }),
  );
  const capture = (clip: (typeof clips)[number]) => page.screenshot({ clip });
  for (const clip of clips) {
    const animated = await capture(clip);
    await expect
      .poll(async () => !(await capture(clip)).equals(animated))
      .toBe(true);
  }
  // Changing the preference after scene creation must also take effect.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForTimeout(250);
  for (const clip of clips) {
    const still = await capture(clip);
    for (const delay of [270, 430]) {
      await page.waitForTimeout(delay);
      expect((await capture(clip)).equals(still)).toBe(true);
    }
  }
  const marker = page.locator("[data-explorer]");
  const before = Number(await marker.getAttribute("cx"));
  const left = page.getByRole("button", { name: "Move left", exact: true });
  await left.hover();
  await page.mouse.down();
  await expect
    .poll(async () => Number(await marker.getAttribute("cx")))
    .toBeLessThan(before - 20);
  await page.mouse.up();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const npc = await capture(clips[1]);
  await expect
    .poll(async () => !(await capture(clips[1])).equals(npc))
    .toBe(true);
});
