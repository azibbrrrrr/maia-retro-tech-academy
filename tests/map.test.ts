import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("all destinations have collision-free routes from spawn, with unique Tiled IDs", () => {
  const map = JSON.parse(readFileSync("public/maps/academy.json", "utf8"));
  const collision = map.layers.find(
    (l: { name: string }) => l.name === "collision",
  ).data as number[];
  const visited = new Set<number>(),
    pending = [18 * 32 + 16];
  while (pending.length) {
    const index = pending.pop()!;
    if (
      visited.has(index) ||
      collision[index] ||
      index < 0 ||
      index >= collision.length
    )
      continue;
    visited.add(index);
    for (const next of [index - 32, index + 32, index - 1, index + 1])
      pending.push(next);
  }
  // Hand-checked positions immediately in front of board, teacher and both doors.
  for (const index of [5 * 32 + 8, 6 * 32 + 25, 10 * 32 + 7, 10 * 32 + 22])
    assert.ok(visited.has(index), `unreachable ${index}`);
  const ids = map.layers.flatMap((l: { objects?: { id: number }[] }) =>
    (l.objects ?? []).map((o) => o.id),
  );
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(map.tilewidth, 48);
  assert.ok(collision[2 * 32 + 8], "council north wall must collide");
});
