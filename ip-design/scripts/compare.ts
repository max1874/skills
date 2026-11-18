#!/usr/bin/env node
import { existsSync, realpathSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative } from "node:path";

const usage = `Put several candidate images side by side in a web page, with avatar-size thumbnails below each, to help pick a direction and run the thumbnail test.

Usage: compare.ts <output.html> <image1.png>[=label] <image2.png>[=label] ...

Uses only Node's built-in modules. Images are referenced by relative path, so open the page on the same computer as the images.
`;

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

// Absolute path with symlinks resolved as far as it exists, like Python's Path.resolve().
const resolve = (p: string): string => {
  try {
    return realpathSync(p);
  } catch {
    return join(resolve(dirname(p)), basename(p));
  }
};
// The name without its last suffix; leading dots are not a suffix (".hidden").
const stem = (p: string) => basename(p).replace(/(?<!^\.*)\.[^.]*$/u, "");
const entities: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#x27;" };
const escape = (text: string) => text.replace(/[&<>"']/gu, (c) => entities[c]);

const [output, ...images] = process.argv.slice(2);
if (!images.length) fail(usage);
const out = resolve(output);
const items = images.map((arg) => {
  const i = arg.indexOf("=");
  const [path, label] = i < 0 ? [arg, ""] : [arg.slice(0, i), arg.slice(i + 1)];
  const p = resolve(path);
  if (!existsSync(p)) fail(`Image not found: ${p}`);
  return [relative(dirname(out), p), label || stem(p)];
});

const cols = items.map(([src, label]) => {
  const s = escape(src), l = escape(label);
  // Thumbnail test: avatars on phones are usually only 40–100px; a detail that is cute in the big image can turn into "an extra pair of eyes" here
  const thumbs = [48, 96, 160].map((n) => `<img class="t" style="width:${n}px;height:${n}px" src="${s}">`).join("");
  return `<div class="c"><h2>${l}</h2><img class="big" src="${s}"><div class="row">${thumbs}</div></div>`;
});

const page = `<!doctype html><html lang="en"><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(stem(out))}</title>
<style>
body{margin:0;background:#F4F3EF;color:#1A1A1A;font:16px/1.6 "PingFang SC",-apple-system,sans-serif;padding:24px 16px}
p{margin:0 0 20px;color:#6E6E6A}
.g{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:20px}
.c{background:#fff;border:2px solid #1A1A1A;border-radius:8px;padding:16px}
h2{margin:0 0 10px;font-size:20px}
.big{width:100%;display:block;border-radius:4px}
.row{display:flex;gap:14px;align-items:flex-end;margin-top:14px;padding-top:14px;border-top:1px solid #DEDDD6}
.t{border-radius:50%;object-fit:cover;object-position:50% 30%;border:1px solid #DEDDD6}
</style>
<p>Big images above, avatar sizes below (48 / 96 / 160px). It passes only if it is still recognizable in the small ones, with nothing odd added.</p>
<div class="g">${cols.join("")}</div></html>`;
writeFileSync(out, page);
console.log(out);
