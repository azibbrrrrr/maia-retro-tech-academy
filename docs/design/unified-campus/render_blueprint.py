#!/usr/bin/env python3
"""Render the U0 floorplan SVG from campus-contract.json."""

import html
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
contract = json.loads((ROOT / "campus-contract.json").read_text())
parts: list[str] = []


def add(markup: str) -> None:
    parts.append(markup)


def text(x: float, y: float, value: str, size: int = 18, cls: str = "label", anchor: str = "middle") -> str:
    return (
        f'<text class="{cls}" x="{x:g}" y="{y:g}" font-size="{size}" '
        f'text-anchor="{anchor}">{html.escape(value)}</text>'
    )


def rect_markup(rect: list[float], **attrs: str) -> str:
    x1, y1, x2, y2 = rect
    extra = " ".join(f'{key.replace("_", "-")}="{value}"' for key, value in attrs.items())
    return f'<rect x="{x1}" y="{y1}" width="{x2-x1}" height="{y2-y1}" {extra}/>'


add('''<svg xmlns="http://www.w3.org/2000/svg" width="3840" height="2160" viewBox="0 0 3840 2160" role="img" aria-labelledby="title desc">
<title id="title">Unified MAIA Campus — U0 fixed floorplan reference</title>
<desc id="desc">Continuous 3840 by 2160 world plan. Seven visible interiors, central courtyard, open gate, physical room openings, and sixteen individually numbered engineering desks.</desc>
<defs>
  <pattern id="minor-grid" width="48" height="48" patternUnits="userSpaceOnUse">
    <path d="M 48 0 H 0 V 48" fill="none" stroke="#59705c" stroke-width="1" opacity=".14"/>
  </pattern>
  <pattern id="major-grid" width="240" height="240" patternUnits="userSpaceOnUse">
    <path d="M 240 0 H 0 V 240" fill="none" stroke="#49634f" stroke-width="2" opacity=".16"/>
  </pattern>
  <pattern id="plaster" width="48" height="48" patternUnits="userSpaceOnUse">
    <path d="M0 47.5 H48 M47.5 0 V48" fill="none" stroke="#6f745b" stroke-width="1" opacity=".12"/>
  </pattern>
  <pattern id="wood" width="96" height="36" patternUnits="userSpaceOnUse">
    <path d="M0 35.5 H96 M48 0 V35 M0 17.5 H48 M72 18 V36" fill="none" stroke="#805c39" stroke-width="2" opacity=".18"/>
  </pattern>
  <pattern id="pavers" width="96" height="48" patternUnits="userSpaceOnUse">
    <path d="M0 0 H96 M0 24 H96 M48 0 V24 M24 24 V48 M72 24 V48" fill="none" stroke="#7b785d" stroke-width="2" opacity=".2"/>
  </pattern>
  <filter id="room-shadow" x="-10%" y="-10%" width="120%" height="120%">
    <feDropShadow dx="0" dy="7" stdDeviation="8" flood-color="#29392d" flood-opacity=".22"/>
  </filter>
  <style>
    text { font-family: Inter, Avenir, Arial, sans-serif; fill: #243a2f; }
    .title { font-weight: 800; letter-spacing: 2px; }
    .subtitle { font-weight: 600; letter-spacing: 1px; fill: #53634d; }
    .room-title { font-weight: 800; letter-spacing: 1.6px; fill: #243c30; }
    .room-id { font-family: ui-monospace, Menlo, monospace; font-size: 13px; letter-spacing: .5px; fill: #53634d; }
    .path-label { font-weight: 700; letter-spacing: 1px; fill: #5f634d; }
    .door-label { font-family: ui-monospace, Menlo, monospace; font-weight: 700; fill: #845c26; }
    .desk-id { font-family: ui-monospace, Menlo, monospace; font-weight: 800; fill: #f5e9c9; }
    .small { font-family: ui-monospace, Menlo, monospace; fill: #4a5846; }
    .fixture-label { font-family: ui-monospace, Menlo, monospace; font-weight: 700; fill: #f5edda; }
  </style>
</defs>
<rect width="3840" height="2160" fill="#e8dfca"/>
<rect width="3840" height="2160" fill="url(#minor-grid)"/>
<rect width="3840" height="2160" fill="url(#major-grid)"/>
''')

# The room and court floors follow the exact world rectangles in the contract.
texture_by_zone = {
    "library": "wood",
    "noc": "plaster",
    "engineering_lab": "plaster",
    "high_council": "wood",
    "qa_lab": "plaster",
    "kantin": "plaster",
    "cikgu_room": "wood",
    "courtyard": "plaster",
    "gate_approach": "pavers",
}
for room in contract["rooms"]:
    x1, y1, x2, y2 = room["rect"]
    add(rect_markup(room["rect"], fill=room["fill"], filter="url(#room-shadow)", rx="14"))
    add(rect_markup(room["rect"], fill=f'url(#{texture_by_zone[room["id"]]})', rx="14"))

# Continuous circulation strips touch at their bounds and remain below all room furnishings.
for path in contract["walkablePaths"]:
    path_id = path["id"]
    if path_id == "courtyard":
        continue
    x1, y1, x2, y2 = path["rect"]
    add(f'<rect x="{x1}" y="{y1}" width="{x2-x1}" height="{y2-y1}" fill="#d8d0b9" stroke="#b7ad91" stroke-width="4"/>')
    add(f'<rect x="{x1}" y="{y1}" width="{x2-x1}" height="{y2-y1}" fill="url(#pavers)"/>')

# The courtyard floor was laid with the rooms above. The two dashed circles are empty cutout candidates.
for r in contract["treeCutoutCandidates"]:
    cx, cy = r["center"]
    add(f'<circle cx="{cx}" cy="{cy}" r="{r["radius"]}" fill="#c5d0a6" stroke="#657d58" stroke-width="6" stroke-dasharray="16 12"/>')
    add(f'<circle cx="{cx}" cy="{cy}" r="10" fill="none" stroke="#657d58" stroke-width="3"/>')
    add(text(cx, cy + r["radius"] + 28, "TREE CUTOUT", 14, "small"))

# Hall and courtyard centerlines show the connected route without hiding floor openings.
for d in [
    'M 120 1240 H 3720',
    'M 1920 1400 V 2160',
    'M 920 240 V 1080',
    'M 2920 240 V 1080',
]:
    add(f'<path d="{d}" fill="none" stroke="#8b845f" stroke-width="5" stroke-dasharray="20 22" opacity=".6"/>')

# Room titles and exact semantic IDs.
label_positions = {
    "library": (480, 230), "noc": (3360, 230), "engineering_lab": (1920, 112),
    "high_council": (480, 710), "qa_lab": (3360, 710), "kantin": (480, 1560),
    "cikgu_room": (3360, 1560), "courtyard": (1920, 1460), "gate_approach": (1920, 1978),
}
for room in contract["rooms"]:
    cx, cy = label_positions[room["id"]]
    size = 30 if room["id"] == "engineering_lab" else 26 if room["zoneType"] == "interior" else 22
    add(text(cx, cy, room["label"], size, "room-title"))
    add(text(cx, cy + 27, room["id"], 14, "room-id"))

# Fixed furniture plan.
fixture_colors = {
    "bookcase": "#795d3c", "table": "#895f38", "server-rack": "#466b68",
    "console": "#385553", "meeting-table": "#805938", "test-bench": "#64648b",
    "whiteboard": "#ede8d8", "service-counter": "#9d613d", "dining-table": "#96653a",
    "teacher-desk": "#79583c", "chair": "#476d68", "bench-pair": "#84633c",
}
for fixture in contract["fixtures"]:
    x1, y1, x2, y2 = fixture["rect"]
    kind = fixture["kind"]
    fill = fixture_colors[kind]
    radius = 16 if "table" in kind or "desk" in kind or kind == "service-counter" else 8
    add(f'<rect x="{x1}" y="{y1}" width="{x2-x1}" height="{y2-y1}" rx="{radius}" fill="{fill}" stroke="#314c3c" stroke-width="8"/>')
    if kind in ("meeting-table", "dining-table", "teacher-desk", "service-counter", "test-bench"):
        label = fixture["id"].replace("kantin-table-", "TABLE ").replace("cikgu-teacher-desk", "TEACHER DESK").replace("kantin-counter", "SERVICE COUNTER").replace("council-table", "COUNCIL TABLE").replace("qa-bench", "TEST BENCH")
        add(text((x1+x2)/2, (y1+y2)/2+7, label.upper(), 14, "fixture-label"))
    elif kind == "whiteboard":
        add(f'<line x1="{x1+20}" y1="{(y1+y2)/2}" x2="{x2-20}" y2="{(y1+y2)/2}" stroke="#536b5d" stroke-width="5"/>')

# The desk cards are individually registered from the JSON, numbered 01–16, with chairs and approach zones.
for ws in contract["workstations"]:
    x1, y1, x2, y2 = ws["deskRect"]
    cx1, cy1, cx2, cy2 = ws["chairRect"]
    ax1, ay1, ax2, ay2 = ws["approachRect"]
    number = ws["id"].rsplit("-", 1)[1]
    add(f'<rect x="{ax1}" y="{ay1}" width="{ax2-ax1}" height="{ay2-ay1}" rx="16" fill="#e7dfc9" fill-opacity=".35" stroke="#b47737" stroke-width="4" stroke-dasharray="12 9"/>')
    add(f'<rect x="{cx1}" y="{cy1}" width="{cx2-cx1}" height="{cy2-cy1}" rx="12" fill="#527d75" stroke="#304e44" stroke-width="5"/>')
    add(f'<rect x="{x1}" y="{y1}" width="{x2-x1}" height="{y2-y1}" rx="12" fill="#536d60" stroke="#2f4b3b" stroke-width="7"/>')
    add(f'<rect x="{x1+16}" y="{y1+10}" width="{x2-x1-32}" height="{y2-y1-20}" rx="5" fill="#d3c4a1" stroke="#314c3c" stroke-width="4"/>')
    add(f'<rect x="{x1+54}" y="{y1+15}" width="60" height="34" rx="4" fill="#46716d" stroke="#2b4945" stroke-width="3"/>')
    add(text((x1+x2)/2, y1+62, number, 18, "desk-id"))
    ux, uy = ws["usePoint"]
    add(f'<circle cx="{ux}" cy="{uy}" r="16" fill="#f2ca72" stroke="#875e2c" stroke-width="4"/>')
    add(f'<circle cx="{ux}" cy="{uy}" r="5" fill="#875e2c"/>')

# Use anchors are explicit interaction approaches; workstation anchors are already numbered above.
for anchor in contract["useAnchors"]:
    if anchor["id"].startswith("lab-desk-") or anchor["id"] == "outer-gate-spawn":
        continue
    ux, uy = anchor["point"]
    add(f'<circle cx="{ux}" cy="{uy}" r="14" fill="#f2ca72" stroke="#875e2c" stroke-width="4"/>')
    add(f'<circle cx="{ux}" cy="{uy}" r="4" fill="#875e2c"/>')
    labels = {
        "kantin-counter-service": "SERVICE APPROACH",
        "kantin-table-1-use": "TABLE 1 APPROACH",
        "kantin-table-2-use": "TABLE 2 APPROACH",
        "cikgu-visitor-approach": "VISITOR APPROACH",
    }
    if anchor["id"] in labels:
        add(text(ux, uy + 28, labels[anchor["id"]], 12, "small"))

# Draw wall runs last. No wall stroke is present in a listed door segment.
for wall in contract["wallSegments"]:
    x1, y1 = wall["from"]
    x2, y2 = wall["to"]
    add(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="#314e3c" stroke-width="{wall["thickness"]}" stroke-linecap="square"/>')

# Physical gaps get dashed threshold guides and IDs, not a door leaf or an invisible barrier.
for door in contract["doors"]:
    x1, y1, x2, y2 = door["segment"]
    add(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="#c18a3c" stroke-width="12" stroke-dasharray="20 14"/>')
    if door["id"] == "outer-gate":
        continue
    if x1 == x2:
        tx, ty, anchor = x1 + (38 if x1 < 1920 else -38), (y1+y2)/2, "start" if x1 < 1920 else "end"
    else:
        tx, ty, anchor = (x1+x2)/2, y1 - 28, "middle"
    add(text(tx, ty, f'{door["id"]} · {door["width"]}w', 15, "door-label", anchor))

# Gate pillars, spawn marker, path names and a compact drawing title.
for x in (1720, 2120):
    add(f'<rect x="{x-18}" y="2010" width="36" height="60" rx="5" fill="#8b6240" stroke="#314e3c" stroke-width="6"/>')
add('<circle cx="1920" cy="2100" r="20" fill="#f3ce77" stroke="#865e2c" stroke-width="6"/>')
add(text(2350, 2145, "WALKABLE ROAD STRIP · SPAWN 1920,2100", 17, "path-label"))
add(text(920, 1225, "CROSS CORRIDOR · 320w", 17, "path-label"))
add('<text class="path-label" x="1944" y="1820" font-size="17" transform="rotate(-90 1944 1820)">CENTRAL SPINE · 400w</text>')
add(text(920, 195, "LEFT CORRIDOR · 240w", 13, "path-label"))
add(text(2920, 195, "RIGHT CORRIDOR · 240w", 13, "path-label"))

# Coordinate ticks sit below the header panels so the title remains clean.
for x in range(0, 3841, 240):
    add(f'<path d="M{x} 0 v22" stroke="#405b48" stroke-width="4" opacity=".65"/>')
    if x not in (0, 3840):
        add(text(x, 18, str(x), 11, "small"))

# Title and scale note sit in the clear header margin above the floorplan.
add('<rect x="48" y="6" width="1340" height="64" rx="14" fill="#f1e8d5" fill-opacity=".98" stroke="#48634e" stroke-width="4"/>')
add('<text class="title" x="76" y="32" font-size="22" text-anchor="start">MAIA · UNIFIED CAMPUS / U0 FIXED-FLOORPLAN GUIDE</text>')
add('<text class="subtitle" x="76" y="55" font-size="14" text-anchor="start">3840×2160 WORLD = NATIVE PNG · 1:1 · 48u GRID · DIAGRAM REFERENCE</text>')
add('<rect x="2780" y="6" width="1012" height="64" rx="14" fill="#f1e8d5" fill-opacity=".98" stroke="#48634e" stroke-width="4"/>')
add('<text class="small" x="2830" y="30" font-size="15" text-anchor="start">OPENINGS ARE CLEAR FLOOR · ROOMS SHARE ONE WORLD</text>')
add('<text class="small" x="2830" y="54" font-size="14" text-anchor="start">No scene hops · no transfer pads · no hidden doorway walls</text>')
add('</svg>')

svg_path = ROOT / "campus-blueprint.svg"
svg_path.write_text("\n".join(parts) + "\n")
print(f"Rendered vector source from contract: {svg_path} ({contract['coordinateContract']['nativeImagePixels'][0]}×{contract['coordinateContract']['nativeImagePixels'][1]})")
