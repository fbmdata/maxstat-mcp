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

## Обновление счётчиков и GIF

Числа, дата проверки и источник хранятся в `data/index-stats.json`.
Из этого файла формируются два блока README и первый кадр GIF.
`npm run check` проверяет, что они совпадают.

Для обновления нужны Python 3, ffmpeg с фильтром `drawtext` и шрифты Arial
или DejaVu Sans. Команда читает публичную страницу MaxStat без токена:

```bash
npm run refresh:stats
```

При капче, ошибке страницы или рендера прежние файлы и дата сохраняются.
Если страница открывается только в браузере, сохраните её публичный блок
счётчиков в игнорируемый каталог `.local/` и укажите время чтения в UTC:

```bash
node scripts/refresh-index-stats.mjs \
  --from-html .local/service-counters.html \
  --observed-at 2026-11-08T09:59:27.000Z
```

Указывайте время сохранения HTML. Старый снимок не может заменить более новый.
Сырые HTML-файлы в репозиторий не добавляйте. Для пересборки GIF без обращения
к сайту выполните `npm run render:demo`.

При нестандартной установке задайте пути в `MAXSTAT_FFMPEG`,
`MAXSTAT_FONT_REGULAR` и `MAXSTAT_FONT_BOLD`.

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
