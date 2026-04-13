/**
 * Windows: `prisma generate` often fails with EPERM when Next.js dev holds
 * `query_engine-windows.dll.node`. Stop `npm run dev`, then run:
 *   npm run db:refresh-client
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const prismaClientDir = path.join(root, "node_modules", ".prisma", "client");

try {
  fs.rmSync(prismaClientDir, { recursive: true, force: true });
} catch (e) {
  const msg = e instanceof Error ? e.message : String(e);
  console.error("Could not remove node_modules/.prisma/client.");
  console.error("Stop the Next.js dev server (and any Node processes), then run this script again.");
  console.error(msg);
  process.exit(1);
}

const r = spawnSync("npx", ["prisma", "generate"], {
  stdio: "inherit",
  shell: true,
  cwd: root,
});
process.exit(r.status ?? 1);
