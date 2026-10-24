"""校验绘画分镜，导出完整提示词和浏览器素材清单。不会调用绘图 API。"""
import argparse
from pathlib import Path
import sys
from visual_styles import read_json, validate_art, export_art


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("project")
    parser.add_argument("--check-images", action="store_true", help="绘图完成后检查文件与竖幅尺寸")
    args = parser.parse_args()
    project = Path(args.project).resolve()
    try:
        art = read_json(project / "art-direction.json")
        errors = validate_art(art, project, images=args.check_images)
        if errors:
            raise ValueError("\n".join(errors))
        export_art(art, project)
    except (ValueError, OSError, TypeError, KeyError) as exc:
        print(f"绘画准备失败：{exc}", file=sys.stderr)
        return 1
    print(f"{art['style']} · {len(art['shots'])}镜：art-prompts.md / art-direction.js 已同步。")
    return 0


if __name__ == "__main__":
    sys.exit(main())
