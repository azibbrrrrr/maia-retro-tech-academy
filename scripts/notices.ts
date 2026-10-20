import { readFile, writeFile } from "node:fs/promises";

const sources = [
  "LICENSE",
  "docs/licenses/phaser-template-MIT.txt",
  "node_modules/phaser/LICENSE.md",
  "node_modules/eventemitter3/LICENSE",
  "node_modules/react/LICENSE",
  "node_modules/react-dom/LICENSE",
  "node_modules/scheduler/LICENSE",
];
const sections = await Promise.all(
  sources.map(async (path) => `${path}\n\n${await readFile(path, "utf8")}`),
);
await writeFile(
  "dist/public/dependency-notices.txt",
  sections.join("\n\n---\n\n"),
);
