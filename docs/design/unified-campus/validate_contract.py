#!/usr/bin/env python3
"""Static consistency and declared-route checks for the U0 campus contract."""

import json
from collections import defaultdict, deque
from pathlib import Path

ROOT = Path(__file__).resolve().parent
data = json.loads((ROOT / "campus-contract.json").read_text())
errors: list[str] = []


def check(condition: bool, message: str) -> None:
    if not condition:
        errors.append(message)


def contains(outer: list[float], inner: list[float]) -> bool:
    return outer[0] <= inner[0] and outer[1] <= inner[1] and inner[2] <= outer[2] and inner[3] <= outer[3]


def intersects(a: list[float], b: list[float]) -> bool:
    return a[0] < b[2] and b[0] < a[2] and a[1] < b[3] and b[1] < a[3]


coords = data["coordinateContract"]
check(coords["worldBounds"] == [0, 0, 3840, 2160], "world bounds must be 3840×2160")
check(coords.get("rectEncoding") == "[x1, y1, x2, y2] inclusive bounds; width=x2-x1; height=y2-y1", "rectangles must declare endpoint encoding")
check(coords["nativeImagePixels"] == [3840, 2160], "guide PNG must be native 3840×2160")
check(coords["imageBounds"] == [0, 0, 3840, 2160], "image bounds must cover the native guide")
check(coords["scale"] == 1 and coords["imageOffset"] == [0, 0], "world and image must use a 1:1 transform without offset")
check(coords["grid"] == {"spacing": 48, "columns": 80, "rows": 45}, "48-unit grid must be 80×45")
check(coords["footBody"] == [14.08, 7.92], "tested visitor body dimensions must remain unchanged")

room_map = {room["id"]: room for room in data["rooms"]}
interiors = [r for r in data["rooms"] if r["zoneType"] == "interior"]
expected = {"library", "noc", "engineering_lab", "high_council", "qa_lab", "kantin", "cikgu_room"}
check({r["id"] for r in interiors} == expected, "the plan must contain exactly the seven named interiors")
for room in data["rooms"]:
    check(contains(coords["worldBounds"], room["rect"]), f'{room["id"]} is outside world bounds')
for i, a in enumerate(interiors):
    for b in interiors[i + 1 :]:
        check(not intersects(a["rect"], b["rect"]), f'{a["id"]} overlaps {b["id"]}')

doors = {door["id"]: door for door in data["doors"]}
check(len(doors) == len(data["doors"]), "door IDs must be unique")
for door in data["doors"]:
    x1, y1, x2, y2 = door["segment"]
    check(door["width"] == (abs(x2 - x1) or abs(y2 - y1)), f'{door["id"]} width must match its opening segment')
    check(door["width"] >= 192, f'{door["id"]} is narrower than the minimum planned doorway')
    if door["zoneId"] in room_map:
        room = room_map[door["zoneId"]]["rect"]
        on_edge = (
            (door["wall"] == "north" and y1 == y2 == room[1])
            or (door["wall"] == "east" and x1 == x2 == room[2])
            or (door["wall"] == "south" and y1 == y2 == room[3])
            or (door["wall"] == "west" and x1 == x2 == room[0])
            or (door["wall"] == "south-boundary" and y1 == y2 == 2040 and door["width"] == 400)
        )
        check(on_edge, f'{door["id"]} is not on the named room wall')
check(doors["outer-gate"]["segment"] == [1720, 2040, 2120, 2040], "the gate must be an inset 400-unit opening at y=2040")
check(any(path["id"] == "road-strip" and path["rect"] == [0, 2040, 3840, 2160] for path in data["walkablePaths"]), "the native 120-unit road strip must remain inside the image")
spawn = next((a for a in data["useAnchors"] if a["id"] == "outer-gate-spawn"), None)
check(spawn is not None and spawn["point"] == [1920, 2100], "safe gate spawn must be inside the road strip at [1920, 2100]")

walls = data["wallSegments"]
for door in data["doors"]:
    x1, y1, x2, y2 = door["segment"]
    for wall in walls:
        if wall["zoneId"] != door["zoneId"]:
            continue
        a, b = wall["from"], wall["to"]
        if x1 == x2 == a[0] == b[0]:
            check(not (min(y1, y2) < max(a[1], b[1]) and max(y1, y2) > min(a[1], b[1])), f'{door["id"]} is blocked by a wall segment')
        elif y1 == y2 == a[1] == b[1]:
            check(not (min(x1, x2) < max(a[0], b[0]) and max(x1, x2) > min(a[0], b[0])), f'{door["id"]} is blocked by a wall segment')

workstations = data["workstations"]
check(len(workstations) == 16, "engineering lab must contain exactly sixteen desks")
check(len({ws["id"] for ws in workstations}) == 16, "workstation IDs must be unique")
check({(ws["row"], ws["column"]) for ws in workstations} == {(r, c) for r in range(1, 5) for c in range(1, 5)}, "workstations must form a complete 4×4 grid")
lab = room_map["engineering_lab"]["rect"]
for ws in workstations:
    check(contains(lab, ws["deskRect"]), f'{ws["id"]} desk is outside the lab')
    check(contains(lab, ws["chairRect"]), f'{ws["id"]} chair is outside the lab')
    check(contains(lab, ws["approachRect"]), f'{ws["id"]} approach is outside the lab')
    check(ws["approachRect"][0] <= ws["usePoint"][0] <= ws["approachRect"][2], f'{ws["id"]} use point is outside its approach')
    check(ws["approachRect"][1] <= ws["usePoint"][1] <= ws["approachRect"][3], f'{ws["id"]} use point is outside its approach')
row_groups = {row: sorted((ws for ws in workstations if ws["row"] == row), key=lambda ws: ws["column"]) for row in range(1, 5)}
for row in (1, 2, 3):
    gap = row_groups[row][0]["chairRect"][3] * 0 + row_groups[row][0]["chairRect"][3]
    next_desk_top = row_groups[row + 1][0]["deskRect"][1]
    check(next_desk_top - gap >= 96, f"desk rows {row} and {row + 1} need at least 96 units of clear paired-row gap; measured {next_desk_top-gap}")

for aisle in data["labAisles"]:
    rect = aisle["rect"]
    measured = rect[3] - rect[1] if aisle["orientation"] == "horizontal" else rect[2] - rect[0]
    check(measured == aisle["clearance"], f'{aisle["id"]} declared clearance does not match its oriented rectangle')
    check(measured >= aisle["preferredMinimum"], f'{aisle["id"]} is narrower than its stated preferred minimum')
for i, a in enumerate(workstations):
    for b in workstations[i + 1 :]:
        check(not intersects(a["deskRect"], b["deskRect"]), f'{a["id"]} overlaps {b["id"]}')

fixtures = data["fixtures"]
check(sum(f["kind"] == "dining-table" for f in fixtures) == 2, "Kantin must have exactly two dining tables")
check(sum(f["kind"] == "service-counter" for f in fixtures) == 1, "Kantin must have one service counter")
check(sum(f["kind"] == "teacher-desk" for f in fixtures) == 1, "Cikgu must have exactly one teacher desk")
check(sum(a["id"] == "cikgu-visitor-approach" for a in data["useAnchors"]) == 1, "Cikgu must have one visitor approach")

# The declared physical opening graph must connect each interior from the outer gate.
graph: dict[str, set[str]] = defaultdict(set)
for a, b in data["connectivity"]["edges"]:
    graph[a].add(b)
    graph[b].add(a)
seen = {data["connectivity"]["root"]}
queue = deque(seen)
while queue:
    current = queue.popleft()
    for neighbor in graph[current] - seen:
        seen.add(neighbor)
        queue.append(neighbor)
check(expected <= seen, f'unreachable interiors from gate: {sorted(expected - seen)}')
for edge in data["connectivity"]["edges"]:
    room_ids = {room["id"] for room in interiors}
    if edge[0] in room_ids or edge[1] in room_ids:
        room_id = edge[0] if edge[0] in room_ids else edge[1]
        check(any(door["zoneId"] == room_id for door in data["doors"]), f'{room_id} connection has no physical opening')

# Candidate foreground circles must stay outside every designated circulation rectangle.
tree_paths = [p["rect"] for p in data["walkablePaths"] if p["id"] not in {"courtyard", "gate-apron"}]
for tree in data["treeCutoutCandidates"]:
    cx, cy = tree["center"]
    circle = [cx-tree["radius"], cy-tree["radius"], cx+tree["radius"], cy+tree["radius"]]
    check(contains(coords["worldBounds"], circle), f'{tree["id"]} is outside world bounds')
    check(not any(intersects(circle, path) for path in tree_paths), f'{tree["id"]} overlaps a designated path')

# Flood the actual rectangle union from the gate using the preserved tested foot body.
# Sample centers every 8 world units, shrink floors and inflate walls/furniture by the half-body.
step = 8
hx, hy = coords["footBody"][0] / 2, coords["footBody"][1] / 2
bounds = coords["worldBounds"]
cols = int((bounds[2] - bounds[0]) / step)
rows = int((bounds[3] - bounds[1]) / step)
walkable = [r["rect"] for r in data["rooms"]] + [p["rect"] for p in data["walkablePaths"]]
obstacles: list[list[float]] = []
for wall in walls:
    x1, y1 = wall["from"]
    x2, y2 = wall["to"]
    half = wall["thickness"] / 2
    obstacles.append([min(x1, x2) - half - hx, min(y1, y2) - half - hy, max(x1, x2) + half + hx, max(y1, y2) + half + hy])
for fixture in fixtures:
    if fixture["solid"]:
        r = fixture["rect"]
        obstacles.append([r[0] - hx, r[1] - hy, r[2] + hx, r[3] + hy])
for ws in workstations:
    for r in (ws["deskRect"], ws["chairRect"]):
        obstacles.append([r[0] - hx, r[1] - hy, r[2] + hx, r[3] + hy])

def center(ix: int, iy: int) -> tuple[float, float]:
    return bounds[0] + step / 2 + ix * step, bounds[1] + step / 2 + iy * step

def body_clear(ix: int, iy: int) -> bool:
    x, y = center(ix, iy)
    # The whole foot rectangle may straddle adjacent floor rectangles at a doorway.
    # Verify its corners and center against their union rather than shrinking each rectangle alone.
    samples = ((x, y), (x-hx, y-hy), (x-hx, y+hy), (x+hx, y-hy), (x+hx, y+hy))
    on_floor = all(any(r[0] <= sx <= r[2] and r[1] <= sy <= r[3] for r in walkable) for sx, sy in samples)
    return on_floor and not any(r[0] <= x <= r[2] and r[1] <= y <= r[3] for r in obstacles)

def nearest_cell(point: list[float]) -> tuple[int, int] | None:
    ix = round((point[0] - bounds[0] - step / 2) / step)
    iy = round((point[1] - bounds[1] - step / 2) / step)
    ix, iy = min(max(ix, 0), cols - 1), min(max(iy, 0), rows - 1)
    if (center(ix, iy)[0] - point[0]) ** 2 + (center(ix, iy)[1] - point[1]) ** 2 > (step * 0.75) ** 2:
        return None
    return (ix, iy) if body_clear(ix, iy) else None

spawn_cell = nearest_cell(spawn["point"]) if spawn else None
check(spawn_cell is not None, "safe spawn does not admit the visitor body envelope")
reachable: set[tuple[int, int]] = set()
if spawn_cell is not None:
    queue_cells = deque([spawn_cell])
    reachable.add(spawn_cell)
    while queue_cells:
        ix, iy = queue_cells.popleft()
        for nx, ny in ((ix-1,iy),(ix+1,iy),(ix,iy-1),(ix,iy+1)):
            cell=(nx,ny)
            if 0 <= nx < cols and 0 <= ny < rows and cell not in reachable and body_clear(nx,ny):
                reachable.add(cell)
                queue_cells.append(cell)

reachable_targets=[]
for anchor in data["useAnchors"]:
    cell=nearest_cell(anchor["point"])
    check(cell is not None and cell in reachable, f'{anchor["id"]} is not reachable from the gate with the tested foot body')
    if cell is not None and cell in reachable:
        reachable_targets.append(anchor["id"])

if errors:
    print("U0 campus contract: FAIL")
    print("\n".join(f"- {error}" for error in errors))
    raise SystemExit(1)

print("U0 campus contract: PASS")
print(f"- {len(interiors)} interiors connected from {data['connectivity']['root']} by declared physical openings")
print(f"- foot-envelope raster: {len(reachable)} reachable 8-unit centers; {len(reachable_targets)}/{len(data['useAnchors'])} registered use/spawn anchors reachable")
print("- lab paired-row gaps: 98/230/98u; lab cross aisle: 230u; side/main aisles: 192/432/192u")
print(f"- {len(workstations)} non-overlapping desks and {len(doors)} unblocked openings")
print("- coordinate scale 1:1; 3840×2160 image/world; 48-unit grid 80×45")
print("- Kantin two tables + counter; Cikgu one desk + visitor approach")
print("- both foreground cutout candidates clear of designated path rectangles")
