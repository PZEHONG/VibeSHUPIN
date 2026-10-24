# VibeSHUPIN · 竖屏书评短片工作流

一条可以独立运行的书评视频流水线：**书评文案 → 温暖男声旁白 → 分镜表 → 选外观 → 9:16 分镜制作 → 字幕 → 终检出片**。
引擎、字体、文案 skill、脚本全部在本目录内，不依赖任何其他项目。

**声音只有温暖男声旁白：不加伴奏、不加音效、不加第二音源。** 这条由 `scripts/check_film.py` 强制检查。

## 环境（一次性）

需要：Python 3.11+、本机 Chrome（渲染用 `channel="chrome"`）、ffmpeg / ffprobe 在 PATH 里。
中文字体已随包带上（`engine/fonts/`，44MB），不用另装。

```bash
cd /d/VibeSHUPIN
python -m venv .venv
./.venv/Scripts/python.exe -m pip install -r requirements.txt   # Windows；macOS/Linux 用 .venv/bin/python
cp .env.example .env    # 然后填入你的 FISH_API_KEY
```

- 依赖只有 `playwright`（驱动本机 Chrome，无需下载浏览器）、`numpy`、`Pillow`。
- `FISH_API_KEY` 用于 Fish Audio 配音；只走环境变量或根目录 `.env`，`.env` 已被 gitignore。
- 下面所有 `python` 都可以换成 `./.venv/Scripts/python.exe`。

## 七步（详见 SKILL.md）

```bash
# 1. 文案：用 skills/emotional-book-review 出稿，写成 projects/<片名>/script.json
# 2. 配音（只有人声）
python scripts/make_voiceover.py projects/<片名> --check
python scripts/make_voiceover.py projects/<片名> --speed 0.9
# 3. 分镜表：按 audio/timings.json 写 projects/<片名>/storyboard.md
# 4. 选S01–S06：治愈S01/02，遗憾S03/04，现实S05，抽象S06
# 5. 建工程 + 画分镜（1080×1920）
python scripts/new_film.py projects/<片名> --world S01
# 补全 art-direction.json 的角色、场景、动作、画面性质与依据
python scripts/prepare_art.py projects/<片名>
# 用AI绘图工具按 art-prompts.md 出图，保存到 assets/
python scripts/prepare_art.py projects/<片名> --check-images
python engine/render.py projects/<片名> --sheet 16
python engine/render.py projects/<片名> --stills 5.9 18.1
python engine/render.py projects/<片名> --det
python engine/render.py projects/<片名> --jobs 4
# 6. 字幕（SUB_Y=1520，最多两行）+ 只合人声
python scripts/finalize.py projects/<片名>
# 7. 终检
python scripts/check_film.py projects/<片名>
```

产物：`projects/<片名>/renders/final.mp4`（1080×1920 / 30fps / h264 + aac 单音轨旁白，约 -16 LUFS）。

## 六套画风

| 参数 | 画风 |
|---|---|
| S01（默认） | 暖光纸感油画 |
| S02 | 森系手绘绘本 |
| S03 | 蓝灰胶片插画 |
| S04 | 淡彩水彩散文 |
| S05 | 黑白版画 |
| S06 | 超现实纸艺 |

也可在script.json写visual_style或review_style，由脚本选择；显式--world优先。B/C只兼容旧工程。
材质来自实际AI图片；准备脚本导出完整提示词，绘图工具负责出图。图片齐全后再渲染，缺图会报错。
修改art-direction.json的style后重新准备并出图，已有图片不会自动重绘。规格见references/worlds.md。

## 目录

```
VibeSHUPIN/
  SKILL.md                  工作流主入口（给 agent 读）
  references/               竖屏规范、分镜表、找形象、外观、引擎 API
  skills/emotional-book-review/   书评文案 skill
  engine/                   vk.js / vk-kit.js / render.py / 字体
  scripts/                  建工程、配音、纯人声合成、终检
  projects/                 每条片一个工程（script.json + storyboard.md + film.js + audio/ + renders/）
```

工程目录里 `audio/vo/` 是旁白分段，`audio/narration.wav` 是整条旁白，`audio/timings.json` 是时间轴；
`review/` 放静帧和拼图，`renders/raw.mp4` 是无声画面，`renders/final.mp4` 是成片。
