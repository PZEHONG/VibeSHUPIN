# Emotional Book Review Skill · 中文情感书评生成器

根据**不同书籍的内容和核心主题**，生成适合视频口播的原创中文书评。支持情感共鸣、文学治愈、遗憾告别和人生感悟等风格。

## 功能

- 为每本书选择自己的情感切口，避免直接换书名套模板。
- 默认生成8–15分钟叙事讲解型深度书评，先以10–12分钟构思：整理文本依据和章节提纲，沿人物事件或作者论证推进，在关键节点展开分析。短篇情绪导读、分析评论体、金句书摘体、情感散文体和其他时长按需选择。
- 可以指定温暖男声、女声、视频号/抖音/小红书和避剧透规则。
- 支持多个风格版本、批量书单，以及可选的标题、封面、字幕、分镜、配音提示。
- 不编造人物/情节/作者原话；只有书名却缺少可靠内容时明确事实限制。

**技术说明**：这是 instruction-only Agent Skill，不自带大模型、书籍数据库、TTS或视频渲染器。实际生成由运行它的 Codex、Claude Code、OpenCode 等支持 Skills 的智能体完成。

## 文件说明

```text
emotional-book-review/
├── SKILL.md                    # Agent Skills 主入口（必需）
├── README.md                   # 安装与使用
├── assets/
│   └── INPUT_TEMPLATE.md      # 可复制的书评需求卡
└── references/
    ├── STYLE_GUIDE.md         # 四种风格的写作规则与反套路约束
    ├── EMOTIONAL_LEAD.md      # 情绪入口、片段推进、结尾与编辑示例
    ├── NARRATIVE_LONGFORM.md  # 中长篇叙事、证据与审稿
    ├── OUTPUTS.md             # 标题、字幕、配音、分镜、批量格式
    ├── QUOTING.md             # 原文记录、出处核查与署名边界
    └── EXAMPLES.md            # 细节评论、概念边界与引文处理示意
```

## 安装

下载 ZIP 后保留 `emotional-book-review/` 目录，将它放在支持的 Skills 目录内。

**Codex / OpenCode 通用安装（用户级）**

macOS/Linux：

```bash
mkdir -p ~/.agents/skills
unzip emotional-book-review.zip -d ~/.agents/skills/
```

Windows PowerShell：

```powershell
New-Item -ItemType Directory -Force "$HOME\.agents\skills" | Out-Null
Expand-Archive -Path .\emotional-book-review.zip -DestinationPath "$HOME\.agents\skills" -Force
```

安装后应有 `~/.agents/skills/emotional-book-review/SKILL.md`（Windows 为 `$HOME\.agents\skills\emotional-book-review\SKILL.md`）。

**项目级安装（Codex / OpenCode）**

将 `emotional-book-review/` 放到项目根目录：`.agents/skills/emotional-book-review/`。

**Claude Code**

将目录放到 `~/.claude/skills/emotional-book-review/`，或项目根目录 `.claude/skills/emotional-book-review/`。

Codex通常可自动发现新Skill，若未出现可以重启会话。OpenCode在其支持的skills路径中按需发现。

## 调用

在支持 `$` Skill 调用的 Codex 会话中输入：

```text
$emotional-book-review 为《小王子》生成一份60秒遗憾告别风格的中文口播书评。温暖男声，尽量不剧透。给我3个标题。
```

也可以自然语言触发：

```text
请使用 emotional-book-review，把《活着》《被讨厌的勇气》《窗边的小豆豆》分别生成60秒书评：每本书自动选择不同情绪切口，不要套模板。
```

或者粘贴 [书评需求卡](assets/INPUT_TEMPLATE.md) 填入自己的书名与要求。

## 关于原文与版权

此Skill默认撰写的是**原创评论性文案**，不是原著引文或书籍的完整替代品。若没有可靠来源，不把文案里的金句称为“书中原话”；若需展示摘录、封面或影视画面，请自行确认相应使用许可。

## 版本

v1.2.0 · 2026-10-25
