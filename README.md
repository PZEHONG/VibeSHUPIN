# VibeSHUPIN · 竖屏书评视频工作流

一条可以独立运行的书评视频流水线：**书评文案 → 温暖男声旁白 → 动态分镜 → Remotion 混合素材画面与字幕 → 终检出片**。
文案默认8–15分钟叙事讲解型深度书评，先以10–12分钟构思；先核材料、确认讲述范围和剧透边界，再做章节提纲和口播。用户指定短篇或其他风格时按其要求。
引擎、字体、文案 skill、脚本全部在本目录内，不依赖任何其他项目。

**声音只有温暖男声旁白：不加伴奏、不加音效、不加第二音源。** 这条由 `scripts/check_film.py` 强制检查。

## 环境（一次性）

需要：Python 3.11+、Node.js 22+、本机 Chrome、ffmpeg / ffprobe 在 PATH 里。
中文字体已随包带上（`engine/fonts/`，44MB），不用另装。

```bash
cd /d/VibeSHUPIN
python -m venv .venv
./.venv/Scripts/python.exe -m pip install -r requirements.txt   # Windows；macOS/Linux 用 .venv/bin/python
cp .env.example .env    # 然后填入你的 FISH_API_KEY
```

- Python 依赖为 `playwright`、`numpy`、`Pillow`；Remotion 的独立 Node 依赖由 `remotion/package-lock.json` 锁定。浏览器使用已有 Chrome；非标准位置通过 `VIBE_CHROME_PATH` 指定，不另下载浏览器。
- 首次安装 Remotion：`npm ci --prefix remotion`。缓存优先设到 D 盘，例如 PowerShell `$env:npm_config_cache='D:\AI剪辑\.npm-cache'`。
- `FISH_API_KEY` 用于 Fish Audio 配音；只走环境变量或根目录 `.env`，`.env` 已被 gitignore。
- 下面所有 `python` 都可以换成 `./.venv/Scripts/python.exe`。

## 新默认：Remotion 动态书评

新工程默认 CUSTOM：按每本书的内容设计视觉语言，由 Remotion 的图形、场景及逐帧动作构建叙事。图片和视频仅在用户明确需要时作为可选素材，不以静态图片推拉替代动态场景。M01 文学纸艺和 M02 厚涂油画保留为旧工程兼容选项。Remotion 负责画面及动画，不自动创造自然的人物表演；每期仍需逐镜设计、准备素材和审看片段。使用方法见 [混合素材指南](references/remotion-mixed.md)。

历史两套主题都有循环门廊、金鱼重铸、雨中小镇三种《百年孤独》示例场景；M02 完整版另有七种专用场景，见下文。新书需要对应的场景设计，未支持的场景类型会报错。新建工程为 `draft=true`，补全动态分镜与字幕后才允许渲染。

```powershell
# 文案确认、配音和分镜规则继续有效
python scripts/make_voiceover.py projects/<片名> --check
python scripts/make_voiceover.py projects/<片名> --speed 0.9
python scripts/new_film.py projects/<片名>
# 油画风新工程可改用：python scripts/new_film.py projects/<片名> --theme M02
# 编辑 motion.json：镜头、scene_type/scene_props、事实依据和字幕；完成后设 draft=false
python scripts/render_remotion.py projects/<片名> --sheet 12
python scripts/render_remotion.py projects/<片名> --stills 0.7 4.8
python scripts/render_remotion.py projects/<片名> --det
python scripts/render_remotion.py projects/<片名> --jobs 2
python scripts/finalize.py projects/<片名>
python scripts/check_film.py projects/<片名>
```

重配音或改文案后，需要重新核对并调整镜头和字幕，再更新 `motion.json` 的 `source_hashes`；哈希变化不能直接忽略。字段、场景参数和时间规则见 [Remotion 引擎指南](references/remotion.md)。

已有样片工程：`projects/bainiangudu-remotion/`。复用既有配音，源区间量化为 [363,749) 帧，样片共 386 帧（约 12.87 秒）。不重配音，也未调用任何生图 API。

油画对照样片位于 `projects/bainiangudu-remotion-oil/`，同配音、同时间轴，包含油画门廊、金鱼重铸、雨中小镇。新建时使用 `--theme M02`；已有 Remotion 工程修改 motion.json 的 theme 后重新渲染即可。详见 [主题与命令](references/remotion.md)。

M02 按用户图示采用满幅油画，绘画覆盖顶部和底部，只保留中下方的旁白字幕；中文使用本地挥墨体，配紧凑字距、柔和局部暗影与平滑淡入淡出。不显示常驻书名/作者、章节标题、重复解说和英文装饰。字体文件及排版规则见 [Remotion 引擎指南](references/remotion.md)。

M02 已按用户提供的《罗纳河上的星夜》参考片做蓝金光色与空间优化：连续明暗底色、三层方向笔触、窗光及水面局部倒影、近景叶片视差、缓慢推移与片尾落定。仍为纯程序绘画，不调用生图或视频生成。[参考逐帧查看器](references/rhone-study/index.html)包含全部 644 帧的缩略预览；[制作与验证记录](docs/remotion-rhone-validation.md)说明适用范围与验证结果。

《百年孤独》M02 挥墨体完整版工程：`projects/bainiangudu-remotion-oil-full/`，沿用已确认的 44.991 秒旁白，10 镜、15 条原字幕、1350 帧。新增集市、家族肖像、长桌、现代城市、争吵、合书及空桌场景；完整成片位于该工程的 `renders/final.mp4`，原三镜样片独立保留。

```powershell
python scripts/render_remotion.py projects/bainiangudu-remotion --serve
python scripts/render_remotion.py projects/bainiangudu-remotion --sheet 12
python scripts/render_remotion.py projects/bainiangudu-remotion --jobs 2
python scripts/finalize.py projects/bainiangudu-remotion
python scripts/check_film.py projects/bainiangudu-remotion
```

样片画面：循环门廊 → 金鱼融化重铸 → 雨停人仍在。完整约45秒示例按迁移设计，在用户审看样片后扩展。

## 历史 Canvas 生图流程（显式选择时使用）

已有 Canvas 工程会按原引擎识别；`--world S01–S07/B/C` 或 `--renderer canvas` 可创建旧版工程。`--renderer remotion` 与 `--world` 冲突时会报错。不会把已有工程强制转成新引擎。

```bash
# 1. 文案：用 skills/emotional-book-review 出稿（默认8–15分钟叙事讲解，先做证据底稿和章节提纲），先交用户确认；确认后才写成 projects/<片名>/script.json
# 2. 配音（只有人声）
python scripts/make_voiceover.py projects/<片名> --check
python scripts/make_voiceover.py projects/<片名> --speed 0.9
# 3. 分镜表：按 audio/timings.json 写 projects/<片名>/storyboard.md
# 4. 选S01–S07：治愈S01/02，遗憾S03/04，现实S05，抽象S06，电影静帧S07
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
# 6. 字幕（SUB_Y=1500，最多两行，可加英文副行）+ 只合人声
python scripts/finalize.py projects/<片名>
# 7. 终检
python scripts/check_film.py projects/<片名>
```

产物：`projects/<片名>/renders/final.mp4`（1080×1920 / 30fps / h264 + aac 单音轨旁白，约 -16 LUFS）。

## 历史 Canvas 的七套画风

| 参数 | 画风 |
|---|---|
| S01（默认） | 暖光纸感油画 |
| S02 | 森系手绘绘本 |
| S03 | 蓝灰胶片插画 |
| S04 | 淡彩水彩散文 |
| S05 | 黑白版画 |
| S06 | 超现实纸艺 |
| S07 | 电影静帧（35mm 胶片、单一主光、颗粒与暗角） |

也可在script.json写visual_style或review_style，由脚本选择；显式--world优先。B/C只兼容旧工程。
材质来自实际AI图片；准备脚本导出完整提示词，绘图工具负责出图。图片齐全后再渲染，缺图会报错。
修改art-direction.json的style后重新准备并出图，已有图片不会自动重绘。规格见references/worlds.md。

## 目录

```
VibeSHUPIN/
  SKILL.md                  工作流主入口（给 agent 读）
  references/               竖屏规范、分镜表、找形象、外观、引擎 API
  skills/emotional-book-review/   书评文案 skill
  remotion/                 新默认：React/SVG 动态场景、按帧渲染与锁定依赖
  engine/                   旧Canvas引擎与两种引擎共用的本地字体
  scripts/                  建工程、配音、纯人声合成、终检
  projects/                 每条片一个工程（script.json + storyboard.md + motion.json + audio/ + renders/）
```

工程目录里 `audio/vo/` 是旁白分段，`audio/narration.wav` 是整条旁白，`audio/timings.json` 是时间轴；
`review/` 放静帧和拼图，`renders/raw.mp4` 是无声画面，`renders/final.mp4` 是成片。

文案写法见 [情绪导读指南](skills/emotional-book-review/references/EMOTIONAL_LEAD.md)；本轮五篇参考的逐篇拆解、适用边界与改动依据见 [参考文案分析](docs/reference-copy-analysis.md)。参考视频转写不直接充当原著出处。
