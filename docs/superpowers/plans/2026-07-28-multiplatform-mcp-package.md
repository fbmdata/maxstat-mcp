# MaxStat MCP Multiplatform Package Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Release MaxStat MCP `1.2.0` as one validated repository that installs
or configures correctly in Codex, Claude Code, VS Code, GitHub Copilot CLI,
Gemini CLI, Cursor, Claude Desktop, Windsurf, JetBrains AI Assistant, and
generic MCP clients.

**Architecture:** Keep `server.json` as the protocol-level registry manifest,
add platform-specific marketplace manifests around one self-contained plugin
under `plugins/maxstat`, and make the repository root a Gemini CLI extension.
A dependency-free Node.js validator enforces shared endpoint, header, version,
path, copy, and secret-safety invariants before CI or release.

**Tech Stack:** JSON manifests, Markdown skills/docs, TOML configuration,
Node.js 24 in CI (Node.js 20 or newer locally), GitHub Actions, MCP Streamable
HTTP.

## Global Constraints

- Release version is exactly `1.2.0`.
- MCP endpoint is exactly `https://maxstat.ru/api/mcp`.
- Authentication header is exactly `X-API-Token`.
- Token environment variable is exactly `MAXSTAT_API_TOKEN`.
- Never use `bearer_token_env_var` for MaxStat.
- Never place a real or realistic API token in a tracked file, command, URL,
  image, fixture, or log.
- Product name is `MaxStat MCP`.
- Publisher is `ООО «ФБМ Аналитикс» / FBM Analytics`.
- Primary product and workflow copy is Russian; global machine metadata may
  use concise English.
- Brand color is `#4830E6`.
- The MIT license applies only to this repository's public integration files;
  the hosted service, server implementation, and data remain proprietary.
- Preserve the existing 21-tool contract and the verified 2026-07-28 index
  figures unless a new live verification intentionally updates them.
- OAuth and hosted ChatGPT directory submission are outside release `1.2.0`.

---

## File map

| File                                                | Responsibility                                   |
| --------------------------------------------------- | ------------------------------------------------ |
| `package.json`                                      | Dependency-free validation and test commands     |
| `scripts/integration-contract.mjs`                  | Reusable repository validation logic             |
| `scripts/validate-integrations.mjs`                 | CLI wrapper for validation                       |
| `tests/integration-contract.test.mjs`               | Contract and negative-fixture tests              |
| `.agents/plugins/marketplace.json`                  | Codex marketplace                                |
| `.claude-plugin/marketplace.json`                   | Claude/VS Code/Copilot marketplace               |
| `plugins/maxstat/.codex-plugin/plugin.json`         | Codex plugin metadata                            |
| `plugins/maxstat/.claude-plugin/plugin.json`        | Claude-compatible metadata                       |
| `plugins/maxstat/.mcp.json`                         | Claude/VS Code/Copilot MCP configuration         |
| `plugins/maxstat/skills/maxstat-analytics/SKILL.md` | Shared analytics workflow                        |
| `gemini-extension.json`                             | Gemini CLI extension and secure token setting    |
| `GEMINI.md`                                         | Gemini-specific Russian-first operating guidance |
| `configs/*.json`, `configs/codex.toml`              | Copy-paste client configurations                 |
| `docs/catalog-submissions.md`                       | Directory submission ledger                      |
| `assets/*`, `plugins/maxstat/assets/*`              | Marketplace presentation assets                  |
| `.github/workflows/validate-integrations.yml`       | Pull-request validation                          |
| `.github/workflows/publish-mcp.yml`                 | Registry release validation/publish              |
| `README.md`                                         | Bilingual installation and product documentation |
| `CHANGELOG.md`                                      | `1.2.0` public release notes                     |
| `CONTRIBUTING.md`                                   | Rules for platform integration contributions     |

---

### Task 1: Add a dependency-free integration contract validator

**Files:**

- Create: `package.json`
- Create: `scripts/integration-contract.mjs`
- Create: `scripts/validate-integrations.mjs`
- Create: `tests/integration-contract.test.mjs`

**Interfaces:**

- Produces: `validateRepository(rootDir: string): string[]`
- Produces: `readJson(rootDir: string, relativePath: string): object`
- Produces: CLI exit code `0` with `All integration manifests are valid.`
- Produces: CLI exit code `1` with one line per invariant violation

- [ ] **Step 1: Create failing tests for shared contract invariants**

Create `tests/integration-contract.test.mjs` with Node's built-in test runner.
The tests must create isolated temporary fixtures and assert:

```js
import assert from "node:assert/strict";
import { cp, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { validateRepository } from "../scripts/integration-contract.mjs";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

async function fixture() {
  const root = await mkdtemp(path.join(tmpdir(), "maxstat-contract-"));
  await cp(repoRoot, root, {
    recursive: true,
    filter: (source) => !source.includes(`${path.sep}.git${path.sep}`),
  });
  return root;
}

test("the checked-in repository satisfies every integration invariant", async () => {
  assert.deepEqual(await validateRepository(repoRoot), []);
});

test("Authorization bearer configuration is rejected", async (t) => {
  const root = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  await writeFile(
    path.join(root, "plugins/maxstat/.codex-plugin/plugin.json"),
    JSON.stringify({
      maxstat: {
        url: "https://maxstat.ru/api/mcp",
        bearer_token_env_var: "MAXSTAT_API_TOKEN",
      },
    }),
  );
  const errors = await validateRepository(root);
  assert(errors.some((error) => error.includes("X-API-Token")));
});

test("missing marketplace source paths are rejected", async (t) => {
  const root = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const marketplacePath = path.join(root, ".agents/plugins/marketplace.json");
  const marketplace = JSON.parse(
    await (await import("node:fs/promises")).readFile(marketplacePath, "utf8"),
  );
  marketplace.plugins[0].source.path = "./plugins/missing";
  await writeFile(marketplacePath, JSON.stringify(marketplace, null, 2));
  const errors = await validateRepository(root);
  assert(errors.some((error) => error.includes("plugins/missing")));
});

test("token-like tracked values are rejected", async (t) => {
  const root = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  await writeFile(
    path.join(root, "configs/generic-mcp.json"),
    JSON.stringify({
      mcpServers: {
        maxstat: {
          headers: { "X-API-Token": "maxstat_live_1234567890" },
        },
      },
    }),
  );
  const errors = await validateRepository(root);
  assert(errors.some((error) => error.includes("hardcoded token")));
});
```

- [ ] **Step 2: Run the tests and confirm the first test fails**

Run:

```bash
node --test tests/integration-contract.test.mjs
```

Expected: failure because `scripts/integration-contract.mjs` and the new
platform manifests do not exist.

- [ ] **Step 3: Implement the validator**

Create `scripts/integration-contract.mjs` using only Node built-ins. Export:

```js
export const RELEASE_VERSION = "1.2.0";
export const MCP_URL = "https://maxstat.ru/api/mcp";
export const TOKEN_HEADER = "X-API-Token";
export const TOKEN_ENV = "MAXSTAT_API_TOKEN";
export async function readJson(rootDir, relativePath) {}
export async function validateRepository(rootDir) {}
```

`validateRepository` must accumulate, not throw on, content errors. It must:

1. read every JSON file listed in the design;
2. verify versions in `server.json`, both plugin manifests, the
   version-bearing Claude marketplace, `package.json`, and
   `gemini-extension.json`;
3. verify every MCP URL equals `MCP_URL`;
4. verify every authenticated configuration uses `TOKEN_HEADER`;
5. reject `bearer_token_env_var` and `Authorization` in MaxStat configs;
6. reject token values other than `<API_TOKEN>`, `${MAXSTAT_API_TOKEN}`,
   `${env:MAXSTAT_API_TOKEN}`, `${input:maxstat-api-token}`, or the environment
   variable name used by Codex;
7. resolve and verify marketplace source paths and manifest asset paths;
8. verify the Codex and Claude marketplace entries point to
   `./plugins/maxstat`;
9. verify `server.json` marks the token header required and secret;
10. verify the skill contains valid YAML delimiters, `name:
maxstat-analytics`, Russian workflow headings, and all 21 tool names;
11. verify README contains the canonical install commands and does not contain
    the old `--bearer-token-env-var` command.

Create `scripts/validate-integrations.mjs`:

```js
#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateRepository } from "./integration-contract.mjs";

const rootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const errors = await validateRepository(rootDir);

if (errors.length > 0) {
  for (const error of errors) {
    process.stderr.write(`- ${error}\n`);
  }
  process.exitCode = 1;
} else {
  process.stdout.write("All integration manifests are valid.\n");
}
```

Create `package.json`:

```json
{
  "name": "maxstat-mcp-integration",
  "version": "1.2.0",
  "private": true,
  "description": "Validation tooling for the public MaxStat MCP integration package.",
  "type": "module",
  "scripts": {
    "test": "node --test tests/*.test.mjs",
    "validate": "node scripts/validate-integrations.mjs"
  },
  "engines": {
    "node": ">=20"
  }
}
```

- [ ] **Step 4: Run the validator tests**

Run:

```bash
npm test
```

Expected: negative-fixture tests pass; the checked-in-repository test still
fails until Tasks 2–5 create the required files.

- [ ] **Step 5: Commit the validation harness**

```bash
git add package.json scripts tests
git commit -m "test: define multiplatform integration contract"
```

---

### Task 2: Add verified brand assets and Russian-first agent guidance

**Files:**

- Create: `assets/maxstat-icon.png`
- Create: `assets/maxstat-logo.png`
- Create: `plugins/maxstat/assets/maxstat-icon.png`
- Create: `plugins/maxstat/assets/maxstat-logo.png`
- Create: `plugins/maxstat/skills/maxstat-analytics/SKILL.md`
- Create: `GEMINI.md`

**Interfaces:**

- Consumes: product fields in Global Constraints
- Produces: square PNG icon at least `256x256`
- Produces: transparent or solid-background PNG logo suitable for install UI
- Produces: skill identifier `maxstat-analytics`
- Produces: Gemini context with the same operating rules

- [ ] **Step 1: Retrieve and inspect the approved source assets**

Download the approved MaxStat/FBM brand assets from
`https://disk.yandex.ru/d/apGiqFmyctOPhQ`. Inspect every candidate visually,
select the product mark that remains legible at 64 pixels, and record the
selected source filename in the commit message.

Expected: no screenshots, unrelated corporate materials, or raster images
with embedded credentials are selected.

- [ ] **Step 2: Produce install-surface images**

Create:

- `assets/maxstat-icon.png`: square, at least `256x256`, RGB/RGBA PNG;
- `assets/maxstat-logo.png`: landscape or square, at least 512 pixels on its
  longest side, RGB/RGBA PNG.

Copy byte-identical versions into `plugins/maxstat/assets/`.

Run:

```bash
file assets/maxstat-icon.png assets/maxstat-logo.png
shasum -a 256 assets/maxstat-icon.png plugins/maxstat/assets/maxstat-icon.png
shasum -a 256 assets/maxstat-logo.png plugins/maxstat/assets/maxstat-logo.png
```

Expected: both formats are PNG and each root/plugin checksum pair matches.

- [ ] **Step 3: Write the shared analytics skill**

Create `plugins/maxstat/skills/maxstat-analytics/SKILL.md` with:

```yaml
---
name: maxstat-analytics
description: >
  Используйте MaxStat MCP для поиска и анализа каналов и публикаций MAX,
  сравнения аудитории и вовлечённости, поиска пересылок, мониторинга через
  webhooks и контроля кредитов.
---
```

The body must contain:

- when to use MaxStat and when not to use it;
- the ordered discovery → identifier resolution → analytics workflow;
- a table mapping all 21 MCP tool names to exact outcomes and credit costs;
- Russian workflows for channel discovery, competitor comparison, publication
  research, audience dynamics, engagement, forwards, monitoring, and account
  usage;
- instructions to include URLs, date ranges, observed-at dates, caveats, and
  credit usage;
- webhook safety requirements for public HTTPS callbacks;
- five Russian starter requests and three English starter requests.

- [ ] **Step 4: Write Gemini context**

Create `GEMINI.md` as a concise Russian-first adaptation of the skill. It must
not duplicate the 21-tool reference in full; it must link users to `README.md`
for the full contract and retain the workflow ordering, safety rules, and
starter requests.

- [ ] **Step 5: Validate content and commit**

Run:

```bash
npm test
npx --yes markdownlint-cli2 \
  "plugins/maxstat/skills/maxstat-analytics/SKILL.md" \
  "GEMINI.md"
```

Expected: only missing-manifest failures remain in the repository contract
test; Markdown validation passes.

```bash
git add assets plugins/maxstat/assets plugins/maxstat/skills GEMINI.md
git commit -m "feat: add MaxStat brand assets and analytics guidance"
```

---

### Task 3: Add Codex and Claude-compatible marketplaces and plugins

**Files:**

- Create: `.agents/plugins/marketplace.json`
- Create: `.claude-plugin/marketplace.json`
- Create: `plugins/maxstat/.codex-plugin/plugin.json`
- Create: `plugins/maxstat/.claude-plugin/plugin.json`
- Create: `plugins/maxstat/.mcp.json`

**Interfaces:**

- Consumes: `plugins/maxstat/assets/*`
- Consumes: `plugins/maxstat/skills/maxstat-analytics/SKILL.md`
- Produces: Codex marketplace `maxstat-plugins`
- Produces: Claude-compatible marketplace `maxstat-plugins`
- Produces: plugin identifier `maxstat`

- [ ] **Step 1: Create the Codex marketplace**

Create `.agents/plugins/marketplace.json`:

```json
{
  "name": "maxstat-plugins",
  "interface": {
    "displayName": "MaxStat"
  },
  "plugins": [
    {
      "name": "maxstat",
      "source": {
        "source": "local",
        "path": "./plugins/maxstat"
      },
      "policy": {
        "installation": "AVAILABLE",
        "authentication": "ON_INSTALL"
      },
      "category": "Data & Analytics"
    }
  ]
}
```

- [ ] **Step 2: Create the Codex plugin manifest and MCP config**

Create `plugins/maxstat/.codex-plugin/plugin.json` with exact release metadata,
the two asset paths, Russian-first `interface` copy, three short Russian
`defaultPrompt` values, `skills: "./skills/"`, and an inline `mcpServers`
object:

```json
{
  "maxstat": {
    "url": "https://maxstat.ru/api/mcp",
    "env_http_headers": {
      "X-API-Token": "MAXSTAT_API_TOKEN"
    }
  }
}
```

- [ ] **Step 3: Create the Claude-compatible marketplace**

Create `.claude-plugin/marketplace.json`:

```json
{
  "name": "maxstat-plugins",
  "description": "MaxStat analytics for MAX channels and publications.",
  "version": "1.2.0",
  "owner": {
    "name": "ООО «ФБМ Аналитикс» / FBM Analytics",
    "url": "https://maxstat.ru/"
  },
  "plugins": [
    {
      "name": "maxstat",
      "source": "./plugins/maxstat",
      "description": "Поиск, аналитика и мониторинг каналов и публикаций MAX.",
      "author": {
        "name": "ООО «ФБМ Аналитикс» / FBM Analytics"
      },
      "homepage": "https://maxstat.ru/promo/mcp",
      "repository": "https://github.com/fbmdata/maxstat-mcp",
      "license": "MIT",
      "keywords": ["max", "analytics", "channels", "publications", "mcp"],
      "category": "data"
    }
  ]
}
```

- [ ] **Step 4: Create the Claude-compatible plugin and MCP config**

Create `plugins/maxstat/.claude-plugin/plugin.json` with `name`, `displayName`,
`version`, bilingual description, author, homepage, repository, license,
keywords, `skills: "./skills/"`, and `mcpServers: "./.mcp.json"`.

Create `plugins/maxstat/.mcp.json`:

```json
{
  "mcpServers": {
    "maxstat": {
      "type": "http",
      "url": "https://maxstat.ru/api/mcp",
      "headers": {
        "X-API-Token": "${MAXSTAT_API_TOKEN}"
      }
    }
  }
}
```

- [ ] **Step 5: Validate both marketplace families**

Run:

```bash
npm test
npm run validate
claude plugin validate . --strict
claude plugin validate ./plugins/maxstat --strict
```

Expected: all Node contract tests pass for these files; both Claude validation
commands exit `0` without warnings. Repository-wide validation may still list
only the Gemini, direct-client, and README files intentionally created in
Tasks 4–5.

- [ ] **Step 6: Commit plugin packaging**

```bash
git add .agents .claude-plugin plugins/maxstat
git commit -m "feat: package MaxStat for Codex Claude and Copilot"
```

---

### Task 4: Add Gemini CLI extension and direct client configurations

**Files:**

- Create: `gemini-extension.json`
- Create: `configs/claude-code.json`
- Create: `configs/claude-desktop.json`
- Create: `configs/codex.toml`
- Create: `configs/cursor.json`
- Create: `configs/generic-mcp.json`
- Create: `configs/jetbrains.json`
- Create: `configs/windsurf.json`
- Create: `configs/vscode.json`
- Modify: `mcp-config.example.json`

**Interfaces:**

- Consumes: `GEMINI.md`
- Produces: Gemini extension identifier `maxstat-mcp`
- Produces: secret-safe copy-paste configuration for every supported client

- [ ] **Step 1: Create the Gemini extension**

Create `gemini-extension.json` with the exact object from the approved design:
version `1.2.0`, sensitive `MAXSTAT_API_TOKEN` setting, `httpUrl`, custom
`X-API-Token` header, and `contextFileName: "GEMINI.md"`.

- [ ] **Step 2: Add direct client configurations**

Create the files below:

`configs/codex.toml`

```toml
[mcp_servers.maxstat]
url = "https://maxstat.ru/api/mcp"
env_http_headers = { "X-API-Token" = "MAXSTAT_API_TOKEN" }
```

`configs/claude-code.json`

```json
{
  "mcpServers": {
    "maxstat": {
      "type": "http",
      "url": "https://maxstat.ru/api/mcp",
      "headers": {
        "X-API-Token": "${MAXSTAT_API_TOKEN}"
      }
    }
  }
}
```

`configs/claude-desktop.json`

```json
{
  "mcpServers": {
    "maxstat": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://maxstat.ru/api/mcp",
        "--header",
        "X-API-Token:${MAXSTAT_API_TOKEN}"
      ],
      "env": {
        "MAXSTAT_API_TOKEN": "<API_TOKEN>"
      }
    }
  }
}
```

`configs/cursor.json`

```json
{
  "mcpServers": {
    "maxstat": {
      "url": "https://maxstat.ru/api/mcp",
      "headers": {
        "X-API-Token": "${env:MAXSTAT_API_TOKEN}"
      }
    }
  }
}
```

`configs/windsurf.json`

```json
{
  "mcpServers": {
    "maxstat": {
      "serverUrl": "https://maxstat.ru/api/mcp",
      "headers": {
        "X-API-Token": "${env:MAXSTAT_API_TOKEN}"
      }
    }
  }
}
```

`configs/jetbrains.json`

```json
{
  "mcpServers": {
    "maxstat": {
      "type": "streamable-http",
      "url": "https://maxstat.ru/api/mcp",
      "headers": {
        "X-API-Token": "<API_TOKEN>"
      }
    }
  }
}
```

`configs/vscode.json`

```json
{
  "inputs": [
    {
      "type": "promptString",
      "id": "maxstat-api-token",
      "description": "MaxStat API token",
      "password": true
    }
  ],
  "servers": {
    "maxstat": {
      "type": "http",
      "url": "https://maxstat.ru/api/mcp",
      "headers": {
        "X-API-Token": "${input:maxstat-api-token}"
      }
    }
  }
}
```

`configs/generic-mcp.json` and `mcp-config.example.json`

```json
{
  "mcpServers": {
    "maxstat": {
      "type": "streamable-http",
      "url": "https://maxstat.ru/api/mcp",
      "headers": {
        "X-API-Token": "<API_TOKEN>"
      }
    }
  }
}
```

- [ ] **Step 3: Validate configurations**

Run:

```bash
npm test
npm run validate
node -e '
  const fs = require("fs");
  for (const file of fs.readdirSync("configs").filter((x) => x.endsWith(".json"))) {
    JSON.parse(fs.readFileSync(`configs/${file}`, "utf8"));
  }
'
```

Expected: every JSON file parses. Repository-wide validation may still list
only README/documentation requirements intentionally completed in Task 5.

- [ ] **Step 4: Commit extension and configs**

```bash
git add gemini-extension.json configs mcp-config.example.json
git commit -m "feat: add multiplatform direct client configs"
```

---

### Task 5: Rewrite installation documentation around the package

**Files:**

- Modify: `README.md`
- Modify: `CHANGELOG.md`
- Modify: `CONTRIBUTING.md`
- Modify: `NOTICE`

**Interfaces:**

- Consumes: every manifest and config created in Tasks 2–4
- Produces: canonical RU/EN installation instructions
- Produces: release notes for `1.2.0`

- [ ] **Step 1: Add a Russian-first installation matrix**

At the beginning of `README.md`, after the product introduction, add a
platform table with:

- Codex marketplace source `https://github.com/fbmdata/maxstat-mcp`;
- Claude Code commands:

  ```bash
  claude plugin marketplace add fbmdata/maxstat-mcp
  claude plugin install maxstat@maxstat-plugins
  ```

- VS Code/Copilot marketplace source `fbmdata/maxstat-mcp`;
- Gemini command:

  ```bash
  gemini extensions install https://github.com/fbmdata/maxstat-mcp
  ```

- Cursor configuration and official install link;
- Claude Desktop local-bridge configuration, including its Node.js/npm
  prerequisite and the hosted-connector OAuth limitation;
- Windsurf configuration path and environment-variable requirement;
- JetBrains AI Assistant configuration path and local token replacement;
- generic `server.json`/MCP Registry discovery;
- a direct link to `https://maxstat.ru/dashboard/api` for token creation.

State next to Codex and Claude that `MAXSTAT_API_TOKEN` must exist before the
client starts.

- [ ] **Step 2: Correct Codex authentication documentation**

Remove:

```bash
codex mcp add maxstat \
  --url https://maxstat.ru/api/mcp \
  --bearer-token-env-var MAXSTAT_API_TOKEN
```

Replace it with instructions to merge `configs/codex.toml` into
`~/.codex/config.toml`, showing:

```toml
[mcp_servers.maxstat]
url = "https://maxstat.ru/api/mcp"
env_http_headers = { "X-API-Token" = "MAXSTAT_API_TOKEN" }
```

- [ ] **Step 3: Document package contents and compatibility boundaries**

Add sections explaining:

- one plugin supports Claude Code, VS Code, and GitHub Copilot CLI;
- Codex uses its own manifest and the same shared skill/assets;
- Gemini securely requests the token as an extension setting;
- Cursor, Windsurf, JetBrains, and generic clients use direct configuration;
- Claude Desktop uses a local `mcp-remote` bridge until MaxStat supports OAuth;
- hosted ChatGPT publication awaits OAuth 2.1;
- `server.json` is an MCP Registry manifest, not a Codex marketplace manifest.

- [ ] **Step 4: Update release and contribution documents**

Add `CHANGELOG.md` entry:

```markdown
## [1.2.0] - 2026-07-28

### Added

- Codex and Claude-compatible plugin marketplaces.
- Installable plugin metadata for Codex, Claude Code, VS Code, and GitHub
  Copilot CLI.
- Gemini CLI extension with secure MaxStat token configuration.
- Cursor, VS Code, Codex, Claude Code, Claude Desktop, Windsurf, JetBrains,
  and generic MCP client configs.
- Russian-first MaxStat analytics skill and install-surface brand assets.
- Automated cross-platform manifest and secret-safety validation.

### Fixed

- Corrected Codex authentication to send `MAXSTAT_API_TOKEN` in the required
  `X-API-Token` header instead of `Authorization: Bearer`.
```

Update `CONTRIBUTING.md` with `npm test`, `npm run validate`,
`claude plugin validate`, version consistency, skill naming, and secret-safety
requirements. Update `NOTICE` to explicitly include plugin manifests, skills,
and client configurations within the public integration-file license boundary.

- [ ] **Step 5: Validate and commit documentation**

Run:

```bash
npm test
npm run validate
npx --yes markdownlint-cli2 "**/*.md"
```

Expected: all commands exit `0`.

```bash
git add README.md CHANGELOG.md CONTRIBUTING.md NOTICE
git commit -m "docs: document multiplatform installation"
```

---

### Task 6: Add pull-request validation and harden release publishing

**Files:**

- Create: `.github/workflows/validate-integrations.yml`
- Modify: `.github/workflows/publish-mcp.yml`

**Interfaces:**

- Consumes: `npm test`, `npm run validate`
- Produces: required CI signal before merge
- Produces: version-consistent registry release

- [ ] **Step 1: Add integration validation workflow**

Create `.github/workflows/validate-integrations.yml`:

```yaml
name: Validate integrations

on:
  pull_request:
  push:
    branches:
      - main

permissions:
  contents: read

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - name: Check out the repository
        uses: actions/checkout@v7
      - name: Set up Node.js
        uses: actions/setup-node@v7
        with:
          node-version: "24"
      - name: Install Claude Code
        run: npm install --global @anthropic-ai/claude-code
      - name: Test integration contracts
        run: npm test
      - name: Validate integration manifests
        run: npm run validate
      - name: Validate Claude marketplace and plugin
        run: |
          claude plugin validate . --strict
          claude plugin validate ./plugins/maxstat --strict
      - name: Lint Markdown
        run: npx --yes markdownlint-cli2 "**/*.md"
```

- [ ] **Step 2: Harden publish workflow version checks**

In `.github/workflows/publish-mcp.yml`, add Node setup and run:

```yaml
- name: Test integration contracts
  run: npm test

- name: Validate integration manifests
  run: npm run validate
```

before installing `mcp-publisher`. Extend the tag check to compare the tag
against `server.json`, `package.json`, `gemini-extension.json`, and both plugin
manifests.

- [ ] **Step 3: Validate workflow syntax and commit**

Run:

```bash
npm test
npm run validate
git diff --check
```

Expected: all commands exit `0`.

```bash
git add .github/workflows
git commit -m "ci: validate every integration before release"
```

---

### Task 7: Run isolated installation smoke tests

**Files:**

- Modify only when a smoke test reveals a package defect.

**Interfaces:**

- Consumes: complete release tree
- Produces: evidence that marketplaces and extension loaders accept the package

- [ ] **Step 1: Validate Claude marketplace and plugin**

Run:

```bash
claude plugin validate . --strict
claude plugin validate ./plugins/maxstat --strict
```

Expected: both commands exit `0` with no warnings.

- [ ] **Step 2: Test Codex marketplace in isolated state**

Run with a temporary Codex home:

```bash
MAXSTAT_TEST_CODEX_HOME="$(mktemp -d)"
CODEX_HOME="$MAXSTAT_TEST_CODEX_HOME" \
  codex plugin marketplace add "$(pwd)" --json
CODEX_HOME="$MAXSTAT_TEST_CODEX_HOME" \
  codex plugin list --available --json
CODEX_HOME="$MAXSTAT_TEST_CODEX_HOME" \
  codex plugin add maxstat@maxstat-plugins --json
```

Expected: marketplace add reports `maxstat-plugins`, available plugins include
`maxstat`, and installation succeeds. Delete only the explicit
`MAXSTAT_TEST_CODEX_HOME` temporary directory after confirming its path begins
with the operating system temporary directory.

- [ ] **Step 3: Test Gemini extension in isolated state**

Run with a temporary home and skip interactive settings:

```bash
MAXSTAT_TEST_GEMINI_HOME="$(mktemp -d)"
HOME="$MAXSTAT_TEST_GEMINI_HOME" \
  gemini extensions install "$(pwd)" --consent --skip-settings
HOME="$MAXSTAT_TEST_GEMINI_HOME" \
  gemini extensions list
```

Expected: `maxstat-mcp` appears and the manifest loads. Do not run an MCP tool
without an explicitly provided test token. Delete only the explicit
`MAXSTAT_TEST_GEMINI_HOME` temporary directory after validating its location.

- [ ] **Step 4: Validate the Official MCP Registry manifest**

Install the current `mcp-publisher` binary into an isolated temporary
directory, then run:

```bash
./mcp-publisher validate server.json
```

Expected: validation succeeds for version `1.2.0`.

- [ ] **Step 5: Validate direct-client configuration contracts**

Parse every tracked JSON configuration and confirm the documented placement
and authentication behavior against current official client documentation:

- Claude Desktop: local `mcp-remote` bridge and local environment value;
- Windsurf: `~/.codeium/windsurf/mcp_config.json`, `serverUrl`, and
  `${env:MAXSTAT_API_TOKEN}` interpolation;
- JetBrains: Streamable HTTP JSON under the AI Assistant MCP settings;
- VS Code: password input and HTTP header;
- Cursor: environment-backed custom header.

Do not open a live MCP session without an explicitly supplied test token.

- [ ] **Step 6: Final repository checks**

Run:

```bash
npm test
npm run validate
npx --yes markdownlint-cli2 "**/*.md"
git diff --check
git status --short
```

Expected: all checks pass and only intended committed changes are present.

---

### Task 8: Publish release `1.2.0` and activate discovery

**Files:**

- No additional tracked files unless release verification finds a defect.
- GitHub repository metadata: add topic `gemini-cli-extension`.

**Interfaces:**

- Consumes: verified `main` commit
- Produces: GitHub release/tag `v1.2.0`
- Produces: MCP Registry version `1.2.0`
- Produces: Gemini gallery discovery eligibility

- [ ] **Step 1: Push the verified commits**

```bash
git push origin main
```

Expected: push succeeds and the `Validate integrations` workflow starts.

- [ ] **Step 2: Wait for GitHub Actions**

Run:

```bash
gh run list --repo fbmdata/maxstat-mcp --limit 5
MAXSTAT_RUN_ID="$(
  gh run list \
    --repo fbmdata/maxstat-mcp \
    --workflow validate-integrations.yml \
    --limit 1 \
    --json databaseId \
    --jq '.[0].databaseId'
)"
gh run watch "$MAXSTAT_RUN_ID" \
  --repo fbmdata/maxstat-mcp \
  --exit-status
```

Expected: `Validate integrations` completes successfully.

- [ ] **Step 3: Add Gemini discovery topic**

Run:

```bash
gh repo edit fbmdata/maxstat-mcp \
  --add-topic gemini-cli-extension
```

Expected: repository topics include `gemini-cli-extension`.

- [ ] **Step 4: Create and push the release tag**

```bash
git tag -a v1.2.0 -m "MaxStat MCP v1.2.0"
git push origin v1.2.0
gh release create v1.2.0 \
  --repo fbmdata/maxstat-mcp \
  --title "MaxStat MCP v1.2.0 — multiplatform package" \
  --notes-from-tag
```

Expected: the tag and GitHub release exist.

- [ ] **Step 5: Verify registry publishing**

Wait for `Publish to MCP Registry`:

```bash
gh run list --repo fbmdata/maxstat-mcp --workflow publish-mcp.yml --limit 3
MAXSTAT_PUBLISH_RUN_ID="$(
  gh run list \
    --repo fbmdata/maxstat-mcp \
    --workflow publish-mcp.yml \
    --limit 1 \
    --json databaseId \
    --jq '.[0].databaseId'
)"
gh run watch "$MAXSTAT_PUBLISH_RUN_ID" \
  --repo fbmdata/maxstat-mcp \
  --exit-status
curl -fsSL \
  "https://registry.modelcontextprotocol.io/v0.1/servers?search=io.github.fbmdata/maxstat-mcp"
```

Expected: the workflow succeeds and registry results include version `1.2.0`.

- [ ] **Step 6: Verify remote installation from GitHub**

Use fresh temporary homes and repeat the Codex, Claude, and Gemini marketplace
or extension install commands against `fbmdata/maxstat-mcp`, not the local
path. Expected: each client resolves version `1.2.0`.

---

### Task 9: Complete platform listing, directory submissions, and handoff

**Files:**

- Create: `docs/catalog-submissions.md`
- Modify: `README.md` if a verified production install link differs from the
  locally generated link.

**Interfaces:**

- Consumes: public `v1.2.0` repository and manifests
- Produces: verified install links and auditable directory submissions

- [ ] **Step 1: Generate and verify Cursor install link**

Use Cursor's official MCP install-link builder with this server definition:

```json
{
  "mcpServers": {
    "maxstat": {
      "url": "https://maxstat.ru/api/mcp",
      "headers": {
        "X-API-Token": "${env:MAXSTAT_API_TOKEN}"
      }
    }
  }
}
```

Open the generated link in Cursor, verify the preview contains the MaxStat URL
and header name but no token value, and place the verified link behind the
`Add to Cursor` badge in `README.md`.

- [ ] **Step 2: Verify VS Code and Copilot discovery**

Add `fbmdata/maxstat-mcp` to `chat.plugins.marketplaces` in a test VS Code
profile and confirm `maxstat@maxstat-plugins` appears. Confirm GitHub Copilot
CLI discovers the same Claude-format plugin.

- [ ] **Step 3: Verify Gemini gallery eligibility**

Confirm:

```bash
gh repo view fbmdata/maxstat-mcp --json isPrivate,repositoryTopics
gh release view v1.2.0 --repo fbmdata/maxstat-mcp
```

Expected: repository is public, topic `gemini-cli-extension` is present, and
the release is published. Gemini's daily crawler requires no manual form.

- [ ] **Step 4: Submit to Cursor's curated MCP list**

Use Cursor's official submission link from the MCP tools directory. Submit:

- name: `MaxStat MCP`;
- publisher: `ООО «ФБМ Аналитикс» / FBM Analytics`;
- repository: `https://github.com/fbmdata/maxstat-mcp`;
- website: `https://maxstat.ru/promo/mcp`;
- endpoint: `https://maxstat.ru/api/mcp`;
- transport: `Streamable HTTP`;
- authentication: required secret header `X-API-Token`;
- capability summary: search and analytics for MAX channels and publications,
  daily audience/view/reaction histories, forwards, webhook monitoring, and
  account credit usage.

Do not submit a token or screenshot containing a token.

- [ ] **Step 5: Inventory and submit to active MCP directories**

Search for currently active directories and submission routes immediately
before release. At minimum, inspect and submit where available:

- `https://mcpdb.ru/submit/server`;
- `https://mcpservers.org/ru/submit`;
- the Official MCP Registry;
- Cursor's MCP directory;
- Smithery, Glama, MCP.so, PulseMCP, and other discoverable directories whose
  submission forms accept a hosted Streamable HTTP server or a public GitHub
  repository.

Use one canonical bilingual submission packet with the exact publisher,
website, repository, endpoint, authentication header, transport, license
boundary, 21-tool capability summary, and approved logo. Do not create paid
plans, publish secrets, or accept materially different third-party terms
without explicit user authorization.

Create `docs/catalog-submissions.md` with one row per directory:

- directory and submission URL;
- submission date;
- submitted account identity;
- resulting listing URL or moderation ticket;
- status: `published`, `pending`, `not eligible`, or `blocked`;
- factual reason for any non-published status.

- [ ] **Step 6: Final public verification**

Verify the public repository tree, README badges/links, marketplace manifests,
GitHub release, workflow results, Official MCP Registry result, and repository
topics. Record any directory with asynchronous moderation as pending rather
than claiming publication.

---

## Plan self-review

- Spec coverage: every included platform, auth rule, skill, asset, config,
  validation, release, and discovery requirement maps to Tasks 1–9.
- Placeholder scan: no implementation field, version, URL, header, filename,
  command, or expected result is left unspecified.
- Type consistency: every task uses release `1.2.0`, endpoint
  `https://maxstat.ru/api/mcp`, header `X-API-Token`, environment variable
  `MAXSTAT_API_TOKEN`, marketplace `maxstat-plugins`, and plugin `maxstat`.
- Scope consistency: OAuth and hosted ChatGPT publication remain explicitly
  outside this release and do not block the local multiplatform package.
