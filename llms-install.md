# Install MaxStat MCP

Use this file when an AI agent or Cline is asked to install MaxStat MCP.

MaxStat is a hosted Streamable HTTP server. Do not clone, build, or run a local
package. There is no `maxstat-mcp` npm executable.

## Prerequisites

1. Create an API token in <https://maxstat.ru/dashboard/api>.
2. Store it in the `MAXSTAT_API_TOKEN` environment variable.
3. Never print the token, paste it into chat, or commit it to a repository.

## Cline configuration

Add this server to Cline's MCP settings:

```json
{
  "mcpServers": {
    "maxstat": {
      "type": "streamableHttp",
      "url": "https://maxstat.ru/api/mcp",
      "headers": {
        "X-API-Token": "${env:MAXSTAT_API_TOKEN}"
      },
      "disabled": false
    }
  }
}
```

Cline expands `${env:MAXSTAT_API_TOKEN}` locally before connecting. Keep the
placeholder in the settings file and supply the real value through the process
environment.

For the Cline CLI, the interactive equivalent is:

```bash
cline mcp install maxstat --transport http https://maxstat.ru/api/mcp
```

Choose **Static headers** and enter `X-API-Token` with the local token value.
For a reusable setup, prefer the environment-backed JSON above.

## Verification

After reconnecting, verify all of the following:

1. The MCP initialization handshake succeeds with a protocol version supported
   by both client and server.
2. `tools/list` returns the 15 MaxStat tools listed in the
   [tool reference](README.md#инструменты-mcp); compare names as well as count.
3. The read-only `get_account_limits` call returns the current account limits.
4. `get_categories` returns the live MAX channel categories.

If the server returns `401`, check that the header name is exactly
`X-API-Token` and that the local token is valid. The supplied configurations
use that header; keep it when installing from these examples.

If an old webhook-subscription call returns `Unknown tool`, refresh the client's
tool list. Those six operations were removed. `get_account_subscription` is
still supported and reports billing information.

## What the connection provides

The tools cover MAX channel and post search, channel cards, subscriber/view/
reaction/activity history, post metrics, detected reposts, and account credit
usage. Monitoring and webhooks are configured separately in the
[dashboard](https://maxstat.ru/dashboard/monitoring), outside MCP. Adding a
channel with `add_channel` does not create a monitor. The full reference is in
[README.md](README.md#инструменты-mcp).
