# MaxStat MCP

[![MCP](https://img.shields.io/badge/MCP-Streamable%20HTTP-6f42c1)](https://modelcontextprotocol.io/)
[![MaxStat](https://img.shields.io/badge/MaxStat-MAX%20analytics-7c3aed)](https://maxstat.ru/promo/mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**The official remote MCP server for analytics of channels and posts in the MAX messenger.**

[English](#english) · [Русский](#русский)

> The MCP server is hosted by MaxStat. This repository contains its public
> manifest, connection examples, and documentation; the server-side
> implementation and MaxStat data are not published here.

## English

Connect [MaxStat](https://maxstat.ru/) to Codex, Claude Code, Cursor, Claude
Desktop, or any Streamable HTTP MCP client. An AI agent can search MAX channels
and posts, inspect audience and engagement metrics, compare performance over
time, and use the results in reports, research, and product prototypes.

### What you can do

- Find channels by name, description, link, category, audience size, or post count.
- Search posts by text, channel, format, date, views, or likes.
- Track subscriber growth, views, reactions, and publishing activity.
- Compare channels and prepare structured analytics.
- Add a public or invite-only MAX channel to the MaxStat tracking queue.
- Use current MAX data while building dashboards, reports, and prototypes.

### Connection details

| Parameter | Value |
| --- | --- |
| Endpoint | `https://maxstat.ru/api/mcp` |
| Transport | Streamable HTTP |
| Authentication | API token |
| Header | `X-API-Token: <API_TOKEN>` |
| Access | Included in every [MaxStat API plan](https://maxstat.ru/promo/api) |

### 1. Get an API token

Open the [MaxStat API dashboard](https://maxstat.ru/dashboard/api) and create a
token. The Test Drive plan activates on the first API request and provides
1,000 credits every 30 days.

Keep the token secret. Use an environment variable whenever your MCP client
supports one, and never commit a real token to a repository.

### 2. Connect your client

#### Claude Code

```bash
claude mcp add --transport http maxstat https://maxstat.ru/api/mcp \
  --header "X-API-Token: <API_TOKEN>"
```

#### Codex CLI

```bash
export MAXSTAT_API_TOKEN="<API_TOKEN>"

codex mcp add maxstat \
  --url https://maxstat.ru/api/mcp \
  --bearer-token-env-var MAXSTAT_API_TOKEN
```

#### Cursor

Add the server to your MCP configuration:

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

#### Claude Desktop

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

#### Generic MCP client

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

### Available tools

The server exposes current public MaxStat API operations as MCP tools.

| Tool | Purpose |
| --- | --- |
| `get_categories` | List channel categories and the number of channels in each category. |
| `search_channels` | Search channels by text, link, category, audience, and post count. |
| `get_channel` | Get a full channel profile by ID. |
| `add_channel` | Add a public or invite-only channel to the tracking queue. |
| `get_channel_subscribers` | Get subscriber minimum, maximum, and growth for a period. |
| `get_channel_views` | Get total, average, and maximum post views for a period. |
| `get_channel_likes` | Get total, average, and maximum post likes for a period. |
| `get_channel_posts` | Get post count, format distribution, and daily publishing history. |
| `search_posts` | Search posts by text, channel, type, date, views, or likes. |
| `get_post` | Get post text, attachments, link, views, likes, and reposts. |
| `get_post_views` | Get current and historical post views. |
| `get_post_likes` | Get reactions and historical post likes. |

### Example prompts

```text
Find 20 fast-growing technology channels in MAX over the last 30 days.
```

```text
Compare these five channels by subscribers, view growth, and publishing frequency.
```

```text
Find posts about mortgages published in June and return their links, views, and reactions.
```

```text
Build a channel ranking page in this project and use MaxStat MCP as the data source.
```

### Usage and billing

MCP access is included in all MaxStat API plans at no additional charge. MCP
calls and direct API requests consume the same credit allowance. See
[API plans and limits](https://maxstat.ru/promo/api).

## Русский

MaxStat MCP подключает актуальные данные о каналах и публикациях в MAX к
Codex, Claude Code, Cursor, Claude Desktop и другим MCP-клиентам. AI-агент
может самостоятельно выбирать инструменты MaxStat, выполнять поиск и собирать
аналитику прямо в рабочем контексте.

### Возможности

- Поиск каналов по названию, описанию, ссылке, категории и размеру аудитории.
- Поиск публикаций по тексту, каналу, формату, датам, просмотрам и лайкам.
- Анализ динамики подписчиков, просмотров, реакций и частоты публикаций.
- Сравнение каналов и подготовка аналитических отчётов.
- Добавление публичных и пригласительных MAX-каналов в очередь отслеживания.
- Использование данных MAX при создании прототипов, интерфейсов и исследований.

### Быстрый старт

1. Получите токен в [личном кабинете MaxStat API](https://maxstat.ru/dashboard/api).
2. Выберите конфигурацию для своего клиента в разделе
   [Connect your client](#2-connect-your-client).
3. Замените `<API_TOKEN>` своим токеном или сохраните его в переменной окружения.
4. Перезапустите MCP-клиент и проверьте, что инструменты MaxStat появились в списке.

Test Drive активируется при первом API-запросе и предоставляет 1 000 кредитов
каждые 30 дней. MCP входит во все тарифы API без дополнительной оплаты; MCP и
прямой API используют общий лимит операций.

### Примеры запросов

```text
Найди 20 быстрорастущих каналов MAX о технологиях за последние 30 дней.
```

```text
Сравни эти пять каналов по числу подписчиков, динамике просмотров и частоте публикаций.
```

```text
Найди публикации про ипотеку за июнь и верни ссылки, просмотры и реакции.
```

```text
Создай в проекте страницу рейтинга каналов MAX и используй MaxStat MCP для получения данных.
```

## Links / Ссылки

- [MaxStat MCP](https://maxstat.ru/promo/mcp)
- [Get an API token / Получить API-токен](https://maxstat.ru/dashboard/api)
- [API documentation / Документация API](https://maxstat.ru/api/docs)
- [API plans / Тарифы API](https://maxstat.ru/promo/api)
- [MaxStat Insights in MAX](https://max.ru/maxstat)
- [FBM API Insights in Telegram](https://t.me/fbmapi)

For documentation and configuration problems, open a
[GitHub issue](https://github.com/fbmdata/maxstat-mcp/issues). To report a
security vulnerability, follow [SECURITY.md](SECURITY.md).

## License

Files published in this repository are available under the [MIT License](LICENSE).
The license does **not** apply to the MaxStat service, API, data, trademarks, or
server-side implementation. See [NOTICE](NOTICE) for details.
