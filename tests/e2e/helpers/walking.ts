import { expect, type Page, type CDPSession } from "@playwright/test";
import {
  campusDefinition,
  type CampusPoint,
  type CampusSolid,
  type CampusZoneId,
} from "../../../packages/world/unified-campus";
import { FOOT_BODY } from "../../../packages/world/scenes";
import { createDemoActors, reserveUnifiedDemoActors } from "../../../packages/world/unified-actors";

export type Point = CampusPoint;

export async function position(page: Page): Promise<Point> {
  return page.locator("[data-explorer]").evaluate((marker) => ({
    x: Number(marker.getAttribute("cx")),
    y: Number(marker.getAttribute("cy")),
  }));
}

async function settle(page: Page) {
  await page.evaluate(async () => {
    for (let i = 0; i < 6; i++)
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    await new Promise((resolve) => setTimeout(resolve, 50));
  });
}

export async function ready(page: Page) {
  await expect(page.locator("canvas")).toBeVisible();
  await expect(page.locator("[data-explorer]")).toBeVisible();
  await expect(page.locator("[data-explorer]")).toHaveAttribute("data-scene", "entrance");
}

export async function zone(page: Page, id: CampusZoneId) {
  await expect(page.locator("[data-explorer]")).toHaveAttribute("data-scene", id);
}

export async function directory(page: Page, title: string) {
  await page.getByRole("button", { name: "Room directory", exact: true }).click();
  await page.getByRole("button", { name: title, exact: true }).click();
}

// The route leaves room for the one-frame movement and marker-report delay.
// Connectors at an already occupied start or a doorway target use the actual
// Arcade foot size; the grid route keeps the larger clearance throughout.
const ROUTE_MARGIN = 8;
async function occupiedSolids(page: Page): Promise<CampusSolid[]> {
  const diagnosticActors = page.locator("[data-actors]");
  const reported = await diagnosticActors.count() ? await diagnosticActors.getAttribute("data-actors") : null;
  const actors = reported
    ? JSON.parse(reported) as { id: string; position: Point | null }[]
    : reserveUnifiedDemoActors(createDemoActors(20));
  return [
    ...campusDefinition.solids,
    ...campusDefinition.npcs.map((npc) => ({ id: `${npc.id}-feet`, x: npc.point.x - 8, y: npc.point.y - 5.5, width: 16, height: 9, kind: "fixture" as const })),
    ...actors.filter((actor) => actor.position).map((actor) => ({ id: `${actor.id}-feet`, x: actor.position!.x - 8, y: actor.position!.y - 6, width: 16, height: 10, kind: "fixture" as const })),
  ];
}

function nearbySolids(at: Point, solids: readonly CampusSolid[]) {
  const foot = FOOT_BODY.exact;
  const body = { left: at.x + foot.left, top: at.y + foot.top, right: at.x + foot.right, bottom: at.y + foot.bottom };
  return solids.map((solid) => ({
    id: solid.id,
    gapX: Math.max(solid.x - body.right, body.left - (solid.x + solid.width), 0),
    gapY: Math.max(solid.y - body.bottom, body.top - (solid.y + solid.height), 0),
  })).sort((a, b) => Math.hypot(a.gapX, a.gapY) - Math.hypot(b.gapX, b.gapY)).slice(0, 5);
}

function cardinalPath(from: Point, to: Point, margin: number, solids: readonly CampusSolid[]): Point[] | null {
  const foot = FOOT_BODY.exact;
  const clear = (a: Point, b: Point) => {
    if (a.x !== b.x && a.y !== b.y) return false;
    const left = Math.min(a.x, b.x) + foot.left - margin;
    const right = Math.max(a.x, b.x) + foot.right + margin;
    const top = Math.min(a.y, b.y) + foot.top - margin;
    const bottom = Math.max(a.y, b.y) + foot.bottom + margin;
    return left >= 0 && top >= 0 && right <= campusDefinition.bounds.width && bottom <= campusDefinition.bounds.height &&
      !solids.some((solid) => left < solid.x + solid.width && right > solid.x && top < solid.y + solid.height && bottom > solid.y);
  };
  for (const middle of [{ x: from.x, y: to.y }, { x: to.x, y: from.y }])
    if (clear(from, middle) && clear(middle, to)) return [from, middle, to];
  return null;
}

function route(start: Point, goal: Point, solids: readonly CampusSolid[]): Point[] {
  const step = 8;
  const offset = step / 2;
  const cols = Math.ceil(campusDefinition.bounds.width / step);
  const rows = Math.ceil(campusDefinition.bounds.height / step);
  const point = (index: number): Point => ({ x: (index % cols) * step + offset, y: Math.floor(index / cols) * step + offset });
  const nearest = (value: Point): { index: number; connector: Point[] } => {
    const cx = Math.round((value.x - offset) / step), cy = Math.round((value.y - offset) / step);
    for (let radius = 0; radius <= 12; radius++)
      for (let y = cy - radius; y <= cy + radius; y++)
        for (let x = cx - radius; x <= cx + radius; x++)
          if (x >= 0 && y >= 0 && x < cols && y < rows) {
            const index = y * cols + x;
            const target = point(index);
            if (!cardinalPath(target, target, ROUTE_MARGIN, solids)) continue;
            const connector = cardinalPath(value, target, ROUTE_MARGIN, solids) ?? cardinalPath(value, target, 0, solids);
            if (connector) return { index, connector };
          }
    throw Error(`No clear campus route connector ${JSON.stringify(value)}`);
  };
  const source = nearest(start), target = nearest(goal);
  const previous = new Int32Array(cols * rows).fill(-2);
  const queue = [source.index];
  previous[source.index] = -1;
  for (let head = 0; head < queue.length && previous[target.index] === -2; head++) {
    const current = queue[head], x = current % cols, y = Math.floor(current / cols);
    for (const [nx, ny] of [[x + 1, y], [x, y + 1], [x - 1, y], [x, y - 1]]) {
      if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
      const next = ny * cols + nx;
      if (previous[next] !== -2 || !cardinalPath(point(current), point(next), ROUTE_MARGIN, solids)) continue;
      previous[next] = current;
      queue.push(next);
    }
  }
  if (previous[target.index] === -2) throw Error(`Cardinal campus route blocked ${JSON.stringify({ start, goal })}`);
  const grid: Point[] = [];
  for (let index = target.index; index !== -1; index = previous[index]) grid.push(point(index));
  grid.reverse();
  const full = [...source.connector, ...grid, ...target.connector.slice().reverse()];
  const compact = full.filter((value, index) => index === 0 || index === full.length - 1 || !((full[index - 1].x === value.x && value.x === full[index + 1].x) || (full[index - 1].y === value.y && value.y === full[index + 1].y)));
  for (let index = 1; index < compact.length; index++)
    if (!cardinalPath(compact[index - 1], compact[index], 0, solids)) throw Error(`Cardinal route contains blocked segment ${JSON.stringify(compact[index])}`);
  return compact;
}

async function moveToWaypoint(page: Page, waypoint: Point, axis: "x" | "y", label: string, solids: readonly CampusSolid[], touch?: CDPSession, tolerance = 2) {
  await page.locator("canvas").focus();
  if (touch) {
    let stalled = 0;
    for (let attempt = 0; attempt < 32; attempt++) {
      const before = await position(page);
      const delta = waypoint[axis] - before[axis];
      if (Math.abs(delta) <= tolerance) return;
      const direction = axis === "x" ? (delta > 0 ? "right" : "left") : (delta > 0 ? "down" : "up");
      await touchPulse(page, touch, direction, Math.min(1800, Math.max(0, ((Math.abs(delta) - 8) / 190) * 1000)));
      const after = await position(page);
      stalled = Math.abs(after[axis] - before[axis]) < 1 ? stalled + 1 : 0;
      if (stalled >= 3)
        throw Error(`Real Arcade touch route stalled at ${JSON.stringify({ label, before, after, waypoint, attempt, nearestSolids: nearbySolids(after, solids) })}`);
    }
    const actual = await position(page);
    throw Error(`Real Arcade touch route exceeded corrections at ${JSON.stringify({ label, actual, waypoint, nearestSolids: nearbySolids(actual, solids) })}`);
  }
  await page.evaluate(async ({ waypoint, axis, label, solids, foot }) => {
    const canvas = document.querySelector("canvas")!;
    const read = () => {
      const marker = document.querySelector("[data-explorer]")!;
      return { x: Number(marker.getAttribute("cx")), y: Number(marker.getAttribute("cy")) };
    };
    const settleFrames = async () => {
      for (let i = 0; i < 6; i++)
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      await new Promise((resolve) => setTimeout(resolve, 50));
    };
    const nearbySolids = (at: Point) => {
      const body = { left: at.x + foot.left, top: at.y + foot.top, right: at.x + foot.right, bottom: at.y + foot.bottom };
      return solids.map((solid) => ({
        id: solid.id,
        gapX: Math.max(solid.x - body.right, body.left - (solid.x + solid.width), 0),
        gapY: Math.max(solid.y - body.bottom, body.top - (solid.y + solid.height), 0),
      })).sort((a, b) => Math.hypot(a.gapX, a.gapY) - Math.hypot(b.gapX, b.gapY)).slice(0, 5);
    };
    let stalled = 0;
    for (let attempt = 0; attempt < 32; attempt++) {
      const before = read();
      const delta = waypoint[axis] - before[axis];
      if (Math.abs(delta) <= 2) return;
      const keys = [axis === "x" ? (delta > 0 ? "ArrowRight" : "ArrowLeft") : (delta > 0 ? "ArrowDown" : "ArrowUp")];
      // Input is ordinary key down/up; fresh marker reads close the loop after
      // one or more rendered frames and the actual Arcade body have settled.
      const duration = Math.min(1800, Math.max(0, ((Math.abs(delta) - 8) / 190) * 1000));
      for (const key of keys) canvas.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
      try {
        const started = performance.now();
        do {
          await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        } while (performance.now() - started < duration);
      } finally {
        for (const key of keys) canvas.dispatchEvent(new KeyboardEvent("keyup", { key, bubbles: true }));
      }
      await settleFrames();
      const after = read();
      const progress = Math.abs(after[axis] - before[axis]);
      stalled = progress < 1 ? stalled + 1 : 0;
      if (stalled >= 3)
        throw Error(`Real Arcade route stalled at ${JSON.stringify({ label, before, after, waypoint, nearestSolids: nearbySolids(after), attempt })}`);
    }
    const actual = read();
    throw Error(`Real Arcade route exceeded corrections at ${JSON.stringify({ label, actual, waypoint, nearestSolids: nearbySolids(actual) })}`);
  }, { waypoint, axis, label, solids, foot: FOOT_BODY.exact });
}

export async function walkTo(page: Page, goal: Point, label = "campus target", options: { touch?: CDPSession } = {}) {
  const solids = await occupiedSolids(page);
  let points = route(await position(page), goal, solids);
  let index = 1;
  let replans = 0;
  while (index < points.length) {
    const actual = await position(page);
    const waypoint = points[index];
    const connector = cardinalPath(actual, waypoint, 0, solids);
    if (!connector) {
      if (++replans > 8)
        throw Error(`Real Arcade route could not validate its next leg from actual position ${JSON.stringify({ label, actual, waypoint })}`);
      points = route(actual, goal, solids);
      index = 1;
      continue;
    }
    for (let leg = 1; leg < connector.length; leg++) {
      const from = await position(page);
      const to = connector[leg];
      const axis = from.x !== to.x && connector[leg - 1].x !== to.x ? "x" : "y";
      if (!cardinalPath(from, { ...from, [axis]: to[axis] }, 0, solids))
        throw Error(`Real Arcade correction blocked ${JSON.stringify({ label, from, to, axis })}`);
      await moveToWaypoint(page, to, axis, label, solids, options.touch, options.touch && index < points.length - 1 ? 7 : 2);
    }
    index++;
  }
  const actual = await position(page);
  const error = Math.hypot(actual.x - goal.x, actual.y - goal.y);
  expect(error, JSON.stringify({ label, goal, actual })).toBeLessThanOrEqual(5);
}

export async function touchPulse(page: Page, cdp: CDPSession, direction: string, ms: number) {
  const button = page.getByRole("button", { name: `Move ${direction}`, exact: true });
  const box = (await button.boundingBox())!;
  // Queue the real touch start, then time the hold in rendered frames. Waiting
  // for the CDP acknowledgement first can add several physics frames to a
  // nominal one-frame correction and make short moves oscillate.
  const began = cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: box.x + box.width / 2, y: box.y + box.height / 2 }],
  });
  try {
    await page.evaluate(async (duration) => {
      const started = performance.now();
      do {
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      } while (performance.now() - started < duration);
    }, ms);
  } finally {
    const ended = cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await Promise.all([began, ended]);
  }
  await settle(page);
}

export async function pulse(page: Page, key: string, ms: number) {
  await page.locator("canvas").focus();
  await page.evaluate(async ({ key, ms }) => {
    const canvas = document.querySelector("canvas")!;
    canvas.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
    try {
      await new Promise((resolve) => setTimeout(resolve, ms));
    } finally {
      canvas.dispatchEvent(new KeyboardEvent("keyup", { key, bubbles: true }));
    }
    for (let i = 0; i < 6; i++)
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  }, { key, ms });
}

export async function tools(page: Page) {
  const toggle = page.getByRole("button", { name: "Navigation controls", exact: true });
  if ((await toggle.getAttribute("aria-expanded")) === "false") await toggle.click();
}

export async function debug(page: Page) {
  await tools(page);
  const button = page.getByRole("button", { name: "Collision diagnostics", exact: true });
  if ((await button.getAttribute("aria-pressed")) === "false") await button.click();
}

export async function diagnostic<T>(page: Page, name: string): Promise<T> {
  return JSON.parse((await page.locator(`[data-${name}]`).getAttribute(`data-${name}`))!);
}
