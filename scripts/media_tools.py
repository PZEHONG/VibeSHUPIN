"""使用PATH中有效的已有编码器，跳过Windows空占位文件；不安装软件。"""
import os
from functools import lru_cache
from pathlib import Path
import shutil


def _windows_registry_paths():
    """父进程传来的PATH可能丢掉中文目录，回读注册表里的原始PATH补齐。"""
    if os.name != "nt":
        return []
    import winreg

    entries = []
    for root, sub in (
        (winreg.HKEY_CURRENT_USER, "Environment"),
        (winreg.HKEY_LOCAL_MACHINE, r"SYSTEM\CurrentControlSet\Control\Session Manager\Environment"),
    ):
        try:
            with winreg.OpenKey(root, sub) as key:
                value, _ = winreg.QueryValueEx(key, "Path")
        except OSError:
            continue
        entries.extend(value.split(os.pathsep))
    return entries


def _path_directories():
    seen = set()
    for directory in [*os.get_exec_path(), *_windows_registry_paths()]:
        if not directory or "%" in directory:
            continue
        key = os.path.normcase(os.path.normpath(directory))
        if key in seen:
            continue
        seen.add(key)
        yield directory


@lru_cache(maxsize=None)
def media_tool(name):
    if name not in {"ffmpeg", "ffprobe"}:
        raise ValueError("只允许解析ffmpeg或ffprobe")
    for directory in _path_directories():
        candidate = shutil.which(name, path=directory)
        if candidate:
            try:
                if Path(candidate).stat().st_size > 0:
                    return candidate
            except OSError:
                continue
    raise FileNotFoundError(f"找不到有效的{name}，请将已有安装的bin目录加入PATH")
