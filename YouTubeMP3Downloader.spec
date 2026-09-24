# -*- mode: python ; coding: utf-8 -*-
from PyInstaller.utils.hooks import collect_all, collect_data_files, collect_submodules

datas = [("icon.ico", ".")]   # window / header logo
binaries = [('C:/ffmpeg/bin/ffmpeg.exe', '.')]
hiddenimports = []
for pkg in ('customtkinter', 'curl_cffi'):
    tmp_ret = collect_all(pkg)
    datas += tmp_ret[0]; binaries += tmp_ret[1]; hiddenimports += tmp_ret[2]

# yt-dlp: all extractors + the YouTube JS challenge solver files (.js data)
datas += collect_data_files('yt_dlp')
hiddenimports += collect_submodules('yt_dlp')

# Keep unrelated packages from the global Python install out of the exe
excludes = ['PyQt5', 'PyQt6', 'PySide2', 'PySide6', 'numpy', 'pandas', 'matplotlib',
            'scipy', 'IPython', 'jupyter', 'notebook', 'werkzeug', 'flask', 'cv2', 'torch']


a = Analysis(
    ['app.py'],
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
    a.binaries,
    a.datas,
    [],
    name='YouTubeMP3Downloader',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=['icon.ico'],
)
