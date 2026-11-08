import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFile, writeFile, mkdtemp, mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const observed = "2026-11-08T09:59:27.000Z";
const snapshot = {
  source: "https://maxstat.ru/service",
  observed_at: observed,
  channels: 672837,
  posts: 155837316,
  categories: 42,
};
const html = await readFile(new URL("./fixtures/index-stats.html", import.meta.url), "utf8");

async function contract() {
  try {
    return await import("../scripts/index-stats.mjs");
  } catch (error) {
    assert.fail(`index statistics module must load: ${error.message}`);
  }
}

test("public service counters are parsed without rounded values", async () => {
  const { parseIndexStats } = await contract();
  assert.deepEqual(parseIndexStats(html, observed), snapshot);
  assert.deepEqual(parseIndexStats(html.replaceAll("&nbsp;", "\u202f"), observed), snapshot);
  assert.deepEqual(parseIndexStats(html.replaceAll("&nbsp;", "&#160;"), observed), snapshot);
});

test("CAPTCHA pages and missing, repeated or invalid counters are rejected", async () => {
  const { parseIndexStats } = await contract();
  for (const content of [
    "<html><title>Are you not a robot?</title>showcaptcha</html>",
    html.replace("Постов в базе", "Нет данных"),
    html + html,
    html.replace("672&nbsp;837", "672K+"),
    html.replace("672&nbsp;837", "0"),
    html.replace("672&nbsp;837", "672.837"),
  ]) {
    assert.throws(() => parseIndexStats(content, observed));
  }
});

test("script payloads cannot supply missing public counters", async () => {
  const { parseIndexStats } = await contract();
  assert.throws(() => parseIndexStats(`<script>${html}</script>`, observed));
});

test("snapshots require a production source, UTC observation time and positive safe integers", async () => {
  const { validateIndexStats } = await contract();
  assert.doesNotThrow(() => validateIndexStats(snapshot));
  for (const invalid of [
    { ...snapshot, source: "https://maxstat.mindful42.ru/service" },
    { ...snapshot, observed_at: "yesterday" },
    { ...snapshot, observed_at: "2026-02-30T00:00:00.000Z" },
    { ...snapshot, posts: -1 },
    { ...snapshot, posts: "155837316" },
    { ...snapshot, channels: 672.837 },
    { ...snapshot, categories: 0 },
    { ...snapshot, posts: Number.MAX_SAFE_INTEGER + 1 },
  ]) {
    assert.throws(() => validateIndexStats(invalid));
  }
});

function readme() {
  return "# Editorial heading\n\nKeep this text.\n\n" +
    "<!-- maxstat:index:ru:start -->\nOld RU counts\n<!-- maxstat:index:ru:end -->\n\n" +
    "English introduction.\n\n<!-- maxstat:index:en:start -->\nOld EN counts\n<!-- maxstat:index:en:end -->\n\nKeep this footer.\n";
}

test("both README blocks use the same dated snapshot and preserve surrounding prose", async () => {
  const { updateReadmeIndexStats } = await contract();
  const result = updateReadmeIndexStats(readme(), snapshot);
  assert(result.startsWith("# Editorial heading\n\nKeep this text.\n\n"));
  assert(result.endsWith("\n\nKeep this footer.\n"));
  assert(result.includes("English introduction.\n\n"));
  assert.match(result, /672 837/);
  assert.match(result, /155 837 316/);
  assert.match(result, /672,837/);
  assert.match(result, /155,837,316/);
  assert.match(result, /8 ноября 2026 года/);
  assert.match(result, /November 8, 2026/);
  assert.equal(updateReadmeIndexStats(result, snapshot), result);
});

test("missing or duplicated managed blocks stop a refresh", async () => {
  const { updateReadmeIndexStats } = await contract();
  assert.throws(() => updateReadmeIndexStats("# No markers", snapshot));
  assert.throws(() => updateReadmeIndexStats(readme() + readme(), snapshot));
});

test("README dates use Moscow time at the UTC day boundary", async () => {
  const { updateReadmeIndexStats } = await contract();
  const result = updateReadmeIndexStats(readme(), { ...snapshot, observed_at: "2026-11-08T22:30:00.000Z" });
  assert.match(result, /9 ноября 2026 года/);
  assert.match(result, /November 9, 2026/);
});

test("HTML import rejects invalid dates and missing UTC timezone before normalization", async () => {
  const cli = fileURLToPath(new URL("../scripts/refresh-index-stats.mjs", import.meta.url));
  const input = fileURLToPath(new URL("./fixtures/index-stats.html", import.meta.url));
  for (const observedAt of ["2026-02-30T12:00:00.000Z", "2026-11-08T09:59:27", "2026-11-08T09:59:27.000+00:00"]) {
    await assert.rejects(execFileAsync(process.execPath, [cli, "--from-html", input, "--observed-at", observedAt, "--check-source"]),
      (error) => error.code === 1 && error.stderr.includes("UTC ISO timestamp"));
  }
});

test("source or renderer failures preserve previous data, README and GIF", async (t) => {
  const { refreshIndexStats } = await contract();
  const root = await mkdtemp(path.join(tmpdir(), "maxstat-index-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, "data"));
  await mkdir(path.join(root, "assets"));
  const previous = { ...snapshot, observed_at: "2026-11-07T10:00:00.000Z", channels: 670000 };
  const files = {
    "data/index-stats.json": JSON.stringify(previous),
    "README.md": readme(),
    "assets/maxstat-mcp-demo.gif": "previous GIF bytes",
  };
  for (const [name, content] of Object.entries(files)) await writeFile(path.join(root, name), content);

  await assert.rejects(refreshIndexStats(root, {
    html, observedAt: observed,
    renderDemo: async () => { throw new Error("renderer unavailable"); },
  }), /renderer unavailable/);
  await assert.rejects(refreshIndexStats(root, {
    html: "CAPTCHA", observedAt: observed,
    renderDemo: async () => { assert.fail("must not render invalid source data"); },
  }));
  await assert.rejects(refreshIndexStats(root, {
    html, observedAt: "2026-11-06T10:00:00.000Z",
    renderDemo: async () => { assert.fail("unexpected render of stale input"); },
  }), /older/);
  for (const [name, content] of Object.entries(files)) assert.equal(await readFile(path.join(root, name), "utf8"), content);
});
