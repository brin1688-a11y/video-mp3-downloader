# -*- mode: python ; coding: utf-8 -*-
# Folder build (fast start-up) used by installer.iss to make setup.exe
import os
import shutil
from PyInstaller.utils.hooks import collect_all, collect_data_files, collect_submodules


def find_tool(name, fallbacks):
    """Finds a helper exe on PATH or in known folders."""
    for path in [shutil.which(name), *fallbacks]:
        if path and os.path.isfile(path):
            return path
    raise SystemExit(f"{name} not found. Install it or edit installer.spec.")


FFMPEG = find_tool("ffmpeg", ["C:/ffmpeg/bin/ffmpeg.exe"])
DENO = find_tool("deno", [os.path.expandvars(
    "%LOCALAPPDATA%/Microsoft/WinGet/Packages/DenoLand.Deno_Microsoft.Winget.Source_8wekyb3d8bbwe/deno.exe")])

datas = [("icon.ico", ".")]   # window / header logo
binaries = [(FFMPEG, "."), (DENO, ".")]   # FFmpeg: MP3/merging · Deno: YouTube
hiddenimports = []
for pkg in ("customtkinter", "curl_cffi"):
    tmp_ret = collect_all(pkg)
    datas += tmp_ret[0]; binaries += tmp_ret[1]; hiddenimports += tmp_ret[2]

# yt-dlp: all extractors + the YouTube JS challenge solver files (.js data)
datas += collect_data_files("yt_dlp")
hiddenimports += collect_submodules("yt_dlp")

# Playwright driver (drives the installed Microsoft Edge for Douyin)
datas += collect_data_files("playwright", include_py_files=False)
hiddenimports += collect_submodules("playwright")

# Keep unrelated packages from the global Python install out of the build
excludes = ["PyQt5", "PyQt6", "PySide2", "PySide6", "numpy", "pandas", "matplotlib",
            "scipy", "IPython", "jupyter", "notebook", "werkzeug", "flask", "cv2", "torch"]


a = Analysis(
    ["app.py"],
    pathex=[],
    binaries=binaries,
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=excludes,
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name="BorinDownloader",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=["icon.ico"],
)

coll = COLLECT(
    exe,
    a.binaries,
    a.datas,
    strip=False,
    upx=False,
    upx_exclude=[],
    name="BorinDownloader",
)
