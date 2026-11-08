# Changelog

Changes to the public MaxStat MCP integration. For service and public API news,
see [MaxStat updates](UPDATES.md) (Russian).

## [Unreleased]

### Changed

- Rewrote descriptions, setup guides, plugin text, and demo captions in plain language.
- Updated the index snapshot to November 8, 2026: 672,837 channels,
  155,837,316 posts, and 42 categories.
- Updated both README languages and the demo from the same dated snapshot.

### Added

- A service, public API, and MCP news log linked from README.
- Instructions for MAX, Telegram, and Webhook notifications, with separate
  messenger delivery limits.
- A counter refresh command that can import dated browser HTML when the public
  page requires a CAPTCHA. Failed reads and renders leave the previous files intact.
- A demo renderer that works across environments, plus checks that README
  and GIF statistics match `data/index-stats.json`.

## [1.2.4] - 2026-11-08

### Fixed

- Updated the tool reference to cover all 15 public API operations. Removed six
  retired webhook-subscription tools from tool tables and agent workflows.
  Kept `get_account_subscription` for billing information.
- Removed webhook-management claims from plugin and registry descriptions.
- Corrected the claim that the server rejects Bearer authentication.
  The supplied configurations still use `X-API-Token`.
- Marked July production index figures as historical. Removed Test Drive renewal
  terms that lacked a source.
- Rebuilt the README demo around 15 tools and dashboard monitoring.

### Added

- Dashboard monitoring instructions covering paid slots, paused monitors,
  50 query phrases, filters for 100 channels, 1,000 daily events, notification
  recipients, optional HTTPS webhooks, delivery limits, and 90-day history.
- Instructions for string IDs, pagination limits, deleted posts, UTF-16 text
  links, forward lookup, credit usage, errors, and growth-ranking samples.
- Checks for tool names and credit costs in README and the analytics skill.
- An optional `npm run check:api` command to compare the REST contract with the
  public OpenAPI schema. It needs no credentials and makes no paid requests.
  Check authenticated MCP discovery separately in the client.

## [1.2.3] - 2026-07-29

### Changed

- Rebuilt the public demo as a short Russian-first walkthrough with index scale,
  MCP capabilities, and connection instructions.
- Shortened the demo from 34 to 15 seconds and adjusted its layout for GitHub
  and advertising previews.
- Added checks for GIF dimensions, duration, frame count, file size, and integrity.

## [1.2.2] - 2026-07-29

### Changed

- Replaced staging index figures with the production snapshot:
  408,501 channels and 86,315,758 posts.
- Updated the production data example with audience growth, post engagement,
  and detected forwards.
- Added tests to keep staging figures out of the public README.

## [1.2.1] - 2026-07-29

### Changed

- Removed unneeded root assets and the duplicate generic MCP configuration.
- Pinned versions for GitHub Actions, the Claude Desktop bridge, Claude validator,
  Markdown linter, and MCP Registry publisher.
- Added checksum validation for the downloaded MCP Registry publisher.
- Extended secret checks to every public text file.
- Added compatibility and feature-request forms, plus README installation guidance.

## [1.2.0] - 2026-07-28

### Added

- Codex and Claude-compatible plugin marketplaces.
- Plugin metadata for Codex, Claude Code, VS Code, and GitHub Copilot CLI.
- A Gemini CLI extension that treats the MaxStat token as a secret.
- Configurations for Cursor, VS Code, Codex, Claude Code, Claude Desktop,
  Windsurf, JetBrains AI Assistant, and generic MCP clients.
- A Russian-first MaxStat analytics skill with all 21 tools and common research workflows.
- FBM Analytics brand assets for plugin installation screens.
- Tests for manifests, paths, versions, and secrets across platforms.

### Changed

- Put Russian installation and capability documentation first, for users in Russia
  and the CIS.
- Clarified the MIT license scope: the public integration package. The hosted
  service, server code, data, and trademarks are excluded.

### Fixed

- Changed Codex authentication to send `MAXSTAT_API_TOKEN` in `X-API-Token`
  instead of `Authorization: Bearer`.

## [1.1.0] - 2026-07-28

### Added

- A reference for all 21 MCP tools, including webhook monitoring and account usage.
- A data contract for channel profiles, audience history, engagement, publishing
  activity, post content, attachments, reactions, and forwards.
- Index scale and a real-data response example dated 2026-07-28.
- Credit costs for every MCP operation and webhook delivery.

### Changed

- Expanded the Official MCP Registry description with MaxStat data and monitoring tools.
- Updated English and Russian prompts for research, monitoring, and usage control.

## [1.0.0] - 2026-07-28

### Added

- Documentation for the public Streamable HTTP endpoint.
- Connection examples for Claude Code, Codex CLI, Cursor, Claude Desktop,
  and generic MCP clients.
- An Official MCP Registry `server.json` manifest.
- A tool reference, example prompts, security policy, and contribution guide.
