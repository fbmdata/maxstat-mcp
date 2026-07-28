#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ASSETS_DIR="${ROOT_DIR}/assets"
ICON="${ASSETS_DIR}/maxstat-icon.png"
OUTPUT_MP4="${ASSETS_DIR}/maxstat-mcp-demo.mp4"
OUTPUT_GIF="${ASSETS_DIR}/maxstat-mcp-demo.gif"
CLINE_ICON="${ASSETS_DIR}/maxstat-cline-400.png"

if [[ -x /opt/homebrew/opt/ffmpeg-full/bin/ffmpeg ]]; then
  FFMPEG=/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg
  FFPROBE=/opt/homebrew/opt/ffmpeg-full/bin/ffprobe
else
  FFMPEG="$(command -v ffmpeg || true)"
  FFPROBE="$(command -v ffprobe || true)"
fi

if [[ -z "${FFMPEG}" || -z "${FFPROBE}" ]]; then
  echo "ffmpeg and ffprobe are required" >&2
  exit 1
fi

if ! "${FFMPEG}" -hide_banner -filters 2>/dev/null | grep 'drawtext' >/dev/null; then
  echo "ffmpeg must be built with the drawtext filter (for example ffmpeg-full)" >&2
  exit 1
fi

FONT_REGULAR=/System/Library/Fonts/Supplemental/Arial.ttf
FONT_BOLD=/System/Library/Fonts/Supplemental/Arial\ Bold.ttf

for required_file in "${ICON}" "${FONT_REGULAR}" "${FONT_BOLD}"; do
  if [[ ! -f "${required_file}" ]]; then
    echo "Required file is missing: ${required_file}" >&2
    exit 1
  fi
done

TMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/maxstat-mcp-demo.XXXXXX")"
trap 'rm -rf "${TMP_DIR}"' EXIT

write_text() {
  printf '%s' "$2" >"${TMP_DIR}/$1.txt"
}

render_slide() {
  local output="$1"
  local filter="$2"
  "${FFMPEG}" -hide_banner -loglevel error -y \
    -f lavfi -i "color=c=0x090711:s=1920x1080:r=30" \
    -loop 1 -i "${ICON}" \
    -filter_complex "${filter}" \
    -map "[out]" \
    -frames:v 1 "${TMP_DIR}/${output}.png"
}

drawtext() {
  local file="$1"
  local size="$2"
  local color="$3"
  local x="$4"
  local y="$5"
  local font="${6:-${FONT_REGULAR}}"
  printf "drawtext=fontfile='%s':textfile='%s/%s.txt':expansion=none:fontsize=%s:fontcolor=%s:x=%s:y=%s" \
    "${font}" "${TMP_DIR}" "${file}" "${size}" "${color}" "${x}" "${y}"
}

write_text brand "MAXSTAT MCP"
write_text hero "Данные MAX — прямо в вашем AI-агенте"
write_text endpoint "maxstat.ru/api/mcp  ·  Streamable HTTP"
render_slide slide-01 "\
[0:v]drawbox=x=0:y=0:w=1920:h=18:color=0xA84DFF:t=fill,\
drawbox=x=118:y=118:w=1684:h=844:color=0x120F1D:t=fill,\
drawbox=x=118:y=118:w=10:h=844:color=0xA84DFF:t=fill,\
$(drawtext brand 46 0xD4B6FF 298 214 "${FONT_BOLD}"),\
$(drawtext hero 76 0xFFFFFF 298 336 "${FONT_BOLD}"),\
$(drawtext endpoint 34 0xB8B2C7 298 684 "${FONT_REGULAR}") [base];\
[1:v]scale=132:132[icon];[base][icon]overlay=138:178[out]"

write_text channels "367K+"
write_text channels_label "каналов MAX"
write_text posts "85M+"
write_text posts_label "публикаций"
write_text tools "21"
write_text tools_label "инструмент"
write_text live_index "Живой индекс MaxStat"
render_slide slide-02 "\
[0:v]drawbox=x=0:y=0:w=1920:h=18:color=0xA84DFF:t=fill,\
$(drawtext live_index 56 0xFFFFFF 120 112 "${FONT_BOLD}"),\
drawbox=x=120:y=270:w=500:h=520:color=0x161222:t=fill,\
drawbox=x=710:y=270:w=500:h=520:color=0x161222:t=fill,\
drawbox=x=1300:y=270:w=500:h=520:color=0x161222:t=fill,\
drawbox=x=120:y=270:w=500:h=10:color=0xA84DFF:t=fill,\
drawbox=x=710:y=270:w=500:h=10:color=0x725CFF:t=fill,\
drawbox=x=1300:y=270:w=500:h=10:color=0x4DAEFF:t=fill,\
$(drawtext channels 112 0xFFFFFF '120+(500-text_w)/2' 386 "${FONT_BOLD}"),\
$(drawtext channels_label 38 0xC7C0D3 '120+(500-text_w)/2' 572),\
$(drawtext posts 112 0xFFFFFF '710+(500-text_w)/2' 386 "${FONT_BOLD}"),\
$(drawtext posts_label 38 0xC7C0D3 '710+(500-text_w)/2' 572),\
$(drawtext tools 112 0xFFFFFF '1300+(500-text_w)/2' 386 "${FONT_BOLD}"),\
$(drawtext tools_label 38 0xC7C0D3 '1300+(500-text_w)/2' 572) [base];\
[1:v]scale=92:92[icon];[base][icon]overlay=1680:80[out]"

write_text task_label "ЗАПРОС АГЕНТУ"
write_text task_line_1 "Найди каналы MAX о недвижимости"
write_text task_line_2 "и сравни рост аудитории за 30 дней"
write_text tool_1 "search_channels"
write_text tool_2 "get_channel"
write_text tool_3 "get_channel_subscribers"
render_slide slide-03 "\
[0:v]drawbox=x=0:y=0:w=1920:h=18:color=0xA84DFF:t=fill,\
drawbox=x=160:y=170:w=1600:h=610:color=0x151120:t=fill,\
drawbox=x=160:y=170:w=12:h=610:color=0xA84DFF:t=fill,\
$(drawtext task_label 30 0xB783FF 244 232 "${FONT_BOLD}"),\
$(drawtext task_line_1 66 0xFFFFFF 244 338 "${FONT_BOLD}"),\
$(drawtext task_line_2 66 0xFFFFFF 244 438 "${FONT_BOLD}"),\
drawbox=x=244:y=620:w=326:h=70:color=0x251A38:t=fill,\
drawbox=x=594:y=620:w=286:h=70:color=0x251A38:t=fill,\
drawbox=x=904:y=620:w=430:h=70:color=0x251A38:t=fill,\
$(drawtext tool_1 28 0xDCC8FF 272 638),\
$(drawtext tool_2 28 0xDCC8FF 622 638),\
$(drawtext tool_3 28 0xDCC8FF 932 638) [base];\
[1:v]scale=92:92[icon];[base][icon]overlay=1640:858[out]"

write_text result_label "РЕЗУЛЬТАТ"
write_text col_channel "Канал"
write_text col_audience "Аудитория"
write_text col_growth "Рост за 30 дней"
write_text row_1 "Недвижимость сегодня"
write_text row_2 "Новостройки Москвы"
write_text row_3 "Дом и инвестиции"
write_text row_1_a "128 400"
write_text row_2_a "94 820"
write_text row_3_a "61 750"
write_text row_1_g "+8,7%"
write_text row_2_g "+6,1%"
write_text row_3_g "+11,4%"
render_slide slide-04 "\
[0:v]drawbox=x=0:y=0:w=1920:h=18:color=0xA84DFF:t=fill,\
$(drawtext result_label 30 0xB783FF 160 112 "${FONT_BOLD}"),\
drawbox=x=160:y=190:w=1600:h=680:color=0x151120:t=fill,\
drawbox=x=160:y=190:w=1600:h=86:color=0x221A31:t=fill,\
$(drawtext col_channel 30 0xAAA3B7 214 218 "${FONT_BOLD}"),\
$(drawtext col_audience 30 0xAAA3B7 1055 218 "${FONT_BOLD}"),\
$(drawtext col_growth 30 0xAAA3B7 1380 218 "${FONT_BOLD}"),\
drawbox=x=214:y=422:w=1492:h=2:color=0x2E2739:t=fill,\
drawbox=x=214:y=608:w=1492:h=2:color=0x2E2739:t=fill,\
$(drawtext row_1 42 0xFFFFFF 214 330 "${FONT_BOLD}"),\
$(drawtext row_2 42 0xFFFFFF 214 516 "${FONT_BOLD}"),\
$(drawtext row_3 42 0xFFFFFF 214 702 "${FONT_BOLD}"),\
$(drawtext row_1_a 38 0xD7D2DF 1070 334),\
$(drawtext row_2_a 38 0xD7D2DF 1070 520),\
$(drawtext row_3_a 38 0xD7D2DF 1070 706),\
$(drawtext row_1_g 42 0x64E4A8 1450 330 "${FONT_BOLD}"),\
$(drawtext row_2_g 42 0x64E4A8 1450 516 "${FONT_BOLD}"),\
$(drawtext row_3_g 42 0x64E4A8 1450 702 "${FONT_BOLD}") [base];\
[1:v]scale=92:92[icon];[base][icon]overlay=1660:86[out]"

write_text insight_title "От поиска — к доказательным выводам"
write_text f1 "Каналы и публикации"
write_text f2 "Просмотры и реакции"
write_text f3 "Динамика аудитории"
write_text f4 "Репосты и распространение"
write_text f5 "Webhook-мониторинг"
write_text f6 "Лимиты и кредиты"
render_slide slide-05 "\
[0:v]drawbox=x=0:y=0:w=1920:h=18:color=0xA84DFF:t=fill,\
$(drawtext insight_title 58 0xFFFFFF 140 108 "${FONT_BOLD}"),\
drawbox=x=140:y=270:w=780:h=150:color=0x171321:t=fill,\
drawbox=x=1000:y=270:w=780:h=150:color=0x171321:t=fill,\
drawbox=x=140:y=470:w=780:h=150:color=0x171321:t=fill,\
drawbox=x=1000:y=470:w=780:h=150:color=0x171321:t=fill,\
drawbox=x=140:y=670:w=780:h=150:color=0x171321:t=fill,\
drawbox=x=1000:y=670:w=780:h=150:color=0x171321:t=fill,\
drawbox=x=140:y=270:w=10:h=150:color=0xA84DFF:t=fill,\
drawbox=x=1000:y=270:w=10:h=150:color=0x725CFF:t=fill,\
drawbox=x=140:y=470:w=10:h=150:color=0x4DAEFF:t=fill,\
drawbox=x=1000:y=470:w=10:h=150:color=0x64E4A8:t=fill,\
drawbox=x=140:y=670:w=10:h=150:color=0xFFB85C:t=fill,\
drawbox=x=1000:y=670:w=10:h=150:color=0xFF6F9D:t=fill,\
$(drawtext f1 38 0xFFFFFF 196 322 "${FONT_BOLD}"),\
$(drawtext f2 38 0xFFFFFF 1056 322 "${FONT_BOLD}"),\
$(drawtext f3 38 0xFFFFFF 196 522 "${FONT_BOLD}"),\
$(drawtext f4 38 0xFFFFFF 1056 522 "${FONT_BOLD}"),\
$(drawtext f5 38 0xFFFFFF 196 722 "${FONT_BOLD}"),\
$(drawtext f6 38 0xFFFFFF 1056 722 "${FONT_BOLD}") [base];\
[1:v]scale=92:92[icon];[base][icon]overlay=1660:86[out]"

write_text cta_title "Подключите MaxStat MCP"
write_text cta_subtitle "За несколько минут. Без локального сервера."
write_text cta_site "maxstat.ru/promo/mcp"
write_text cta_github "github.com/fbmdata/maxstat-mcp"
write_text operator "ООО «ФБМ Аналитикс» / FBM Analytics"
render_slide slide-06 "\
[0:v]drawbox=x=0:y=0:w=1920:h=18:color=0xA84DFF:t=fill,\
drawbox=x=118:y=118:w=1684:h=844:color=0x120F1D:t=fill,\
drawbox=x=118:y=118:w=10:h=844:color=0xA84DFF:t=fill,\
$(drawtext cta_title 78 0xFFFFFF 330 254 "${FONT_BOLD}"),\
$(drawtext cta_subtitle 42 0xC7C0D3 330 382),\
drawbox=x=330:y=520:w=980:h=84:color=0xA84DFF:t=fill,\
$(drawtext cta_site 38 0xFFFFFF 374 540 "${FONT_BOLD}"),\
$(drawtext cta_github 34 0xD8D1E2 330 666),\
$(drawtext operator 28 0x948CA2 330 842) [base];\
[1:v]scale=144:144[icon];[base][icon]overlay=150:236[out]"

"${FFMPEG}" -hide_banner -loglevel error -y \
  -loop 1 -t 4.5 -i "${TMP_DIR}/slide-01.png" \
  -loop 1 -t 4.5 -i "${TMP_DIR}/slide-02.png" \
  -loop 1 -t 6.5 -i "${TMP_DIR}/slide-03.png" \
  -loop 1 -t 6.5 -i "${TMP_DIR}/slide-04.png" \
  -loop 1 -t 6.5 -i "${TMP_DIR}/slide-05.png" \
  -loop 1 -t 8.0 -i "${TMP_DIR}/slide-06.png" \
  -filter_complex "\
    [0:v]fps=30,format=yuv420p,settb=AVTB[v0];\
    [1:v]fps=30,format=yuv420p,settb=AVTB[v1];\
    [2:v]fps=30,format=yuv420p,settb=AVTB[v2];\
    [3:v]fps=30,format=yuv420p,settb=AVTB[v3];\
    [4:v]fps=30,format=yuv420p,settb=AVTB[v4];\
    [5:v]fps=30,format=yuv420p,settb=AVTB[v5];\
    [v0][v1]xfade=transition=fade:duration=0.5:offset=4[x1];\
    [x1][v2]xfade=transition=fade:duration=0.5:offset=8[x2];\
    [x2][v3]xfade=transition=fade:duration=0.5:offset=14[x3];\
    [x3][v4]xfade=transition=fade:duration=0.5:offset=20[x4];\
    [x4][v5]xfade=transition=fade:duration=0.5:offset=26,format=yuv420p[out]" \
  -map "[out]" \
  -c:v libx264 -preset medium -crf 18 -movflags +faststart \
  -t 34 "${OUTPUT_MP4}"

"${FFMPEG}" -hide_banner -loglevel error -y \
  -i "${OUTPUT_MP4}" \
  -vf "fps=12,scale=960:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=bayer:bayer_scale=3" \
  -loop 0 "${OUTPUT_GIF}"

sips -z 400 400 "${ICON}" --out "${CLINE_ICON}" >/dev/null

duration="$("${FFPROBE}" -v error -show_entries format=duration -of default=nw=1:nk=1 "${OUTPUT_MP4}")"
dimensions="$("${FFPROBE}" -v error -select_streams v:0 -show_entries stream=width,height,pix_fmt -of csv=p=0 "${OUTPUT_MP4}")"

printf 'Rendered %s (%ss, %s)\n' "${OUTPUT_MP4}" "${duration}" "${dimensions}"
printf 'Rendered %s\n' "${OUTPUT_GIF}"
printf 'Rendered %s\n' "${CLINE_ICON}"
