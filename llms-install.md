# Install MaxStat MCP

Follow these steps when installing MaxStat MCP for an AI agent or Cline.

MaxStat runs as a hosted Streamable HTTP server. Connect to its URL; no local
clone, build, or package is needed. There is no `maxstat-mcp` npm executable.

## Prerequisites

1. Create an API token in <https://maxstat.ru/dashboard/api>.
2. Store it in the `MAXSTAT_API_TOKEN` environment variable.
3. Keep the token out of logs, chat messages, and repository files.

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

Cline reads `${env:MAXSTAT_API_TOKEN}` from its process environment before
connecting. Keep the placeholder in settings and set the token locally.

For interactive installation with the Cline CLI, run:

```bash
cline mcp install maxstat --transport http https://maxstat.ru/api/mcp
```

Choose **Static headers** and enter `X-API-Token` with the local token value.
Use the JSON configuration above to keep the token in an environment variable.

## Verification

Reconnect, then check:

1. MCP initialization succeeds with a protocol version that both client
   and server support.
2. `tools/list` returns the 15 MaxStat tools in the
   [tool reference](README.md#инструменты-mcp). Compare their names, not just the count.
3. The read-only `get_account_limits` call returns your account limits.
4. `get_categories` returns the current MAX channel categories.

For `401` errors, check the token and the exact header name: `X-API-Token`.
Keep this header when using the supplied configurations.

For `Unknown tool` errors from old webhook-subscription calls, refresh the
client's tool list and remove those calls. The six subscription operations
were removed. `get_account_subscription` still returns billing information.

## What the connection provides

Search MAX channels and posts, read channel profiles, track subscribers,
views, reactions, and publishing activity, inspect post metrics and detected
reposts, and check account credit usage.

Set up monitoring and webhooks separately in the
[dashboard](https://maxstat.ru/dashboard/monitoring). They are outside MCP.
Calling `add_channel` queues a channel for collection; it does not create a monitor.
See the [full tool reference](README.md#инструменты-mcp).
