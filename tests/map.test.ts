import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

type Rect = {
  id: number;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
};
const map = JSON.parse(readFileSync("public/maps/academy.json", "utf8"));
const solids: Rect[] = map.layers.find(
  (l: { name: string }) => l.name === "collision",
).objects;
const clear = (x: number, y: number) =>
  !solids.some(
    (r) =>
      x + 8 > r.x &&
      x - 8 < r.x + r.width &&
      y + 4 > r.y &&
      y - 6 < r.y + r.height,
  );

test("Tiled geometry connects both classroom doors and interaction approaches with foot clearance", () => {
  const step = 4,
    columns = 418,
    rows = 236;
  const visited = new Set<number>(),
    pending = [165 * columns + 209];
  while (pending.length) {
    const index = pending.pop()!;
    if (visited.has(index)) continue;
    const col = index % columns,
      row = Math.floor(index / columns);
    if (!clear(col * step, row * step)) continue;
    visited.add(index);
    if (col > 0) pending.push(index - 1);
    if (col < columns - 1) pending.push(index + 1);
    if (row > 0) pending.push(index - columns);
    if (row < rows - 1) pending.push(index + columns);
  }
  for (const [x, y] of [
    [476, 384],
    [660, 248],
    [1200, 384],
    [1380, 312],
    [836, 660],
  ]) {
    assert.ok(
      visited.has(Math.round(y / step) * columns + Math.round(x / step)),
      `unreachable ${x},${y}`,
    );
  }
  const ids = map.layers.flatMap((l: { objects?: Rect[] }) =>
    (l.objects ?? []).map((o) => o.id),
  );
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(map.tilewidth, 48);
  assert.equal(clear(630, 190), false, "back wall is solid");
  assert.equal(clear(450, 260), false, "Council desks are solid");
  assert.equal(clear(1200, 260), false, "teacher desks are solid");
  assert.equal(clear(836, 550), false, "welcome noticeboard is solid");
  assert.equal(clear(400, 600), false, "tree planters are solid");
});
