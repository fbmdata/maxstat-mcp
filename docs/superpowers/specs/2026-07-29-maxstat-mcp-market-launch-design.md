# MaxStat MCP Market Launch Design

Date: 2026-07-29
Status: approved for implementation

## Goal

Finish the five approved launch tasks:

1. correct the ServerHub listing so it describes the hosted Streamable HTTP
   server instead of a nonexistent npm package;
2. publish public MCP discovery metadata on `maxstat.ru`;
3. finish the 402.ad submission;
4. verify installation in Cline and submit MaxStat MCP to Cline Marketplace;
5. publish a compact Russian launch kit with three practical use cases and a
   short demo video.

## Product truth

- Product: MaxStat MCP.
- Operator: ООО «ФБМ Аналитикс» / FBM Analytics.
- Public endpoint: `https://maxstat.ru/api/mcp`.
- Transport: Streamable HTTP.
- Authentication: API key in the `X-API-Token` request header.
- Secret source for clients: `MAXSTAT_API_TOKEN`.
- The public repository is an integration and documentation package. It does
  not claim that the hosted server implementation or MaxStat data is open
  source.
- The public launch materials must explain the actual data surface: MAX channel
  discovery, channel and post cards, audience/view/reaction/activity history,
  detected reposts, keyword and channel webhook monitoring, account limits and
  usage.

## Discovery design

Publish one server-card payload at both URLs:

- `https://maxstat.ru/.well-known/mcp.json`
- `https://maxstat.ru/.well-known/mcp/server-card.json`

The first path follows the main endpoint named by the current draft proposal.
The second preserves compatibility with the later nested path described in the
same draft. Both responses must:

- use HTTPS and `application/json`;
- allow browser discovery with `Access-Control-Allow-Origin: *`;
- be cacheable for one hour;
- name the 2025-06-18 MCP protocol and Streamable HTTP transport;
- point to `/api/mcp`, the public documentation, icon and GitHub repository;
- state that authentication is required through `X-API-Token`;
- advertise tools as dynamic instead of duplicating schemas that can drift;
- contain no credential, internal address or user-specific data.

Because the published schema URL in the draft currently returns 404, the card
will not include a misleading `$schema` reference. A compatibility test will
lock both public routes to the same payload and headers.

## Cline design

Add `llms-install.md` at the repository root. It will give an agent a single,
safe installation recipe for a hosted HTTP server:

- no clone/build/npm step;
- use `https://maxstat.ru/api/mcp`;
- use the `X-API-Token` header;
- obtain the value from `MAXSTAT_API_TOKEN`;
- verify initialization, tool discovery and one read-only account call;
- never print, commit or embed the key in documentation.

Use an isolated Cline CLI data directory for the live check. The test credential
must remain only in temporary local state and be removed after verification.
The Marketplace issue will contain the GitHub URL, a 400×400 PNG logo, a concise
reason for inclusion and an honest confirmation of the installation test.

## Directory submissions

### ServerHub

The corrected listing must describe MaxStat as a hosted remote MCP server. It
must not display `npx -y maxstat-mcp`. The desired client configuration is:

```json
{
  "url": "https://maxstat.ru/api/mcp",
  "headers": {
    "X-API-Token": "${MAXSTAT_API_TOKEN}"
  }
}
```

If the directory has no public edit API, use its authenticated author workflow.
Do not create a duplicate listing merely to hide the incorrect one.

### 402.ad

Complete the prepared submission with the canonical name, description, endpoint,
repository and logo. A human-only CAPTCHA is the only acceptable interactive
handoff; all other form work and result verification remain in scope.

## Russian launch kit

Create a durable `docs/launch-kit.ru.md` with:

- a short announcement for Telegram/MAX;
- a longer launch post for Habr/VC/LinkedIn-like surfaces;
- a 30-second demo script;
- three ready-to-run use cases:
  1. market and competitor channel discovery;
  2. publication and engagement analysis;
  3. automated keyword/channel monitoring through webhooks;
- a clear “what the MCP returns” section and setup CTA.

Create a silent 1920×1080 H.264 MP4 and a compact GIF preview from repository
brand assets. The video should use evergreen rounded figures (`367K+` channels,
`85M+` posts, `21` tools) and show no key or private account data. Keep the
rendering script so the asset is reproducible.

## Verification

- repository unit tests and integration validation;
- Markdown lint;
- site route contract test, frontend CI checks, typecheck and production build;
- live HTTPS checks for both discovery paths, headers and identical JSON;
- live MCP initialization, tool listing and one read-only authenticated call;
- Cline isolated-profile installation and tool availability;
- `ffprobe` checks for codec, dimensions and duration;
- remote checks for the created/updated directory entries and Cline issue.

## Security and release boundaries

- Never write the supplied test token to a tracked file.
- Never echo the token in logs or final reporting.
- Use a clean worktree for the site because the existing local checkout has
  unrelated user changes.
- Release the GitHub integration package through its existing main-branch
  workflow.
- Release the production discovery routes through the MaxStat production
  pipeline; verify the deployment itself and the live URLs before declaring the
  task complete.
