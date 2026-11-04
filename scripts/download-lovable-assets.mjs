#!/usr/bin/env node
/**
 * Download referenced Lovable assets into public/site/assets and localize links.
 * Run from the repository root with Node 18+:
 *   node scripts/download-lovable-assets.mjs
 */
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ASSET_ORIGIN = "https://id-preview--4e9a5fc2-80e7-4325-8114-9881762c3165.lovable.app";
const FALLBACK_ASSET_ORIGIN = "https://build-decoder-buddy.lovable.app";
const SCAN_DIRS = ["src", "public"];
const TEXT_EXTENSIONS = new Set([
  ".html", ".htm", ".js", ".mjs", ".cjs", ".ts", ".tsx", ".jsx",
  ".css", ".json", ".svg", ".xml", ".txt", ".md",
]);
const ASSET_REFERENCE = /(?:https?:\/\/[^/\s"'<>]+)?\/__l5e\/assets-v1\/[^\s"'<>),;}]+/g;
const LOCAL_ASSET_PREFIX = "/site/assets/";
const MAX_DOWNLOADS = 2;
const MAX_FETCH_ATTEMPTS = 4;
const DOWNLOAD_TIMEOUT_MS = 10 * 60 * 1_000;

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

const references = new Map();
const sourceFiles = new Map();

for (const directory of SCAN_DIRS) {
  for (const file of await walk(path.join(ROOT, directory))) {
    const original = await readFile(file, "utf8");
    sourceFiles.set(file, original);
    for (const match of original.matchAll(ASSET_REFERENCE)) {
      const reference = match[0];
      references.set(reference, [...(references.get(reference) ?? []), file]);
    }
  }
}

const assets = new Map();
for (const reference of references.keys()) {
  const url = new URL(reference, ASSET_ORIGIN);
  const filename = decodeURIComponent(path.posix.basename(url.pathname));
  if (!filename || filename === "." || filename === "..") {
    throw new Error(`Invalid Lovable asset filename in ${reference}`);
  }
  const existing = assets.get(filename);
  if (existing && existing.pathname !== url.pathname) {
    throw new Error(`Different Lovable assets share the filename "${filename}"`);
  }
  if (!existing || (url.origin !== ASSET_ORIGIN && existing.url.origin === ASSET_ORIGIN)) {
    assets.set(filename, { pathname: url.pathname, url, references: [] });
  }
  assets.get(filename).references.push(reference);
}

const assetsDirectory = path.join(ROOT, "public", "site", "assets");
await mkdir(assetsDirectory, { recursive: true });
const existingAssets = new Set(await readdir(assetsDirectory));

const queue = [...assets.entries()];
let downloaded = 0;
const failures = [];
const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function fetchAsset(url) {
  let lastError;
  for (let attempt = 1; attempt <= MAX_FETCH_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS) });
      if (response.status < 500 || attempt === MAX_FETCH_ATTEMPTS) return response;
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
      if (attempt === MAX_FETCH_ATTEMPTS) break;
    }
    await delay(attempt * 1_000);
  }
  throw new Error(`Could not fetch ${url} after ${MAX_FETCH_ATTEMPTS} attempts`, { cause: lastError });
}

async function downloadNext() {
  while (queue.length) {
    const [filename, asset] = queue.shift();
    const destination = path.join(assetsDirectory, filename);
    if (existingAssets.has(filename)) {
      const details = await stat(destination);
      if (!details.isFile() || details.size === 0) {
        throw new Error(`Existing asset is not a non-empty file: ${destination}`);
      }
      console.log(`Keeping existing ${filename}`);
      continue;
    }
    try {
      let response = await fetchAsset(asset.url);
      if (response.status === 404 && asset.url.origin !== FALLBACK_ASSET_ORIGIN) {
        const fallbackUrl = new URL(asset.pathname, FALLBACK_ASSET_ORIGIN);
        response = await fetchAsset(fallbackUrl);
      }
      if (!response.ok) {
        throw new Error(`Failed to download ${asset.url}: HTTP ${response.status}`);
      }
      const bytes = Buffer.from(await response.arrayBuffer());
      if (bytes.length === 0) throw new Error(`Downloaded an empty asset: ${asset.url}`);
      await writeFile(destination, bytes, { flag: "wx" });
      existingAssets.add(filename);
      downloaded += 1;
      console.log(`Downloaded ${filename} (${bytes.length} bytes)`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failures.push(`${filename}: ${message}`);
      console.error(`Failed ${filename}: ${message}`);
    }
  }
}

await Promise.all(Array.from({ length: Math.min(MAX_DOWNLOADS, queue.length) }, downloadNext));

if (failures.length) {
  throw new Error(`Could not download ${failures.length} asset(s):\n${failures.join("\n")}`);
}

let updatedFiles = 0;
for (const [file, original] of sourceFiles) {
  const updated = original.replace(ASSET_REFERENCE, (reference) => {
    const url = new URL(reference, ASSET_ORIGIN);
    const filename = decodeURIComponent(path.posix.basename(url.pathname));
    return `${LOCAL_ASSET_PREFIX}${filename}`;
  });
  if (updated !== original) {
    await writeFile(file, updated, "utf8");
    updatedFiles += 1;
    console.log(`Localized references in ${path.relative(ROOT, file)}`);
  }
}

console.log(`Downloaded ${downloaded} assets and localized references in ${updatedFiles} files.`);
