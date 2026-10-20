# ADR 001 — official template fallback

Accepted 2026-10-20. GitHub authenticated identity: `azibbrrrrr`, type `User`.
The target repository was absent before creation; it is a new personal public
repository, not a fork.

## Evidence

- Agent Town HEAD: `6ead3c94d7d8031c34cfdb703101003f7543d15a`.
  [Pinned tree](https://github.com/geezerrrr/agent-town/tree/6ead3c94d7d8031c34cfdb703101003f7543d15a).
  GitHub license metadata is null. No LICENSE, COPYING, NOTICE or credit file
  was found in the tracked tree. package.json declares MIT; README links a
  missing LICENSE. CLAUDE.md line 20 describes purchased LimeZu Modern assets.
  This does not establish redistribution rights for the software or each asset.
- Bundled characters, tilesets, sprites and UI: not cleared; purchased artwork
  provenance alone is insufficient. Maps depend on that artwork.
- Bundled `audio/bgm.mp3`: no demonstrated license; excluded.
- Bundled `fonts/ark-pixel-12px.woff2`: no accompanying license; excluded.
- Bundled SVG logos and all remaining images: not individually cleared; excluded.
- **Disposition for every tracked upstream file: excluded.** No source, map,
  binary, font, music or icon from Agent Town is copied into this project.
- Official template HEAD: `7d292284722f6cccd6a8bfa5dccf668e383e0156`.
  [Pinned license](https://github.com/phaserjs/template-react/blob/7d292284722f6cccd6a8bfa5dccf668e383e0156/LICENSE)
  grants MIT rights, copyright 2025 Phaser Studio Inc. Exact license archived
  in `docs/licenses/phaser-template-MIT.txt`.

## Decision

Use the template's React lifecycle + Phaser + Vite structure, converted to
TypeScript and reduced to one independently written scene. Preserve its MIT
notice. Copy none of the template sample logos, images or telemetry script.
Current template uses Phaser 4; this project's explicit Phaser 3 requirement
takes precedence. Pin Phaser 3.90.0 and implement movement, map loading,
collision and interactions afresh. The dependency lockfile fixes versions.

This is a conservative reuse decision, not a legal conclusion about upstream.
Any future external asset must have its own verified license evidence.
