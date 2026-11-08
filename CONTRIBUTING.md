# Вклад в MaxStat MCP

Спасибо за помощь в развитии публичного интеграционного пакета MaxStat MCP.

Можно присылать:

- исправления и улучшения документации;
- конфигурации для дополнительных MCP-клиентов;
- исправления публичных манифестов и метаданных;
- воспроизводимые проблемы совместимости;
- улучшения русскоязычного аналитического skill.

Сервер MaxStat является размещённым сервисом. Серверная реализация не входит в
этот репозиторий, поэтому backend feature request следует создавать как issue,
а не как изменение закрытого кода.

## Перед pull request

1. Не добавляйте API-токены, персональные данные или другие секреты.
2. Используйте только `<API_TOKEN>` или документированную переменную
   `MAXSTAT_API_TOKEN`.
3. Сохраняйте `X-API-Token` в готовых конфигурациях; поддержка Bearer сервером
   не требует менять их способ авторизации.
4. Сохраняйте версию `1.2.4` согласованной во всех release-bearing
   манифестах.
5. Используйте kebab-case для имён плагинов и skill.
6. Проверяйте каждую изменённую ссылку и конфигурацию.
7. Укажите клиент и версию, на которых проверено изменение.

## Локальная проверка

Требуется Node.js 22 или новее.

```bash
npm run check
```

При обновлении справочника инструментов выполните сетевую проверку:

```bash
npm run check:api
```

Она читает публичную OpenAPI-схему без токена и сравнивает имена 15 операций
и цены с `scripts/tool-contract.mjs`. Локальный валидатор сверяет с тем же
контрактом таблицы README и skill. Сетевая проверка не вызывает платные методы
и не заменяет авторизованный MCP `tools/list` в клиенте.
Мониторинг и получатели уведомлений относятся к кабинету, в MCP их не добавляйте.

Для изменений Claude-compatible плагина дополнительно выполните:

```bash
claude plugin validate . --strict
claude plugin validate ./plugins/maxstat --strict
```

Пути, версию и MCP-конфигурацию Codex-плагина проверяет общий валидатор:

```bash
npm run validate
```

## English

Contributions are welcome for documentation, additional client
configurations, public manifest fixes, reproducible compatibility reports, and
the Russian-first analytics skill.

Before opening a pull request, do not include secrets, preserve the required
`X-API-Token` header, keep release versions consistent, and run every command
from the local validation section. Explain which client and version you tested.
