#!/usr/bin/env node
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs, promisify } from "node:util";
import { INDEX_SOURCE, parseIndexStats, refreshIndexStats } from "./index-stats.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const exec = promisify(execFile);

try {
  const { values } = parseArgs({ options: {
    "from-html": { type: "string" },
    "observed-at": { type: "string" },
    "check-source": { type: "boolean", default: false },
  } });
  let html;
  let observedAt;
  if (values["from-html"]) {
    if (!values["observed-at"]) throw new Error("HTML import requires --observed-at with its UTC capture time.");
    observedAt = values["observed-at"];
    if (Date.parse(observedAt) > Date.now() + 60_000) throw new Error("HTML observation time cannot be in the future.");
    html = await readFile(path.resolve(values["from-html"]), "utf8");
  } else {
    if (values["observed-at"]) throw new Error("--observed-at is only allowed with --from-html.");
    const response = await fetch(INDEX_SOURCE, {
      redirect: "manual", credentials: "omit", signal: AbortSignal.timeout(20_000),
      headers: { Accept: "text/html", "User-Agent": "MaxStat-MCP-stats-refresh/1.0 (+https://github.com/fbmdata/maxstat-mcp)" },
    });
    if (!response.ok) throw new Error(`Statistics source returned HTTP ${response.status}; redirects and CAPTCHA pages are not followed.`);
    if (!response.headers.get("content-type")?.includes("text/html")) throw new Error("Statistics source did not return HTML.");
    html = await response.text();
    observedAt = new Date().toISOString();
  }
  if (values["check-source"]) {
    process.stdout.write(`${JSON.stringify(parseIndexStats(html, observedAt), null, 2)}\n`);
  } else {
    const result = await refreshIndexStats(root, { html, observedAt, renderDemo: async (stats, output) => {
      await exec("python3", [path.join(root, "scripts/render-demo.py"), "--stats", stats, "--output", output], { maxBuffer: 1024 * 1024 });
    } });
    process.stdout.write(result.changed ? "Updated index snapshot, README and GIF.\n" : "Index statistics are unchanged.\n");
  }
} catch (error) {
  process.stderr.write(`Index refresh failed: ${error.message}\n`);
  process.exitCode = 1;
}
