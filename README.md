# Video & MP3 Downloader

A small Windows desktop app that downloads videos as **MP3** (audio) or **MP4** (video) from
**YouTube, Facebook, TikTok, Douyin and Bilibili**.

- Paste many links at once (one per line); up to 3 download at the same time
- MP3: 192 / 256 / 320 kbps · MP4: Best / 1080p / 720p / 480p
- Choose where files are saved (remembered next time)
- Dark / light theme

## Install (for users)

1. Open the **[Releases](../../releases/latest)** page and download `VideoDownloader-Setup-1.2.0.exe`
2. Run it and follow the steps. No admin rights needed.
3. Open **Video & MP3 Downloader** from the Start menu or desktop.

FFmpeg and everything else is included. Douyin uses Microsoft Edge, which comes with Windows 10/11.

> Windows may show "Windows protected your PC" because the installer isn't code-signed.
> Click **More info → Run anyway**.

## ដំឡើង (Khmer)

1. ចូល **Releases** ហើយទាញយក `VideoDownloader-Setup-1.2.0.exe`
2. ចុចពីរដង ហើយចុច Next រហូតដល់ចប់
3. បើក **Video & MP3 Downloader** ពី Start menu ឬ Desktop

បើ Windows លោតថា "Windows protected your PC" ចុច **More info → Run anyway**។

## Run from source (for developers)

```bash
pip install -r requirements.txt
python app.py
```

Needs Python 3.10+, FFmpeg on PATH, and Deno (for YouTube).

## Build the installer

Requires [Inno Setup 6](https://jrsoftware.org/isinfo.php). Double-click `build_installer.bat`,
or run:

```bash
pyinstaller --noconfirm installer.spec
"%LOCALAPPDATA%\Programs\Inno Setup 6\ISCC.exe" installer.iss
```

The installer is written to `installer\VideoDownloader-Setup-<version>.exe`.
