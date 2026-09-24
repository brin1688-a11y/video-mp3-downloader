"""
Borin Downloader - Desktop Application
Supports YouTube, Facebook, TikTok, Douyin & Bilibili (MP3 audio or MP4 video)
Built with CustomTkinter & yt-dlp
Modern Minimalist Dark / Light Flat Design
"""

import os
import sys
import re
import threading
from concurrent.futures import ThreadPoolExecutor
import subprocess
from pathlib import Path
import json
import math
import tkinter as tk
from tkinter import filedialog
import customtkinter as ctk

try:
    import yt_dlp
except ImportError:
    yt_dlp = None

import douyin

# -----------------------------------------------------------------------------
# Configuration & Theme Constants
# -----------------------------------------------------------------------------
APP_TITLE = "Borin Downloader"
APP_VERSION = "1.3.0"
WINDOW_WIDTH = 440
WINDOW_HEIGHT = 590
MAX_PARALLEL = 3                 # Links downloaded at the same time

AUDIO_QUALITIES = ["192 kbps", "256 kbps", "320 kbps"]
VIDEO_QUALITIES = ["Best", "1080p", "720p", "480p"]

# Supported sites (yt-dlp handles the actual extraction)
SUPPORTED_URL_PATTERNS = [
    r"^https?://(www\.|m\.|music\.)?youtube\.com/",
    r"^https?://youtu\.be/",
    r"^https?://(www\.|m\.|web\.|mbasic\.)?facebook\.com/",
    r"^https?://fb\.watch/",
    r"^https?://(www\.|m\.|vm\.|vt\.)?tiktok\.com/",
    r"^https?://(www\.|m\.)?bilibili\.com/",
    r"^https?://(www\.)?bilibili\.tv/",
    r"^https?://b23\.tv/",
    *douyin.DOUYIN_URL_PATTERNS,
]

# Colors (Emerald accent on Zinc) — (light, dark) pairs
ACCENT_COLOR = "#10B981"         # Emerald Green
ACCENT_HOVER = "#0EA472"         # Slightly darker on hover
ACCENT_PRESS = "#047857"         # Pressed
ACCENT_GLOW = "#34D399"          # Pulse / success flash
ACCENT_TEXT = "#FFFFFF"
BG = ("#F4F4F5", "#09090B")
CARD = ("#FFFFFF", "#131316")
CARD_BORDER = ("#E4E4E7", "#232329")
CHIP = ("#F4F4F5", "#1D1D22")
CHIP_HOVER = ("#E4E4E7", "#2A2A31")
CHIP_PRESS = ("#D4D4D8", "#3A3A43")
INPUT_BG = ("#FAFAFA", "#0D0D10")
INPUT_BORDER = ("#E4E4E7", "#27272A")
TEXT = ("#18181B", "#FAFAFA")
MUTED = ("#71717A", "#A1A1AA")
STATUS_SUCCESS = "#10B981"       # Emerald
STATUS_ERROR = "#EF4444"         # Rose 500
STATUS_WARN = "#F59E0B"          # Amber 500

# Platform names, brand colors and the domains used to detect them
PLATFORMS = [
    ("YouTube", "#FF0033", ("youtube.com", "youtu.be")),
    ("Facebook", "#1877F2", ("facebook.com", "fb.watch")),
    ("TikTok", "#00C2CB", ("tiktok.com",)),
    ("Douyin", "#FE2C55", ("douyin.com",)),
    ("Bilibili", "#00A1D6", ("bilibili.com", "bilibili.tv", "b23.tv")),
]
PLATFORM_COLORS = {name: color for name, color, _ in PLATFORMS}


def detect_platform(url: str) -> str:
    low = url.lower()
    for name, _, domains in PLATFORMS:
        if any(d in low for d in domains):
            return name
    return "Link"


def shorten(text: str, limit: int) -> str:
    text = " ".join(text.split())
    return text if len(text) <= limit else text[: limit - 1] + "…"


def format_speed(bytes_per_sec) -> str:
    """1536000 -> '1.5 MB/s' (plain text, no terminal color codes)."""
    if not bytes_per_sec:
        return ""
    for unit in ("B/s", "KB/s", "MB/s", "GB/s"):
        if bytes_per_sec < 1024 or unit == "GB/s":
            return f"{bytes_per_sec:.0f} {unit}" if unit == "B/s" else f"{bytes_per_sec:.1f} {unit}"
        bytes_per_sec /= 1024


def format_eta(seconds) -> str:
    """95 -> '1:35', 3725 -> '1:02:05'."""
    if seconds is None:
        return ""
    seconds = int(seconds)
    h, rem = divmod(seconds, 3600)
    m, s = divmod(rem, 60)
    return f"{h}:{m:02d}:{s:02d}" if h else f"{m}:{s:02d}"


def mode_color(color) -> str:
    """Picks the light / dark variant of a color for the current appearance mode."""
    if isinstance(color, (tuple, list)):
        return color[1] if ctk.get_appearance_mode() == "Dark" else color[0]
    return color


def blend(c1: str, c2: str, t: float) -> str:
    """Mixes two #RRGGBB colors (t=0 -> c1, t=1 -> c2)."""
    a = [int(c1[i:i + 2], 16) for i in (1, 3, 5)]
    b = [int(c2[i:i + 2], 16) for i in (1, 3, 5)]
    return "#" + "".join(f"{round(x + (y - x) * t):02X}" for x, y in zip(a, b))


def fade(widget, target, start=None, steps: int = 10, prop: str = "fg_color", ms: int = 16):
    """Smoothly fades a color property (fg_color, text_color, ...) toward target."""
    job = getattr(widget, "_fade_jobs", {}).get(prop)
    if job:
        widget.after_cancel(job)
    begin = mode_color(start if start is not None else widget.cget(prop))
    end = mode_color(target)
    if not (begin.startswith("#") and end.startswith("#") and len(begin) == len(end) == 7):
        widget.configure(**{prop: target})
        return
    widget._fade_jobs = getattr(widget, "_fade_jobs", {})

    def step(i=1):
        try:
            if i >= steps:
                widget.configure(**{prop: target})    # keep the light/dark pair
                widget._fade_jobs.pop(prop, None)
                return
            widget.configure(**{prop: blend(begin, end, i / steps)})
            widget._fade_jobs[prop] = widget.after(ms, lambda: step(i + 1))
        except tk.TclError:
            pass                                       # widget was destroyed
    step()


class Hover:
    """Smooth color fade on hover and a darker flash on press for a CTkButton."""
    instances = []

    def __init__(self, widget, normal, hover, pressed=None):
        self.widget, self.normal, self.hover, self.pressed = widget, normal, hover, pressed or hover
        self.enabled = True
        self.job = None
        widget.configure(hover=False, fg_color=normal)
        widget.bind("<Enter>", lambda e: self._on_enter(), add="+")
        widget.bind("<Leave>", lambda e: widget.after(20, self._on_leave), add="+")
        widget.bind("<ButtonPress-1>", lambda e: self._on_press(), add="+")
        widget.bind("<ButtonRelease-1>", lambda e: self._on_enter(), add="+")
        widget._hover = self
        Hover.instances.append(self)

    def _pointer_inside(self) -> bool:
        try:
            under = self.widget.winfo_containing(*self.widget.winfo_pointerxy())
        except (KeyError, tk.TclError):
            return False
        return under is not None and str(under).startswith(str(self.widget))

    def _on_enter(self):
        if self.enabled and self.widget.cget("state") != "disabled":
            self.animate(self.hover)

    def _on_leave(self):
        if self.enabled and not self._pointer_inside():
            self.animate(self.normal)

    def _on_press(self):
        if self.enabled and self.widget.cget("state") != "disabled":
            self.animate(self.pressed, steps=2)

    def animate(self, target, steps: int = 7):
        """Fades fg_color from its current value to target over a few frames."""
        if self.job:
            self.widget.after_cancel(self.job)
            self.job = None
        start = mode_color(self.widget.cget("fg_color"))
        end = mode_color(target)
        if not (start.startswith("#") and end.startswith("#") and len(start) == len(end) == 7):
            self.widget.configure(fg_color=target)
            return

        def step(i=1):
            if i >= steps:
                self.widget.configure(fg_color=target)   # keep the light/dark pair
                self.job = None
                return
            self.widget.configure(fg_color=blend(start, end, i / steps))
            self.job = self.widget.after(16, lambda: step(i + 1))
        step()

    @classmethod
    def reset_all(cls):
        """After a theme switch, snap every button back to its themed color."""
        for h in cls.instances:
            if h.enabled:
                h.widget.configure(fg_color=h.normal)


# Installed / bundled build: let yt-dlp find the bundled deno.exe & ffmpeg.exe
if getattr(sys, "frozen", False) and hasattr(sys, "_MEIPASS"):
    os.environ["PATH"] = sys._MEIPASS + os.pathsep + os.environ.get("PATH", "")

# Set default appearance
ctk.set_appearance_mode("Dark")
ctk.set_default_color_theme("green")


def resource_path(name: str) -> Path:
    """Finds a bundled file (icon, etc.) both when run as a script and as an exe."""
    base = Path(getattr(sys, "_MEIPASS", Path(__file__).parent))
    return base / name


def load_logo(size: int):
    """Loads icon.ico as a CTkImage for the header, or None if unavailable."""
    try:
        from PIL import Image
        img = Image.open(resource_path("icon.ico"))
        img.size = max(img.info.get("sizes", [img.size]))
        img = img.convert("RGBA")
        return ctk.CTkImage(light_image=img, dark_image=img, size=(size, size))
    except Exception:
        return None


COUNTER_URL = "https://abacus.jasoncameron.dev/{action}/brin1688-video-mp3-downloader/installs"


def counter_request(action: str) -> int | None:
    """Anonymous install counter: 'hit' adds one, 'get' reads the total. No personal data is sent."""
    try:
        # curl_cffi ships its own CA certificates (Windows' store can be outdated)
        from curl_cffi import requests
        resp = requests.get(COUNTER_URL.format(action=action), timeout=8,
                            headers={"User-Agent": f"BorinDownloader/{APP_VERSION}"})
        if resp.status_code == 404:
            return 0                              # nobody counted yet
        resp.raise_for_status()
        return int(resp.json().get("value"))
    except Exception:
        return None


def get_default_download_path() -> Path:
    """Returns the user's default Downloads folder."""
    if os.name == "nt":
        import winreg
        try:
            sub_key = r"SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\Shell Folders"
            with winreg.OpenKey(winreg.HKEY_CURRENT_USER, sub_key) as key:
                downloads_guid = "{374DE290-123F-4565-9164-39C4925E467B}"
                return Path(winreg.QueryValueEx(key, downloads_guid)[0])
        except Exception:
            pass
    return Path.home() / "Downloads"


SETTINGS_FILE = Path(os.environ.get("APPDATA") or Path.home()) / "VideoDownloader" / "settings.json"


def load_settings() -> dict:
    """Reads saved user settings (e.g. the chosen save folder)."""
    try:
        return json.loads(SETTINGS_FILE.read_text(encoding="utf-8"))
    except Exception:
        return {}


def save_settings(changes: dict):
    """Merges changes into the saved settings file."""
    try:
        settings = load_settings()
        settings.update(changes)
        SETTINGS_FILE.parent.mkdir(parents=True, exist_ok=True)
        SETTINGS_FILE.write_text(json.dumps(settings, indent=2), encoding="utf-8")
    except Exception:
        pass


def find_ffmpeg_binary() -> str | None:
    """
    Locates FFmpeg in PATH, next to the executable, or in bundled PyInstaller MEIPASS.
    """
    # 1. Bundled PyInstaller temp dir
    if getattr(sys, "frozen", False) and hasattr(sys, "_MEIPASS"):
        bundle_ffmpeg = Path(sys._MEIPASS) / ("ffmpeg.exe" if os.name == "nt" else "ffmpeg")
        if bundle_ffmpeg.is_file():
            return str(bundle_ffmpeg)

    # 2. Local directory beside script / exe
    exe_dir = Path(sys.executable).parent if getattr(sys, "frozen", False) else Path(__file__).parent
    local_ffmpeg = exe_dir / ("ffmpeg.exe" if os.name == "nt" else "ffmpeg")
    if local_ffmpeg.is_file():
        return str(local_ffmpeg)

    # 3. Check system PATH
    import shutil
    return shutil.which("ffmpeg")


# -----------------------------------------------------------------------------
# Main Application Class
# -----------------------------------------------------------------------------
class YouTubeMP3Downloader(ctk.CTk):
    def __init__(self):
        super().__init__()

        # Window Settings
        self.title(APP_TITLE)
        self.geometry(f"{WINDOW_WIDTH}x{WINDOW_HEIGHT}")
        self.resizable(True, True)
        self.minsize(WINDOW_WIDTH, 540)
        icon = resource_path("icon.ico")
        if icon.is_file():
            try:
                self.iconbitmap(str(icon))
            except tk.TclError:
                pass

        # Center Window on Screen
        self.center_window()

        # State Variables
        self.is_downloading = False
        saved_dir = load_settings().get("download_dir")
        self.download_dir = Path(saved_dir) if saved_dir and Path(saved_dir).is_dir() else get_default_download_path()
        self.ffmpeg_path = find_ffmpeg_binary()
        self.selected_mode = tk.StringVar(value="MP3")
        self.selected_quality = tk.StringVar(value="320 kbps")

        # Spinner animation states
        self.spinner_frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"]
        self.spinner_idx = 0
        self.spinner_job = None

        # Build UI, then fade the window in
        self.setup_ui()
        self._fade_in_window()

    def center_window(self):
        """Calculates screen dimensions and centers the 480x320 window."""
        self.update_idletasks()
        screen_width = self.winfo_screenwidth()
        screen_height = self.winfo_screenheight()
        x = max(0, int((screen_width - WINDOW_WIDTH) / 2))
        y = max(0, int((screen_height - WINDOW_HEIGHT) / 2))
        self.geometry(f"{WINDOW_WIDTH}x{WINDOW_HEIGHT}+{x}+{y}")

    def setup_ui(self):
        """Builds the modern card layout: header, links, options, action, downloads."""
        self.configure(fg_color=BG)
        self.container = ctk.CTkFrame(self, fg_color="transparent", corner_radius=0)
        self.container.pack(fill="both", expand=True, padx=14, pady=12)

        # ---------------------------------------------------------------------
        # HEADER: Logo badge + title / supported sites + theme toggle
        # ---------------------------------------------------------------------
        header = ctk.CTkFrame(self.container, fg_color="transparent")
        header.pack(fill="x", pady=(0, 10))

        logo = load_logo(34)
        self.icon_label = ctk.CTkLabel(
            header, text="" if logo else "♫", image=logo, width=34, height=34,
            text_color=ACCENT_COLOR, font=ctk.CTkFont(size=20, weight="bold")
        )
        self.icon_label.pack(side="left", padx=(0, 10))

        title_box = ctk.CTkFrame(header, fg_color="transparent")
        title_box.pack(side="left")
        self.title_label = ctk.CTkLabel(
            title_box, text="Borin Downloader", text_color=TEXT,
            font=ctk.CTkFont(size=15, weight="bold"), height=20, anchor="w"
        )
        self.title_label.pack(anchor="w")
        ctk.CTkLabel(
            title_box, text="  ·  ".join(p[0] for p in PLATFORMS), text_color=MUTED,
            font=ctk.CTkFont(size=10), height=14, anchor="w"
        ).pack(anchor="w")

        self.theme_btn = ctk.CTkButton(
            header, text="☀" if ctk.get_appearance_mode() == "Dark" else "☾",
            width=30, height=30, corner_radius=15, font=ctk.CTkFont(size=13),
            fg_color=CARD, border_width=1, border_color=CARD_BORDER,
            text_color=TEXT, command=self.toggle_theme
        )
        self.theme_btn.pack(side="right")
        Hover(self.theme_btn, CARD, CHIP_HOVER, CHIP_PRESS)

        # Small user-count chip (filled in from the web; hidden while offline)
        self.users_label = ctk.CTkLabel(
            header, text="", height=22, corner_radius=11, fg_color=CHIP,
            text_color=MUTED, font=ctk.CTkFont(size=10, weight="bold")
        )
        threading.Thread(target=self._load_user_count, daemon=True).start()
        self.after(300, self._poll_user_count)

        # ---------------------------------------------------------------------
        # LINKS CARD: multi-line link box, detected platforms, Paste / Clear
        # ---------------------------------------------------------------------
        links_card = self._card()
        links_head = self._card_title(links_card, "LINKS")
        self.clear_btn = self._pill(links_head, "Clear", self.clear_links, height=24)
        self.clear_btn.pack(side="right")
        self.paste_btn = self._pill(links_head, "Paste", self.paste_clipboard, height=24)
        self.paste_btn.pack(side="right", padx=(0, 6))

        box_wrap = self.box_wrap = ctk.CTkFrame(links_card, fg_color="transparent")
        box_wrap.pack(fill="x", padx=12)
        self.url_box = ctk.CTkTextbox(
            box_wrap, height=66, corner_radius=10, border_width=2,
            border_color=INPUT_BORDER, fg_color=INPUT_BG, text_color=TEXT,
            font=ctk.CTkFont(size=11), wrap="none"
        )
        self.url_box.pack(fill="x")
        self.placeholder = ctk.CTkLabel(
            box_wrap, text="Paste links here, one per line (Ctrl+Enter to start)",
            text_color=MUTED, fg_color=INPUT_BG, font=ctk.CTkFont(size=11), height=16
        )
        self.placeholder.place(x=12, y=8)
        self.placeholder.bind("<Button-1>", lambda e: self.url_box.focus_set())

        self.url_box.bind("<FocusIn>", lambda e: self._set_box_focus(True), add="+")
        self.url_box.bind("<FocusOut>", lambda e: self._set_box_focus(False), add="+")
        self.url_box.bind("<KeyRelease>", lambda e: self.update_link_summary(), add="+")
        self.url_box.bind("<<Paste>>", lambda e: self.after(10, self.update_link_summary), add="+")
        self.url_box.bind("<Control-Return>", lambda e: (self.start_download(), "break")[1])

        self.chips_frame = ctk.CTkFrame(links_card, fg_color="transparent", height=22)
        self.chips_frame.pack(fill="x", padx=12, pady=(6, 10))

        # ---------------------------------------------------------------------
        # OPTIONS CARD: format, quality, save folder
        # ---------------------------------------------------------------------
        options_card = self._card()
        self._card_title(options_card, "OPTIONS")

        row = self._option_row(options_card, "Format")
        self.mode_menu = self._segmented(row, ["MP3", "MP4"], self.selected_mode, self.on_mode_change)
        self.mode_menu.set("MP3")
        self.mode_menu.pack(side="left")

        row = self._option_row(options_card, "Bitrate")
        self.quality_label = row.label
        self.quality_menu = self._segmented(row, AUDIO_QUALITIES, self.selected_quality)
        self.quality_menu.set("320 kbps")
        self.quality_menu.pack(side="left")

        row = self._option_row(options_card, "Save to", last=True)
        self.open_folder_btn = self._pill(row, "Open", self.open_downloads_folder)
        self.open_folder_btn.pack(side="right")
        self.change_folder_btn = self._pill(row, "Change", self.choose_download_folder)
        self.change_folder_btn.pack(side="right", padx=(6, 4))
        self.folder_path_label = ctk.CTkLabel(
            row, text="", anchor="w", text_color=TEXT, font=ctk.CTkFont(size=11)
        )
        self.folder_path_label.pack(side="left", fill="x", expand=True)
        self.refresh_folder_label()

        # ---------------------------------------------------------------------
        # ACTION: Download button (hover / press / pulse effects) + progress
        # ---------------------------------------------------------------------
        self.download_btn = ctk.CTkButton(
            self.container, text="Download MP3", height=40, corner_radius=10,
            font=ctk.CTkFont(size=13, weight="bold"),
            fg_color=ACCENT_COLOR, text_color=ACCENT_TEXT, command=self.start_download
        )
        self.download_btn.pack(fill="x", pady=(0, 8))
        self.download_hover = Hover(self.download_btn, ACCENT_COLOR, ACCENT_HOVER, ACCENT_PRESS)

        progress_row = ctk.CTkFrame(self.container, fg_color="transparent")
        progress_row.pack(fill="x")
        self.percent_label = ctk.CTkLabel(
            progress_row, text="0%", width=34, anchor="e", text_color=MUTED,
            font=ctk.CTkFont(size=11, weight="bold")
        )
        self.percent_label.pack(side="right")
        self.progress_bar = ctk.CTkProgressBar(
            progress_row, height=6, corner_radius=3,
            progress_color=ACCENT_COLOR, fg_color=CHIP
        )
        self.progress_bar.set(0)
        self.progress_bar.pack(side="left", fill="x", expand=True, padx=(0, 8))

        self.status_label = ctk.CTkLabel(
            self.container, text="Ready · paste links to begin", anchor="w",
            font=ctk.CTkFont(size=11), text_color=MUTED, height=20
        )
        self.status_label.pack(fill="x", pady=(2, 6))

        # ---------------------------------------------------------------------
        # DOWNLOADS CARD: one row per link with its own progress
        # ---------------------------------------------------------------------
        queue_card = self._card(expand=True, pady=0)
        self._card_title(queue_card, "DOWNLOADS")
        self.queue_frame = ctk.CTkScrollableFrame(
            queue_card, fg_color="transparent", corner_radius=0, height=70
        )
        self.queue_frame.pack(fill="both", expand=True, padx=6, pady=(0, 8))
        self.queue_rows = []
        self.queue_empty = ctk.CTkLabel(
            self.queue_frame, text="Your downloads will appear here",
            text_color=MUTED, font=ctk.CTkFont(size=11)
        )
        self.queue_empty.pack(pady=14)

        self.update_link_summary()
        self._animate_progress()

    # -------------------------------------------------------------------------
    # Small UI builders
    # -------------------------------------------------------------------------
    def _card(self, expand: bool = False, pady: int = 8) -> ctk.CTkFrame:
        card = ctk.CTkFrame(
            self.container, fg_color=CARD, corner_radius=12,
            border_width=1, border_color=CARD_BORDER
        )
        card.pack(fill="both" if expand else "x", expand=expand, pady=(0, pady))
        return card

    def _card_title(self, card, title: str, hint: str = "") -> ctk.CTkFrame:
        row = ctk.CTkFrame(card, fg_color="transparent")
        row.pack(fill="x", padx=12, pady=(8, 6))
        ctk.CTkLabel(
            row, text=title, text_color=MUTED, height=16,
            font=ctk.CTkFont(size=10, weight="bold")
        ).pack(side="left")
        if hint:
            ctk.CTkLabel(
                row, text=hint, text_color=MUTED, height=16, font=ctk.CTkFont(size=11)
            ).pack(side="left", padx=(10, 0))
        return row

    def _option_row(self, card, label: str, last: bool = False) -> ctk.CTkFrame:
        row = ctk.CTkFrame(card, fg_color="transparent")
        row.pack(fill="x", padx=12, pady=(0, 10 if last else 6))
        row.label = ctk.CTkLabel(
            row, text=label, width=56, anchor="w", text_color=MUTED, font=ctk.CTkFont(size=11)
        )
        row.label.pack(side="left")
        return row

    def _pill(self, parent, text: str, command, height: int = 26) -> ctk.CTkButton:
        btn = ctk.CTkButton(
            parent, text=text, width=56, height=height, corner_radius=height // 2,
            font=ctk.CTkFont(size=11, weight="bold"),
            fg_color=CHIP, text_color=TEXT, command=command
        )
        Hover(btn, CHIP, CHIP_HOVER, CHIP_PRESS)
        return btn

    def _segmented(self, parent, values, variable, command=None) -> ctk.CTkSegmentedButton:
        return ctk.CTkSegmentedButton(
            parent, values=values, variable=variable, command=command,
            height=26, corner_radius=8, font=ctk.CTkFont(size=11, weight="bold"),
            fg_color=CHIP, selected_color=ACCENT_COLOR, selected_hover_color=ACCENT_HOVER,
            unselected_color=CHIP, unselected_hover_color=CHIP_HOVER, text_color=TEXT
        )

    # -------------------------------------------------------------------------
    # UI Helpers & Micro-interactions
    # -------------------------------------------------------------------------
    def toggle_theme(self):
        """Switches between Dark and Light appearance modes."""
        if ctk.get_appearance_mode() == "Dark":
            ctk.set_appearance_mode("Light")
            self.theme_btn.configure(text="☾")
        else:
            ctk.set_appearance_mode("Dark")
            self.theme_btn.configure(text="☀")
        Hover.reset_all()

    def _load_user_count(self):
        """Background: counts this install once (installed app only), then reads the total."""
        count = None
        try:
            if getattr(sys, "frozen", False) and not load_settings().get("counted"):
                count = counter_request("hit")
                if count is not None:
                    save_settings({"counted": True})
            if count is None:
                count = counter_request("get")
        except Exception:
            count = None
        self.user_count = count          # None = offline; read on the UI thread
        self.user_count_done = True

    def _poll_user_count(self, tries: int = 40):
        """UI thread: shows the user count once the background request has finished."""
        if not getattr(self, "user_count_done", False):
            if tries > 0:
                self.after(500, lambda: self._poll_user_count(tries - 1))
            return
        count = self.user_count
        if count is not None:
            self.users_label.configure(text=f"● {count:,} user" + ("" if count == 1 else "s"))
            self.users_label.pack(side="right", padx=(0, 8), ipadx=4)

    def _set_box_focus(self, focused: bool):
        """Glowing accent border while the link box is focused."""
        self.url_box.configure(border_color=ACCENT_COLOR if focused else INPUT_BORDER)
        self.update_link_summary()

    def update_link_summary(self):
        """Shows how many links are in the box and which platforms they are from."""
        urls = self.get_urls()
        has_text = bool(self.url_box.get("1.0", "end").strip())
        if has_text or self.focus_get() is getattr(self.url_box, "_textbox", None):
            self.placeholder.place_forget()
        else:
            self.placeholder.place(x=12, y=8)

        for child in self.chips_frame.winfo_children():
            child.destroy()
        if not urls:
            ctk.CTkLabel(self.chips_frame, text="No links yet", text_color=MUTED, height=22,
                         font=ctk.CTkFont(size=11)).pack(side="left")
            return

        counts = {}
        for url in urls:
            name = detect_platform(url) if self.validate_url(url) else "Unsupported"
            counts[name] = counts.get(name, 0) + 1
        items = list(counts.items())
        if len(items) > 3:
            items = items[:2] + [(f"+{len(counts) - 2} more", None)]
        for name, count in items:
            color = PLATFORM_COLORS.get(name, MUTED if name.startswith("+") else STATUS_ERROR)
            ctk.CTkLabel(
                self.chips_frame, text=f"● {name} {count}" if count else name, height=22, corner_radius=11,
                fg_color=CHIP, text_color=color, font=ctk.CTkFont(size=10, weight="bold")
            ).pack(side="left", padx=(0, 6), ipadx=4)

    def on_mode_change(self, mode: str):
        """Swaps the quality options when switching between MP3 and MP4."""
        if mode == "MP4":
            self.quality_label.configure(text="Quality")
            self.quality_menu.configure(values=VIDEO_QUALITIES)
            self.quality_menu.set("Best")
        else:
            self.quality_label.configure(text="Bitrate")
            self.quality_menu.configure(values=AUDIO_QUALITIES)
            self.quality_menu.set("320 kbps")
        if not self.is_downloading:
            self.download_btn.configure(text=self.button_text())

    def button_text(self) -> str:
        return "Download MP4" if self.selected_mode.get() == "MP4" else "Download MP3"

    def paste_clipboard(self):
        """Appends clipboard content to the link list as new line(s)."""
        try:
            content = self.clipboard_get().strip()
        except tk.TclError:
            content = ""
        if not content:
            self.update_status("Clipboard is empty", STATUS_WARN)
            self.shake_links()
            return
        existing = self.url_box.get("1.0", tk.END).strip()
        self.url_box.delete("1.0", tk.END)
        self.url_box.insert("1.0", f"{existing}\n{content}" if existing else content)
        self.update_link_summary()
        self.flash_button(self.paste_btn, "✓ Pasted")
        self.update_status(f"Link pasted · {len(self.get_urls())} link(s) in list", STATUS_SUCCESS)

    def clear_links(self):
        self.url_box.delete("1.0", tk.END)
        self.update_link_summary()
        self.flash_button(self.clear_btn, "✓ Cleared")
        self.update_status("Links cleared")

    def update_status(self, text: str, color: str | None = None):
        """Status text update with a quick fade-in (UI thread)."""
        target = color or MUTED
        if text == self.status_label.cget("text"):
            return
        self.status_label.configure(text=text)
        fade(self.status_label, target, start=blend(mode_color(target), mode_color(BG), 0.75),
             steps=8, prop="text_color")

    # -------------------------------------------------------------------------
    # Effects
    # -------------------------------------------------------------------------
    def _fade_in_window(self, step: int = 0):
        """Fades the whole window in on start-up."""
        try:
            self.attributes("-alpha", min(1.0, step / 14))
        except tk.TclError:
            return
        if step < 14:
            self.after(16, lambda: self._fade_in_window(step + 1))

    def shake_links(self):
        """Shakes the link box and flashes its border red (invalid / empty input)."""
        self.url_box.configure(border_color=STATUS_ERROR)
        offsets = [10, -9, 7, -6, 4, -3, 1, 0]

        def step(i=0):
            if i < len(offsets):
                o = offsets[i]
                self.box_wrap.pack_configure(padx=(12 + o, 12 - o))
                self.after(28, lambda: step(i + 1))
            else:
                focused = self.focus_get() is getattr(self.url_box, "_textbox", None)
                fade(self.url_box, ACCENT_COLOR if focused else INPUT_BORDER,
                     steps=14, prop="border_color")
        step()

    def flash_button(self, btn, text: str, color: str = ACCENT_COLOR, ms: int = 900):
        """Briefly shows a confirmation on a button, then fades it back."""
        original = getattr(btn, "_flash_text", None) or btn.cget("text")
        btn._flash_text = original
        hover = getattr(btn, "_hover", None)
        if hover:
            hover.enabled = False
        btn.configure(text=text, fg_color=color, text_color="#FFFFFF")

        def restore():
            btn.configure(text=original, text_color=TEXT)
            btn._flash_text = None
            if hover:
                hover.enabled = True
                fade(btn, hover.normal, steps=12)
        if getattr(btn, "_flash_job", None):
            btn.after_cancel(btn._flash_job)
        btn._flash_job = btn.after(ms, restore)

    def set_progress(self, val: float):
        """Sets the progress target; the bar eases smoothly toward it."""
        self.progress_target = max(0.0, min(1.0, val))

    def _animate_progress(self):
        """Eases the progress bar toward its target (~60 fps)."""
        current = getattr(self, "progress_value", 0.0)
        target = getattr(self, "progress_target", 0.0)
        if abs(target - current) > 0.001:
            current += (target - current) * (0.18 if target > current else 0.35)
            self.progress_value = current
            self.progress_bar.set(current)
            self.percent_label.configure(text=f"{int(round(current * 100))}%")
        elif current != target:
            self.progress_value = target
            self.progress_bar.set(target)
            self.percent_label.configure(text=f"{int(round(target * 100))}%")
        self.after(16, self._animate_progress)

    def refresh_folder_label(self):
        """Shows the save folder, shortened from the left so the end stays visible."""
        path = str(self.download_dir)
        self.folder_path_label.configure(text=path if len(path) <= 30 else "…" + path[-29:])

    def choose_download_folder(self):
        """Lets the user pick where files are saved, and remembers it."""
        folder = filedialog.askdirectory(
            parent=self,
            title="Choose where to save downloads",
            initialdir=str(self.download_dir) if self.download_dir.is_dir() else str(Path.home()),
        )
        if not folder:
            return
        self.download_dir = Path(folder)
        self.refresh_folder_label()
        save_settings({"download_dir": str(self.download_dir)})
        self.flash_button(self.change_folder_btn, "✓ Saved")
        fade(self.folder_path_label, TEXT, start=ACCENT_COLOR, steps=30, prop="text_color", ms=30)
        self.update_status(f"Files will be saved to: {self.download_dir.name or folder}", STATUS_SUCCESS)

    def open_downloads_folder(self):
        """Opens user's download folder in system file manager."""
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
        """Spinner text + pulsing glow on the Download button while working."""
        if not self.is_downloading:
            return
        frame = self.spinner_frames[(self.spinner_idx // 3) % len(self.spinner_frames)]
        pulse = (math.sin(self.spinner_idx * 0.18) + 1) / 2
        self.download_btn.configure(
            text=f"{frame}  {base_text}…",
            fg_color=blend(mode_color(ACCENT_COLOR), mode_color(ACCENT_GLOW), pulse),
        )
        # Shimmer on the progress bar, a little out of phase with the button
        shimmer = (math.sin(self.spinner_idx * 0.18 + 1.6) + 1) / 2
        self.progress_bar.configure(progress_color=blend(ACCENT_COLOR, ACCENT_GLOW, shimmer))
        self.spinner_idx += 1
        if self.spinner_idx % 3 == 0:
            self._refresh_progress()
        self.spinner_job = self.after(33, lambda: self.start_spinner(base_text))

    def stop_spinner(self, success: bool = True):
        """Stops the pulse, flashes a result on the button, then resets it."""
        if self.spinner_job:
            self.after_cancel(self.spinner_job)
            self.spinner_job = None
        self.progress_bar.configure(progress_color=ACCENT_COLOR if success else STATUS_WARN)
        fade(self.percent_label, MUTED, start=ACCENT_GLOW if success else STATUS_WARN,
             steps=40, prop="text_color", ms=30)
        if success:
            self.download_btn.configure(text="✓  Done!", fg_color=ACCENT_GLOW)
        else:
            self.download_btn.configure(text="Finished with errors", fg_color=STATUS_WARN)
        self.after(1600, self._reset_download_button)

    def _reset_download_button(self):
        if self.is_downloading:
            return
        self.download_hover.enabled = True
        self.download_btn.configure(text=self.button_text())
        self.download_hover.animate(ACCENT_COLOR, steps=12)

    # -------------------------------------------------------------------------
    # Download list (one row per link)
    # -------------------------------------------------------------------------
    def build_queue(self):
        for row in self.queue_rows:
            row["frame"].destroy()
        self.queue_rows = []
        self.queue_empty.pack_forget()
        for i, job in enumerate(self.jobs):
            name = detect_platform(job["url"])
            frame = ctk.CTkFrame(self.queue_frame, fg_color=CHIP, corner_radius=10)
            # Staggered entrance: rows appear one after another and fade from the card color
            self.after(70 * i, lambda f=frame: self._show_row(f))
            frame.grid_columnconfigure(1, weight=1)
            ctk.CTkLabel(
                frame, text="●", width=18, text_color=PLATFORM_COLORS.get(name, MUTED),
                font=ctk.CTkFont(size=12)
            ).grid(row=0, column=0, rowspan=2, padx=(8, 2), pady=5, sticky="n")
            title = ctk.CTkLabel(frame, text=shorten(job["url"], 40), anchor="w", text_color=TEXT,
                                 font=ctk.CTkFont(size=11, weight="bold"), height=16)
            title.grid(row=0, column=1, sticky="ew", pady=(6, 0))
            state = ctk.CTkLabel(frame, text="Waiting", anchor="e", text_color=MUTED,
                                 font=ctk.CTkFont(size=10, weight="bold"), height=16)
            state.grid(row=0, column=2, padx=(6, 10), pady=(6, 0))
            detail = ctk.CTkLabel(frame, text=name, anchor="w", text_color=MUTED,
                                  font=ctk.CTkFont(size=10), height=14)
            detail.grid(row=1, column=1, columnspan=2, sticky="ew", padx=(0, 10))
            bar = ctk.CTkProgressBar(frame, height=3, corner_radius=2,
                                     progress_color=PLATFORM_COLORS.get(name, ACCENT_COLOR), fg_color=CARD)
            bar.set(0)
            bar.grid(row=2, column=1, columnspan=2, sticky="ew", padx=(0, 10), pady=(3, 7))
            self.queue_rows.append({"frame": frame, "title": title, "state": state,
                                    "detail": detail, "bar": bar, "name": name, "flashed": False})

    def _show_row(self, frame):
        try:
            frame.pack(fill="x", pady=(0, 4), padx=2)
            fade(frame, CHIP, start=CARD, steps=12)
        except tk.TclError:
            pass                                   # row was replaced before it appeared

    def refresh_queue(self):
        for job, row in zip(self.jobs, self.queue_rows):
            if job["title"]:
                row["title"].configure(text=shorten(job["title"], 40))
            phase = job["phase"]
            if phase in ("done", "failed") and not row["flashed"]:
                # Finished: flash the row green / red, then fade back
                row["flashed"] = True
                tint = STATUS_SUCCESS if phase == "done" else STATUS_ERROR
                fade(row["frame"], CHIP, start=blend(mode_color(CHIP), tint, 0.35), steps=30, ms=25)
            if phase == "done":
                row["state"].configure(text="✓ Saved", text_color=STATUS_SUCCESS)
                row["detail"].configure(text=f"{row['name']} · saved as {self.mode_at_start}")
                row["bar"].set(1.0)
                row["bar"].configure(progress_color=STATUS_SUCCESS)
            elif phase == "failed":
                row["state"].configure(text="✕ Failed", text_color=STATUS_ERROR)
                row["detail"].configure(text=shorten(job["error"] or "", 60), text_color=STATUS_ERROR)
                row["bar"].set(1.0)
                row["bar"].configure(progress_color=STATUS_ERROR)
            elif phase == "queued":
                row["state"].configure(text="Waiting", text_color=MUTED)
            else:
                row["state"].configure(text=f"{int(job['fraction'] * 100)}%", text_color=ACCENT_COLOR)
                row["detail"].configure(text=f"{row['name']} · {job['msg'] or 'Starting…'}")
                row["bar"].set(job["fraction"])

    # -------------------------------------------------------------------------
    # Core Download Workflow (Multi-threaded)
    # -------------------------------------------------------------------------
    def validate_url(self, url: str) -> bool:
        """Checks the link is from a supported site (YouTube, Facebook, TikTok)."""
        return any(re.search(pat, url.strip(), re.IGNORECASE) for pat in SUPPORTED_URL_PATTERNS)

    def get_urls(self) -> list[str]:
        """Returns the unique, non-empty links from the link box (one per line)."""
        urls = []
        for line in self.url_box.get("1.0", tk.END).splitlines():
            for part in line.split():
                if part not in urls:
                    urls.append(part)
        return urls

    def set_inputs_state(self, state: str):
        """Enables / disables every input control."""
        self.url_box.configure(state=state)
        for widget in (self.paste_btn, self.clear_btn, self.mode_menu, self.quality_menu, self.change_folder_btn):
            widget.configure(state=state)

    def start_download(self):
        """Validates all links, disables UI, and starts parallel background workers."""
        if self.is_downloading:
            return

        if yt_dlp is None:
            self.update_status("yt-dlp is not installed. Run: pip install yt-dlp", STATUS_ERROR)
            return

        urls = self.get_urls()
        if not urls:
            self.update_status("Please enter at least one video link", STATUS_WARN)
            self.shake_links()
            self.url_box.focus()
            return

        invalid = [u for u in urls if not self.validate_url(u)]
        if invalid:
            self.update_status(f"Unsupported link: {invalid[0][:40]}", STATUS_ERROR)
            self.shake_links()
            return

        # One state record per link; worker threads write, the UI thread reads
        self.jobs = [
            {"url": u, "fraction": 0.0, "phase": "queued", "title": None, "error": None, "msg": ""}
            for u in urls
        ]
        self.mode_at_start = self.selected_mode.get()
        self.quality_at_start = self.selected_quality.get()

        # Disable interactive controls during download
        self.is_downloading = True
        self.download_hover.enabled = False
        self.set_inputs_state("disabled")
        self.build_queue()
        self.progress_value = 0.0
        self.set_progress(0.0)
        self.update_status(f"Starting {len(urls)} download(s)...")
        self.start_spinner("Downloading")

        # Run yt-dlp in background threads to keep the UI responsive
        threading.Thread(target=self._run_all, daemon=True).start()

    def _run_all(self):
        """Downloads all links, up to MAX_PARALLEL at the same time."""
        with ThreadPoolExecutor(max_workers=MAX_PARALLEL) as pool:
            list(pool.map(self._download_worker, self.jobs))
        self.after(0, self._on_all_complete)

    def _refresh_progress(self):
        """UI thread: combines per-link progress into the progress bar & status."""
        jobs = getattr(self, "jobs", None)
        if not jobs:
            return
        total = len(jobs)
        overall = sum(1.0 if j["phase"] in ("done", "failed") else j["fraction"] for j in jobs) / total
        self.set_progress(overall)
        self.refresh_queue()

        if total == 1:
            job = jobs[0]
            if job["msg"]:
                self.update_status(job["msg"], ACCENT_COLOR if job["phase"] == "processing" else None)
            return

        finished = sum(j["phase"] in ("done", "failed") for j in jobs)
        active = sum(j["phase"] in ("downloading", "processing") for j in jobs)
        failed = sum(j["phase"] == "failed" for j in jobs)
        msg = f"{finished}/{total} done · {active} downloading · {int(overall * 100)}%"
        if failed:
            msg += f" · {failed} failed"
        self.update_status(msg)

    def _make_progress_hook(self, job: dict):
        """Builds a yt-dlp progress callback bound to one link."""
        def hook(d: dict):
            status = d.get("status")
            if not job["title"]:
                job["title"] = (d.get("info_dict") or {}).get("title")
            if status == "downloading":
                job["phase"] = "downloading"
                total = d.get("total_bytes") or d.get("total_bytes_estimate") or 0
                downloaded = d.get("downloaded_bytes", 0)
                if total > 0:
                    job["fraction"] = min(downloaded / total, 0.95)
                    speed = format_speed(d.get("speed"))
                    eta = format_eta(d.get("eta"))
                    msg = f"Downloading: {int(downloaded / total * 100)}%"
                    if speed:
                        msg += f" · {speed}"
                    if eta:
                        msg += f" · ETA: {eta}"
                    job["msg"] = msg
                else:
                    job["msg"] = "Downloading stream..."
            elif status == "finished":
                job["phase"] = "processing"
                job["fraction"] = 0.95
                job["msg"] = "Merging video & audio..." if self.mode_at_start == "MP4" else "Converting audio to MP3..."
        return hook

    def _make_postprocessor_hook(self, job: dict):
        """Builds a yt-dlp post-processing callback bound to one link."""
        def hook(d: dict):
            if d.get("status") == "started":
                job["phase"] = "processing"
                job["msg"] = "Processing with FFmpeg..."
        return hook

    def _download_worker(self, job: dict):
        """Background worker running yt-dlp for a single link."""
        url = job["url"]
        mode = self.mode_at_start
        quality = self.quality_at_start

        # Prepare output template (title trimmed; id avoids name clashes on TikTok/FB)
        output_template = str(self.download_dir / "%(title).80B [%(id)s].%(ext)s")

        ydl_opts = {
            "outtmpl": output_template,
            "progress_hooks": [self._make_progress_hook(job)],
            "postprocessor_hooks": [self._make_postprocessor_hook(job)],
            "noplaylist": True,
            "windowsfilenames": True,
            "quiet": True,
            "no_warnings": True,
            "noprogress": True,
            "color": {"stdout": "no_color", "stderr": "no_color"},
        }

        if mode == "MP4":
            height = "" if quality == "Best" else f"[height<={quality.rstrip('p')}]"
            ydl_opts["format"] = (
                f"bv*{height}[ext=mp4]+ba[ext=m4a]/"
                f"bv*{height}+ba/"
                f"b{height}[ext=mp4]/b{height}/b"
            )
            ydl_opts["merge_output_format"] = "mp4"
            ydl_opts["postprocessors"] = [
                {"key": "FFmpegVideoRemuxer", "preferedformat": "mp4"},
                {"key": "FFmpegMetadata", "add_metadata": True},
            ]
        else:
            ydl_opts["format"] = "bestaudio/best"
            ydl_opts["postprocessors"] = [
                {
                    "key": "FFmpegExtractAudio",
                    "preferredcodec": "mp3",
                    "preferredquality": quality.replace(" kbps", ""),
                },
                {"key": "FFmpegMetadata", "add_metadata": True},
            ]

        # If custom FFmpeg path found, pass it directly
        if self.ffmpeg_path:
            ydl_opts["ffmpeg_location"] = self.ffmpeg_path

        error_msg = None
        job["phase"] = "downloading"
        job["msg"] = "Connecting & fetching video metadata..."

        try:
            if douyin.is_douyin(url):
                job["title"] = douyin.download(url, mode, quality, self.download_dir, self.ffmpeg_path, job)
            else:
                with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                    info = ydl.extract_info(url, download=True)
                    if info:
                        job["title"] = info.get("title") or "Video"
        except douyin.DouyinError as e:
            error_msg = str(e)
        except yt_dlp.utils.DownloadError as e:
            raw_err = re.sub(r"\x1b\[[0-9;]*m", "", str(e)).replace("ERROR: ", "")
            low = raw_err.lower()
            if "ffmpeg" in low:
                error_msg = "FFmpeg is required. Please install FFmpeg."
            elif "private" in low or "unavailable" in low:
                error_msg = "Video is private or unavailable."
            elif "not a bot" in low:
                error_msg = "YouTube blocked the request. Update yt-dlp and retry."
            elif "sign in" in low or "login" in low or "log in" in low:
                error_msg = "This video requires login (age/private restricted)."
            elif "unsupported url" in low:
                error_msg = "This link is not a video page."
            else:
                error_msg = f"Download failed: {raw_err[:60]}..."
        except Exception as e:
            error_msg = f"Error: {str(e)[:60]}"

        job["error"] = error_msg
        job["phase"] = "failed" if error_msg else "done"

    def _on_all_complete(self):
        """Invoked on UI thread after every link finished or errored."""
        self.is_downloading = False
        self.set_inputs_state("normal")
        self.refresh_queue()

        failed = [j for j in self.jobs if j["error"]]
        done = [j for j in self.jobs if not j["error"]]
        ext = "mp4" if self.mode_at_start == "MP4" else "mp3"
        self.stop_spinner(success=not failed)

        # Keep only failed links in the box so they can be retried
        self.url_box.delete("1.0", tk.END)
        self.url_box.insert("1.0", "\n".join(j["url"] for j in failed))
        self.update_link_summary()

        if len(self.jobs) == 1:
            job = self.jobs[0]
            if job["error"]:
                self.set_progress(0.0)
                self.update_status(job["error"], STATUS_ERROR)
            else:
                self.set_progress(1.0)
                title = job["title"] or "Video"
                clean_title = (title[:30] + "..") if len(title) > 32 else title
                self.update_status(f"✓ Success! Saved: {clean_title}.{ext}", STATUS_SUCCESS)
        elif not failed:
            self.set_progress(1.0)
            self.update_status(f"✓ Success! Saved {len(done)} {ext.upper()} files", STATUS_SUCCESS)
        else:
            self.set_progress(1.0)
            self.update_status(
                f"{len(done)} saved · {len(failed)} failed (kept in list): {failed[0]['error'][:40]}",
                STATUS_ERROR if not done else STATUS_WARN,
            )


# -----------------------------------------------------------------------------
# Entry Point
# -----------------------------------------------------------------------------
def main():
    app = YouTubeMP3Downloader()
    app.mainloop()


if __name__ == "__main__":
    main()
