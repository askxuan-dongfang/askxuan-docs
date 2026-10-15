#!/usr/bin/env node

import { existsSync, readdirSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const workspace = resolve(process.argv[2] ?? resolve(dirname(fileURLToPath(import.meta.url)), "../.."));
const root = join(workspace, "artifacts");
const categories = new Set(["history", "releases", "native", "maintenance"]);
const indexes = new Set(["README.md", "INDEX.md"]);
const monthPattern = /^\d{4}-(0[1-9]|1[0-2])$/;
const errors = [];
let tasks = 0;

function fail(path, reason) {
  errors.push(`${relative(workspace, path)}: ${reason}`);
}

function entries(path) {
  return readdirSync(path, { withFileTypes: true }).filter((entry) => entry.name !== ".DS_Store");
}

function checkMonth(path, month) {
  for (const entry of entries(path)) {
    const child = join(path, entry.name);
    if (entry.isFile() && indexes.has(entry.name)) continue;
    const date = /^.+-(\d{4})(\d{2})(\d{2})$/.exec(entry.name);
    if (!entry.isDirectory() || !date || `${date[1]}-${date[2]}` !== month) {
      fail(child, "月份目录下只放任务目录 <task>-YYYYMMDD，日期须与月份一致；日志放到任务内部");
      continue;
    }
    const parsed = new Date(`${date[1]}-${date[2]}-${date[3]}T00:00:00Z`);
    if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10).replaceAll("-", "") !== date.slice(1).join("")) {
      fail(child, "任务日期无效");
    }
    tasks += 1;
  }
}

function checkCategory(path, name) {
  for (const entry of entries(path)) {
    const child = join(path, entry.name);
    if (entry.isFile() && (indexes.has(entry.name) || (name === "history" && entry.name === "PATHS.md"))) continue;
    if (name === "history" && entry.isDirectory() && entry.name === "legacy") {
      const legacy = new Set(["README.md", "h5-booking-tests.log", "h5-typecheck.log", "ios-wallet-pods.log", "security-audit-20260926.md"]);
      for (const old of entries(child)) {
        if (!old.isFile() || !legacy.has(old.name)) fail(join(child, old.name), "legacy 仅保留迁入的旧文件，不接收新产物");
      }
      continue;
    }
    if (!entry.isDirectory() || !monthPattern.test(entry.name)) {
      fail(child, "使用 YYYY-MM/<task>-YYYYMMDD/ 归档，不在分类根部散放任务或文件");
      continue;
    }
    checkMonth(child, entry.name);
  }
}

function checkReleases(path) {
  const scopes = new Set(["backend", "web", "h5"]);
  for (const entry of entries(path)) {
    const child = join(path, entry.name);
    if (entry.isFile() && indexes.has(entry.name)) continue;
    if (!entry.isDirectory() || !scopes.has(entry.name)) {
      fail(child, "发布包使用 <backend|web|h5>/<release-id>/，原生包归入 native");
      continue;
    }
    for (const release of entries(child)) {
      if (release.isFile() && indexes.has(release.name)) continue;
      if (!release.isDirectory()) fail(join(child, release.name), "发布包放到 release-id 目录内");
    }
  }
}

function checkSourceCopies(path) {
  for (const entry of entries(path)) {
    const child = join(path, entry.name);
    if ([".git", "node_modules", ".worktrees"].includes(entry.name)) {
      fail(child, "源码工作副本和依赖不属于归档产物，请使用临时工作区");
    } else if (entry.isDirectory()) {
      checkSourceCopies(child);
    }
  }
}

if (!existsSync(root)) {
  fail(root, "本地工作区没有 artifacts；参数应为 DongFang 工作区根目录");
} else {
  const seen = new Set();
  for (const entry of entries(root)) {
    const path = join(root, entry.name);
    if (entry.isFile() && indexes.has(entry.name)) continue;
    if (!entry.isDirectory() || !categories.has(entry.name)) {
      fail(path, "顶层只允许 history、releases、native、maintenance 和 README.md、INDEX.md");
      continue;
    }
    seen.add(entry.name);
    if (entry.name === "releases") checkReleases(path);
    else checkCategory(path, entry.name);
  }
  for (const category of categories) {
    if (!seen.has(category)) fail(join(root, category), "缺少固定归档分类");
  }
  checkSourceCopies(root);
}

console.log(`归档目录: ${root}`);
console.log(`月份任务目录: ${tasks}`);
console.log(`结构问题: ${errors.length}`);
for (const error of errors) console.error(`- ${error}`);
process.exitCode = errors.length ? 1 : 0;
