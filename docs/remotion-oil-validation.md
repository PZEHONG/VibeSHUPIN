# M02 厚涂油画验收记录

日期：2026-10-26。工程：projects/bainiangudu-remotion-oil。

本页为带章节标题的初版记录；用户随后要求满幅油画、只留旁白字幕。当前版本验证见 [满幅版验收记录](remotion-oil-fullscreen-validation.md)。

## 交付与使用

M01 文学纸艺保持默认；新增 M02 厚涂油画。新工程使用 `python scripts/new_film.py projects/<片名> --theme M02`，已有纯 Remotion 工程修改 motion.json 的 theme 后重新渲染、合声、终检。

M02 用固定种子的程序绘画生成笔触、颜料明暗和画布经纬；门、人物、金鱼、坩埚使用独立图层，按当前帧计算动作，雨线按帧运动并停下。没有调用生图、配音或其他远端媒体服务，没有新增依赖。它是一套偏印象派的程序化油画表现。

交付：renders/final.mp4、motion.json、storyboard.md、review/sheet.jpg、静帧、字幕测量、确定性检查帧、review/validation.json、渲染与合成来源记录。

## 验证结果

- 两份 motion.json 除 theme 外完全一致；script.json、audio/timings.json、audio/narration.wav 逐字节相同。旁白 SHA256：e1594ad21147fc8a747ba05da52477a513b255619bf6cfc6da9ebb8a98620781。
- 两套样片均为 386 帧、12.866667 秒、1080×1920、30fps、H.264。raw 无音轨；成片仅一路 AAC 旁白，音轨 12.866 秒。
- 最终油画版大小 4,195,051 字节；视频 SHA256：fd8807b7f23f835dd847d0f213894cc2ffea9274a0847312ef196181ad2f5352。
- 渲染代码/字体摘要：a6aea689c0ad481985cb2e932397a567853d361d5baf3cabc985dd062fcf2ce1。
- M02 最终版本同帧乱序重渲染像素一致；全字幕 DOM 边界覆盖全部四条字幕，底边最大 1562.90625，左右边界 64–1016，均在安全区内。
- 两套样片 check_film.py 全部 19 项通过；响度 -16.01 LUFS，真峰值 -4.1 dBTP。两套最终音视频完整 FFmpeg -xerror 解码通过。
- 全套常规回归：42 passed、1 skipped、25 subtests passed。跳过项为需显式开启的真实 Remotion 渲染测试。
- 开启真实 Chrome 渲染后：24 passed、21 subtests passed，覆盖 M01/M02 的16字、18字、两行各18字及60个宽英文字母；两套字幕均实际测量通过。
- TypeScript 类型检查通过；最后门牌补充后再次通过。CLI 帮助文案调整后再次运行工作流回归：23 passed、13 subtests passed。

## 静帧与独立审查

查看了三镜静帧、12格拼图和金鱼重组末段：走廊回到同一扇门、鱼进入坩埚消失后重新成形、雨停而人物原地停留。首轮笔触边缘过黑，已修正颜色处理并柔化笔触轮廓。独立审查发现门上缺少分镜承诺的“一”字标记，已补入门本身的绘画纹理，复核后无剩余发现；修正后重新渲染和检查两套样片。

未声称人工完整播放或完整试听。最终样片供用户预览观感与听感。三个场景仍服务于已确认的《百年孤独》样片，其他书需要按文案实现相应场景。

工作区已有修改保留，未打包提交。M01 样片与同内容的 remotion-sample.mp4 已同步到本次渲染版本。
