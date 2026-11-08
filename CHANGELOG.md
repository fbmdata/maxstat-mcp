# Changelog

All notable public changes to the MaxStat MCP integration will be documented in
this file.

## [1.2.4] - 2026-11-08

### Fixed

- Aligned the current tool reference with all 15 operations in the public API.
  Removed six retired webhook-subscription tools from supported-tool tables
  and agent workflows; retained the billing `get_account_subscription` tool.
- Removed webhook-management claims from plugin and registry descriptions.
- Corrected the claim that the server rejects Bearer authentication; shipped
  integrations continue to use the `X-API-Token` header.
- Kept July production index figures explicitly historical and removed
  unverified Test Drive renewal terms.
- Rebuilt the README demo with 15 tools and dashboard monitoring clearly
  separated from MCP analytics.

### Added

- Dashboard monitoring guidance: paid slots, paused monitors, 50 query phrases,
  filters for 100 channels, 1,000 daily events, notification recipients,
  optional HTTPS webhooks, delivery limits, and 90-day history.
- Guidance for string IDs, pagination limits, deleted posts, UTF-16 text links,
  explicit forward lookup, credit usage, errors, and growth-ranking samples.
- Exact tool and credit-cost validation for both README and analytics skill.
- An opt-in `npm run check:api` check against the public OpenAPI schema, with
  no credentials or credit-consuming requests. This checks the REST contract;
  authenticated MCP discovery remains a separate installation check.

The current reference was checked against source and public OpenAPI on
November 8, 2026. Source changes to notification recipients do not by themselves
establish that a delivery method is enabled in the live dashboard.

## [1.2.3] - 2026-07-29

### Changed

- Rebuilt the public demo as a concise Russian-first product walkthrough with
  evergreen index scale, clearer MCP capabilities, and a focused connection
  call to action.
- Reduced the demo from 34 to 15 seconds and improved its layout for GitHub and
  advertising previews.
- Added automated validation for GIF dimensions, duration, frame count, file
  size, and structural integrity.

## [1.2.2] - 2026-07-29

### Changed

- Replaced staging-derived index figures with a verified production snapshot:
  408,501 channels and 86,315,758 posts.
- Refreshed the real-data example from production, including audience growth,
  post engagement, and detected forwards.
- Added regression coverage that prevents staging figures from returning to the
  public README.

## [1.2.1] - 2026-07-29

### Changed

- Removed redundant root assets and the duplicate generic MCP configuration.
- Pinned GitHub Actions, Claude Desktop bridge, Claude validator, Markdown
  linter, and MCP Registry publisher versions.
- Added checksum verification for the downloaded MCP Registry publisher.
- Expanded secret-safety validation to every public text file.
- Added focused compatibility and feature-request forms plus a
  conversion-oriented README entry point.

## [1.2.0] - 2026-07-28

### Added

- Codex and Claude-compatible plugin marketplaces.
- Installable plugin metadata for Codex, Claude Code, VS Code, and GitHub
  Copilot CLI.
- Gemini CLI extension with sensitive MaxStat token configuration.
- Direct configurations for Cursor, VS Code, Codex, Claude Code, Claude
  Desktop, Windsurf, JetBrains AI Assistant, and generic MCP clients.
- Russian-first MaxStat analytics skill covering all 21 tools and common
  research workflows.
- Verified FBM Analytics brand assets for plugin installation surfaces.
- Automated cross-platform manifest, path, version, and secret-safety tests.

### Changed

- Reworked the README around Russian and CIS users, with Russian-first
  installation and capability documentation.
- Clarified that MIT covers the public integration package, not the hosted
  MaxStat service, server implementation, data, or trademarks.

### Fixed

- Corrected Codex authentication to send `MAXSTAT_API_TOKEN` in the required
  `X-API-Token` header instead of `Authorization: Bearer`.

## [1.1.0] - 2026-07-28

### Added

- Complete reference for all 21 MCP tools, including webhook monitoring and
  account usage.
- Explicit data contract for channel profiles, audience history, engagement,
  publishing activity, post content, attachments, reactions, and forwards.
- Verified index scale and a real-data response example dated 2026-07-28.
- Credit costs for every MCP operation and webhook delivery.

### Changed

- Expanded the Official MCP Registry description to state the data and
  monitoring capabilities available through MaxStat MCP.
- Improved English and Russian example prompts for research, monitoring, and
  usage control.

## [1.0.0] - 2026-07-28

### Added

- Public Streamable HTTP endpoint documentation.
- Connection examples for Claude Code, Codex CLI, Cursor, Claude Desktop, and
  generic MCP clients.
- Official MCP Registry `server.json` manifest.
- Tool reference, example prompts, security policy, and contribution guide.
