# MaxStat MCP

[![MCP](https://img.shields.io/badge/MCP-Streamable%20HTTP-4830E6)](https://modelcontextprotocol.io/)
[![MaxStat](https://img.shields.io/badge/MAX_analytics-MaxStat-4830E6)](https://maxstat.ru/promo/mcp)
[![Tools](https://img.shields.io/badge/MCP_tools-21-4830E6)](#complete-tool-reference)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**The official remote MCP server for searching, analyzing and monitoring
channels and publications in the MAX messenger.**

[English](#english) · [Русский](#русский)

> MaxStat hosts the MCP server. This repository contains its public manifest,
> connection examples and documentation. The server-side implementation and
> MaxStat data are not published here.

## English

Connect [MaxStat](https://maxstat.ru/) to Codex, Claude Code, Cursor, Claude
Desktop or any Streamable HTTP MCP client. An AI agent gets structured access
to the live MAX channel and publication index instead of relying on search
snippets or manually collected screenshots.

### Verified index scale

| Verified on 2026-07-28 | Live index |
| --- | ---: |
| MAX channels | **367,759** |
| Publications | **85,720,012** |
| Channel categories | **42** |
| MCP tools | **21** |

The index grows continuously. Use `search_channels`, `search_posts` or
`get_categories` to obtain current results.

### Exactly what data you receive

| Data area | Fields and metrics returned by the MCP |
| --- | --- |
| Channel discovery | Name, description, URL, category, access type, subscriber range, post-count range and relevance/date/audience sorting. |
| Channel profile | ID, name, description, avatar, URL, public/private access, subscribers, posts, categories, timestamps and RKN status when available. |
| Audience history | Daily subscriber totals, minimum, maximum, absolute growth and percentage growth for a selected period. |
| Channel engagement | Total, average and maximum views and reactions per post, plus daily histories. |
| Publishing activity | Number of posts, daily publishing history and distribution by text, photo, video, file and other formats. |
| Publication discovery | Full-text search with channel, format, date, view and reaction filters. |
| Publication profile | Text, URL, type, attachments, views, total reactions, per-reaction breakdown, timestamps and forward-source data. |
| Publication history | Daily view and reaction totals for an individual post. |
| Forwards | Detected reposts, their URLs, publication dates and destination channel IDs. |
| Monitoring | Webhook subscriptions for every new channel post or for posts matching a keyword and optional category. |
| Operations | Subscription status and delivery failures, pause/resume/update/delete actions, current plan, credit balance and request-level usage history. |

You can also add a public or invite-only MAX channel to the MaxStat tracking
queue.

### Real-data example

A verification request on 2026-07-28 returned:

- **MAX • Анонсы**: 3,446,649 subscribers;
- growth from 3,040,777 to 3,446,649 between 2026-06-29 and 2026-07-28:
  **+405,872 / +13.3%**;
- a selected publication: **17,719,253 views** and **185,992 reactions**;
- reaction details including 👍, 🇷🇺, 🐶, ❤️, 👌, 🔥, 🎉 and 😍;
- daily view and reaction histories and a list of detected forwards.

These numbers demonstrate the response shape and are not static product
promises.

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

### Complete tool reference

#### Search and catalog

| Tool | Returns | Credits |
| --- | --- | ---: |
| `get_categories` | Categories and the current channel count in each category. | Free |
| `search_channels` | Filtered, sorted and paginated channel profiles. | 3 |
| `get_channel` | One complete channel profile by ID. | 1 |
| `add_channel` | Adds a public or invite-only channel to the tracking queue. | Free |
| `search_posts` | Filtered, sorted and paginated publications. | 3 |

#### Channel analytics

| Tool | Returns | Credits |
| --- | --- | ---: |
| `get_channel_subscribers` | Min/max audience, absolute and percentage growth and daily history. | 5 |
| `get_channel_views` | Total, average and maximum views per post and daily history. | 5 |
| `get_channel_likes` | Total, average and maximum reactions per post and daily history. | 5 |
| `get_channel_posts` | Post total, format distribution and daily publishing history. | 5 |

#### Post analytics

| Tool | Returns | Credits |
| --- | --- | ---: |
| `get_post` | Post content, attachments, metrics, forward source and optional detected forwards. | 1 |
| `get_post_views` | Current views and daily view history. | 5 |
| `get_post_likes` | Reaction total, per-reaction breakdown and daily history. | 5 |

#### Webhook monitoring

| Tool | Returns or action | Credits |
| --- | --- | ---: |
| `create_channel_subscription` | Subscribes a public HTTPS callback to new posts from one channel. | Free to create; 2 per delivery |
| `create_keyword_subscription` | Subscribes a callback to new posts matching a query and optional category. | Free to create; 3 per delivery |
| `get_subscriptions` | Lists webhook subscriptions with optional status/type filters. | Free |
| `get_subscription` | Returns one subscription, delivery status and last error. | Free |
| `update_subscription` | Updates the callback URL or pauses/resumes delivery. | Free |
| `delete_subscription` | Deletes a webhook subscription. | Free |

Webhook callbacks must use a publicly available HTTPS URL.

#### Account and usage

| Tool | Returns | Credits |
| --- | --- | ---: |
| `get_account_subscription` | Current plan, status, period and credit state. | Free |
| `get_account_limits` | Included, purchased, used and remaining credits. | Free |
| `get_account_usage` | Paginated request-level credit usage history. | Free |

### Example prompts

```text
Find 20 technology channels with the fastest subscriber growth over the last
30 days. Return links, current audience, absolute growth and growth rate.
```

```text
Compare these five channels by audience, average views, reactions, publishing
frequency and content-format mix.
```

```text
Find MAX posts about mortgages published in July. Return their links, text,
attachments, views, reaction breakdown and detected forwards.
```

```text
Subscribe https://example.com/maxstat-webhook to new posts containing
"искусственный интеллект" in the Technology category.
```

```text
Show my MaxStat plan, remaining credits and the latest ten charged requests.
```

### Usage and billing

MCP access is included in all MaxStat API plans at no additional charge. MCP
calls and direct API requests consume the same credit allowance. See
[API plans and limits](https://maxstat.ru/promo/api).

## Русский

### Что даёт MaxStat MCP

MaxStat MCP подключает Codex, Claude Code, Cursor, Claude Desktop и другие
MCP-клиенты к **живому индексу каналов и публикаций MAX**. AI-агент работает
со структурированными данными MaxStat, а не с фрагментами поисковой выдачи или
вручную собранными скриншотами.

Решение подходит коммуникационным и маркетинговым командам, агентствам,
аналитикам, разработчикам и корпоративным заказчикам из России и стран СНГ.
Через MCP можно искать площадки и публикации, сравнивать показатели, готовить
исследования и отчёты и запускать постоянный мониторинг.

Сервер размещён и обслуживается MaxStat. В этом репозитории опубликованы
манифест, примеры подключения и документация; серверная реализация и база
данных MaxStat не являются открытым исходным кодом.

### Проверенный масштаб индекса

| Проверено 28 июля 2026 года | Живой индекс |
| --- | ---: |
| Каналы MAX | **367,759** |
| Публикации | **85,720,012** |
| Категории каналов | **42** |
| MCP-инструменты | **21** |

Индекс постоянно обновляется. Актуальные результаты можно получить через
`search_channels`, `search_posts` и `get_categories`.

### Какие данные можно получить

#### Каналы

- Поиск по названию, описанию, ссылке, категории, типу доступа, диапазону
  аудитории и количеству публикаций с сортировкой по релевантности, дате или
  размеру аудитории.
- Полная карточка канала: идентификатор, название, описание, аватар, ссылка,
  публичный или закрытый доступ, подписчики, публикации, категории, временные
  метки и статус РКН, если он доступен.
- Дневная история аудитории, минимальное и максимальное значение, абсолютный
  прирост и темп роста за выбранный период.
- Суммарные, средние и максимальные просмотры и реакции на публикацию и
  дневная история показателей.
- Количество публикаций, дневная активность и распределение по форматам:
  текст, фото, видео, файлы и другие типы.
- Добавление публичного или доступного по приглашению канала MAX в очередь
  отслеживания MaxStat.

#### Публикации

- Полнотекстовый поиск с фильтрами по каналу, формату, датам, просмотрам и
  реакциям.
- Текст, ссылка, тип публикации, вложения, просмотры, общее число реакций,
  разбивка по каждой реакции и временные метки.
- Дневная история просмотров и реакций отдельной публикации.
- Источник пересылки и найденные репосты: ссылки, даты публикации и
  идентификаторы каналов, в которых появился материал.

#### Мониторинг

- Webhook-подписка на каждую новую публикацию выбранного канала.
- Webhook-подписка на новые публикации с заданным ключевым словом и
  необязательным ограничением по категории.
- Просмотр состояния доставки и последней ошибки.
- Приостановка, возобновление, изменение и удаление подписок.

Webhook должен быть доступен по публичному HTTPS-адресу.

#### Тариф и использование API

- Текущий тариф, его статус и расчётный период.
- Включённые, приобретённые, использованные и оставшиеся кредиты.
- Постраничная история списаний с детализацией по отдельным запросам.

MCP и прямые вызовы API расходуют единый баланс кредитов.

### Пример ответа на реальных данных

Проверочный запрос 28 июля 2026 года вернул:

- канал **MAX • Анонсы** с аудиторией 3,446,649 подписчиков;
- рост с 3,040,777 до 3,446,649 с 29 июня по 28 июля:
  **+405,872 / +13.3%**;
- публикацию с **17,719,253 просмотрами** и **185,992 реакциями**;
- подробную разбивку реакций, включая 👍, 🇷🇺, 🐶, ❤️, 👌, 🔥, 🎉 и 😍;
- дневную историю просмотров и реакций и список найденных пересылок.

Эти значения показывают структуру реального ответа и не являются обещанием
фиксированных показателей продукта.

### Все 21 инструмент

#### Поиск и каталог

| Инструмент | Что возвращает или делает | Кредиты |
| --- | --- | ---: |
| `get_categories` | Категории и актуальное количество каналов в каждой категории. | Бесплатно |
| `search_channels` | Отфильтрованные, отсортированные и постраничные карточки каналов. | 3 |
| `get_channel` | Полная карточка одного канала по идентификатору. | 1 |
| `add_channel` | Добавляет публичный или доступный по приглашению канал в очередь отслеживания. | Бесплатно |
| `search_posts` | Отфильтрованные, отсортированные и постраничные публикации. | 3 |

#### Аналитика каналов

| Инструмент | Что возвращает | Кредиты |
| --- | --- | ---: |
| `get_channel_subscribers` | Минимум и максимум аудитории, абсолютный и процентный прирост и дневную историю. | 5 |
| `get_channel_views` | Суммарные, средние и максимальные просмотры на публикацию и дневную историю. | 5 |
| `get_channel_likes` | Суммарные, средние и максимальные реакции на публикацию и дневную историю. | 5 |
| `get_channel_posts` | Количество публикаций, распределение форматов и дневную историю активности. | 5 |

#### Аналитика публикаций

| Инструмент | Что возвращает | Кредиты |
| --- | --- | ---: |
| `get_post` | Контент, вложения, метрики, источник пересылки и найденные репосты. | 1 |
| `get_post_views` | Текущее число просмотров и дневную историю просмотров. | 5 |
| `get_post_likes` | Общее число реакций, разбивку по реакциям и дневную историю. | 5 |

#### Webhook-мониторинг

| Инструмент | Что возвращает или делает | Кредиты |
| --- | --- | ---: |
| `create_channel_subscription` | Подписывает публичный HTTPS-callback на новые публикации одного канала. | Создание бесплатно; 2 за доставку |
| `create_keyword_subscription` | Подписывает callback на новые публикации по запросу и необязательной категории. | Создание бесплатно; 3 за доставку |
| `get_subscriptions` | Возвращает список подписок с фильтрами по статусу и типу. | Бесплатно |
| `get_subscription` | Возвращает одну подписку, состояние доставки и последнюю ошибку. | Бесплатно |
| `update_subscription` | Меняет callback URL или приостанавливает и возобновляет доставку. | Бесплатно |
| `delete_subscription` | Удаляет webhook-подписку. | Бесплатно |

#### Тариф и использование

| Инструмент | Что возвращает | Кредиты |
| --- | --- | ---: |
| `get_account_subscription` | Текущий тариф, статус, период и состояние кредитов. | Бесплатно |
| `get_account_limits` | Включённые, приобретённые, использованные и оставшиеся кредиты. | Бесплатно |
| `get_account_usage` | Постраничную историю списаний кредитов по отдельным запросам. | Бесплатно |

### Быстрый старт

1. Получите токен в
   [личном кабинете MaxStat API](https://maxstat.ru/dashboard/api).
2. Выберите конфигурацию для своего клиента в разделе
   [Connect your client](#2-connect-your-client).
3. Замените `<API_TOKEN>` своим токеном или сохраните его в переменной
   окружения.
4. Перезапустите MCP-клиент и проверьте, что появились 21 инструмент MaxStat.

| Параметр | Значение |
| --- | --- |
| Endpoint | `https://maxstat.ru/api/mcp` |
| Транспорт | Streamable HTTP |
| Авторизация | API-токен |
| Заголовок | `X-API-Token: <API_TOKEN>` |

Test Drive активируется при первом API-запросе и предоставляет 1 000 кредитов
каждые 30 дней. MCP входит во все тарифы API без дополнительной оплаты; MCP и
прямой API используют общий лимит операций.

Храните токен в секрете, используйте переменную окружения, если MCP-клиент это
поддерживает, и никогда не добавляйте реальный токен в публичный репозиторий.

### Примеры запросов

```text
Найди 20 технологических каналов MAX с максимальным приростом подписчиков за
последние 30 дней. Верни ссылки, текущую аудиторию и процент роста.
```

```text
Сравни эти пять каналов по аудитории, средним просмотрам, реакциям, частоте
публикаций и распределению форматов контента.
```

```text
Найди публикации об ипотеке за июль. Верни ссылки, текст, вложения, просмотры,
детальные реакции и найденные репосты.
```

```text
Подпиши webhook на новые публикации со словами «искусственный интеллект» в
категории «Технологии».
```

```text
Покажи мой тариф MaxStat, оставшиеся кредиты и десять последних запросов, за
которые были списаны кредиты.
```

### Тарифы, безопасность и поддержка

MCP входит во все [тарифы MaxStat API](https://maxstat.ru/promo/api) без
дополнительной оплаты. Стоимость конкретной операции указана в таблицах выше.

Если возник вопрос по документации или подключению, создайте
[GitHub issue](https://github.com/fbmdata/maxstat-mcp/issues). Уязвимости и
другие вопросы безопасности следует передавать по инструкции из
[SECURITY.md](SECURITY.md), а не публиковать в открытом issue.

MIT License распространяется только на файлы этого репозитория. Лицензия не
распространяется на сервис MaxStat, API, данные, товарные знаки и серверную
реализацию; подробности приведены в [NOTICE](NOTICE).

## Links / Ссылки

- [MaxStat MCP](https://maxstat.ru/promo/mcp)
- [Get an API token / Получить API-токен](https://maxstat.ru/dashboard/api)
- [API documentation / Документация API](https://maxstat.ru/api/docs)
- [API plans / Тарифы API](https://maxstat.ru/promo/api)
- [FBM Analytics](https://fbmdata.ru)
- [MaxStat Insights in MAX](https://max.ru/maxstat)
- [FBM API Insights in Telegram](https://t.me/fbmapi)

For documentation and configuration problems, open a
[GitHub issue](https://github.com/fbmdata/maxstat-mcp/issues). To report a
security vulnerability, follow [SECURITY.md](SECURITY.md).

## License

Files published in this repository are available under the
[MIT License](LICENSE). The license does **not** apply to the MaxStat service,
API, data, trademarks or server-side implementation. See [NOTICE](NOTICE) for
details.
