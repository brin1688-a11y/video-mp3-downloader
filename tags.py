"""
Clean music titles for MP3 tags and file names.

"All3rgy Ft. Monetrey Ek - Ocean Breeze [Official Lyrics Video]"
    -> title "Ocean Breeze", artist "All3rgy Ft. Monetrey Ek"
"""

import re

# Words that mark a bracket as video "junk" rather than part of the song name
JUNK_WORDS = (
    r"official|lyrics?|lyric video|video|audio|mv|m/v|visuali[sz]er|music video|"
    r"hd|hq|4k|8k|1080p|720p|full song|full version|free download|karaoke|"
    r"clip officiel|官方|歌词|完整版|高清"
)
BRACKETS = r"\(\)\[\]【】「」（）"
JUNK_BRACKET = re.compile(
    rf"\s*[\(\[【「（][^{BRACKETS}]*?(?:{JUNK_WORDS})[^{BRACKETS}]*?[\)\]】」）]", re.IGNORECASE)
HASHTAG = re.compile(r"\s*#\S+")
AFTER_BAR = re.compile(r"\s*[|｜].*$")
ARTIST_SUFFIX = re.compile(r"\s*(?:-\s*Topic|VEVO|Official)\s*$", re.IGNORECASE)


def tidy(text: str) -> str:
    text = re.sub(r"\s+", " ", text or "").strip()
    return text.strip(" -–—_·:").strip()


def clean_music_title(title: str, artist: str | None = None, uploader: str | None = None) -> tuple[str, str]:
    """Returns (song title, artist) with video junk removed."""
    t = JUNK_BRACKET.sub("", title or "")
    t = HASHTAG.sub("", t)
    t = AFTER_BAR.sub("", t)
    t = tidy(t)

    artist = tidy(ARTIST_SUFFIX.sub("", artist or ""))
    parts = re.split(r"\s+[-–—]\s+", t, maxsplit=1)
    if len(parts) == 2 and parts[0] and parts[1]:
        # "Artist - Song": keep the song; use the left side as artist if none is known
        t = tidy(parts[1])
        artist = artist or tidy(parts[0])
    if not artist:
        artist = tidy(ARTIST_SUFFIX.sub("", uploader or ""))
    return (t or tidy(title) or "Audio"), artist


def file_label(track: str, artist: str) -> str:
    """'Artist - Song' (or just 'Song') for the MP3 file name."""
    return f"{artist} - {track}" if artist else track
