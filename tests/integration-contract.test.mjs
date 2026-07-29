import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { access, cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { promisify } from "node:util";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const validatorUrl = pathToFileURL(
  path.join(repoRoot, "scripts/integration-contract.mjs"),
);
const execFileAsync = promisify(execFile);

async function loadValidator() {
  try {
    return await import(validatorUrl);
  } catch (error) {
    assert.fail(`integration validator must load: ${error.message}`);
  }
}

async function fixture(t) {
  const root = await mkdtemp(path.join(tmpdir(), "maxstat-contract-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await cp(repoRoot, root, {
    recursive: true,
    filter: (source) => path.basename(source) !== ".git",
  });
  return root;
}

async function updateJson(root, relativePath, update) {
  const filePath = path.join(root, relativePath);
  const value = JSON.parse(await readFile(filePath, "utf8"));
  update(value);
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

async function initializeFixtureRepository(root) {
  await execFileAsync("git", ["init", "--quiet"], { cwd: root });
  await execFileAsync("git", ["add", "--all"], { cwd: root });
}

test("the checked-in repository satisfies every integration invariant", async () => {
  const { validateRepository } = await loadValidator();
  assert.deepEqual(await validateRepository(repoRoot), []);
});

test("the README uses the production index snapshot instead of staging data", async () => {
  const readme = await readFile(path.join(repoRoot, "README.md"), "utf8");

  assert.match(readme, /Проверено 29 июля 2026 года/);
  assert.match(readme, /\*\*408 501\*\*/);
  assert.match(readme, /\*\*86 315 758\*\*/);
  assert.doesNotMatch(readme, /367 759|85 720 012/);
});

test("the real-data example is refreshed from production", async () => {
  const readme = await readFile(path.join(repoRoot, "README.md"), "utf8");

  assert.match(readme, /3 496 789 подписчиков/);
  assert.match(readme, /\+442 788 \/ \+14,5%/);
  assert.match(readme, /17 888 688 просмотрами/);
  assert.match(readme, /187 460 реакциями/);
  assert.match(readme, /184 найденных пересылк/);
});

test("readJson reads a repository-relative JSON document", async () => {
  const { readJson } = await loadValidator();
  const server = await readJson(repoRoot, "server.json");
  assert.equal(server.name, "io.github.fbmdata/maxstat-mcp");
});

test("the MCP Registry description stays within its 100-character limit", async () => {
  const { readJson } = await loadValidator();
  const server = await readJson(repoRoot, "server.json");
  assert(server.description.length <= 100);
});

test("Authorization bearer configuration is rejected", async (t) => {
  const { validateRepository } = await loadValidator();
  const root = await fixture(t);
  await updateJson(
    root,
    "plugins/maxstat/.codex-plugin/plugin.json",
    (plugin) => {
      plugin.mcpServers = {
        maxstat: {
          url: "https://maxstat.ru/api/mcp",
          bearer_token_env_var: "MAXSTAT_API_TOKEN",
        },
      };
    },
  );

  const errors = await validateRepository(root);
  assert(errors.some((error) => error.includes("X-API-Token")));
});

test("missing marketplace source paths are rejected", async (t) => {
  const { validateRepository } = await loadValidator();
  const root = await fixture(t);
  await updateJson(root, ".agents/plugins/marketplace.json", (marketplace) => {
    marketplace.plugins[0].source.path = "./plugins/missing";
  });

  const errors = await validateRepository(root);
  assert(errors.some((error) => error.includes("plugins/missing")));
});

test("token-like tracked values are rejected", async (t) => {
  const { validateRepository } = await loadValidator();
  const root = await fixture(t);
  await updateJson(root, "configs/generic-mcp.json", (config) => {
    config.mcpServers.maxstat.headers["X-API-Token"] =
      "maxstat" + "_live_" + "1234567890";
  });

  const errors = await validateRepository(root);
  assert(errors.some((error) => error.includes("hardcoded token")));
});

test("token-like values in public text files are rejected", async (t) => {
  const { validateRepository } = await loadValidator();
  const root = await fixture(t);
  const readmePath = path.join(root, "README.md");
  const readme = await readFile(readmePath, "utf8");
  await writeFile(readmePath, `${readme}\n${"a".repeat(64)}\n`);

  const errors = await validateRepository(root);
  assert(
    errors.some(
      (error) =>
        error.includes("README.md") && error.includes("token-like value"),
    ),
  );
});

test("token-like values in forced environment files are rejected", async (t) => {
  const { validateRepository } = await loadValidator();
  const root = await fixture(t);
  await initializeFixtureRepository(root);
  await writeFile(path.join(root, ".env.local"), `${"b".repeat(64)}\n`);
  await execFileAsync("git", ["add", "--force", ".env.local"], { cwd: root });

  const errors = await validateRepository(root);
  assert(
    errors.some(
      (error) =>
        error.includes(".env.local") && error.includes("token-like value"),
    ),
  );
});

test("token-like values in ignored environment files are not scanned", async (t) => {
  const { validateRepository } = await loadValidator();
  const root = await fixture(t);
  await initializeFixtureRepository(root);
  await writeFile(path.join(root, ".env.local"), `${"c".repeat(64)}\n`);

  const errors = await validateRepository(root);
  assert(
    errors.every((error) => !error.includes(".env.local")),
    errors.join("\n"),
  );
});

test("token-like values in tracked extensionless text are rejected", async (t) => {
  const { validateRepository } = await loadValidator();
  const root = await fixture(t);
  await initializeFixtureRepository(root);
  await writeFile(path.join(root, "run-check"), `${"d".repeat(64)}\n`);
  await execFileAsync("git", ["add", "run-check"], { cwd: root });

  const errors = await validateRepository(root);
  assert(
    errors.some(
      (error) =>
        error.includes("run-check") && error.includes("token-like value"),
    ),
  );
});

test("Claude Desktop rejects an unpinned mcp-remote package", async (t) => {
  const { validateRepository } = await loadValidator();
  const root = await fixture(t);
  await updateJson(root, "configs/claude-desktop.json", (config) => {
    config.mcpServers.maxstat.args[1] = "mcp-remote";
  });

  const errors = await validateRepository(root);
  assert(
    errors.some(
      (error) =>
        error.includes("configs/claude-desktop.json") &&
        error.includes("pinned"),
    ),
  );
});

test("release-bearing manifests must use the same version", async (t) => {
  const { validateRepository } = await loadValidator();
  const root = await fixture(t);
  await updateJson(root, "gemini-extension.json", (manifest) => {
    manifest.version = "9.9.9";
  });

  const errors = await validateRepository(root);
  assert(
    errors.some(
      (error) =>
        error.includes("gemini-extension.json") && error.includes("1.2.2"),
    ),
  );
});

test("the analytics skill must document every MCP tool", async (t) => {
  const { validateRepository } = await loadValidator();
  const root = await fixture(t);
  const skillPath = path.join(
    root,
    "plugins/maxstat/skills/maxstat-analytics/SKILL.md",
  );
  const skill = await readFile(skillPath, "utf8");
  await writeFile(skillPath, skill.replaceAll("get_post_likes", "post_likes"));

  const errors = await validateRepository(root);
  assert(
    errors.some(
      (error) => error.includes("SKILL.md") && error.includes("get_post_likes"),
    ),
  );
});

test("the Codex marketplace does not invent an unsupported version field", async (t) => {
  const { validateRepository } = await loadValidator();
  const root = await fixture(t);
  await updateJson(root, ".agents/plugins/marketplace.json", (marketplace) => {
    marketplace.version = "1.2.0";
  });

  const errors = await validateRepository(root);
  assert(
    errors.some(
      (error) =>
        error.includes(".agents/plugins/marketplace.json") &&
        error.includes("version"),
    ),
  );
});

test("the Codex plugin embeds its environment-backed MCP configuration", async () => {
  const { readJson } = await loadValidator();
  const plugin = await readJson(
    repoRoot,
    "plugins/maxstat/.codex-plugin/plugin.json",
  );
  assert.deepEqual(plugin.mcpServers, {
    maxstat: {
      url: "https://maxstat.ru/api/mcp",
      env_http_headers: {
        "X-API-Token": "MAXSTAT_API_TOKEN",
      },
    },
  });
});

test("Cline can install the hosted server from the agent guide", async () => {
  const guide = await readFile(path.join(repoRoot, "llms-install.md"), "utf8");

  for (const required of [
    "https://maxstat.ru/api/mcp",
    "Streamable HTTP",
    "X-API-Token",
    "MAXSTAT_API_TOKEN",
    "get_account_limits",
    "tools/list",
  ]) {
    assert(
      guide.includes(required),
      `llms-install.md must document ${required}`,
    );
  }

  assert.doesNotMatch(guide, /\bnpx\s+(?:-y\s+)?maxstat-mcp\b/i);
  assert.doesNotMatch(guide, /\bnpm\s+install\s+maxstat-mcp\b/i);
});

test("the Cline icon and public demo are tracked and valid", async () => {
  const clineIcon = await readFile(
    path.join(repoRoot, "assets/maxstat-cline-400.png"),
  );
  assert.equal(clineIcon.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
  assert.equal(clineIcon.readUInt32BE(16), 400);
  assert.equal(clineIcon.readUInt32BE(20), 400);

  const demo = await readFile(
    path.join(repoRoot, "assets/maxstat-mcp-demo.gif"),
  );
  assert(demo.length > 1024, "assets/maxstat-mcp-demo.gif must not be empty");
});

test("the public package excludes internal and redundant files", async () => {
  for (const excludedPath of [
    "docs/catalog-submissions.md",
    "docs/launch-kit.ru.md",
    "docs/superpowers",
    "scripts/render-demo-video.sh",
    "assets/maxstat-icon.png",
    "assets/maxstat-logo.png",
    "assets/maxstat-mcp-demo.mp4",
    "mcp-config.example.json",
  ]) {
    await assert.rejects(
      access(path.join(repoRoot, excludedPath)),
      undefined,
      `${excludedPath} must not be published`,
    );
  }

  const readme = await readFile(path.join(repoRoot, "README.md"), "utf8");
  assert.doesNotMatch(readme, /catalog-submissions|launch-kit|superpowers/i);
});
