import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
const forbidden = [
  "PRIVATE_FIXTURE_CANARY",
  "OPERATOR_PASSWORD",
  "/api/operator",
  "/Users/",
  "/home/",
  "BEGIN PRIVATE KEY",
];
async function scan(directory: string): Promise<number> {
  let count = 0;
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      count += await scan(path);
      continue;
    }
    if (path.endsWith(".map")) throw new Error(`Source map found: ${path}`);
    const content = await readFile(path, "utf8");
    if (forbidden.some((value) => content.includes(value)))
      throw new Error(`Private marker found: ${path}`);
    count++;
  }
  return count;
}
console.info(
  `Public distribution scanned: ${await scan("dist/public")} files; no private markers or source maps.`,
);
