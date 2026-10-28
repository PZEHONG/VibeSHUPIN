# 纯 Remotion 动态书评

新工程默认 Remotion CUSTOM，逐书设计原生图形与动作；图片、视频图层仅按用户需要使用；见 [混合素材指南](remotion-mixed.md)。M01 与 M02 及 Canvas 保留为历史兼容路径。下文两套主题和无外部素材的描述仅适用于历史工程。

## 两套主题

| 主题 | 视觉 | 字幕 |
|---|---|---|
| M01 文学纸艺 | 暖纸、炭黑剪影、旧金、线描 | 浅底深色字 |
| M02 厚涂油画 | 满幅竖屏油画；赭石、橄榄绿、暗蓝；程序笔触与画布经纬，偏印象派 | 挥墨体旁白字幕，象牙白字、轻阴影与柔和局部暗影 |

M02 在 Remotion 内用固定种子的绘画函数生成颜料图层，再按帧移动门、人物、金鱼和雨线；纹理随物体移动，不逐帧随机闪烁。不需要 AI 图片、外部图片素材或生图服务。它是程序化油画表现，不等同于写实油画或照片。

M02 按用户图示使用满幅构图：油画延伸到四边和字幕下方，人物、金鱼保持原比例；仅字幕区域局部压暗。取消常驻书名/作者、章节标题、画内重复解说及底部英文装饰。title_card、closing 字段在 M02 中不显示；M01 仍按原规则显示。切镜直接接入下一幅完整画面，避免出现空的画布页。

新建油画工程：`python scripts/new_film.py projects/<片名> --theme M02`。已有纯 Remotion 工程可将 motion.json 的 theme 改为 M02，随后重新渲染、合声和终检。历史工程可显式选择 M01；`--theme` 不能与 Canvas 或 `--world` 同用。

## 工程与运行

- `script.json`：确认后的书评文案、书名与作者。
- `storyboard.md`：动态分镜、原著依据与示意说明。
- `motion.json`：可编辑镜头、字幕、主题及源摘要。
- `audio/narration.wav`、`audio/timings.json`：真实旁白与时间轴。
- `renders/raw.mp4`：无音轨画面；`raw.render.json` 记录分镜与输出摘要。
- `renders/final.mp4`：只合旁白的成片；`final.render.json` 记录画面、旁白与成片摘要。
- `review/`：静帧、拼图、全部字幕的实际 DOM 边界及绑定分镜/场景代码/字体的测量摘要。

依赖：Python 3.11+、Node.js 22+、现有 Chrome、FFmpeg；`npm ci --prefix remotion` 安装锁定的 Node 依赖。渲染不会下载浏览器；设置 `VIBE_CHROME_PATH` 可指定已有 Chrome。

M02 使用本地 `engine/fonts/WenYue-HuiMoShouShu-J.otf`（挥墨体），来自用户已有项目保存的字体文件；渲染前复制至静态资源区，并等待字体真正加载后排字。该文件不由 `engine/get_fonts.py` 下载。缺失时报出字体路径，不以其他字体替代；M01 不依赖挥墨体。字体内容纳入渲染摘要，替换字体后需重新渲染。

```powershell
python scripts/new_film.py projects/<片名>
python scripts/render_remotion.py projects/<片名> --serve
python scripts/render_remotion.py projects/<片名> --sheet 12
python scripts/render_remotion.py projects/<片名> --stills 0.7 4.8 6.5
python scripts/render_remotion.py projects/<片名> --det
python scripts/render_remotion.py projects/<片名> --clip 0 3 --name opening
python scripts/render_remotion.py projects/<片名> --jobs 2
python scripts/finalize.py projects/<片名>
python scripts/check_film.py projects/<片名>
```

`--serve` 启动 Remotion Studio，支持时间线预览；画面合成本身无声。首期通过合成后的样片审听，未接实时旁白播放。Ctrl+C 结束预览。

`--clip` 仅导出无声片段及 `.clip.json` 中的原帧区间，不把原旁白自动混入片段。请按同一量化区间裁音后再合成；不能直接对这个片段使用整条旁白。

## motion.json

```json
{
  "schema_version": 1,
  "renderer": "remotion",
  "theme": "M01",
  "draft": false,
  "title": "书名",
  "author": "作者",
  "width": 1080,
  "height": 1920,
  "fps": 30,
  "duration": 3,
  "source_hashes": {
    "script.json": "对应文件的SHA256",
    "audio/timings.json": "对应文件的SHA256",
    "audio/narration.wav": "对应文件的SHA256"
  },
  "shots": [{
    "id": "road",
    "segment_ids": ["hook"],
    "start": 0,
    "end": 3,
    "scene_type": "corridor",
    "scene_props": {"cycles": 1},
    "kind": "情绪隐喻",
    "evidence": "",
    "intent": "走到尽头又回到同一扇门"
  }],
  "subtitles": [{"start": 0.2, "end": 2.8, "zh": "走到尽头，又回原点。"}],
  "title_card": null,
  "closing": null
}
```

这只是字段示例，实际字幕必须与真实旁白完全对应，摘要必须由真实文件计算，不能把示例字符串直接用于出片。新脚手架是 draft，未完成分镜不能渲染。

当前场景：`corridor`（cycles 整数 1–3）、`goldfish`（cycles 整数 1–3）、`rain`（stop_at 在 0.1–0.9 之间，表示镜头内停雨的进度）。这三种是《百年孤独》样片场景；其他书按分镜写新场景，不能用马孔多或小金鱼充当所有书的通用画面。

《百年孤独》完整版另有七种 M02 专用场景（`scene_props: {}`）：`market`（人流与静止的人）、`portraits`（七幅家族肖像与扫光）、`table`（长桌两只错过的手）、`city`（现代城市车流与窗前人）、`quarrel`（一人离开、椅子微晃）、`book`（合书）、`empty_table`（七把空椅与渐弱烛光）。M01 使用这些场景会报错。完整工程位于 `projects/bainiangudu-remotion-oil-full`，沿用 r3 原始文案、44.991 秒完整旁白及完整中英文字幕；10 镜、1350 帧。它与此前 386 帧样片分别保存。

场景组件使用当前帧计算所有状态。新增场景需同步 `scripts/motion_project.py` 的参数校验、`src/data/types.ts` 的类型和 `BookReview.tsx` 的调度；不使用墙上时钟、非固定随机数或随播放累积的状态。

M02 的参考优化采用 `oilPaint.ts` 的多尺度底色与笔触、`oilFullPaint.ts` 的局部光照和建筑细节、`oilMotion.ts` 的镜头路径。镜头只作用于绘画，字幕仍保持固定安全区；推移预留足够出血，不露画面边缘。雨景的暖金倒影按当前帧轻微摆动，近景叶片具有额外位移。空桌镜头在 78% 进度后固定机位。不要引入逐帧随机纹理或实时 SVG 噪声位移：后者曾使同帧重渲出现微小像素差异，已去除。运动边界检查：`node --experimental-strip-types --test remotion/scripts/oil-motion.test.mjs`。

`kind` 为原著场景、情绪隐喻或读者生活映射。原著场景必须填写 evidence；画面解读用 intent 描述。title_card/closing 可为空，非空时含 start/end/text，并遵守字幕与安全区。

## 时间、字幕与输入更新

- duration 与 timings.json 完全一致。
- 所有场景连续覆盖 [0,duration)，旁白停顿归入相邻镜头，保持落定画面。
- 时间以秒编辑，绝对边界用 floor(t×30+0.5)，全片最终边界为 ceil(duration×30)，右开区间。
- 用绝对边界计算镜头和片段，不逐镜累加四舍五入后的时长。最后一帧最多补齐不足 1/30 秒的片尾。
- 字幕只用原旁白，可见文字对照 timings 的完整段落校验；每行≤18字，最多两行，英文≤60字符且只配单行中文。
- 两者字幕块中心约 y=1500。M01 为思源宋体、深色字和暖纸底，以 68/62/54px 为字号上限，字距 .055em、行高 1.38。M02 为挥墨体原生 400 字重，不合成加粗；按句长以 72/66/60px 为字号上限，字距 .018em、行高 1.28。两者均按已加载字体的实际文字宽度自动缩小以适配 952px；英文副行继续自动适宽，全部字幕做 DOM 测量，底边≤1594。
- M02 使用象牙白字与轻阴影；柔和椭圆暗影按中英文文字宽度和行数自适应，不铺满高不透明横带。字幕约 0.16 秒平滑淡入淡出，短句自动缩短过渡，完全由当前帧计算；原始字幕文案与起止时间保持同步于旁白。
- 重配音或修改文稿后，先重新安排镜头与字幕，再调用 `motion_project.source_hashes(project)` 计算真实摘要并写回 motion.json；不要用更新摘要掩盖未调整的分镜。
- 修改 motion.json、渲染组件或字体后需重新渲染。输入和渲染代码摘要在渲染开始时固定，结束时再次校验；渲染途中更改输入会报错。输出和字幕测量记录都绑定分镜、组件代码与字体摘要，不能沿用旧检查证据。

## 样片复现

已有工程 `projects/bainiangudu-remotion` 源自 `bainiangudu-r3`。源区间 12.091–24.961 秒量化为 [363,749)，实际裁音范围 12.1–24.9666667 秒，产生 386 帧短片。切点误差小于半帧，字幕时间减去同一个起点，首句起点取零。

创建到**空的新目录**可运行：

```powershell
python scripts/make_remotion_sample.py projects/bainiangudu-r3 projects/bainiangudu-remotion-copy
```

此命令专用于这段既有旁白；它保留 sample-source.json 和 source-storyboard.md，不重新调用配音或生图服务。完整约45秒示例待用户审看样片后扩展。

油画对照工程：`projects/bainiangudu-remotion-oil`。script、timings、narration 与 M01 样片完全相同，仍为 386 帧；镜头参数一致，仅主题及分镜材质说明不同。

```powershell
python scripts/render_remotion.py projects/bainiangudu-remotion-oil --sheet 12
python scripts/render_remotion.py projects/bainiangudu-remotion-oil --det
python scripts/render_remotion.py projects/bainiangudu-remotion-oil --jobs 2
python scripts/finalize.py projects/bainiangudu-remotion-oil
python scripts/check_film.py projects/bainiangudu-remotion-oil
```
