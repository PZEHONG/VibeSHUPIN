# Remotion 逐书视觉与混合素材

新工程默认 `CUSTOM`；这是一种制作模式，不是统一画风。优先按作品创作 Remotion 原生动态场景，使用逐帧图形、角色及物件变化承担叙事。下文素材图层是用户明确需要时的可选能力，不能代替人物和情节动画。确认文案、完成配音之后，按本书叙事制定风格、色彩、人物设定与镜头变化，保存在 motion.json 的 `visual_direction`：`style`、`palette`、`characters`。M01/M02 可显式选择，旧工程不迁移。

`media` 场景的 `scene_props.layers` 从下到上叠放，图片或视频均放项目 `assets/`，不能越界。每层填写 `type`（`image` 或 `video`）、`src`（例如 `assets/scene.png`），可填写 `scaleFrom`、`scaleTo`、`xFrom`、`xTo`、`opacity`。图片会随镜头线性推移；视频从镜头开始播放且静音，应自行保证源视频至少覆盖镜头时长；暂不提供源内入点、循环或自动补帧。字幕当前沿用白字挥墨体排版；这项设计并不限定插画或视频的风格。每个镜头仍需说明画面性质、依据和观众理解。素材叠层、慢推移不等于自然的人物表演；需要动画素材或另行制作。

完成素材选择后在项目根目录运行：

```powershell
python -c "import sys,json; from pathlib import Path; sys.path.insert(0,'scripts'); from motion_project import asset_hashes,write_json; p=Path('projects/项目名'); m=json.loads((p/'motion.json').read_text(encoding='utf-8')); m['asset_hashes']=asset_hashes(p,m); write_json(p/'motion.json',m)"
python scripts/render_remotion.py projects/项目名 --clip 0 30 --clip-audio --name sample
```

片段将产生无声 `sample.mp4` 与按同一帧边界裁切旁白的 `sample-voice.mp4`；已有带声文件不会覆盖。选择不切断句子的边界。图片/视频的路径、存在性及内容摘要会在渲染前和渲染后检查；替换素材需重新检查分镜并更新摘要、重新渲染。只保存摘要并不证明素材版权或画面事实准确。

推荐先做 30–60 秒包含动作、情节变化和观点的样片：检查视觉一致性、画面中叙事变化、旁白和字幕同步，完整播放观察人物动作是否达到要求，并记录制作耗时。技术校验不代替审看；素材不足、人物一致性或动作不自然时应修改样片，不应自动扩展全片。

## 原生动画制作

每期从文案的情节和观点出发设计动作：为对象分别定义位置、形变、遮挡、出入场及发生时刻，并以当前帧计算状态；不得把静态图缓慢缩放视为情节动作。必要时为本书编写新场景，并在 Python 校验、TypeScript 类型和画面调度中注册；`story_tree`、`story_court` 是《知更鸟》动作验证专用示例，不是其他书的默认模板。颜色、构图与造型随每期美术方向确定。自动测试验证时间与状态变化，视觉与动作质量必须另行完整审看。
