"""
Douyin (抖音) downloader.

Douyin's web API only answers requests signed by its own page scripts, so a hidden
Microsoft Edge (built into Windows) opens the video page, and we read the video
details that the page itself fetches. The file is then downloaded directly.
"""

import re
import subprocess
from pathlib import Path

DOUYIN_URL_PATTERNS = [
    r"^https?://(www\.)?douyin\.com/",
    r"^https?://v\.douyin\.com/",
    r"^https?://(www\.)?iesdouyin\.com/",
]

DETAIL_API = "aweme/v1/web/aweme/detail"
PAGE_TIMEOUT_MS = 45000
CHUNK_SIZE = 256 * 1024


class DouyinError(Exception):
    """Error with a message that can be shown to the user as-is."""


def is_douyin(url: str) -> bool:
    return any(re.search(pat, url.strip(), re.IGNORECASE) for pat in DOUYIN_URL_PATTERNS)


def extract_video_id(url: str) -> str | None:
    """Finds the numeric video id in /video/ID, /note/ID or ?modal_id=ID links."""
    m = re.search(r"(?:/video/|/note/|/share/video/|modal_id=)(\d{15,})", url)
    return m.group(1) if m else None


def fetch_detail(url: str) -> tuple[dict, str]:
    """Opens the link in hidden Edge and returns (aweme_detail, browser user agent)."""
    try:
        from playwright.sync_api import sync_playwright, Error as PlaywrightError
    except ImportError:
        raise DouyinError("Douyin needs Playwright. Run: pip install playwright")

    detail = {}

    def on_response(response):
        if DETAIL_API in response.url and not detail:
            try:
                data = response.json().get("aweme_detail")
                if data:
                    detail.update(data)
            except Exception:
                pass

    with sync_playwright() as p:
        browser = None
        for channel in ("msedge", "chrome"):
            try:
                browser = p.chromium.launch(channel=channel, headless=True)
                break
            except PlaywrightError:
                continue
        if browser is None:
            raise DouyinError("Douyin needs Microsoft Edge or Google Chrome installed.")

        try:
            page = browser.new_page()
            page.on("response", on_response)

            # Short links (v.douyin.com/xxx) redirect to the real video page
            video_id = extract_video_id(url)
            if not video_id:
                page.goto(url, wait_until="domcontentloaded", timeout=PAGE_TIMEOUT_MS)
                video_id = extract_video_id(page.url)
                if not video_id:
                    raise DouyinError("Could not find a video in this Douyin link.")

            if not detail:
                page.goto(f"https://www.douyin.com/video/{video_id}",
                          wait_until="domcontentloaded", timeout=PAGE_TIMEOUT_MS)
            for _ in range(60):
                if detail:
                    break
                page.wait_for_timeout(500)
            user_agent = page.evaluate("navigator.userAgent")
        except PlaywrightError as e:
            raise DouyinError(f"Could not open Douyin: {str(e)[:50]}")
        finally:
            browser.close()

    if not detail:
        raise DouyinError("Douyin video not found (deleted, private, or blocked).")
    return detail, user_agent


def pick_stream(detail: dict, mode: str, max_height: int | None) -> str:
    """Chooses a video URL. MP4: best H.264 within max_height. MP3: smallest file."""
    video = detail.get("video") or {}
    streams = []
    for br in video.get("bit_rate") or []:
        addr = br.get("play_addr") or {}
        urls = addr.get("url_list") or []
        if br.get("format", "mp4") != "mp4" or not urls:
            continue
        res = min(addr.get("width") or 0, addr.get("height") or 0)
        streams.append({
            "url": urls[0],
            "res": res,
            "h265": bool(br.get("is_h265") or br.get("is_bytevc1")),
            "rate": br.get("bit_rate") or 0,
        })

    if not streams:
        urls = (video.get("play_addr") or {}).get("url_list") or []
        if not urls:
            raise DouyinError("This Douyin post has no video (photo post?).")
        return urls[0]

    if mode == "MP3":
        # Audio is the same in every stream, so take the smallest download
        return min(streams, key=lambda s: s["rate"])["url"]

    # H.264 plays everywhere; H.265 only as a fallback
    compatible = [s for s in streams if not s["h265"]] or streams
    if max_height:
        within = [s for s in compatible if s["res"] <= max_height]
        compatible = within or [min(compatible, key=lambda s: s["res"])]
    return max(compatible, key=lambda s: (s["res"], s["rate"]))["url"]


def safe_filename(text: str, max_len: int = 80) -> str:
    name = re.sub(r'[\\/:*?"<>|\r\n\t]+', " ", text).strip().strip(".")
    name = re.sub(r"\s+", " ", name)
    return name[:max_len].strip() or "douyin"


def download(url: str, mode: str, quality: str, out_dir: Path, ffmpeg: str | None, job: dict) -> str:
    """Downloads one Douyin link as MP3 or MP4. Updates job progress. Returns the title."""
    from curl_cffi import requests

    job["msg"] = "Opening Douyin (hidden Edge)..."
    detail, user_agent = fetch_detail(url)
    if detail.get("images"):
        raise DouyinError("This Douyin post is photos, not a video.")

    title = detail.get("desc") or "Douyin video"
    job["title"] = title
    aweme_id = detail.get("aweme_id") or extract_video_id(url) or "douyin"
    max_height = int(quality.rstrip("p")) if mode == "MP4" and quality != "Best" else None
    stream_url = pick_stream(detail, mode, max_height)

    base = str(out_dir / f"{safe_filename(title)} [{aweme_id}]")
    video_path = Path(base + (".mp4" if mode == "MP4" else ".part.mp4"))

    # Download with progress
    headers = {"User-Agent": user_agent, "Referer": "https://www.douyin.com/"}
    resp = requests.get(stream_url, headers=headers, impersonate="chrome", stream=True, timeout=60)
    if resp.status_code != 200:
        raise DouyinError(f"Douyin refused the download (HTTP {resp.status_code}).")
    total = int(resp.headers.get("content-length") or 0)
    done = 0
    with open(video_path, "wb") as f:
        for chunk in resp.iter_content(chunk_size=CHUNK_SIZE):
            f.write(chunk)
            done += len(chunk)
            if total:
                job["fraction"] = min(done / total, 0.95)
                job["msg"] = f"Downloading: {int(done / total * 100)}% · {done / 1048576:.1f} / {total / 1048576:.1f} MB"

    if mode == "MP4":
        return title

    # Convert to MP3 with FFmpeg
    if not ffmpeg:
        video_path.unlink(missing_ok=True)
        raise DouyinError("FFmpeg is required. Please install FFmpeg.")
    job["phase"] = "processing"
    job["fraction"] = 0.95
    job["msg"] = "Converting audio to MP3..."
    bitrate = quality.replace(" kbps", "")
    result = subprocess.run(
        [ffmpeg, "-y", "-loglevel", "error", "-i", str(video_path), "-vn",
         "-codec:a", "libmp3lame", "-b:a", f"{bitrate}k", "-metadata", f"title={title[:120]}",
         base + ".mp3"],
        capture_output=True, text=True,
        creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
    )
    video_path.unlink(missing_ok=True)
    if result.returncode != 0:
        raise DouyinError(f"MP3 conversion failed: {result.stderr.strip()[:50]}")
    return title
