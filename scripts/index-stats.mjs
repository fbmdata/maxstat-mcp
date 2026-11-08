import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { gifMetadata } from "./media-contract.mjs";

export const INDEX_SOURCE = "https://maxstat.ru/service";
export const GIF_STATS_PREFIX = "maxstat-index:";
const counters = { channels: "Индексируемых каналов", posts: "Постов в базе", categories: "Категорий" };

export function validateIndexStats(snapshot) {
  if (snapshot?.source !== INDEX_SOURCE) throw new Error("Index statistics must come from the production service page.");
  const time = snapshot.observed_at;
  if (typeof time !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(time) ||
      !Number.isFinite(Date.parse(time)) || new Date(time).toISOString() !== time) {
    throw new Error("Index observation time must be a valid UTC ISO timestamp.");
  }
  for (const name of Object.keys(counters)) {
    if (!Number.isSafeInteger(snapshot[name]) || snapshot[name] <= 0) {
      throw new Error(`Index ${name} must be a positive safe integer.`);
    }
  }
}

export function parseIndexStats(html, observedAt) {
  if (typeof html !== "string" || /checkbox-captcha|showcaptcha|<title>[^<]*not a robot/i.test(html)) {
    throw new Error("MaxStat returned a CAPTCHA or an invalid page; previous statistics were kept.");
  }
  const content = html.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>|<style\b[^>]*>[\s\S]*?<\/style\s*>|<!--[\s\S]*?-->/gi, "");
  const snapshot = { source: INDEX_SOURCE, observed_at: observedAt };
  for (const [name, label] of Object.entries(counters)) {
    const matches = [...content.matchAll(new RegExp(`${label}(?:(?!<div\\b)[\\s\\S])*?<div\\b[^>]*>([^<]*)<\\/div\\s*>`, "giu"))];
    if (matches.length !== 1) throw new Error(`Expected one public ${name} counter, found ${matches.length}.`);
    const value = matches[0][1].replace(/&nbsp;|&#160;|&#x0*a0;/gi, " ").trim();
    if (!/^(?:[1-9]\d*|[1-9]\d{0,2}(?:[ \u00a0\u202f]\d{3})+)$/.test(value)) {
      throw new Error(`The public ${name} counter is not an exact integer.`);
    }
    snapshot[name] = Number(value.replace(/[ \u00a0\u202f]/g, ""));
  }
  validateIndexStats(snapshot);
  return snapshot;
}

function date(snapshot, language) {
  return new Intl.DateTimeFormat(language, { timeZone: "Europe/Moscow", year: "numeric", month: "long", day: "numeric" })
    .format(new Date(snapshot.observed_at));
}

function block(snapshot, language) {
  const format = (value) => new Intl.NumberFormat(language).format(value).replace(/[\u00a0\u202f]/g, " ");
  if (language === "en-US") {
    return `As of ${date(snapshot, language)}: **${format(snapshot.channels)} channels**,\n` +
      `**${format(snapshot.posts)} posts**, **${format(snapshot.categories)} categories**.\n` +
      `[Source: MaxStat](${INDEX_SOURCE}).\n`;
  }
  const asOf = date(snapshot, language).replace(/\s*г\.$/u, " года");
  const rows = [
    [`На ${asOf}`, "Всего"],
    ["Каналы MAX", `**${format(snapshot.channels)}**`],
    ["Публикации", `**${format(snapshot.posts)}**`],
    ["Категории", `**${format(snapshot.categories)}**`],
  ];
  const widths = [0, 1].map((i) => Math.max(...rows.map((row) => row[i].length)));
  const line = (row) => `| ${row[0].padEnd(widths[0])} | ${row[1].padStart(widths[1])} |`;
  return [line(rows[0]), `| ${"-".repeat(widths[0])} | ${"-".repeat(widths[1] - 1)}: |`, ...rows.slice(1).map(line), "",
    `[Источник: MaxStat](${INDEX_SOURCE}).`, ""].join("\n");
}

export function updateReadmeIndexStats(readme, snapshot) {
  validateIndexStats(snapshot);
  let result = readme;
  for (const [marker, language] of [["ru", "ru-RU"], ["en", "en-US"]]) {
    const start = `<!-- maxstat:index:${marker}:start -->`;
    const end = `<!-- maxstat:index:${marker}:end -->`;
    if (result.split(start).length !== 2 || result.split(end).length !== 2 || result.indexOf(start) > result.indexOf(end)) {
      throw new Error(`README must have exactly one complete ${marker} index-statistics block.`);
    }
    result = result.slice(0, result.indexOf(start) + start.length) + "\n\n" + block(snapshot, language) + "\n" +
      result.slice(result.indexOf(end));
  }
  return result;
}

export function validateDemoIndexStats(content, snapshot) {
  validateIndexStats(snapshot);
  const metadata = gifMetadata(content);
  if (metadata.width !== 960 || metadata.height !== 540 || metadata.frameCount < 120 ||
      metadata.durationMs < 10_000 || metadata.durationMs > 16_000 || content.length > 3 * 1024 * 1024) {
    throw new Error("Generated demo does not meet the GIF requirements.");
  }
  const comments = metadata.comments.filter((comment) => comment.startsWith(GIF_STATS_PREFIX));
  if (comments.length !== 1) throw new Error("GIF must contain one index-statistics record.");
  const actual = JSON.parse(comments[0].slice(GIF_STATS_PREFIX.length));
  if (["source", "observed_at", ...Object.keys(counters)].some((key) => actual[key] !== snapshot[key])) {
    throw new Error("GIF statistics do not match data/index-stats.json.");
  }
}

export async function refreshIndexStats(root, { html, observedAt, renderDemo }) {
  const next = parseIndexStats(html, observedAt);
  const names = ["data/index-stats.json", "README.md", "assets/maxstat-mcp-demo.gif"];
  const previous = [];
  for (const name of names) previous.push(await readFile(path.join(root, name)));
  const old = JSON.parse(previous[0].toString("utf8"));
  validateIndexStats(old);
  if (Date.parse(next.observed_at) < Date.parse(old.observed_at)) {
    throw new Error("The imported observation is older than the saved snapshot.");
  }
  const unchanged = Object.keys(counters).every((key) => old[key] === next[key]) && date(old, "ru-RU") === date(next, "ru-RU");
  const snapshot = unchanged ? old : next;
  const readme = updateReadmeIndexStats(previous[1].toString("utf8"), snapshot);
  if (unchanged && readme === previous[1].toString("utf8")) {
    try {
      validateDemoIndexStats(previous[2], snapshot);
      return { changed: false, snapshot };
    } catch {
      // Regenerate an outdated demo even when the public counters are unchanged.
    }
  }
  const scratch = await mkdtemp(path.join(tmpdir(), "maxstat-index-refresh-"));
  try {
    const statsPath = path.join(scratch, "index-stats.json");
    const gifPath = path.join(scratch, "demo.gif");
    const data = `${JSON.stringify(snapshot, null, 2)}\n`;
    await writeFile(statsPath, data);
    await renderDemo(statsPath, gifPath);
    const gif = await readFile(gifPath);
    validateDemoIndexStats(gif, snapshot);
    const values = [data, readme, gif];
    try {
      for (let i = 0; i < names.length; i += 1) await writeFile(path.join(root, names[i]), values[i]);
    } catch (error) {
      for (let i = 0; i < names.length; i += 1) await writeFile(path.join(root, names[i]), previous[i]);
      throw error;
    }
    return { changed: true, snapshot };
  } finally {
    await rm(scratch, { recursive: true, force: true });
  }
}
