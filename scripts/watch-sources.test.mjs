// node --test scripts/
import assert from "node:assert/strict";
import { test } from "node:test";
import { collectSources, diffLines, factLines, robotsAllows } from "./watch-sources.mjs";

test("keeps fact lines and drops scripts, menus and repeats", () => {
  const html = `<html><script>var deadline = "May 31";</script><nav><a>Home</a><a>Contact us</a></nav>
    <p>Application deadline: 31 May 2027</p><li>Tuition fee: &euro;1,500 per semester</li>
    <p>Application deadline: 31 May 2027</p><p>Welcome to our beautiful campus</p></html>`;
  assert.deepEqual(factLines(html), ["Application deadline: 31 May 2027", "Tuition fee: €1,500 per semester"]);
});

test("diff reports added and removed lines", () => {
  assert.deepEqual(diffLines(["Deadline: 31 May", "Fee: €1,500"], ["Deadline: 15 June", "Fee: €1,500"]), {
    added: ["Deadline: 15 June"],
    removed: ["Deadline: 31 May"],
  });
});

test("robots.txt: longest rule wins, Allow wins ties, other bots' rules ignored", () => {
  const robots = `User-agent: Googlebot\nDisallow: /\n\nUser-agent: *\nDisallow: /study/\nAllow: /study/application\nDisallow: /*.pdf$`;
  assert.equal(robotsAllows(robots, "/study/application/"), true);
  assert.equal(robotsAllows(robots, "/study/other"), false);
  assert.equal(robotsAllows(robots, "/fees.pdf"), false);
  assert.equal(robotsAllows(robots, "/fees.pdf?x=1"), true);
  assert.equal(robotsAllows(robots, "/en/"), true);
  assert.equal(robotsAllows("", "/anything"), true);
});

test("every record in content has at least one watched source", () => {
  const sources = collectSources(process.cwd());
  const ids = [...sources.values()].flat().map((r) => r.id);
  assert.ok(ids.includes("de-tum") && ids.includes("gb-chevening"));
  assert.ok(sources.size >= 40);
});
