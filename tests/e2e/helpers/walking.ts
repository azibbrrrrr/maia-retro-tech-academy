import { expect, type Page, type CDPSession } from "@playwright/test";
import {
  sceneCatalog,
  type SceneId,
  type Point,
  type Rect,
} from "../../../packages/world/scenes";
import { segmentClear, findRoute } from "../../../packages/world/navigation";

export async function position(page: Page): Promise<Point> {
  return page.locator("[data-explorer]").evaluate((marker) => ({
    x: Number(marker.getAttribute("cx")),
    y: Number(marker.getAttribute("cy")),
  }));
}
async function settle(page: Page) {
  await page.evaluate(async () => {
    for (let i = 0; i < 6; i++)
      await new Promise<void>((r) => requestAnimationFrame(() => r()));
    await new Promise((r) => setTimeout(r, 50));
  });
}
export async function ready(page: Page) {
  await expect(page.locator("canvas")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Interact", exact: true }),
  ).toBeEnabled();
}
export async function scene(page: Page, id: SceneId) {
  await expect(page.locator("[data-explorer]")).toHaveAttribute(
    "data-scene",
    id,
  );
  await page.waitForTimeout(320);
}
export async function directory(page: Page, title: string) {
  await page
    .getByRole("button", { name: "Room directory", exact: true })
    .click();
  await page.getByRole("button", { name: title, exact: true }).click();
  await page.waitForTimeout(400);
}

// A cardinal version of the authoritative static plan. Extra 3px margin absorbs
// reported-position rounding; every input segment still meets the authored model.
function cardinalRoute(
  id: SceneId,
  start: Point,
  goal: Point,
  occupied: Rect[],
): Point[] {
  const base = sceneCatalog[id];
  if (!findRoute(base, start, goal, { occupied }))
    throw Error(`No static route ${id} ${JSON.stringify({ start, goal })}`);
  const room = {
    ...base,
    solids: base.solids.map((r) => ({
      ...r,
      x: r.x - 3,
      y: r.y - 3,
      width: r.width + 6,
      height: r.height + 6,
    })),
  };
  const connect = (a: Point, b: Point): Point[] | null => {
    for (const middle of [
      { x: a.x, y: b.y },
      { x: b.x, y: a.y },
    ])
      if (
        segmentClear(room, a, middle, occupied) &&
        segmentClear(room, middle, b, occupied)
      )
        return [a, middle, b];
    return null;
  };
  const direct = connect(start, goal);
  if (direct) return direct;
  const step = 12,
    cols = Math.ceil(room.bounds.width / step),
    rows = Math.ceil(room.bounds.height / step);
  const point = (n: number) => ({
    x: (n % cols) * step,
    y: Math.floor(n / cols) * step,
  });
  const nearest = (p: Point) => {
    const c = Math.round(p.x / step),
      r = Math.round(p.y / step);
    for (let radius = 0; radius <= 4; radius++)
      for (let y = r - radius; y <= r + radius; y++)
        for (let x = c - radius; x <= c + radius; x++)
          if (
            x >= 0 &&
            y >= 0 &&
            x < cols &&
            y < rows &&
            connect(p, { x: x * step, y: y * step })
          )
            return y * cols + x;
    throw Error(`No clear route connector ${id} ${JSON.stringify(p)}`);
  };
  const source = nearest(start),
    target = nearest(goal),
    previous = new Int32Array(cols * rows).fill(-2),
    queue = [source];
  previous[source] = -1;
  for (let head = 0; head < queue.length; head++) {
    const current = queue[head];
    if (current === target) break;
    const c = current % cols,
      r = Math.floor(current / cols);
    for (const [x, y] of [
      [c + 1, r],
      [c, r + 1],
      [c - 1, r],
      [c, r - 1],
    ]) {
      if (x < 0 || y < 0 || x >= cols || y >= rows) continue;
      const next = y * cols + x;
      if (
        previous[next] !== -2 ||
        !segmentClear(room, point(current), point(next), occupied)
      )
        continue;
      previous[next] = current;
      queue.push(next);
    }
  }
  if (previous[target] === -2)
    throw Error(
      `Cardinal route blocked ${id} ${JSON.stringify({ start, goal })}`,
    );
  const path: Point[] = [];
  for (let n = target; n !== -1; n = previous[n]) path.push(point(n));
  path.reverse();
  const full = [
    ...connect(start, path[0])!,
    ...path,
    ...connect(path.at(-1)!, goal)!,
  ];
  return full.filter(
    (p, i) =>
      i === 0 ||
      i === full.length - 1 ||
      !(
        (full[i - 1].x === p.x && p.x === full[i + 1].x) ||
        (full[i - 1].y === p.y && p.y === full[i + 1].y)
      ),
  );
}

export async function pulse(page: Page, key: string, ms: number) {
  await page.locator("canvas").focus();
  await page.evaluate(
    async ({ key, ms }) => {
      const c = document.querySelector("canvas")!;
      c.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
      await new Promise((r) => setTimeout(r, ms));
      c.dispatchEvent(new KeyboardEvent("keyup", { key, bubbles: true }));
      for (let i = 0; i < 6; i++)
        await new Promise<void>((r) => requestAnimationFrame(() => r()));
      await new Promise((r) => setTimeout(r, 50));
    },
    { key, ms },
  );
}
export async function touchPulse(
  page: Page,
  cdp: CDPSession,
  direction: string,
  ms: number,
) {
  const box = (await page
    .getByRole("button", { name: `Move ${direction}`, exact: true })
    .boundingBox())!;
  const started = cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: box.x + box.width / 2, y: box.y + box.height / 2 }],
  });
  // Use the common host clock: acknowledgement latency must not lengthen a
  // one-frame correction. Always release even if the page or command fails.
  try {
    await new Promise((resolve) => setTimeout(resolve, ms));
  } finally {
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
  }
  await started;
  await settle(page);
}
export async function walkTo(
  page: Page,
  id: SceneId,
  goal: Point,
  options: { touch?: CDPSession; occupied?: Rect[] } = {},
) {
  const route = cardinalRoute(
    id,
    await position(page),
    goal,
    options.occupied ?? [],
  );
  await page.locator("canvas").focus();
  if (!options.touch) {
    // Keep pulses and fresh rendered-position reads in one browser task. This
    // avoids automation transport jitter at narrow corners without touching
    // Phaser state: the only writes are ordinary key down/up events.
    await page.evaluate(
      async ({ route, id }) => {
        const canvas = document.querySelector("canvas")!;
        const read = () => {
          const marker = document.querySelector("[data-explorer]")!;
          return {
            x: Number(marker.getAttribute("cx")),
            y: Number(marker.getAttribute("cy")),
          };
        };
        const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
        const settled = async () => {
          for (let i = 0; i < 6; i++)
            await new Promise<void>((r) => requestAnimationFrame(() => r()));
          await delay(50);
        };
        for (const waypoint of route.slice(1)) {
          // Fresh rendered frames after release precede every axis change.
          // Recheck both axes after settling instead of trusting an earlier read.
          for (let pass = 0; pass < 3; pass++) {
            for (const axis of ["x", "y"] as const) {
              let stuck = 0;
              for (let attempt = 0; attempt < 50; attempt++) {
                const before = read(),
                  remaining = waypoint[axis] - before[axis];
                if (Math.abs(remaining) <= 3) break;
                const key =
                  axis === "x"
                    ? remaining > 0
                      ? "ArrowRight"
                      : "ArrowLeft"
                    : remaining > 0
                      ? "ArrowDown"
                      : "ArrowUp";
                canvas.dispatchEvent(
                  new KeyboardEvent("keydown", { key, bubbles: true }),
                );
                try {
                  if (Math.abs(remaining) < 30)
                    await new Promise<void>((r) =>
                      requestAnimationFrame(() => r()),
                    );
                  else
                    await delay(
                      Math.min(450, ((Math.abs(remaining) - 1) / 190) * 1000),
                    );
                } finally {
                  canvas.dispatchEvent(
                    new KeyboardEvent("keyup", { key, bubbles: true }),
                  );
                }
                await settled();
                const after = read();
                stuck =
                  Math.abs(after[axis] - before[axis]) < 1 ? stuck + 1 : 0;
                if (stuck >= 3 || attempt === 49)
                  throw Error(
                    `Real Arcade key route stuck in ${id}: ${JSON.stringify({ before, after, waypoint, axis })}`,
                  );
              }
            }
            await settled();
            const actual = read();
            if (
              Math.abs(actual.x - waypoint.x) <= 3 &&
              Math.abs(actual.y - waypoint.y) <= 3
            )
              break;
            if (pass === 2)
              throw Error(
                `Real Arcade route did not settle in ${id}: ${JSON.stringify({ actual, waypoint })}`,
              );
          }
        }
      },
      { route, id },
    );
    const actual = await position(page);
    expect(
      Math.hypot(actual.x - goal.x, actual.y - goal.y),
      JSON.stringify({ id, goal, actual, solids: sceneCatalog[id].solids }),
    ).toBeLessThanOrEqual(5);
    return;
  }
  for (const waypoint of route.slice(1)) {
    for (let pass = 0; pass < 3; pass++) {
      for (const axis of ["x", "y"] as const) {
        let stuck = 0;
        for (let attempt = 0; attempt < 50; attempt++) {
          const before = await position(page),
            remaining = waypoint[axis] - before[axis];
          if (Math.abs(remaining) <= 3) break;
          const direction =
            axis === "x"
              ? remaining > 0
                ? "right"
                : "left"
              : remaining > 0
                ? "down"
                : "up";
          const ms = Math.max(
            20,
            Math.min(350, ((Math.abs(remaining) - 1) / 190) * 1000),
          );
          await touchPulse(page, options.touch!, direction, ms);
          const after = await position(page);
          stuck = Math.abs(after[axis] - before[axis]) < 1 ? stuck + 1 : 0;
          if (stuck >= 3 || attempt === 49)
            throw Error(
              `Real Arcade touch route stuck in ${id}: ${JSON.stringify({ before, after, waypoint, goal, axis, solids: sceneCatalog[id].solids })}`,
            );
        }
      }
      await settle(page);
      const actual = await position(page);
      if (
        Math.abs(actual.x - waypoint.x) <= 3 &&
        Math.abs(actual.y - waypoint.y) <= 3
      )
        break;
      if (pass === 2)
        throw Error(
          `Real Arcade touch route did not settle in ${id}: ${JSON.stringify({ actual, waypoint, goal })}`,
        );
    }
  }
  const actual = await position(page);
  expect(Math.hypot(actual.x - goal.x, actual.y - goal.y)).toBeLessThanOrEqual(
    5,
  );
}
export async function tools(page: Page) {
  const toggle = page.getByRole("button", {
    name: "Navigation controls",
    exact: true,
  });
  if ((await toggle.getAttribute("aria-expanded")) === "false")
    await toggle.click();
}
export async function debug(page: Page) {
  await tools(page);
  const b = page.getByRole("button", {
    name: "Collision diagnostics",
    exact: true,
  });
  if ((await b.getAttribute("aria-pressed")) === "false") await b.click();
}
export async function diagnostic<T>(page: Page, name: string): Promise<T> {
  return JSON.parse(
    (await page.locator(`[data-${name}]`).getAttribute(`data-${name}`))!,
  );
}
