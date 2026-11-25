#!/usr/bin/env node
/**
 * Weekly fact watcher. Visits every official source page named in content/, keeps only the lines
 * that carry facts (deadlines, fees, intakes), and compares them with last time.
 * It never edits the content itself: it writes content/watch/REPORT.md for a person to review,
 * and the weekly GitHub Action opens that as a pull request.
 *
 *   node scripts/watch-sources.mjs          (run from the repo root)
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const USER_AGENT = "WayPointFactWatcher/1.0 (+https://waypointbd.com; checks study-abroad deadlines weekly)";
const BOT_NAME = "waypointfactwatcher";
const DELAY_MS = 3000; // between requests, to stay gentle
const TIMEOUT_MS = 20000;

const MONTHS = "january|february|march|april|may|june|july|august|september|october|november|december";
const FACT_LINE = new RegExp(
  String.raw`deadline|tuition|fee|intake|semester|application (period|window|round)|apply (by|before|from|until)|closing date|stipend|scholarship amount|[€£$¥₩]\s?\d|\d\s?(eur|gbp|usd|sek|aud|cad|jpy|myr|krw)\b|\b(${MONTHS})\s+\d{1,2}\b|\b\d{1,2}\s+(${MONTHS})\b`,
  "i",
);

/** Visible text of an HTML page, one block per line. */
export function pageText(html) {
  return html
    .replace(/<(script|style|noscript|svg|template)\b[\s\S]*?<\/\1>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(br|\/p|\/li|\/h\d|\/div|\/tr|\/td|\/th|\/dd|\/dt|\/section|\/article)\b[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&euro;/gi, "€")
    .replace(/&pound;/gi, "£")
    .replace(/&#8211;|&ndash;/gi, "–")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;|&rsquo;/gi, "'")
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

/** Only the lines that state facts we track, de-duplicated, in page order. */
export function factLines(html) {
  const seen = new Set();
  return pageText(html).filter((l) => {
    if (l.length < 8 || l.length > 400 || !FACT_LINE.test(l) || seen.has(l)) return false;
    seen.add(l);
    return true;
  });
}

/** Lines added and removed between two snapshots. */
export function diffLines(before, after) {
  const a = new Set(before);
  const b = new Set(after);
  return { added: after.filter((l) => !a.has(l)), removed: before.filter((l) => !b.has(l)) };
}

/** Whether robots.txt lets our bot (or any bot, "*") fetch this path. Longest matching rule wins; Allow wins ties. */
export function robotsAllows(robotsTxt, pathname) {
  const rules = [];
  let agents = [];
  let inRules = false;
  for (const raw of robotsTxt.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, "").trim();
    const m = /^([a-z-]+)\s*:\s*(.*)$/i.exec(line);
    if (!m) continue;
    const key = m[1].toLowerCase();
    const value = m[2].trim();
    if (key === "user-agent") {
      if (inRules) agents = [];
      inRules = false;
      agents.push(value.toLowerCase());
    } else if (key === "allow" || key === "disallow") {
      inRules = true;
      if (agents.some((a) => a === "*" || BOT_NAME.includes(a)) && value) rules.push({ allow: key === "allow", path: value });
    }
  }
  let best = null;
  for (const r of rules) {
    const re = new RegExp("^" + r.path.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\\\$$/, "$"));
    if (!re.test(pathname)) continue;
    if (!best || r.path.length > best.path.length || (r.path.length === best.path.length && r.allow)) best = r;
  }
  return !best || best.allow;
}

/** Every source URL in content/, with the records that cite it. */
export function collectSources(root) {
  const files = ["content/universities/universities.json", "content/scholarships/scholarships.json"];
  const byUrl = new Map();
  for (const f of files) {
    for (const rec of JSON.parse(fs.readFileSync(path.join(root, f), "utf8"))) {
      for (const url of rec.sources ?? []) {
        if (!byUrl.has(url)) byUrl.set(url, []);
        byUrl.get(url).push({ id: rec.id, name: rec.name, lastChecked: rec.lastChecked ?? null });
      }
    }
  }
  return byUrl;
}

async function get(url) {
  const res = await fetch(url, {
    headers: { "user-agent": USER_AGENT, accept: "text/html,text/plain" },
    redirect: "follow",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  return { status: res.status, text: res.ok ? await res.text() : "" };
}

const robotsCache = new Map();
async function allowed(url) {
  const u = new URL(url);
  if (!robotsCache.has(u.origin)) {
    let txt = "";
    try {
      const r = await get(`${u.origin}/robots.txt`);
      txt = r.status === 200 ? r.text : "";
    } catch {
      // No readable robots.txt: treat as allowed, as crawlers conventionally do.
    }
    robotsCache.set(u.origin, txt);
  }
  return robotsAllows(robotsCache.get(u.origin), u.pathname + u.search);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const hash = (lines) => crypto.createHash("sha256").update(lines.join("\n")).digest("hex").slice(0, 16);

/** Checks one URL. Returns { status, hash, lines } where status is "ok", "blocked-by-robots", "no-facts-found" or "http-NNN"/"error". */
async function check(url) {
  if (!(await allowed(url))) return { status: "blocked-by-robots", hash: null, lines: [] };
  try {
    const r = await get(url);
    if (r.status !== 200) return { status: `http-${r.status}`, hash: null, lines: [] };
    const lines = factLines(r.text);
    // Pages built by JavaScript arrive nearly empty; that needs a person, not a silent "unchanged".
    if (lines.length === 0) return { status: "no-facts-found", hash: null, lines: [] };
    return { status: "ok", hash: hash(lines), lines };
  } catch (e) {
    const code = e?.cause?.code === "UND_ERR_CONNECT_TIMEOUT" ? "connect-timeout" : e?.cause?.code ? `error-${e.cause.code}` : "error";
    return { status: e?.name === "TimeoutError" ? "timeout" : code, hash: null, lines: [] };
  }
}

function report(today, changed, unreadable, unchangedCount) {
  const out = [`# Source watch: ${today}`, ""];
  out.push(
    "This report was written by `scripts/watch-sources.mjs`. It only says *something changed*; it does not know what is right.",
    "For each item: open the official page, update the record in `content/` if a fact changed, set its `lastChecked` to today, then merge.",
    "",
  );
  out.push(`## Changed (${changed.length})`, "");
  if (changed.length === 0) out.push("Nothing changed.", "");
  for (const c of changed) {
    out.push(`### ${c.records.map((r) => r.name).join(", ")}`, "", `Source: ${c.url}`, `Records: ${c.records.map((r) => "`" + r.id + "`").join(", ")}`, "");
    if (c.first) {
      out.push("First snapshot of this page. Check the record against it once, then set `lastChecked`.", "");
      continue;
    }
    for (const l of c.diff.removed.slice(0, 15)) out.push(`- removed: ${l}`);
    for (const l of c.diff.added.slice(0, 15)) out.push(`- added: ${l}`);
    const more = c.diff.removed.length + c.diff.added.length - Math.min(15, c.diff.removed.length) - Math.min(15, c.diff.added.length);
    if (more > 0) out.push(`- …and ${more} more changed lines`);
    out.push("");
  }
  out.push(`## Could not read (${unreadable.length})`, "");
  if (unreadable.length === 0) out.push("All pages were readable.", "");
  else out.push("Check these by hand. `no-facts-found` usually means the page is built by JavaScript or has moved.", "");
  for (const u of unreadable) out.push(`- \`${u.status}\` ${u.url} (${u.records.map((r) => r.id).join(", ")})`);
  out.push("", `Unchanged pages: ${unchangedCount}.`, "");
  return out.join("\n");
}

async function main() {
  const root = process.cwd();
  const stateFile = path.join(root, "content/watch/state.json");
  const reportFile = path.join(root, "content/watch/REPORT.md");
  const state = fs.existsSync(stateFile) ? JSON.parse(fs.readFileSync(stateFile, "utf8")) : {};
  const sources = collectSources(root);
  const today = new Date().toISOString().slice(0, 10);

  const changed = [];
  const unreadable = [];
  let unchanged = 0;
  let anyChange = false;
  const next = {};
  let i = 0;
  for (const [url, records] of sources) {
    if (i++ > 0) await sleep(DELAY_MS);
    const prev = state[url];
    const res = await check(url);
    process.stdout.write(`${res.status.padEnd(18)} ${url}\n`);

    if (res.status !== "ok") {
      unreadable.push({ url, status: res.status, records });
      // Keep the last good snapshot so a temporary outage does not erase history.
      next[url] = { ...(prev ?? {}), status: res.status };
      if (prev?.status !== res.status) anyChange = true;
      continue;
    }
    next[url] = { status: "ok", hash: res.hash, changedOn: prev?.hash === res.hash ? prev.changedOn : today, lines: res.lines };
    if (prev?.hash === res.hash) {
      unchanged++;
      if (prev.status !== "ok") anyChange = true;
    } else {
      anyChange = true;
      changed.push({ url, records, first: !prev?.hash, diff: diffLines(prev?.lines ?? [], res.lines) });
    }
  }
  // Sources no longer cited by any record are dropped.
  if (Object.keys(state).some((u) => !sources.has(u))) anyChange = true;

  if (anyChange) {
    fs.mkdirSync(path.dirname(stateFile), { recursive: true });
    fs.writeFileSync(stateFile, JSON.stringify(next, null, 2) + "\n");
    fs.writeFileSync(reportFile, report(today, changed, unreadable, unchanged));
  }
  console.log(`\n${changed.length} changed, ${unreadable.length} unreadable, ${unchanged} unchanged.`);
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `changed=${anyChange}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
