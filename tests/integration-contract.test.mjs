import assert from "node:assert/strict";
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const validatorUrl = pathToFileURL(
  path.join(repoRoot, "scripts/integration-contract.mjs"),
);

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

test("the checked-in repository satisfies every integration invariant", async () => {
  const { validateRepository } = await loadValidator();
  assert.deepEqual(await validateRepository(repoRoot), []);
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
      "maxstat_live_1234567890";
  });

  const errors = await validateRepository(root);
  assert(errors.some((error) => error.includes("hardcoded token")));
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
        error.includes("gemini-extension.json") && error.includes("1.2.0"),
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

test("the Russian launch kit covers three concrete MCP workflows", async () => {
  const launchKit = await readFile(
    path.join(repoRoot, "docs/launch-kit.ru.md"),
    "utf8",
  );

  for (const required of [
    "## Кейс 1",
    "## Кейс 2",
    "## Кейс 3",
    "search_channels",
    "search_posts",
    "create_keyword_subscription",
    "assets/maxstat-mcp-demo.mp4",
    "assets/maxstat-mcp-demo.gif",
  ]) {
    assert(
      launchKit.includes(required),
      `docs/launch-kit.ru.md must include ${required}`,
    );
  }
});

test("the Cline and demo launch assets are tracked and valid", async () => {
  const clineIcon = await readFile(
    path.join(repoRoot, "assets/maxstat-cline-400.png"),
  );
  assert.equal(clineIcon.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
  assert.equal(clineIcon.readUInt32BE(16), 400);
  assert.equal(clineIcon.readUInt32BE(20), 400);

  for (const mediaFile of [
    "assets/maxstat-mcp-demo.mp4",
    "assets/maxstat-mcp-demo.gif",
  ]) {
    const media = await readFile(path.join(repoRoot, mediaFile));
    assert(media.length > 1024, `${mediaFile} must not be empty`);
  }
});

test("the duplicated full-width company logo stays out of the README", async () => {
  const readme = await readFile(path.join(repoRoot, "README.md"), "utf8");
  assert.doesNotMatch(
    readme,
    /!\[Логотип ООО «ФБМ Аналитикс»\]\(assets\/maxstat-logo\.png\)/,
  );
});
