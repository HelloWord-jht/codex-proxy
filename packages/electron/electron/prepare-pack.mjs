/**
 * Copy root-level runtime resources into packages/electron/ before
 * electron-builder runs, so all paths resolve relative to projectDir.
 *
 * Usage:
 *   node electron/prepare-pack.mjs          # copy
 *   node electron/prepare-pack.mjs --clean  # remove copies
 */

import { cpSync, rmSync, existsSync, mkdirSync } from "fs";
import { resolve, relative } from "path";

const ROOT = resolve(import.meta.dirname, "..", "..", "..");
const PKG = resolve(import.meta.dirname, "..");

const DIRS = ["config", "public", "bin"];
const isClean = process.argv.includes("--clean");

for (const dir of DIRS) {
  const src = resolve(ROOT, dir);
  const dest = resolve(PKG, dir);

  if (isClean) {
    if (existsSync(dest)) {
      rmSync(dest, { recursive: true });
      console.log(`[prepare-pack] removed ${dir}/`);
    }
  } else {
    if (!existsSync(src)) {
      if (dir === "bin") {
        mkdirSync(dest, { recursive: true });
        console.log("[prepare-pack] created empty bin/ placeholder");
        continue;
      }
      console.warn(`[prepare-pack] skipping ${dir}/ (not found at ${src})`);
      continue;
    }
    // Clean destination first to avoid stale files from previous builds
    if (existsSync(dest)) {
      rmSync(dest, { recursive: true });
    }
    cpSync(src, dest, { recursive: true });
    console.log(`[prepare-pack] copied ${dir}/ → packages/electron/${dir}/`);
  }
}

// Native addon — copy only runtime files (index.js, index.d.ts, *.node, package.json),
// skip Rust source, build artifacts (target/), and node_modules.
const nativeSrc = resolve(ROOT, "native");
const nativeDest = resolve(PKG, "native");

if (isClean) {
  if (existsSync(nativeDest)) {
    rmSync(nativeDest, { recursive: true });
    console.log("[prepare-pack] removed native/");
  }
} else if (!existsSync(nativeSrc)) {
  console.warn(`[prepare-pack] skipping native/ (not found at ${nativeSrc})`);
} else {
  if (existsSync(nativeDest)) {
    rmSync(nativeDest, { recursive: true });
  }
  cpSync(nativeSrc, nativeDest, {
    recursive: true,
    force: true,
    filter: (src) => {
      const rel = relative(nativeSrc, src).replace(/\\/g, "/");
      if (rel === "") return true;
      if (rel.includes("/")) return false;
      return /^(index\.js|index\.d\.ts|package\.json|.+\.node)$/.test(rel);
    },
  });
  console.log("[prepare-pack] copied native/ (runtime only) → packages/electron/native/");
}
