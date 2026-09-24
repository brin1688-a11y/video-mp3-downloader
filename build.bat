@echo off
title YouTube MP3 Downloader - PyInstaller Builder
echo =================================================================
echo   YouTube MP3 Downloader - Standalone Executable Builder
echo =================================================================
echo.

:: 1. Check Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in your PATH.
    echo Please install Python 3.10+ from https://www.python.org/
    echo Make sure to check "Add python.exe to PATH" during installation.
    pause
    exit /b 1
)

:: 2. Upgrade pip and install dependencies
echo [1/3] Installing dependencies (customtkinter, yt-dlp, pyinstaller)...
pip install --upgrade pip
pip install -r requirements.txt
pip install -U "yt-dlp[default,curl-cffi]"

:: 3. Clean previous builds
if exist build rmdir /s /q build
if exist dist rmdir /s /q dist

:: 4. Build single-file executable with hidden console
echo.
echo [2/3] Bundling with PyInstaller...
pyinstaller --noconfirm YouTubeMP3Downloader.spec

:: 5. Verification
if exist "dist\YouTubeMP3Downloader.exe" (
    echo.
    echo =================================================================
    echo   SUCCESS! Standalone Executable created successfully:
    echo   dist\YouTubeMP3Downloader.exe
    echo =================================================================
    echo.
    echo NOTE: Ensure ffmpeg.exe is installed or placed in the same folder
    echo if your system does not already have FFmpeg installed.
) else (
    echo.
    echo [ERROR] Build failed. Check the PyInstaller logs above.
)

pause
