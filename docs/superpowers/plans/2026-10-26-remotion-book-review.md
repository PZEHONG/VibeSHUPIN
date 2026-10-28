# Remotion Book Review Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** 将新工程默认入口迁移到纯 Remotion，并交付可审看的《百年孤独》三镜样片。

**Architecture:** Python 管理工程输入、验证、素材暂存和旁白合成；TypeScript/React/Remotion 负责按帧的无声画面。motion.json 为可编辑源，旧 Canvas 分支保持兼容。

**Tech Stack:** Python 3.13、Node 22、TypeScript、React、Remotion、本机 Chrome、FFmpeg。

**Spec:** docs/superpowers/specs/2026-10-26-remotion-book-review-design.md（用户于本轮批准执行）。

## Global Constraints

- 1080×1920、30fps、H.264 视频与 AAC 单音轨旁白。
- 全片只合入 audio/narration.wav；画面组件不包含音频播放或音频素材。
- 字幕块中心 y=1500，最多两行，每行不超过 18 个可见字符，底边不超过 1594。
- 所有时间从 audio/timings.json 取得，绝对切点 round(seconds*fps)，总帧数 ceil(duration*fps)。
- 新文件与依赖留在 D 盘；保护预先存在的未提交改动，不提交它们。
- 先交约 13 秒样片；完整示例扩展等待设计中约定的样片审看。

## Review Focus

- 改了文稿或音频但没重排分镜：哈希不一致必须阻止出片。
- 非整数秒切片：画面、字幕和旁白用同一量化区间，不累计漂移。
- 新旧参数冲突或已有混合工程：明确报错，不覆盖现有工程。
- JSON 类型错误、NaN、越界路径：可读错误，不能崩溃或任意读文件。
- 仅单音轨不能证明音源唯一：无声画面和唯一旁白输入均要验证。

### Task 1: 输入契约与默认入口

Files: 新增 scripts/motion_project.py、tests/test_motion_workflow.py；修改 scripts/new_film.py 和 tests/test_visual_workflow.py。

Interfaces: load_motion(project, ready=True) -> dict；validate_motion(data, project, ready=True) -> list[str]；create_motion_project(project, script, force=False) -> dict；frame_range(start, end, duration, fps=30) -> tuple[int,int]（右开）。

- [x] 先写失败测试：新默认创建 motion.json draft；--world S01 与 --renderer canvas 保留旧路；冲突/覆盖失败；未知场景/缺源/改源/字幕/时间/类型/路径非法会失败。
- [x] 运行 pytest tests/test_motion_workflow.py -q 观察缺实现失败。
- [x] 实现严格输入、源摘要、帧边界和 draft 工程。
- [x] 测试旧外观映射改为显式 Canvas，运行新旧 Python 测试通过。

### Task 2: Remotion 渲染与纯代码画面

Files: 新增 remotion/package.json、锁文件、tsconfig.json、src/Root.tsx、src/BookReview.tsx、src/components/、src/scenes/、src/data/types.ts、scripts/render.mjs、scripts/render_remotion.py。

Interfaces: Python 验证后把 motion.json 作为 inputProps.motion；Node 调用 bundle/selectComposition/renderStill/renderMedia，输出无声 raw.mp4；CLI 支持 --serve/--stills/--sheet/--clip/--det。

- [x] 渲染边界测试先覆盖时间点/切片参数非法；缺依赖给安装提示。
- [x] 统一版本安装依赖到 D 盘，接入本地字体与已有 Chrome。
- [x] 实现纸层、剪影、字幕和循环门廊/金鱼重铸/雨中小镇场景。
- [x] 类型检查通过，渲染真实场景静帧并做两轮视觉检查，测量字幕 DOM 边界。
- [x] 同帧乱序渲染比较像素通过。

### Task 3: 样片与音画合成

Files: 新增 projects/bainiangudu-remotion/ 的 script.json、motion.json、storyboard.md；新增 scripts/make_remotion_sample.py；更新 scripts/finalize.py 支持共用合成函数。

Interfaces: 源区间先量化为 [363,749)，再按量化边界裁切旁白，形成 386 帧样片；记录原工程/原区间和音频派生方式。样片项目本身为完整 12.8667 秒项目，正常 finalize 可用。

- [x] 为样片切点与源字幕偏移先写失败测试，验证量化不改变音画相对位置。
- [x] 复用旧字幕和既有音频，生成三镜样片项目及来源记录，不调用配音 API。
- [x] 导出样片、拼图，完整解码并检查媒体规格与旁白时长。

### Task 4: 终检与交付文档

Files: 修改 scripts/check_film.py、README.md、SKILL.md、references/engine.md、references/storyboard.md、references/vertical.md、references/worlds.md、.gitignore。

Interfaces: check_film.py 识别 Remotion 工程并调用独立公共输入/成片检查；旧 Canvas 检查不变；--no-audio 也检查已有 raw.mp4 确实无音轨。

- [x] 先写检查脚本对合法 Remotion 工程和污染音轨输入的失败测试。
- [x] 实现新终检与清晰 CLI 提示，更新新默认工作流和旧版兼容指引。
- [x] 运行 Python 全套、TypeScript 类型检查、样片终检与完整解码；新上下文审查实现并处理重要问题。
- [x] 交付样片链接、拼图和运行入口，清楚说明完整示例等待用户审看样片，不声称完整看听。

## Execution ledger

- Ruling: 用户“执行”已授权当前设计及原地实施，不再为计划重复请求确认；使用 codex/remotion-book-review 分支，备份位于 D:/AI剪辑/backups/VibeSHUPIN-remotion-20261026，避免仅含 HEAD 的工作树遗漏大量未提交依赖。
- Baseline: tests/test_visual_workflow.py 与 tests/test_media_tools.py：15 passed, 6 subtests passed。
- Ruling: 样片建立为独立、可正常 finalize 的完整短工程；原区间量化后裁音，保留来源记录；完整约 45 秒示例等待样片审看，符合设计交付顺序。
- Commits: 当前工作区混有大量原有更改，本轮先交可审查文件与测试证据，不把混合改动打包提交。
- Task 1: complete — 初次缺实现10项失败后实现通过，新默认、旧参数与输入验证已接通。
- Task 2: complete — 锁定 Remotion4.0.538/React19.3.1；真实三镜静帧已查看，乱序像素比较通过。首次字体类型错误通过补全 DOM.Iterable 定位修正。
- Review: 独立代码审查发现长字幕实际宽度、字幕证据过期、渲染结束才取摘要三项P2；均已先补失败回归，再增加字体实测适宽、全字幕测量/摘要绑定和固定快照。另补31/30秒浮点多帧与非法timing结构回归。
- Ruling: 自动字幕边界检查由抽样升级为每条字幕中点实测，且正式渲染也执行；有少量额外预检耗时，可避免短句未被拼图抽到而漏检。
- Ruling: 来源摘要同时包含组件代码、Node渲染入口、依赖锁与本地字体；渲染期间发生修改时不登记新来源。完整示例仍等待样片审看。
- Task 3: complete — 386帧样片已导出并只合原旁白，H.264/AAC与12.866667秒时长验证，最终音视频完整解码通过。
- Task 4: complete — Python常规40 passed/1 skipped/23 subtests；另显式运行真实渲染边界测试通过（新增测试组22 passed/15 subtests）；tsc通过，样片终检全部PASS；审查三项P2已修正，实测记录见 docs/remotion-sample-validation.md。
- Delivery boundary: 本阶段迁移和三镜样片完成；按已批准设计，完整约45秒示例等待用户审看样片。
