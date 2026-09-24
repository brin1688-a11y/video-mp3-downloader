#!/usr/bin/env bash
# Standalone executable builder for macOS / Linux
set -e

echo "================================================================="
echo "  YouTube MP3 Downloader - Standalone Executable Builder"
echo "================================================================="

# 1. Install dependencies
echo "[1/3] Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# 2. Clean previous artifacts
rm -rf build dist

# 3. PyInstaller bundle
echo "[2/3] Bundling with PyInstaller..."
pyinstaller --noconsole --onefile --collect-all customtkinter --name "YouTubeMP3Downloader" app.py

# 4. Result
echo ""
echo "================================================================="
echo "  SUCCESS! Binary generated in dist/YouTubeMP3Downloader"
echo "================================================================="
