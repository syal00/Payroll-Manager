import fs from "node:fs";
import path from "node:path";

/** UTF-8 punctuation saved as Windows-1252 mojibake — restore proper Unicode. */
const REPLACEMENTS = [
  ["\u00e2\u2020\u0090", "\u2190"], // ←
  ["\u00e2\u2020\u2019", "\u2192"], // →
  ["\u00e2\u20ac\u00a6", "\u2026"], // … (ellipsis)
  ["\u00e2\u20ac\u201d", "\u2014"], // — (em dash)
  ["\u00e2\u20ac\u201c", "\u2013"], // – (en dash)
  ["\u00c2\u00b7", "\u00b7"], // · (middle dot)
];

const ROOT = path.resolve(import.meta.dirname, "..");
const EXT = new Set([".tsx", ".ts", ".jsx", ".js", ".css", ".html", ".md"]);

function walk(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    if (name === "node_modules" || name === ".next" || name === ".git") continue;
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full, files);
    else if (EXT.has(path.extname(name))) files.push(full);
  }
  return files;
}

let filesChanged = 0;
let totalReplacements = 0;

for (const file of walk(ROOT)) {
  if (file.endsWith("fix-mojibake.mjs") || file.endsWith("inspect-chars.mjs")) continue;
  let text = fs.readFileSync(file, "utf8");
  let changed = false;
  for (const [from, to] of REPLACEMENTS) {
    if (text.includes(from)) {
      const count = text.split(from).length - 1;
      text = text.split(from).join(to);
      totalReplacements += count;
      changed = true;
    }
  }
  if (changed) {
    fs.writeFileSync(file, text, "utf8");
    filesChanged++;
    console.log(path.relative(ROOT, file));
  }
}

console.log(`\nFixed ${totalReplacements} replacements in ${filesChanged} files.`);
