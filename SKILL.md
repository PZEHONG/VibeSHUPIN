---
name: vibe-book-review-film
description: >
  抖音竖屏书评短片：9:16（1080×1920）、温暖男声旁白、观众读中下部两行字幕，同时看屏上把这句话演出来。
  全流程七步：emotional-book-review 出文案 → Fish Audio 温暖男声配音 → 按真实时间轴写分镜表 → 按风格选外观 →
  建 9:16 工程逐帧画分镜（Canvas + seek(t) + Playwright + ffmpeg）→ 适配字幕 → 终检出片。
  声音只有旁白：禁止伴奏、禁止音效、禁止第二音源。
  用户说"做一条书评视频""把这篇书评做成抖音短片""给这本书出 60 秒口播视频""竖屏书评""白夜行那种书单视频"，
  或者给了书名 / 书评文案要做成成片时使用。只做 9:16 竖屏，只要温暖男声，不配乐。
---

# 竖屏书评短片工作流

交付物：一个工程目录（`script.json` + `storyboard.md` + `film.js` + `audio/narration.wav` + `renders/final.mp4`），
加上事实表、art-direction.json、art-prompts.md 和 assets/ 分镜图。成片 = 画面 + 温暖男声旁白，**没有别的声音**。

## 一条硬规矩

**全片只允许出现书评文案（温暖男声）的配音。**
不加 BGM、不加背景乐、不加音效（钟声、嗒声、上滑音、环境音都不行）、不垫第二音源。
因此：不写 `fr.sfx`，不跑 `--events`，不调用任何配乐脚本，后期只用 `scripts/finalize.py` 合片。
节奏靠旁白的停顿、画面的落定和留白做，不靠音乐。
`scripts/check_film.py` 把这条当硬检查，过不去就不许交片。

## 七步流程

每步后面是过关标准。没过就停在这一步改。命令都在本工作区根目录执行，`<工程>` 指 `projects/<片名>`。

### 1. 文案：调 emotional-book-review

用 `skills/emotional-book-review/`（SKILL.md 入口）出成稿：书名 / 作者 / 摘录或笔记 → 约 60 秒口播文案，
四种风格（情感共鸣 / 文学治愈 / 遗憾告别 / 人生感悟）选最契合的一种。
把成稿按自然段写成 `<工程>/script.json`（格式见 `references/storyboard.md`），固定温暖男声。

过关：删掉书名还像在谈这本书；没有编造的原著引文和情节；朗读时长与目标时长相符。

### 2. 配音：温暖男声 + 真实时间轴

```bash
python scripts/make_voiceover.py <工程> --check     # 先验证 Key 和声音
python scripts/make_voiceover.py <工程>             # → audio/vo/*.mp3、audio/narration.wav、audio/timings.json
```

Key 写在根目录 `.env` 的 `FISH_API_KEY`。语速 `--speed 0.9` 更克制。
`timings.json` 是后面所有时间的依据：每段起止、全片 duration。

过关：完整听一遍，音色是温暖男声、没有错字断句；只有人声，没有任何底乐。

### 3. 分镜表：按旁白时间写，不先排秒数

照 `references/storyboard.md` 写 `<工程>/storyboard.md`：一镜一行 = 时间（取 timings 分段边界）/ 旁白 / 画面 / 观众明白了什么。
形象先行：每句找到一样外行认得的东西来演，动词真的发生；画不出来的句子改句子（改了要同步重配音）。
末尾写事实表和"示意"清单。

过关：遮住旁白列，只读"画面"也看得出在讲什么；每句的名词屏上找得到；没有分镜表不建工程。

### 4. 选外观：跟着文案风格走

从 **S01–S06** 选择主画风：S01暖光纸感油画、S02森系手绘绘本、S03蓝灰胶片插画、S04淡彩水彩散文、S05黑白版画、S06超现实纸艺。
文学治愈优先S01（轻盈接纳用S02）；情感共鸣／遗憾告别优先S03（回忆散文用S04）；人生感悟优先S01（现实题材用S05，抽象观念用S06）。
以书籍事实和用户指定为先，一片一套；不确定用S01，不强制结尾转暖。

在 `script.json` 写 `"visual_style": "S01"`；也可用 `review_style` 指定四类文风，省略画风时脚本按映射选择。
显式 `--world` 优先于 `visual_style`，最后才按 `review_style` 映射或默认S01。
详细材质、提示词和验收见 `references/worlds.md`；机器使用的统一配置是 `references/visual-styles.json`。
字幕染色含义保持金=关键意象、玫红=痛；场景画材不套旧版星点或仪表。

### 5. 建工程、AI出图、做分镜（9:16）

```bash
python scripts/new_film.py <工程> --world S01      # S01–S06；已配音时自动带入真实片长与分段
```

自动生成 `art-direction.json`（绘画清单）、`art-direction.js`（浏览器清单）、`art-prompts.md`（草稿提示词）、`assets/`、`film.js` 和 `index.html`。
已有分镜表保留；没有时生成待补全初稿，不能把初稿当成完成的分镜。

1. 按分镜补全 `art-direction.json` 的角色、时代地域和逐镜场景、动作、情绪、景别、画面性质及依据。
2. 运行下列准备命令，获得含固定画材与人物设定的完整逐镜提示词。
3. 用可用的AI绘图工具逐镜生成图片：先审代表镜头，再复用角色参考图铺全片。按清单保存至 `assets/`；脚本不会调用付费绘图API或假装已经出图。
4. 保留“原著场景／读者生活映射／情绪隐喻”标签；原著场景必须有依据。需精确文字时后期排版。
5. 出图后验证尺寸与路径，按分镜补足真实动作。仅有推拉不等于动词已经发生。

```bash
python scripts/prepare_art.py <工程>                 # 补全清单后导出逐镜提示词
# 用绘图工具执行 art-prompts.md，把图片保存到各镜的 image 路径
python scripts/prepare_art.py <工程> --check-images  # 检查素材并同步浏览器清单
python engine/render.py <工程> --sheet 16
python engine/render.py <工程> --stills 5.9 18.1
python engine/render.py <工程> --motion 8.2 10.6
python engine/render.py <工程> --serve
```

图片加载完成后才开始渲染；缺图立即报错。六套的底色、字幕字族、颗粒和辉光按统一配置生效，油画／水彩等材质来自生成的图片。
`film.js` 的 `DUR`、绘画清单的 `duration` 必须等于 `timings.json` 的 `duration`。重配旁白后同步镜头和字幕。
换画风：修改 `art-direction.json` 的 `style`，重新准备、出图和验证；不用覆盖已有 `film.js`。风格变更本身不会重绘已存在图片。

坐标看 `references/vertical.md`，图片接口与引擎看 `references/engine.md`。
先做最难的一镜，再铺全片；每镜按本书重写，不搬其他影片画面。

过关：素材与画风清单一致；遮字幕过三问；至少改两轮；`--det`通过，再用`--jobs 4`渲出`renders/raw.mp4`。
B/C仅为旧工程兼容参数，不作为新书评默认选项。

### 6. 适配字幕

字幕 = 旁白原文，按 `audio/vo/` 的真实停顿拆短，写进 `SUBS`。
位置只认 `SUB_Y = 1520`（≈0.79×H），最多两行、一行 ≤18 字、一句最多染一处色，底部约 18% 留给抖音 UI。
细则和常见毛病见 `references/vertical.md` 第三、六节。

```bash
python scripts/finalize.py <工程>                  # 只把 narration.wav 合进 raw.mp4 → renders/final.mp4
```

过关：抽一张两行字幕的原尺寸静帧，字底边 ≤1594；字幕和旁白逐句对得上，不重叠、不超片长。

### 7. 终检

```bash
python scripts/check_film.py <工程>                # 自动项 FAIL 就必须改，退出码非 0
```

再做完人工三项（脚本查不了）：静音遮字幕看一遍 / 只读字幕一遍 / 成片完整看一遍并完整听一遍。
确认：1080×1920、30fps；只有一路音频且就是旁白；没有配乐、没有音效、没有水印署名；
事实与事实表一致；交片时把没做到的地方直说。

## 文件

| | |
|---|---|
| `skills/emotional-book-review/` | 第 1 步的书评文案 skill（写作规范、四种风格、输出格式） |
| `references/storyboard.md` | script.json 格式、分镜表写法、事实边界、风格→外观 |
| `references/vertical.md` | **9:16 硬规范**：跑道、字幕、旁白对齐、没有配乐时节奏怎么做 |
| `references/visualization.md` | 找形象、六种画法、什么时候不画、看图改图的毛病表 |
| `references/visual-grammar.md` | 定了画法之后的速查：句型、版式、常驻元素、转场、动效手感 |
| `references/script.md` | 文案的量、骨架、句式、事实、标题 |
| `references/worlds.md` | S01–S06 六套绘画外观、提示词与验收规格 |
| `references/engine.md` | 引擎 API、命令、坑（含本工作流与通用引擎的差异） |
| `engine/` | `vk.js` `vk-kit.js` `render.py` `index.html` `get_fonts.py` `fonts/`（已自带字体） |
| `references/visual-styles.json` | 六套画风统一配置 |
| `scripts/prepare_art.py` | 校验分镜并导出逐镜提示词与浏览器素材清单 |
| `scripts/` | `new_film.py` 建 9:16 工程 · `make_voiceover.py` 温暖男声旁白 · `finalize.py` 只合人声 · `check_film.py` 终检 |
| `projects/` | 每条片一个工程目录 |

本工作区自包含：引擎、字体、文案 skill、脚本都在目录内，不引用任何外部项目路径。
