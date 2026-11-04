#!/usr/bin/env node
/**
 * Rewrite local source references to Lovable asset URLs as absolute URLs.
 * Run from the repository root with Node 18+:
 *   node scripts/download-lovable-assets.mjs
 */
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ASSET_ORIGIN = "https://id-preview--4e9a5fc2-80e7-4325-8114-9881762c3165.lovable.app";
const SCAN_DIRS = ["src", "public"];
const TEXT_EXTENSIONS = new Set([
  ".html", ".htm", ".js", ".mjs", ".cjs", ".ts", ".tsx", ".jsx",
  ".css", ".json", ".svg", ".xml", ".txt", ".md",
]);
const LOCAL_ASSET_URL = /(?<!https?:)\/__l5e\/assets-v1\//g;

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name === ".git" || entry.name === "node_modules") continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(fullPath));
    else if (entry.isFile() && TEXT_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) files.push(fullPath);
  }
  return files;
}

let replacements = 0;
for (const directory of SCAN_DIRS) {
  const files = await walk(path.join(ROOT, directory));
  for (const file of files) {
    const original = await readFile(file, "utf8");
    const updated = original.replace(LOCAL_ASSET_URL, `${ASSET_ORIGIN}/__l5e/assets-v1/`);
    if (updated !== original) {
      await writeFile(file, updated, "utf8");
      replacements += 1;
      console.log(`Updated ${path.relative(ROOT, file)}`);
    }
  }
}

console.log(`Updated ${replacements} files with absolute Lovable asset URLs.`);
