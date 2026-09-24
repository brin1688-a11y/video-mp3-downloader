/**
 * Source code definitions and templates for YouTube MP3 Downloader
 */

export interface CodeTemplateOptions {
  themeColor: 'emerald' | 'indigo' | 'blue';
  includeBitrateSelector: boolean;
  autoDetectFfmpeg: boolean;
  defaultMode: 'Dark' | 'Light';
}

export function generatePythonCode(options: CodeTemplateOptions): string {
  const accentHex = options.themeColor === 'emerald' 
    ? '#10B981' 
    : options.themeColor === 'indigo' 
    ? '#6366F1' 
    : '#3B82F6';

  const accentHoverHex = options.themeColor === 'emerald'
    ? '#059669'
    : options.themeColor === 'indigo'
    ? '#4F46E5'
    : '#2563EB';

  const colorTheme = options.themeColor === 'emerald' ? 'green' : 'blue';

  return `"""
YouTube MP3 Downloader - Standalone Desktop Application
Built with CustomTkinter & yt-dlp
Window Dimensions: 480x320 px
Minimalist Flat UI with ${options.themeColor.toUpperCase()} Accent
"""

import os
import sys
import re
import threading
import subprocess
from pathlib import Path
import tkinter as tk
import customtkinter as ctk

try:
    import yt_dlp
except ImportError:
    yt_dlp = None

# -----------------------------------------------------------------------------
# Configuration & Theme Constants
# -----------------------------------------------------------------------------
APP_TITLE = "YouTube MP3 Downloader"
APP_VERSION = "1.0.0"
WINDOW_WIDTH = 480
WINDOW_HEIGHT = 330

# Colors (${options.themeColor.toUpperCase()} Palette)
ACCENT_COLOR = "${accentHex}"
ACCENT_HOVER = "${accentHoverHex}"
ACCENT_TEXT = "#FFFFFF"
CARD_BG_DARK = "#18181B"
CARD_BG_LIGHT = "#F4F4F5"
STATUS_SUCCESS = "#10B981"
STATUS_ERROR = "#EF4444"
STATUS_WARN = "#F59E0B"

# Appearance Mode: "Dark" or "Light"
ctk.set_appearance_mode("${options.defaultMode}")
ctk.set_default_color_theme("${colorTheme}")


def get_default_download_path() -> Path:
    """Returns the user's default Downloads folder across Windows, Mac, and Linux."""
    if os.name == "nt":
        import winreg
        try:
            sub_key = r"SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Shell Folders"
            with winreg.OpenKey(winreg.HKEY_CURRENT_USER, sub_key) as key:
                downloads_guid = "{374DE290-123F-4565-9164-39C4925E467B}"
                return Path(winreg.QueryValueEx(key, downloads_guid)[0])
        except Exception:
            pass
    return Path.home() / "Downloads"


def find_ffmpeg_binary() -> str | None:
    """
    Locates FFmpeg in PyInstaller bundle (_MEIPASS), beside executable,
    in standard Windows locations (such as C:\\ffmpeg or C:\\ffmpeg\\bin), or in system PATH.
    """
    # 1. Bundled PyInstaller temp dir
    if getattr(sys, "frozen", False) and hasattr(sys, "_MEIPASS"):
        bundle_ffmpeg = Path(sys._MEIPASS) / ("ffmpeg.exe" if os.name == "nt" else "ffmpeg")
        if bundle_ffmpeg.is_file():
            return str(bundle_ffmpeg)

    # 2. Local directory beside script or compiled exe
    exe_dir = Path(sys.executable).parent if getattr(sys, "frozen", False) else Path(__file__).parent
    local_ffmpeg = exe_dir / ("ffmpeg.exe" if os.name == "nt" else "ffmpeg")
    if local_ffmpeg.is_file():
        return str(local_ffmpeg)

    # 3. Dedicated check for C:\\ffmpeg and common Windows installations
    if os.name == "nt":
        windows_candidates = [
            Path(r"C:\ffmpeg\bin\ffmpeg.exe"),
            Path(r"C:\ffmpeg\ffmpeg.exe"),
            Path(r"C:\Program Files\ffmpeg\bin\ffmpeg.exe"),
            Path(r"C:\Program Files (x86)\ffmpeg\bin\ffmpeg.exe"),
        ]
        for candidate in windows_candidates:
            if candidate.is_file():
                return str(candidate)

    # 4. Check system PATH environment variable
    import shutil
    return shutil.which("ffmpeg")


# -----------------------------------------------------------------------------
# Main Application Window
# -----------------------------------------------------------------------------
class YouTubeMP3Downloader(ctk.CTk):
    def __init__(self):
        super().__init__()

        # Window Settings
        self.title(APP_TITLE)
        self.geometry(f"{WINDOW_WIDTH}x{WINDOW_HEIGHT}")
        self.resizable(False, False)
        self.configure(fg_color=("#F9FAFB", "#09090B"))

        # Center Window on Screen
        self.center_window()

        # State Variables
        self.is_downloading = False
        self.download_dir = get_default_download_path()
        self.ffmpeg_path = find_ffmpeg_binary()
        self.selected_bitrate = tk.StringVar(value="320 kbps")

        # Spinner animation characters
        self.spinner_frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"]
        self.spinner_idx = 0
        self.spinner_job = None

        # Build UI layout
        self.setup_ui()

    def center_window(self):
        """Centers the 480x320 window on the active monitor."""
        self.update_idletasks()
        sw = self.winfo_screenwidth()
        sh = self.winfo_screenheight()
        x = max(0, int((sw - WINDOW_WIDTH) / 2))
        y = max(0, int((sh - WINDOW_HEIGHT) / 2))
        self.geometry(f"{WINDOW_WIDTH}x{WINDOW_HEIGHT}+{x}+{y}")

    def setup_ui(self):
        """Constructs the uncluttered, centered 3-section layout."""

        # Outer Container with generous padding
        self.container = ctk.CTkFrame(self, fg_color="transparent", corner_radius=0)
        self.container.pack(fill="both", expand=True, padx=28, pady=20)

        # ---------------------------------------------------------------------
        # TOP SECTION: Minimalist Header (Icon + Title + Theme Switch)
        # ---------------------------------------------------------------------
        self.top_frame = ctk.CTkFrame(self.container, fg_color="transparent")
        self.top_frame.pack(fill="x", pady=(0, 14))

        # Brand Title Box
        self.title_box = ctk.CTkFrame(self.top_frame, fg_color="transparent")
        self.title_box.pack(side="left")

        # Minimal Music Glyph
        self.icon_label = ctk.CTkLabel(
            self.title_box,
            text="♫",
            font=ctk.CTkFont(size=20, weight="bold"),
            text_color=ACCENT_COLOR,
            width=26
        )
        self.icon_label.pack(side="left", padx=(0, 6))

        self.title_label = ctk.CTkLabel(
            self.title_box,
            text="MP3 Downloader",
            font=ctk.CTkFont(family="Helvetica", size=18, weight="bold"),
            text_color=("#18181B", "#FAFAFA")
        )
        self.title_label.pack(side="left")

        # Subtle Theme Mode Toggle (Dark / Light)
        self.theme_btn = ctk.CTkButton(
            self.top_frame,
            text="☀ Light" if ctk.get_appearance_mode() == "Dark" else "🌙 Dark",
            width=68,
            height=26,
            corner_radius=8,
            font=ctk.CTkFont(size=11),
            fg_color=("#E4E4E7", "#27272A"),
            hover_color=("#D4D4D8", "#3F3F46"),
            text_color=("#27272A", "#E4E4E7"),
            command=self.toggle_theme
        )
        self.theme_btn.pack(side="right")

        # ---------------------------------------------------------------------
        # MIDDLE SECTION: URL Input, Paste Button, Bitrate, Download CTA
        # ---------------------------------------------------------------------
        self.input_group = ctk.CTkFrame(self.container, fg_color="transparent")
        self.input_group.pack(fill="x", pady=(0, 12))

        # URL Entry + Paste Button
        self.url_row = ctk.CTkFrame(self.input_group, fg_color="transparent")
        self.url_row.pack(fill="x")

        self.url_entry = ctk.CTkEntry(
            self.url_row,
            placeholder_text="Paste YouTube link here...",
            height=40,
            corner_radius=10,
            font=ctk.CTkFont(size=13),
            border_width=1,
            border_color=("#D4D4D8", "#27272A"),
            fg_color=("#FFFFFF", "#18181B"),
            text_color=("#09090B", "#F4F4F5")
        )
        self.url_entry.pack(side="left", fill="x", expand=True, padx=(0, 8))
        self.url_entry.bind("<Return>", lambda e: self.start_download())

        self.paste_btn = ctk.CTkButton(
            self.url_row,
            text="📋 Paste",
            width=76,
            height=40,
            corner_radius=10,
            font=ctk.CTkFont(size=12, weight="bold"),
            fg_color=("#E4E4E7", "#27272A"),
            hover_color=("#D4D4D8", "#3F3F46"),
            text_color=("#18181B", "#F4F4F5"),
            command=self.paste_clipboard
        )
        self.paste_btn.pack(side="right")

        # Options Row: Bitrate Selector + Open Downloads folder
        self.options_row = ctk.CTkFrame(self.container, fg_color="transparent")
        self.options_row.pack(fill="x", pady=(0, 14))

        self.bitrate_label = ctk.CTkLabel(
            self.options_row,
            text="Quality:",
            font=ctk.CTkFont(size=12),
            text_color=("#71717A", "#A1A1AA")
        )
        self.bitrate_label.pack(side="left", padx=(2, 6))

        self.bitrate_menu = ctk.CTkSegmentedButton(
            self.options_row,
            values=["192 kbps", "256 kbps", "320 kbps"],
            variable=self.selected_bitrate,
            height=26,
            corner_radius=8,
            font=ctk.CTkFont(size=11, weight="bold"),
            selected_color=ACCENT_COLOR,
            selected_hover_color=ACCENT_HOVER,
            unselected_color=("#E4E4E7", "#27272A"),
            unselected_hover_color=("#D4D4D8", "#3F3F46")
        )
        self.bitrate_menu.set("320 kbps")
        self.bitrate_menu.pack(side="left")

        self.folder_btn = ctk.CTkButton(
            self.options_row,
            text="📂 Downloads",
            width=92,
            height=26,
            corner_radius=8,
            font=ctk.CTkFont(size=11),
            fg_color="transparent",
            hover_color=("#E4E4E7", "#27272A"),
            text_color=("#71717A", "#A1A1AA"),
            command=self.open_downloads_folder
        )
        self.folder_btn.pack(side="right")

        # Primary Action Download Button
        self.download_btn = ctk.CTkButton(
            self.container,
            text="Download MP3",
            height=42,
            corner_radius=10,
            font=ctk.CTkFont(size=14, weight="bold"),
            fg_color=ACCENT_COLOR,
            hover_color=ACCENT_HOVER,
            text_color=ACCENT_TEXT,
            command=self.start_download
        )
        self.download_btn.pack(fill="x", pady=(0, 14))

        # ---------------------------------------------------------------------
        # BOTTOM SECTION: Progress Bar & Status Text
        # ---------------------------------------------------------------------
        self.progress_bar = ctk.CTkProgressBar(
            self.container,
            height=6,
            corner_radius=3,
            progress_color=ACCENT_COLOR,
            fg_color=("#E4E4E7", "#27272A")
        )
        self.progress_bar.set(0)
        self.progress_bar.pack(fill="x", pady=(0, 8))

        self.status_label = ctk.CTkLabel(
            self.container,
            text="Ready · Paste a YouTube link to begin",
            font=ctk.CTkFont(size=12),
            text_color=("#71717A", "#A1A1AA")
        )
        self.status_label.pack(fill="x")

    # -------------------------------------------------------------------------
    # UX Micro-interactions
    # -------------------------------------------------------------------------
    def toggle_theme(self):
        """Switches between Dark and Light mode seamlessly."""
        if ctk.get_appearance_mode() == "Dark":
            ctk.set_appearance_mode("Light")
            self.theme_btn.configure(text="🌙 Dark")
        else:
            ctk.set_appearance_mode("Dark")
            self.theme_btn.configure(text="☀ Light")

    def paste_clipboard(self):
        """Pastes URL directly from the system clipboard."""
        try:
            content = self.clipboard_get().strip()
            if content:
                self.url_entry.delete(0, tk.END)
                self.url_entry.insert(0, content)
                self.update_status("Link pasted from clipboard", ACCENT_COLOR)
        except tk.TclError:
            self.update_status("Clipboard is empty", STATUS_WARN)

    def update_status(self, text: str, color: str | None = None):
        """Thread-safe status text and color update."""
        text_color = color or ("#71717A", "#A1A1AA")
        self.status_label.configure(text=text, text_color=text_color)

    def set_progress(self, val: float):
        """Thread-safe progress bar update (0.0 to 1.0)."""
        self.progress_bar.set(max(0.0, min(1.0, val)))

    def open_downloads_folder(self):
        """Opens user's download directory in their native file explorer."""
        folder = str(self.download_dir)
        try:
            if sys.platform == "win32":
                os.startfile(folder)
            elif sys.platform == "darwin":
                subprocess.run(["open", folder], check=True)
            else:
                subprocess.run(["xdg-open", folder], check=True)
        except Exception as e:
            self.update_status(f"Could not open folder: {e}", STATUS_ERROR)

    def start_spinner(self, base_text: str = "Downloading"):
        """Animates spinner frames on the download button while downloading."""
        if not self.is_downloading:
            return
        frame = self.spinner_frames[self.spinner_idx % len(self.spinner_frames)]
        self.download_btn.configure(text=f"{frame} {base_text}...")
        self.spinner_idx += 1
        self.spinner_job = self.after(100, lambda: self.start_spinner(base_text))

    def stop_spinner(self):
        """Stops the animated spinner and re-enables the download button."""
        if self.spinner_job:
            self.after_cancel(self.spinner_job)
            self.spinner_job = None
        self.download_btn.configure(text="Download MP3", state="normal")

    # -------------------------------------------------------------------------
    # Core Download Workflow (Multi-threaded to prevent UI freeze)
    # -------------------------------------------------------------------------
    def validate_url(self, url: str) -> bool:
        """Validates YouTube URL format."""
        patterns = [
            r"^https?://(www\.)?youtube\.com/watch\?v=[\w-]+",
            r"^https?://(www\.)?youtu\.be/[\w-]+",
            r"^https?://(www\.)?youtube\.com/shorts/[\w-]+",
            r"^https?://music\.youtube\.com/watch\?v=[\w-]+"
        ]
        return any(re.search(pat, url.strip()) for pat in patterns)

    def start_download(self):
        """Validates URL and starts background download thread."""
        if self.is_downloading:
            return

        if yt_dlp is None:
            self.update_status("yt-dlp missing. Run: pip install yt-dlp", STATUS_ERROR)
            return

        url = self.url_entry.get().strip()
        if not url:
            self.update_status("Please paste a YouTube link first", STATUS_WARN)
            self.url_entry.focus()
            return

        if not self.validate_url(url):
            self.update_status("Invalid YouTube URL. Check the link.", STATUS_ERROR)
            return

        # Lock controls during active download
        self.is_downloading = True
        self.download_btn.configure(state="disabled")
        self.url_entry.configure(state="disabled")
        self.paste_btn.configure(state="disabled")
        self.set_progress(0.0)
        self.update_status("Fetching audio stream info...")
        self.start_spinner("Downloading")

        # Daemon thread guarantees smooth UI responsiveness
        thread = threading.Thread(target=self._download_worker, args=(url,), daemon=True)
        thread.start()

    def _progress_hook(self, d: dict):
        """Hook called by yt-dlp as audio chunks download."""
        status = d.get("status")
        if status == "downloading":
            total = d.get("total_bytes") or d.get("total_bytes_estimate") or 0
            downloaded = d.get("downloaded_bytes", 0)
            if total > 0:
                fraction = downloaded / total
                percent = int(fraction * 100)
                speed = d.get("_speed_str", "").strip()
                eta = d.get("_eta_str", "").strip()
                msg = f"Downloading: {percent}%"
                if speed:
                    msg += f" · {speed}"
                if eta:
                    msg += f" · ETA: {eta}"
                self.after(0, lambda f=fraction, m=msg: [self.set_progress(f), self.update_status(m)])
        elif status == "finished":
            self.after(0, lambda: [
                self.set_progress(0.95),
                self.update_status("Converting audio to MP3...", ACCENT_COLOR)
            ])

    def _download_worker(self, url: str):
        """Background worker that calls yt-dlp and ffmpeg."""
        bitrate_str = self.selected_bitrate.get().replace(" kbps", "")
        output_template = str(self.download_dir / "%(title)s.%(ext)s")

        ydl_opts = {
            "format": "bestaudio/best",
            "outtmpl": output_template,
            "progress_hooks": [self._progress_hook],
            "postprocessors": [
                {
                    "key": "FFmpegExtractAudio",
                    "preferredcodec": "mp3",
                    "preferredquality": bitrate_str,
                },
                {
                    "key": "FFmpegMetadata",
                    "add_metadata": True,
                }
            ],
            "quiet": True,
            "no_warnings": True,
            "nocheckcertificate": True,
        }

        if self.ffmpeg_path:
            ydl_opts["ffmpeg_location"] = self.ffmpeg_path

        video_title = "Audio"
        error_msg = None

        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)
                if info:
                    video_title = info.get("title", "Audio")
                    self.after(0, lambda t=video_title: self.update_status(f"Downloading: {t[:36]}..."))
                ydl.download([url])
        except yt_dlp.utils.DownloadError as e:
            raw_err = str(e)
            if "ffmpeg" in raw_err.lower():
                error_msg = "FFmpeg is required for MP3 conversion. Install FFmpeg."
            elif "Private video" in raw_err:
                error_msg = "Video is private or unavailable."
            elif "Sign in" in raw_err:
                error_msg = "Age-restricted video requiring YouTube sign-in."
            else:
                error_msg = f"Download failed: {raw_err[:60]}..."
        except Exception as e:
            error_msg = f"Error: {str(e)[:60]}"

        # Send completion event back to Tkinter UI thread
        self.after(0, lambda: self._on_download_complete(error_msg, video_title))

    def _on_download_complete(self, error: str | None, title: str):
        """Resets UI and shows success or error state."""
        self.is_downloading = False
        self.stop_spinner()
        self.url_entry.configure(state="normal")
        self.paste_btn.configure(state="normal")

        if error:
            self.set_progress(0.0)
            self.update_status(error, STATUS_ERROR)
        else:
            self.set_progress(1.0)
            clean_title = (title[:28] + "..") if len(title) > 30 else title
            self.update_status(f"✓ Success! Saved: {clean_title}.mp3", STATUS_SUCCESS)
            self.url_entry.delete(0, tk.END)


# -----------------------------------------------------------------------------
# Entry Point
# -----------------------------------------------------------------------------
def main():
    app = YouTubeMP3Downloader()
    app.mainloop()


if __name__ == "__main__":
    main()
`;
}

export const REQUIREMENTS_CONTENT = `customtkinter>=5.2.0
yt-dlp>=2024.08.06
pyinstaller>=6.4.0
`;

export const BUILD_BAT_CONTENT = `@echo off
title YouTube MP3 Downloader - PyInstaller Builder
echo =================================================================
echo   YouTube MP3 Downloader - Standalone Executable Builder
echo =================================================================
echo.

:: 1. Check Python installation
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in your PATH.
    echo Please install Python 3.10+ from https://www.python.org/
    echo Remember to check "Add python.exe to PATH" during installation.
    pause
    exit /b 1
)

:: 2. Upgrade pip and install packages
echo [1/3] Installing dependencies (customtkinter, yt-dlp, pyinstaller)...
pip install --upgrade pip
pip install -r requirements.txt

:: 3. Clean previous artifacts
if exist build rmdir /s /q build
if exist dist rmdir /s /q dist

:: 4. Build single-file executable with hidden console
echo.
echo [2/3] Bundling with PyInstaller...
pyinstaller --noconsole --onefile --collect-all customtkinter --name "YouTubeMP3Downloader" app.py

:: 5. Verification
if exist "dist\\YouTubeMP3Downloader.exe" (
    echo.
    echo =================================================================
    echo   SUCCESS! Standalone Executable created successfully:
    echo   dist\\YouTubeMP3Downloader.exe
    echo =================================================================
    echo.
    echo NOTE: Ensure ffmpeg.exe is installed or placed in the same folder
    echo for MP3 audio extraction.
) else (
    echo.
    echo [ERROR] Build failed. Check the PyInstaller logs above.
)

pause
`;

export const BUILD_SH_CONTENT = `#!/usr/bin/env bash
# Standalone executable builder for macOS / Linux
set -e

echo "================================================================="
echo "  YouTube MP3 Downloader - Standalone Executable Builder"
echo "================================================================="

echo "[1/3] Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

rm -rf build dist

echo "[2/3] Bundling with PyInstaller..."
pyinstaller --noconsole --onefile --collect-all customtkinter --name "YouTubeMP3Downloader" app.py

echo ""
echo "================================================================="
echo "  SUCCESS! Executable generated in dist/YouTubeMP3Downloader"
echo "================================================================="
`;

export const README_CONTENT = `# YouTube MP3 Downloader (CustomTkinter + yt-dlp)

A lightweight, minimalist desktop application built with Python **CustomTkinter** and **yt-dlp** that downloads and converts YouTube audio to high-fidelity MP3 files.

## Features
- **Modern Flat UI:** Sleek dark/light theme toggle, rounded corners, responsive micro-interactions.
- **Compact Window:** Exact 480x320 px size, auto-centered on launch.
- **Fast Audio Extraction:** Downloads best audio streams with custom bitrate (192, 256, 320 kbps).
- **Smooth UX:** Multi-threaded execution so the interface never freezes, live progress bar, spinner animation, and direct downloads folder shortcut.
- **Convenient Input:** 1-click clipboard paste and keyboard Enter support.
- **Standalone Packaging:** Ready for PyInstaller single-file .exe compilation with \`--noconsole\`.

## 1. Quick Setup & Run

### Prerequisites
- Python 3.10 or newer (ensure Python is added to your system PATH)
- FFmpeg (required by yt-dlp to convert audio to MP3)

### Installation
\`\`\`bash
pip install -r requirements.txt
\`\`\`

### Run the App
\`\`\`bash
python app.py
\`\`\`

---

## 2. Compiling Standalone .EXE with PyInstaller

### The One-Liner Command
\`\`\`bash
pyinstaller --noconsole --onefile --collect-all customtkinter --name "YouTubeMP3Downloader" app.py
\`\`\`

### Why \`--collect-all customtkinter\` is Vital:
CustomTkinter relies on bundled JSON theme files, color maps, and font assets. Standard PyInstaller runs omit these directories, resulting in runtime crashes (\`FileNotFoundError: assets\`). The \`--collect-all customtkinter\` flag ensures all assets are included inside the single executable.

### With Custom Icon:
\`\`\`bash
pyinstaller --noconsole --onefile --collect-all customtkinter --icon="app_icon.ico" --name "YouTubeMP3Downloader" app.py
\`\`\`

---

## 3. FFmpeg Setup (Required for MP3 Conversion)

yt-dlp streams YouTube audio in AAC or Opus containers and uses FFmpeg to encode to MP3.

- **Windows (Recommended):**
  Open PowerShell as Administrator and run:
  \`\`\`powershell
  winget install Gyan.FFmpeg
  \`\`\`
  Or download \`ffmpeg.exe\` from [gyan.dev/ffmpeg/builds](https://www.gyan.dev/ffmpeg/builds/) and place \`ffmpeg.exe\` in the exact same folder as \`app.py\` or \`YouTubeMP3Downloader.exe\`.

- **macOS:**
  \`\`\`bash
  brew install ffmpeg
  \`\`\`

- **Linux (Ubuntu/Debian):**
  \`\`\`bash
  sudo apt update && sudo apt install -y ffmpeg
  \`\`\`
`;
