"""使用PATH中有效的已有编码器，跳过Windows空占位文件；不安装软件。"""
import os
from pathlib import Path
import shutil


def media_tool(name):
    if name not in {"ffmpeg", "ffprobe"}:
        raise ValueError("只允许解析ffmpeg或ffprobe")
    for directory in os.get_exec_path():
        candidate = shutil.which(name, path=directory)
        if candidate:
            try:
                if Path(candidate).stat().st_size > 0:
                    return candidate
            except OSError:
                continue
    raise FileNotFoundError(f"找不到有效的{name}，请将已有安装的bin目录加入PATH")
