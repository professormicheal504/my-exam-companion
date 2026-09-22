"""
fish_client.py
==============
Fish Audio TTS caller using the s2.1-pro-free model (free, no hard cap).

Why httpx directly instead of the fish-audio-sdk Session?
  The SDK's Backends type is Literal['speech-1.5','speech-1.6',...] and
  does not yet include 's2.1-pro-free' (announced June 2026, SDK not updated).
  We call the same /v1/tts endpoint directly using httpx + ormsgpack,
  which is exactly what the SDK does internally — same wire format, same auth.

Free tier:
  Model : s2.1-pro-free
  Limit : Fair Use (no hard character cap), available through Nov 2026
  Rate  : 2 req/s recommended on free tier

Character-ratio word timing:
  Fish Audio does not expose a public timestamp endpoint on the free tier.
  We estimate each word's start/end time by its character-position share of
  the total text, multiplied by the actual MP3 duration parsed from the file.

  word_start = (char_start / total_chars) * duration_sec
  word_end   = (char_end   / total_chars) * duration_sec

  Accuracy ~±0.3s for normal prose — sufficient for live word highlighting.

Usage:
    from fish_client import FishClient

    client = FishClient(api_key="sk-fish-...")
    mp3_bytes, words, opt_bounds = client.generate(
        "Hello world.", audio_type="question"
    )
    # words -> [{"word":"Hello","start":0.00,"end":0.45}, ...]
"""

from __future__ import annotations

import time
import threading
from typing import Optional

import httpx
import ormsgpack

# ── Constants ──────────────────────────────────────────────────────────────────

FISH_API_URL  = "https://api.fish.audio/v1/tts"

# Free model — announced June 2026, no hard usage cap
BACKEND       = "s2.1-pro-free"

# A clear neutral English voice from Fish Audio's public library (Adrian)
VOICE_ID      = "bf322df2096a46f18c579d0baa36f41d"

# Audio settings
FORMAT        = "mp3"
MP3_BITRATE   = 128         # 64 / 128 / 192
LATENCY       = "balanced"  # lower time-to-first-audio

# Rate limiting — stay gentle on the free tier
MAX_RPS       = 2
RETRY_DELAYS  = [2, 4, 8]   # seconds between retries on 429 / 5xx
REQUEST_TIMEOUT = 120        # seconds total per request


# ── Token-bucket rate limiter ──────────────────────────────────────────────────

class _TokenBucket:
    """Thread-safe token bucket: max `rate` tokens per second."""

    def __init__(self, rate: float) -> None:
        self._rate   = rate
        self._tokens = rate
        self._last   = time.monotonic()
        self._lock   = threading.Lock()

    def acquire(self) -> None:
        with self._lock:
            now     = time.monotonic()
            elapsed = now - self._last
            self._tokens = min(self._rate, self._tokens + elapsed * self._rate)
            self._last   = now
            if self._tokens >= 1.0:
                self._tokens -= 1.0
                return
            deficit   = (1.0 - self._tokens) / self._rate
            self._tokens = 0.0
        time.sleep(deficit)


_bucket = _TokenBucket(MAX_RPS)


# ── MP3 duration parser ────────────────────────────────────────────────────────

def _parse_mp3_duration(data: bytes) -> float:
    """
    Estimate MP3 duration by scanning the first valid MPEG frame header
    and computing: (audio_bytes * 8) / (bitrate_kbps * 1000).
    Falls back to a rough estimate at 128 kbps if parsing fails.
    """
    # Skip ID3v2 tag
    offset = 0
    if data[:3] == b"ID3" and len(data) >= 10:
        sz = (
            (data[6] & 0x7F) << 21 | (data[7] & 0x7F) << 14 |
            (data[8] & 0x7F) << 7  | (data[9] & 0x7F)
        )
        offset = 10 + sz

    _BITRATES = {
        (1,1):[0,32,64,96,128,160,192,224,256,288,320,352,384,416,448,0],
        (1,2):[0,32,48,56,64,80,96,112,128,160,192,224,256,320,384,0],
        (1,3):[0,32,40,48,56,64,80,96,112,128,160,192,224,256,320,0],
        (2,1):[0,32,48,56,64,80,96,112,128,144,160,176,192,224,256,0],
        (2,2):[0,8,16,24,32,40,48,56,64,80,96,112,128,144,160,0],
        (2,3):[0,8,16,24,32,40,48,56,64,80,96,112,128,144,160,0],
    }

    for i in range(offset, min(offset + 8192, len(data) - 4)):
        if data[i] != 0xFF or (data[i+1] & 0xE0) != 0xE0:
            continue
        b1, b2 = data[i+1], data[i+2]
        version = {3:1, 2:2, 0:2}.get((b1 >> 3) & 0x03)
        layer   = {3:1, 2:2, 1:3}.get((b1 >> 1) & 0x03)
        if version is None or layer is None:
            continue
        br_table = _BITRATES.get((version, layer))
        if br_table is None:
            continue
        bitrate_idx = (b2 >> 4) & 0x0F
        if bitrate_idx >= len(br_table) or br_table[bitrate_idx] == 0:
            continue
        bitrate     = br_table[bitrate_idx]
        audio_bytes = len(data) - i
        return max(0.1, round(audio_bytes * 8 / (bitrate * 1000), 3))

    # Fallback
    return max(0.1, round(len(data) * 8 / (MP3_BITRATE * 1000), 3))


# ── Character-ratio word timing ────────────────────────────────────────────────

def _build_word_timings(text: str, duration_sec: float) -> list[dict]:
    """
    Assign each word a start/end time proportional to its char position.
    Returns [{"word": str, "start": float, "end": float}, ...]
    """
    import re
    words: list[dict] = []
    total  = len(text)
    if total == 0 or duration_sec <= 0:
        return words

    for m in re.finditer(r"\S+", text):
        s = round(m.start() / total * duration_sec, 3)
        e = round(m.end()   / total * duration_sec, 3)
        if e - s < 0.05:
            e = round(s + 0.05, 3)
        words.append({"word": m.group(), "start": s, "end": e})
    return words


def _build_option_boundaries(options_text: str,
                              duration_sec: float,
                              options: list[dict]) -> list[dict]:
    """
    For each option block ("Option A. ..."), find its char span in
    options_text and convert to time boundaries.
    Returns [{"tag", "text", "start", "end"}, ...]
    """
    from text_cleaner import clean_for_tts
    total = len(options_text)
    boundaries: list[dict] = []
    tag_seq = "ABCDEFGH"

    for i, opt in enumerate(options):
        tag    = opt.get("tag", "").upper()
        prefix = f"Option {tag}."
        idx    = options_text.find(prefix)
        if idx == -1:
            continue

        # End = start of next option, or end of string
        end_idx = len(options_text)
        if i + 1 < len(options):
            next_tag    = options[i+1].get("tag", "").upper()
            next_prefix = f"Option {next_tag}."
            ni          = options_text.find(next_prefix)
            if ni != -1:
                end_idx = ni

        boundaries.append({
            "tag":   opt.get("tag", ""),
            "text":  clean_for_tts(opt.get("text", "") or ""),
            "start": round(idx     / total * duration_sec, 3),
            "end":   round(end_idx / total * duration_sec, 3),
        })
    return boundaries


# ── Fish Audio client ──────────────────────────────────────────────────────────

class FishClient:
    """
    Calls Fish Audio /v1/tts directly with httpx + ormsgpack.
    Uses model s2.1-pro-free (free tier, no hard cap).
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
        text:       str,
        *,
        audio_type:  str = "question",
        options:     Optional[list[dict]] = None,
        clean_text:  Optional[str] = None,
    ) -> tuple[bytes, list[dict], list[dict]]:
        """
        Generate TTS audio and compute word timing data.

        Parameters
        ----------
        text        : text sent to Fish Audio (may include emotion tags)
        audio_type  : "q" | "opts" | "exp"
        options     : raw options list — only needed when audio_type="opts"
        clean_text  : tag-free version used for word-timing alignment.
                      If None, falls back to text.

        Returns
        -------
        (mp3_bytes, words, option_boundaries)
        """
        if not text or not text.strip():
            raise ValueError("Cannot generate audio for empty text.")

        # Use clean_text for timing if provided (tags skew char positions)
        timing_text = clean_text if clean_text else text

        mp3_bytes = self._call_with_retry(text)
        duration  = _parse_mp3_duration(mp3_bytes)
        words     = _build_word_timings(timing_text, duration)

        opt_bounds: list[dict] = []
        if audio_type == "opts" and options:
            opt_bounds = _build_option_boundaries(timing_text, duration, options)

        return mp3_bytes, words, opt_bounds

    # ── Internal ──────────────────────────────────────────────────────────────

    def _call_with_retry(self, text: str) -> bytes:
        last_exc: Exception | None = None

        for attempt, delay in enumerate([0] + RETRY_DELAYS, start=1):
            if delay:
                print(f"    [retry {attempt}/{len(RETRY_DELAYS)+1}] "
                      f"waiting {delay}s...", flush=True)
                time.sleep(delay)

            _bucket.acquire()

            try:
                return self._post(text)
            except Exception as exc:
                msg = str(exc)
                last_exc = exc

                # 429 rate-limited — retry
                if "429" in msg:
                    print(f"    [429] rate limited, will retry", flush=True)
                    continue

                # 5xx server errors — retry
                if any(f"{c}" in msg for c in (500, 502, 503, 504)):
                    print(f"    [5xx] {msg[:80]}, will retry", flush=True)
                    continue

                # 402 / 401 / 400 — no point retrying
                raise

        raise RuntimeError(
            f"Fish Audio failed after {len(RETRY_DELAYS)+1} attempts"
        ) from last_exc

    def _post(self, text: str) -> bytes:
        """
        POST to /v1/tts using msgpack body, collect streaming response.
        Mirrors what fish_audio_sdk does internally.
        """
        body = {
            "text":         text,
            "format":       FORMAT,
            "mp3_bitrate":  MP3_BITRATE,
            "latency":      LATENCY,
            "normalize":    True,
        }
        if self._voice_id:
            body["reference_id"] = self._voice_id

        headers = {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type":  "application/msgpack",
            "model":          self._backend,    # "s2.1-pro-free"
        }

        chunks: list[bytes] = []
        with httpx.Client(timeout=REQUEST_TIMEOUT) as client:
            with client.stream(
                "POST",
                FISH_API_URL,
                headers=headers,
                content=ormsgpack.packb(body),
            ) as resp:
                if not resp.is_success:
                    resp.read()
                    raise RuntimeError(
                        f"{resp.status_code} {resp.reason_phrase}"
                    )
                for chunk in resp.iter_bytes():
                    if chunk:
                        chunks.append(chunk)

        if not chunks:
            raise RuntimeError("Fish Audio returned empty response")

        return b"".join(chunks)
