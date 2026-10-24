# 六套画风贯穿工作流 Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan inline.

**Goal:** S01–S06 从工作流入口贯穿工程创建、绘画提示词、素材加载、渲染和终检。
**Architecture:** 单一 references/visual-styles.json 保存六套材质与渲染配置；scripts/visual_styles.py 负责数据与验证，new_film.py 创建工程，prepare_art.py 生成逐镜提示词及浏览器清单。engine/art.js 在引擎启动前加载图片，check_film.py 对新工程检查风格、时间与素材；B/C 老路径保留。
**Tech Stack:** Python 标准库、现有 Pillow／Playwright、Canvas JavaScript。
**Spec:** references/worlds.md + 本次用户“让六套模板实际贯穿工作流”。

## Global Constraints
- 1080×1920 / 30fps；SUB_Y=1520，两行字幕底边≤1594。
- 只有温暖男声旁白，无配乐、音效或第二音源。
- S01–S06 支持 --world；默认 S01，script.json 可提供 visual_style 或 review_style，命令显式值优先。
- B/C 兼容既有工程；不改 projects/ 中任何现有文件。
- 真实绘画由已有绘图工具按提示词执行，不宣称参数能自动生成画作。
- 编辑原路径；目录此前不是 Git 仓库，使用局部 Git 提交保存本次代码／技能变更，不添加密钥、音频或既有项目。

## Review Focus
- 非法编号与已有工程冲突须在写入前失败。
- 旁白含引号、反斜杠和换行时仍为有效 JS。
- 新工程缺图必须可读地报错，不能渲空帧后误称成功。
- 画风修改后 JSON、浏览器清单和影片声明须一致。
- 原著场景有依据；隐喻不得冒充事实，时间顺序与素材路径受约束。

## Task 1: 创建与提示词
- [x] 写 CLI 测试：六编号、默认／自动映射、B/C兼容、坏参数无副作用、保护已有文件、含引号字幕。
- [ ] 运行并确认新编号因旧脚本拒绝而失败。
- [ ] 实现注册表、共享校验、新工程 art-direction.json、draft提示词与分镜表；prepare_art.py 校验完整分镜后生成可用清单。
- [ ] 测试准备步骤的缺字段、时间重叠、路径越界与原著依据。
## Task 2: 图片渲染和终检
- [ ] 实现预加载与按时间纯函数绘制；缺图设置 LOAD_ERROR，渲染器快速报错。
- [ ] 六套颜色／辉光／颗粒进入真实渲染；字幕最后绘制；新工程通过 art-direction.js 加载素材。
- [ ] 终检新工程的画风、素材尺寸／存在性、时间轴与清单一致性，兼容旧工程。
- [ ] 真浏览器检查六套工程就绪、确定性、缺图失败；运行完整测试。
## Task 3: 入口同步与保存
- [ ] 同步 SKILL.md、README.md、storyboard.md、worlds.md 与 engine.md，保留纯旁白规则。
- [ ] 检查旧映射不再作为新流程指导；更新计划完成项。
- [x] 作者完成源代码核对，完整测试通过，局部Git提交；独立复核受工具阻碍，未取得结论。

## 实施记录

- CLI、提示词、图片加载和终检已接入；旧项目未改写。
- 强制重建保留既有画风，更新标准分镜头信息；重配旁白后拒绝过期清单。
- 实机发现Chrome系统安装未被旧channel发现，已增加路径检测；发现PATH中的空ffmpeg占位，新增有效编码器解析，不改系统PATH。
- 真实Chrome六套加载与乱序seek截图一致；真实MP4小片段验证通过。

最终验证：18项unittest全部通过（23s），含六套Chrome实测、缺图快速失败、真实H264竖屏短片导出；Python编译、JS语法、技能格式和文档链接均通过。
独立复核说明：首次因sandbox provisioning失败而未读到源码，Node重试未取得结果后终止；不将此项表述为独立审查通过。
