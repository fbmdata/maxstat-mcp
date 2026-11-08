from pathlib import Path
import argparse
import datetime
import json
import os
import shutil
import subprocess
import tempfile

REPO = Path(__file__).resolve().parent.parent
parser = argparse.ArgumentParser(description='Render the MaxStat demo from the shared index snapshot.')
parser.add_argument('--stats', type=Path, default=REPO / 'data/index-stats.json')
parser.add_argument('--output', type=Path, default=REPO / 'assets/maxstat-mcp-demo.gif')
parser.add_argument('--work-dir', type=Path)
args = parser.parse_args()
snapshot = json.loads(args.stats.read_text())
if snapshot.get('source') != 'https://maxstat.ru/service' or any(
    type(snapshot.get(key)) is not int or snapshot[key] <= 0 for key in ('channels', 'posts', 'categories')
):
    raise ValueError('A valid production index snapshot is required.')
observed = datetime.datetime.fromisoformat(snapshot['observed_at'].replace('Z', '+00:00'))
checked = (observed + datetime.timedelta(hours=3)).strftime('%d.%m.%Y')
FFMPEG = os.environ.get('MAXSTAT_FFMPEG') or (
    '/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg' if Path('/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg').is_file()
    else shutil.which('ffmpeg')
)
if not FFMPEG:
    raise RuntimeError('ffmpeg with drawtext is required.')


def font(variable, candidates):
    for name in [os.environ.get(variable), *candidates]:
        if name and Path(name).is_file():
            return str(Path(name).resolve())
    raise RuntimeError(f'No font found; set {variable} to an installed font file.')


REGULAR = font('MAXSTAT_FONT_REGULAR', [
    '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    '/System/Library/Fonts/Supplemental/Arial.ttf',
])
BOLD = font('MAXSTAT_FONT_BOLD', [
    '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
    '/System/Library/Fonts/Supplemental/Arial Bold.ttf',
])
scratch = tempfile.TemporaryDirectory(prefix='maxstat-demo-') if args.work_dir is None else None
OUT = args.work_dir or Path(scratch.name)
OUT.mkdir(exist_ok=True)


def run(args):
    subprocess.run([FFMPEG, '-hide_banner', '-loglevel', 'error', '-y', *args], check=True)


def text(label, x, y, size=24, color='0xF5F3FF', bold=False):
    file = OUT / f'text-{len(list(OUT.glob("text-*.txt"))):03}.txt'
    file.write_text(label)
    font = BOLD if bold else REGULAR
    return f"drawtext=fontfile='{font}':textfile='{file}':expansion=none:fontsize={size}:fontcolor={color}:x={x}:y={y}"


def box(x, y, width, height, color='0x171525', thickness='fill'):
    return f'drawbox=x={x}:y={y}:w={width}:h={height}:color={color}:t={thickness}'


def slide(number, filters):
    base = [
        box(0, 0, 960, 5, '0x4830E6'),
        text('MAXSTAT MCP', 94, 43, 20, bold=True),
        text('15 ИНСТРУМЕНТОВ', 713, 46, 14, '0x9A8AFF', True),
    ]
    chain = ','.join(base + filters)
    run([
        '-f', 'lavfi', '-i', 'color=c=0x0B0A14:s=960x540:r=30',
        '-i', str(REPO / 'plugins/maxstat/assets/maxstat-icon.png'),
        '-filter_complex', f'[0:v]{chain}[base];[1:v]scale=38:38[logo];[base][logo]overlay=42:33[out]',
        '-map', '[out]', '-frames:v', '1', str(OUT / f'slide-{number}.png'),
    ])


stats = [text('База MaxStat', 48, 117, 38, bold=True)]
for i, (key, label) in enumerate([('channels', 'каналов MAX'), ('posts', 'публикаций'), ('categories', 'категории')]):
    x = 48 + i * 292
    stats.extend([
        box(x, 196, 280, 140), box(x, 196, 4, 140, '0x4830E6'),
        text(f"{snapshot[key]:,}".replace(',', ' '), x + 17, 221, 32, bold=True),
        text(label, x + 17, 278, 20, '0xB9B3CC'),
    ])
stats.extend([
    text(f'Проверено {checked} · maxstat.ru/service', 48, 373, 19, '0xB9B3CC'),
    text('Codex · Claude Code · Cursor · Gemini CLI', 48, 432, 24),
    text('Удалённый сервер · Streamable HTTP', 48, 485, 18, '0x9D96AE'),
])
slide(1, stats)

cards = [
    ('Поиск каналов', 'Тематика · аудитория · категории'),
    ('Динамика аудитории', 'История · рост · сравнение'),
    ('Публикации', 'Текст · вложения · даты'),
    ('Вовлечённость', 'Просмотры · реакции'),
    ('Пересылки', 'Источник · найденные репосты'),
    ('Тариф и кредиты', 'Остаток · история списаний'),
]
filters = [text('Доступные данные', 48, 105, 32, bold=True)]
for i, (title, subtitle) in enumerate(cards):
    x = 48 + i % 3 * 292
    y = 173 + i // 3 * 138
    filters.extend([
        box(x, y, 280, 119), box(x, y, 4, 119, '0x4830E6'),
        text(title, x + 17, y + 24, 20, bold=True),
        text(subtitle, x + 17, y + 66, 14, '0xB9B3CC'),
    ])
filters.append(text('Мониторинг и Webhook — отдельно в личном кабинете', 48, 482, 20, '0xB9B3CC'))
slide(2, filters)

slide(3, [
    text('Сравнение каналов MAX', 48, 105, 32, bold=True),
    box(48, 170, 864, 86),
    text('«Сравни рост выбранных каналов MAX за месяц»', 69, 197, 26, bold=True),
    text('01  Найти каналы', 61, 292, 23, bold=True),
    text('search_channels → get_channel', 500, 294, 20, '0xB4A7FF'),
    text('02  Получить историю за месяц', 61, 347, 23, bold=True),
    text('get_channel_subscribers', 500, 350, 20, '0xB4A7FF'),
    text('03  Сопоставить рост и вернуть ссылки', 61, 402, 23, bold=True),
    text('Одинаковый период · факты · ограничения выборки', 61, 475, 19, '0xB9B3CC'),
])

slide(4, [
    text('Подключите MaxStat MCP', 48, 146, 41, bold=True),
    text('15 инструментов · без локального сервера', 50, 218, 28, '0xB9B3CC'),
    box(48, 299, 864, 79, '0x4830E6'),
    text('maxstat.ru/promo/mcp', 72, 322, 28, bold=True),
    text('github.com/fbmdata/maxstat-mcp', 50, 411, 25),
    text('ООО «ФБМ Аналитикс» / FBM Analytics', 50, 483, 17, '0x9D96AE'),
])

inputs = []
for i in range(1, 5):
    inputs.extend(['-loop', '1', '-t', '4', '-i', str(OUT / f'slide-{i}.png')])
run([
    *inputs,
    '-filter_complex',
    '[0:v]fps=30,format=yuv420p,settb=AVTB[v0];'
    '[1:v]fps=30,format=yuv420p,settb=AVTB[v1];'
    '[2:v]fps=30,format=yuv420p,settb=AVTB[v2];'
    '[3:v]fps=30,format=yuv420p,settb=AVTB[v3];'
    '[v0][v1]xfade=transition=fade:duration=0.33:offset=3.67[x1];'
    '[x1][v2]xfade=transition=fade:duration=0.33:offset=7.34[x2];'
    '[x2][v3]xfade=transition=fade:duration=0.33:offset=11.01,format=yuv420p[out]',
    '-map', '[out]', '-t', '15', '-c:v', 'libx264', '-crf', '18', str(OUT / 'demo.mp4'),
])
run([
    '-i', str(OUT / 'demo.mp4'),
    '-vf', 'fps=12,split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=bayer:bayer_scale=3',
    '-loop', '0', str(args.output),
])
comment = ('maxstat-index:' + json.dumps(snapshot, ensure_ascii=False, separators=(',', ':'))).encode()
extension = b'\x21\xfe'
for i in range(0, len(comment), 255):
    chunk = comment[i:i + 255]
    extension += bytes([len(chunk)]) + chunk
extension += b'\x00'
gif = args.output.read_bytes()
if not gif.endswith(b'\x3b'):
    raise ValueError('Rendered GIF is incomplete.')
args.output.write_bytes(gif[:-1] + extension + gif[-1:])
print('Rendered', args.output)
if scratch is not None:
    scratch.cleanup()
