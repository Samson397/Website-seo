#!/usr/bin/env node
/**
 * Push Stripe (+ site URL) env vars from .env.local to Vercel Production/Preview.
 * Usage: VERCEL_TOKEN=... node scripts/push-vercel-env.mjs
 */
import { readFileSync, existsSync, writeFileSync, mkdirSync } from "fs";
import { spawnSync } from "child_process";

const token = process.env.VERCEL_TOKEN;
if (!token) {
  console.error("Missing VERCEL_TOKEN. Create one at https://vercel.com/account/tokens");
  process.exit(1);
}

function loadEnv(path) {
  const out = {};
  if (!existsSync(path)) return out;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    out[t.slice(0, i)] = t.slice(i + 1).replace(/^["']|["']$/g, "");
  }
  return out;
}

const env = loadEnv(".env.local");
const required = [
  "STRIPE_SECRET_KEY",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  "STRIPE_PRICE_ID",
];
for (const k of required) {
  if (!env[k]) {
    console.error(`Missing ${k} in .env.local`);
    process.exit(1);
  }
}

const vars = {
  STRIPE_SECRET_KEY: env.STRIPE_SECRET_KEY,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  STRIPE_PRICE_ID: env.STRIPE_PRICE_ID,
  NEXT_PUBLIC_STRIPE_PRICE_DISPLAY: env.NEXT_PUBLIC_STRIPE_PRICE_DISPLAY || "$1.99",
  NEXT_PUBLIC_SITE_URL: env.NEXT_PUBLIC_SITE_URL || "https://www.seohub.online",
};

// Link project non-interactively if possible
const link = spawnSync(
  "npx",
  ["--yes", "vercel@39", "link", "--yes", "--token", token],
  { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }
);
console.log(link.stdout || "");
if (link.status !== 0) console.error(link.stderr || "vercel link failed");

function upsert(name, value, target) {
  // Remove existing then add (vercel env add is interactive for value; use stdin)
  spawnSync(
    "npx",
    ["--yes", "vercel@39", "env", "rm", name, target, "--yes", "--token", token],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }
  );
  const add = spawnSync(
    "npx",
    ["--yes", "vercel@39", "env", "add", name, target, "--token", token],
    { encoding: "utf8", input: value + "\n", stdio: ["pipe", "pipe", "pipe"] }
  );
  if (add.status !== 0) {
    console.error(`Failed ${name} (${target}):`, add.stderr || add.stdout);
    return false;
  }
  console.log(`OK ${name} → ${target}`);
  return true;
}

let ok = true;
for (const [name, value] of Object.entries(vars)) {
  for (const target of ["production", "preview"]) {
    if (!upsert(name, value, target)) ok = false;
  }
}

console.log("Triggering production redeploy…");
const deploy = spawnSync(
  "npx",
  ["--yes", "vercel@39", "deploy", "--prod", "--yes", "--token", token],
  { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }
);
console.log(deploy.stdout || "");
if (deploy.status !== 0) {
  console.error(deploy.stderr || "deploy failed");
  ok = false;
}

process.exit(ok ? 0 : 1);
