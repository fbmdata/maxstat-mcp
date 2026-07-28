# MaxStat MCP Multiplatform Package Design

## Status

Approved on 2026-07-28. This document defines the implementation and release
contract for the multiplatform package.

## Goal

Package the hosted MaxStat MCP server as an installable, discoverable
integration for Codex, Claude Code, Visual Studio Code, GitHub Copilot CLI,
Gemini CLI, Cursor, Claude Desktop, Windsurf, JetBrains AI Assistant, and
generic MCP clients while keeping one public GitHub repository and one
canonical product description.

## Release scope

Version `1.2.0` will add distribution metadata and agent guidance. It does not
change the hosted MCP endpoint or its 21-tool data contract.

Included:

- Codex marketplace and plugin manifests;
- Claude Code marketplace and plugin manifests;
- one Claude-format plugin that is also discoverable by VS Code and GitHub
  Copilot CLI;
- a Gemini CLI extension manifest with secure token collection;
- direct copy-paste configurations for Cursor, VS Code, Claude Desktop,
  Windsurf, JetBrains AI Assistant, and generic clients, plus install links
  where the client supports them;
- a reusable Russian-first MaxStat analytics skill;
- verified branding, icons, and logos suitable for plugin install surfaces;
- automated validation of manifests, paths, versions, endpoint URLs, header
  names, skill metadata, and secret hygiene;
- updated bilingual documentation, changelog, contribution guidance, and
  release automation;
- publication metadata for the Official MCP Registry and Gemini CLI extension
  gallery.

Not included:

- changes to the proprietary MaxStat server implementation or data;
- OAuth 2.1 implementation;
- publication to the universal hosted ChatGPT plugin directory, because hosted
  ChatGPT cannot accept a user-provided `X-API-Token`;
- publishing a MaxStat npm package or bundling a proprietary proxy process;
- hardcoded credentials or example strings that resemble real credentials.

## Product positioning

The package is Russian-first and bilingual.

- Product name: `MaxStat MCP`.
- Publisher: `ООО «ФБМ Аналитикс» / FBM Analytics`.
- Primary interface copy: Russian.
- Catalog-safe machine metadata: concise English where a global ecosystem
  expects it.
- Brand color: `#4830E6`.
- Website: `https://maxstat.ru/promo/mcp`.
- Repository: `https://github.com/fbmdata/maxstat-mcp`.
- MCP endpoint: `https://maxstat.ru/api/mcp`.
- Authentication header: `X-API-Token`.
- Token environment variable: `MAXSTAT_API_TOKEN`.
- Release version: `1.2.0`.

The skill and install-surface copy must state exactly what users can retrieve:
channel discovery and profiles, daily audience histories, views, reactions,
publishing activity, full-text post search, post content and attachments,
reaction breakdowns, forwards, webhook monitoring, and account/credit usage.

## Repository architecture

```text
maxstat-mcp/
├── .agents/
│   └── plugins/
│       └── marketplace.json
├── .claude-plugin/
│   └── marketplace.json
├── .github/
│   └── workflows/
│       ├── publish-mcp.yml
│       └── validate-integrations.yml
├── assets/
│   ├── maxstat-icon.png
│   └── maxstat-logo.png
├── configs/
│   ├── claude-code.json
│   ├── claude-desktop.json
│   ├── codex.toml
│   ├── cursor.json
│   ├── generic-mcp.json
│   ├── jetbrains.json
│   ├── windsurf.json
│   └── vscode.json
├── docs/
│   └── superpowers/
│       ├── plans/
│       └── specs/
├── plugins/
│   └── maxstat/
│       ├── .claude-plugin/
│       │   └── plugin.json
│       ├── .codex-plugin/
│       │   └── plugin.json
│       ├── assets/
│       │   ├── maxstat-icon.png
│       │   └── maxstat-logo.png
│       ├── skills/
│       │   └── maxstat-analytics/
│       │       └── SKILL.md
│       └── .mcp.json
├── scripts/
│   └── validate-integrations.mjs
├── CHANGELOG.md
├── CONTRIBUTING.md
├── GEMINI.md
├── README.md
├── gemini-extension.json
├── package.json
└── server.json
```

The plugin lives under `plugins/maxstat` so marketplace installation copies a
small, self-contained bundle instead of the whole repository. The repository
root remains the Gemini CLI extension root because the Gemini gallery requires
`gemini-extension.json` at the absolute repository root.

## Platform contracts

### Codex

`.agents/plugins/marketplace.json` exposes the local plugin at
`./plugins/maxstat`. The plugin entry uses:

- `name: "maxstat"`;
- `policy.installation: "AVAILABLE"`;
- `policy.authentication: "ON_INSTALL"`;
- `category: "Data & Analytics"`.

`plugins/maxstat/.codex-plugin/plugin.json` provides publisher, website,
repository, license, Russian interface copy, starter prompts, brand assets,
the skill path, and an inline `mcpServers` map:

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

This intentionally does not use `bearer_token_env_var`, because that option
sends `Authorization: Bearer ...`, while MaxStat requires `X-API-Token`.

### Claude Code, VS Code, and GitHub Copilot CLI

`.claude-plugin/marketplace.json` exposes the same
`./plugins/maxstat` directory. VS Code and GitHub Copilot CLI can consume this
Claude-compatible marketplace and plugin format. The marketplace has its own
release version; the plugin entry does not duplicate the plugin version from
`plugin.json`, preventing stale marketplace metadata from masking updates.

`plugins/maxstat/.claude-plugin/plugin.json` points to `./.mcp.json` and
`./skills/`. The shared `.mcp.json` uses:

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

Users set `MAXSTAT_API_TOKEN` before starting the client. No token is written
to the repository or plugin cache.

### Gemini CLI

`gemini-extension.json` embeds the remote MCP definition:

```json
{
  "name": "maxstat-mcp",
  "version": "1.2.0",
  "description": "Аналитика каналов и публикаций MAX / MAX channel and publication analytics.",
  "settings": [
    {
      "name": "MaxStat API token",
      "description": "Create a token at https://maxstat.ru/dashboard/api",
      "envVar": "MAXSTAT_API_TOKEN",
      "sensitive": true
    }
  ],
  "mcpServers": {
    "maxstat": {
      "httpUrl": "https://maxstat.ru/api/mcp",
      "headers": {
        "X-API-Token": "${MAXSTAT_API_TOKEN}"
      }
    }
  },
  "contextFileName": "GEMINI.md"
}
```

Gemini CLI prompts for the setting at installation, stores a sensitive value
in the system keychain, and hydrates it into the MCP header. `GEMINI.md`
provides the same Russian-first workflows as the reusable skill without
duplicating unsupported Gemini skill layout inside the repository root.

### Cursor

`configs/cursor.json` contains the remote server and an environment-backed
header. The README and landing page receive an official `Add to Cursor` link
generated from the same endpoint and header configuration. Because the
existing authentication is not OAuth, documentation still explains where to
create and set `MAXSTAT_API_TOKEN`.

### Claude Desktop

Claude Desktop's cloud-hosted custom connectors do not accept an arbitrary
user-supplied `X-API-Token`. Until MaxStat supports OAuth 2.1,
`configs/claude-desktop.json` uses the local `mcp-remote` bridge, passes the
token through `MAXSTAT_API_TOKEN`, and never embeds a credential in the
repository. The README labels Node.js/npm as a prerequisite and distinguishes
this local bridge from Claude's hosted connector directory.

### Windsurf

`configs/windsurf.json` uses the documented remote HTTP `serverUrl` field and
Windsurf's `${env:MAXSTAT_API_TOKEN}` interpolation inside the
`X-API-Token` header. Users merge it into
`~/.codeium/windsurf/mcp_config.json`.

### JetBrains AI Assistant

`configs/jetbrains.json` uses Streamable HTTP with the MaxStat URL and the
required custom header. JetBrains does not document environment interpolation
for MCP headers, so the tracked file contains only `<API_TOKEN>` and the
README tells users to replace it inside their local IDE configuration. The
configuration is added under **Settings → Tools → AI Assistant → Model
Context Protocol (MCP)**.

### Visual Studio Code direct MCP installation

`configs/vscode.json` uses VS Code input variables so the token is requested
once and stored securely:

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

### Official MCP Registry and generic clients

`server.json` remains the canonical registry metadata and moves to version
`1.2.0`. Its required secret-header declaration remains unchanged.
`configs/generic-mcp.json`, `configs/jetbrains.json`, and
`mcp-config.example.json` remain copy-paste examples with `<API_TOKEN>`, never
a real credential.

## Agent guidance

`plugins/maxstat/skills/maxstat-analytics/SKILL.md` is a usage skill, not a
replacement for tool schemas. It tells the agent to:

1. discover categories or channels before requesting histories;
2. resolve stable channel and post identifiers before analytics calls;
3. distinguish current values from daily histories;
4. report the measurement period and credit cost when material;
5. label sampled real values with the observation date;
6. avoid claiming that MaxStat indexes private content unavailable to the
   authenticated account;
7. confirm a public HTTPS callback before creating webhooks;
8. check plan and remaining credits before expensive batches;
9. return source URLs and separate facts from interpretations.

The skill includes Russian-first workflows for market research, competitor
comparison, channel selection, publication search, growth analysis,
engagement analysis, repost tracing, webhook monitoring, and usage control.

## Validation and CI

`scripts/validate-integrations.mjs` performs deterministic local checks:

- parse every JSON manifest and configuration;
- assert version `1.2.0` across release-bearing manifests (the Codex
  marketplace itself has no undocumented top-level version field);
- assert the endpoint is exactly `https://maxstat.ru/api/mcp`;
- assert authenticated configurations use `X-API-Token`;
- reject `bearer_token_env_var` and `Authorization` for MaxStat;
- reject hardcoded values for token-bearing keys;
- confirm every marketplace source and manifest asset path exists;
- confirm the two marketplace entries resolve to `plugins/maxstat`;
- confirm required skill frontmatter and Russian guidance sections;
- confirm `server.json` still declares a required secret header;
- confirm README install commands match the checked-in configurations.

CI runs:

```bash
npm test
npm run validate
npx --yes markdownlint-cli2 "**/*.md"
claude plugin validate . --strict
claude plugin validate ./plugins/maxstat --strict
```

The official `mcp-publisher validate server.json` remains part of release
publishing. Codex marketplace add/install and Gemini extension install are
smoke-tested with isolated temporary configuration directories so developer
settings are not modified.

## Release and discovery

The release sequence is:

1. merge the validated package to `main`;
2. add the GitHub topic `gemini-cli-extension`;
3. tag and publish `v1.2.0`;
4. let the existing GitHub Actions workflow publish `server.json` `1.2.0` to
   the Official MCP Registry;
5. verify the Codex and Claude marketplaces can be added from
   `fbmdata/maxstat-mcp`;
6. verify Gemini installs from the GitHub repository and wait for its daily
   gallery crawler;
7. generate and test the Cursor installation link;
8. submit MaxStat to Cursor's curated MCP list and every verified active MCP
   directory, including the requested `mcpdb.ru` and `mcpservers.org`
   submission forms, using the same canonical description and capability
   list;
9. record every submission URL, date, status, and moderation result in a
   public catalog ledger without claiming approval before it occurs.

## Security and licensing

- API tokens are never committed, logged, placed in screenshots, or embedded
  in install links.
- Secret prompts use the platform's secure input or keychain mechanism when it
  exists.
- The MIT license covers only the public integration files in this repository.
- The hosted MaxStat service, server implementation, and MaxStat data remain
  proprietary, as stated in `NOTICE` and `README.md`.
- Plugin metadata links to `SECURITY.md`, the MaxStat website, and the existing
  service terms/privacy pages where the platform supports those fields.

## Known limitation and next phase

The package can be installed locally with `X-API-Token`, but it cannot become a
fully hosted public ChatGPT plugin with that authentication model. A separate
phase must add MCP-compatible OAuth 2.1, token issuance, refresh, revocation,
dynamic or client-ID metadata, and platform callback testing. That phase is
not required for the `1.2.0` multiplatform developer package.
