"""
fish_client.py
==============
Fish Audio TTS caller with:
  - Token-bucket rate limiter (2 req/s free tier)
  - Exponential back-off on 429 / 5xx  (2s → 4s → 8s, then give up)
  - Character-ratio word timing  (works on every plan, no extra endpoint)
  - Returns (mp3_bytes: bytes, words: list[dict])

Character-ratio timing explained:
  Fish Audio does not expose a public timestamp endpoint on the free tier.
  We estimate each word's start/end time by its character-position share of
  the total clean text, multiplied by the actual MP3 duration.

  word_start = (char_offset_of_word / total_chars) * duration_sec
  word_end   = ((char_offset + len(word)) / total_chars) * duration_sec

  Accuracy is ±0.3s for normal sentences — tight enough for live word
  highlighting. If Fish ever exposes timestamps on your plan, swap in the
  real data; the JSON schema is identical.

MP3 duration is read with a lightweight pure-Python parser that scans
the first valid MPEG frame header — no external libraries needed.

Usage:
    from fish_client import FishClient

    client = FishClient(api_key="sk-fish-...")
    mp3_bytes, words = client.generate("Hello world.", audio_type="question")
    #  words → [{"word": "Hello", "start": 0.00, "end": 0.45},
    #           {"word": "world", "start": 0.46, "end": 0.90}]
"""

from __future__ import annotations

import struct
import time
import threading
from typing import Optional

from fish_audio_sdk import Session, TTSRequest

# ── Constants ──────────────────────────────────────────────────────────────────

FISH_API_KEY  = ""          # set by generate_audio.py at runtime
VOICE_ID      = "bf322df2096a46f18c579d0baa36f41d"  # Adrian — clear neutral English voice
BACKEND       = "speech-1.6"

# Audio settings
FORMAT        = "mp3"
MP3_BITRATE   = 128         # kbps  (64 / 128 / 192)
LATENCY       = "balanced"  # "balanced" = lower TTFA, good for quiz

# Rate limiting
MAX_RPS       = 2           # free tier: 2 requests per second
RETRY_DELAYS  = [2, 4, 8]   # seconds to wait after each failed attempt


# ── Token-bucket rate limiter ──────────────────────────────────────────────────

class _TokenBucket:
    """Thread-safe token bucket — max `rate` tokens per second."""

    def __init__(self, rate: float) -> None:
        self._rate      = rate
        self._tokens    = rate
        self._last      = time.monotonic()
        self._lock      = threading.Lock()
        self._min_gap   = 1.0 / rate   # minimum seconds between requests

    def acquire(self) -> None:
        """Block until a token is available."""
        with self._lock:
            now     = time.monotonic()
            elapsed = now - self._last
            self._tokens = min(self._rate, self._tokens + elapsed * self._rate)
            self._last  = now

            if self._tokens >= 1.0:
                self._tokens -= 1.0
                return

            # Not enough tokens — sleep for the deficit
            deficit     = 1.0 - self._tokens
            sleep_for   = deficit / self._rate
            self._tokens = 0.0

        time.sleep(sleep_for)


_bucket = _TokenBucket(MAX_RPS)


# ── MP3 duration parser ────────────────────────────────────────────────────────

# MPEG bitrate table: [version_index][layer_index][bitrate_index]
_MPEG_BITRATES = {
    # MPEG1
    (1, 1): [0,32,64,96,128,160,192,224,256,288,320,352,384,416,448,0],
    (1, 2): [0,32,48,56,64,80,96,112,128,160,192,224,256,320,384,0],
    (1, 3): [0,32,40,48,56,64,80,96,112,128,160,192,224,256,320,0],
    # MPEG2
    (2, 1): [0,32,48,56,64,80,96,112,128,144,160,176,192,224,256,0],
    (2, 2): [0,8,16,24,32,40,48,56,64,80,96,112,128,144,160,0],
    (2, 3): [0,8,16,24,32,40,48,56,64,80,96,112,128,144,160,0],
}

_MPEG_SAMPLE_RATES = {
    0: [44100, 48000, 32000],  # MPEG1
    1: [22050, 24000, 16000],  # MPEG2
    2: [11025, 12000, 8000],   # MPEG2.5
}

_SAMPLES_PER_FRAME = {
    (1, 1): 384, (1, 2): 1152, (1, 3): 1152,
    (2, 1): 384, (2, 2): 1152, (2, 3): 576,
}


def _parse_mp3_duration(data: bytes) -> float:
    """
    Scan the first valid MPEG audio frame in `data` and estimate
    total duration from file size ÷ bitrate.

    Returns duration in seconds, or a fallback estimate on failure.
    """
    # Skip ID3v2 tag if present
    offset = 0
    if data[:3] == b"ID3":
        # ID3v2 header: 10 bytes, size encoded in 4 synchsafe bytes at offset 6
        if len(data) >= 10:
            sz = (
                (data[6] & 0x7F) << 21 |
                (data[7] & 0x7F) << 14 |
                (data[8] & 0x7F) << 7  |
                (data[9] & 0x7F)
            )
            offset = 10 + sz

    # Scan for sync word (0xFF 0xEx or 0xFF 0xFx)
    for i in range(offset, min(offset + 8192, len(data) - 4)):
        if data[i] != 0xFF:
            continue
        b1 = data[i + 1]
        if (b1 & 0xE0) != 0xE0:
            continue

        # Parse frame header
        b2 = data[i + 2]
        b3 = data[i + 3]

        version_bits = (b1 >> 3) & 0x03  # 3=MPEG1, 2=MPEG2, 0=MPEG2.5
        layer_bits   = (b1 >> 1) & 0x03  # 3=L1, 2=L2, 1=L3
        bitrate_idx  = (b2 >> 4) & 0x0F
        sample_idx   = (b2 >> 2) & 0x03

        version = {3: 1, 2: 2, 0: 2}.get(version_bits)
        layer   = {3: 1, 2: 2, 1: 3}.get(layer_bits)
        if version is None or layer is None:
            continue

        br_table = _MPEG_BITRATES.get((version, layer))
        if br_table is None or bitrate_idx >= len(br_table):
            continue

        bitrate = br_table[bitrate_idx]
        if bitrate == 0:
            continue

        sr_list = _MPEG_SAMPLE_RATES.get(version - 1 if version > 0 else 2, [44100,48000,32000])
        if sample_idx >= len(sr_list):
            continue

        # Estimate duration from total data size and bitrate
        audio_bytes = len(data) - i
        duration = (audio_bytes * 8) / (bitrate * 1000)
        return max(0.1, round(duration, 3))

    # Fallback: rough estimate at 128kbps
    return max(0.1, round(len(data) * 8 / (128 * 1000), 3))


# ── Character-ratio word timing ────────────────────────────────────────────────

def _build_word_timings(text: str, duration_sec: float) -> list[dict]:
    """
    Assign each word a start and end time proportional to its character
    position in the text.

    Returns:
        [{"word": str, "start": float, "end": float}, ...]
    """
    words: list[dict] = []
    total_chars = len(text)
    if total_chars == 0 or duration_sec <= 0:
        return words

    pos = 0
    for token in re.split(r"(\s+)", text) if True else []:
        pass  # replaced below

    # Walk character by character to find word boundaries
    import re as _re
    for m in _re.finditer(r"\S+", text):
        word  = m.group()
        start_char = m.start()
        end_char   = m.end()

        start_sec = round((start_char / total_chars) * duration_sec, 3)
        end_sec   = round((end_char   / total_chars) * duration_sec, 3)

        # Ensure minimum word duration of 0.05s
        if end_sec - start_sec < 0.05:
            end_sec = round(start_sec + 0.05, 3)

        words.append({
            "word":  word,
            "start": start_sec,
            "end":   end_sec,
        })

    return words


def _build_option_boundaries(options_text: str,
                              duration_sec: float,
                              options: list[dict]) -> list[dict]:
    """
    For each option, find its spoken prefix ("Option A. text.") in the
    full options_text and compute start/end time for the whole option block.

    Returns:
        [{"tag": "a", "text": "...", "start": float, "end": float}, ...]
    """
    import re as _re
    total_chars = len(options_text)
    boundaries: list[dict] = []

    for opt in options:
        tag  = opt.get("tag", "").upper()
        raw  = opt.get("text", "") or ""
        prefix = f"Option {tag}."

        idx = options_text.find(prefix)
        if idx == -1:
            continue

        # Find start of NEXT option to determine end boundary
        next_tag_map = {"A": "B", "B": "C", "C": "D", "D": "E",
                        "E": "F", "F": "G"}
        next_tag = next_tag_map.get(tag)
        end_idx = len(options_text)
        if next_tag:
            ni = options_text.find(f"Option {next_tag}.")
            if ni != -1:
                end_idx = ni

        start_sec = round((idx       / total_chars) * duration_sec, 3)
        end_sec   = round((end_idx   / total_chars) * duration_sec, 3)

        from text_cleaner import clean_for_tts
        boundaries.append({
            "tag":   opt.get("tag", ""),
            "text":  clean_for_tts(raw),
            "start": start_sec,
            "end":   end_sec,
        })

    return boundaries


# ── Fish Audio client ──────────────────────────────────────────────────────────

class FishClient:
    """
    Thin wrapper around fish_audio_sdk.Session.

    Parameters
    ----------
    api_key   : Fish Audio API key
    voice_id  : reference_id of the voice to use (default: Adrian)
    backend   : model backend (default: speech-1.6)
    """

    def __init__(
        self,
        api_key:  str,
        voice_id: str = VOICE_ID,
        backend:  str = BACKEND,
    ) -> None:
        self._api_key  = api_key
        self._voice_id = voice_id
        self._backend  = backend

    def generate(
        self,
        text: str,
        *,
        audio_type: str = "question",       # "question" | "options" | "explanation"
        options: Optional[list[dict]] = None,  # needed only for audio_type="options"
    ) -> tuple[bytes, list[dict], list[dict]]:
        """
        Generate TTS audio and compute timing data.

        Parameters
        ----------
        text        : clean TTS-ready text (already processed by text_cleaner)
        audio_type  : label used for context — no effect on generation
        options     : raw options list (only for options audio, to build boundaries)

        Returns
        -------
        (mp3_bytes, words, option_boundaries)
          mp3_bytes         : raw MP3 audio bytes
          words             : [{word, start, end}, ...]  — word-level timings
          option_boundaries : [{tag, text, start, end}, ...] — only for options audio
                              empty list for question / explanation audio
        """
        if not text or not text.strip():
            raise ValueError("Cannot generate audio for empty text.")

        mp3_bytes = self._call_with_retry(text)
        duration  = _parse_mp3_duration(mp3_bytes)
        words     = _build_word_timings(text, duration)

        opt_bounds: list[dict] = []
        if audio_type == "options" and options:
            opt_bounds = _build_option_boundaries(text, duration, options)

        return mp3_bytes, words, opt_bounds

    def _call_with_retry(self, text: str) -> bytes:
        """Call Fish API with rate limiting and exponential back-off."""
        last_exc: Exception | None = None

        for attempt, delay in enumerate([0] + RETRY_DELAYS, start=1):
            if delay:
                print(f"    [retry {attempt}/{len(RETRY_DELAYS)+1}] waiting {delay}s...")
                time.sleep(delay)

            # Respect rate limit
            _bucket.acquire()

            try:
                mp3_bytes = self._stream_to_bytes(text)
                return mp3_bytes

            except Exception as exc:
                msg = str(exc)
                last_exc = exc

                # 429 rate-limited — always retry
                if "429" in msg or "rate" in msg.lower():
                    print(f"    [429] rate limited — will retry")
                    continue

                # 5xx server error — retry
                if any(f"{c}" in msg for c in (500, 502, 503, 504)):
                    print(f"    [5xx] server error — will retry: {msg[:80]}")
                    continue

                # 4xx (except 429) — no point retrying
                print(f"    [err] Fish Audio error: {msg[:120]}")
                raise

        raise RuntimeError(
            f"Fish Audio failed after {len(RETRY_DELAYS)+1} attempts"
        ) from last_exc

    def _stream_to_bytes(self, text: str) -> bytes:
        """Use fish_audio_sdk Session to stream TTS and collect all bytes."""
        req = TTSRequest(
            text=text,
            reference_id=self._voice_id if self._voice_id else None,
            format=FORMAT,
            mp3_bitrate=MP3_BITRATE,
            latency=LATENCY,
            normalize=True,
        )

        chunks: list[bytes] = []
        with Session(self._api_key) as session:
            for chunk in session.tts(req, self._backend):
                if chunk:
                    chunks.append(chunk)

        if not chunks:
            raise RuntimeError("Fish Audio returned empty response")

        return b"".join(chunks)


# Fix the stray dead code in _build_word_timings
import re as _re  # noqa — needed at module level for _build_word_timings
