#!/usr/bin/env node
/**
 * Download Lovable-hosted assets into public/site/assets and rewrite their URLs
 * to stable same-origin /site/assets/<filename> paths.
 *
 * Run from the repository root with Node 18+:
 *   node scripts/download-lovable-assets.mjs
 */
import { readdir, readFile, mkdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ASSET_ORIGIN = "https://id-preview--4e9a5fc2-80e7-4325-8114-9881762c3165.lovable.app";
const ASSET_DIR = path.join(ROOT, "public/site/assets");
const SCAN_DIRS = ["src", "public"];
const TEXT_EXTENSIONS = new Set([
  ".html", ".htm", ".js", ".mjs", ".cjs", ".ts", ".tsx", ".jsx",
  ".css", ".json", ".svg", ".xml", ".txt", ".md",
]);
const ASSET_URL = /\/\_\_l5e\/assets-v1\/[^/\s"'<>?#)]+\/[^\s"'<>?#)]+/g;

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

const textFiles = (await Promise.all(SCAN_DIRS.map((dir) => walk(path.join(ROOT, dir))))).flat();
const sourceByName = new Map();
for (const file of textFiles) {
  const text = await readFile(file, "utf8");
  for (const urlPath of text.match(ASSET_URL) ?? []) {
    const filename = decodeURIComponent(urlPath.split("/").at(-1));
    if (!filename || filename !== path.basename(filename) || filename.includes("\\")) {
      throw new Error(`Unsafe asset filename in ${file}: ${urlPath}`);
    }
    const previous = sourceByName.get(filename);
    if (previous && previous !== urlPath) {
      throw new Error(`Asset filename collision for ${filename}: ${previous} and ${urlPath}`);
    }
    sourceByName.set(filename, urlPath);
  }
}

if (sourceByName.size === 0) {
  console.log("No /__l5e/assets-v1/ asset URLs found; nothing to do.");
  process.exit(0);
}

await mkdir(ASSET_DIR, { recursive: true });
for (const [filename, urlPath] of sourceByName) {
  const destination = path.join(ASSET_DIR, filename);
  const response = await fetch(new URL(urlPath, ASSET_ORIGIN));
  if (!response.ok) {
    throw new Error(`Download failed (${response.status}) for ${urlPath}`);
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length === 0) throw new Error(`Downloaded an empty asset: ${urlPath}`);
  const temporary = `${destination}.download`;
  await writeFile(temporary, bytes);
  await rename(temporary, destination);
  console.log(`Downloaded ${filename} (${bytes.length} bytes)`);
}

let replacements = 0;
for (const file of textFiles) {
  const original = await readFile(file, "utf8");
  const updated = original.replace(ASSET_URL, (urlPath) => {
    const filename = decodeURIComponent(urlPath.split("/").at(-1));
    return `/site/assets/${filename}`;
  });
  if (updated !== original) {
    await writeFile(file, updated, "utf8");
    replacements += 1;
    console.log(`Rewrote asset URLs in ${path.relative(ROOT, file)}`);
  }
}

console.log(`Downloaded ${sourceByName.size} assets and updated ${replacements} text files.`);
console.log("Review the changes, then commit and push them to main to trigger deployment.");
