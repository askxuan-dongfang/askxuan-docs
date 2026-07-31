#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.name === ".git") return [];
    if (entry.isDirectory()) return walk(path);
    return extname(entry.name) === ".md" ? [path] : [];
  });
}

const missing = [];
let localLinks = 0;
const linkPattern = /!?\[[^\]]*]\(([^)]+)\)/g;

for (const file of walk(root)) {
  const source = readFileSync(file, "utf8").replace(/```[\s\S]*?```/g, "");
  for (const match of source.matchAll(linkPattern)) {
    let value = match[1].trim().replace(/^<|>$/g, "");
    value = value.split(/\s+["']/)[0];
    if (!value || value.startsWith("#") || /^(?:https?:|mailto:|tel:)/i.test(value)) {
      continue;
    }
    const pathPart = decodeURIComponent(value.split(/[?#]/, 1)[0]);
    let target = resolve(dirname(file), pathPart);
    if (existsSync(target) && statSync(target).isDirectory()) {
      target = join(target, "README.md");
    }
    localLinks += 1;
    if (!existsSync(target)) {
      missing.push({ file: relative(root, file), value });
    }
  }
}

console.log(`Markdown 文档: ${walk(root).length}`);
console.log(`本地相对链接: ${localLinks}`);
console.log(`缺失目标: ${missing.length}`);
for (const item of missing) {
  console.error(`- ${item.file} -> ${item.value}`);
}

process.exitCode = missing.length === 0 ? 0 : 1;
