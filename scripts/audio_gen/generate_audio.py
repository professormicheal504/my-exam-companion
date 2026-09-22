"""
generate_audio.py
=================
Local-first batch TTS generator â€” Fish Audio s2.1-pro-free -> disk.

Saves THREE audio files per question INSTANTLY as each one finishes:
  {qid}_q.mp3   + {qid}_q.json      question text       (always)
  {qid}_opts.mp3 + {qid}_opts.json  options A/B/C/D     (objective/practical only)
  {qid}_exp.mp3 + {qid}_exp.json    explanation/answer  (when non-empty)

Theory questions have no options so only q + exp are generated.
All audio uses emotion tags matched to question type and subject
(objective, theory, practical each get distinct voice styles).

Output mirrors new_staging_area/ folder structure under output/:
  output/
    gh/exams/high_school_graduate/waec/agricultural_science/objective/2000/
      46626_q.mp3    46626_q.json
      46626_opts.mp3 46626_opts.json
      46626_exp.mp3  46626_exp.json
    gh/exams/high_school_graduate/waec/agricultural_science/theory/2000/
      63588_q.mp3    63588_q.json
      63588_exp.mp3  63588_exp.json
    ...

Progress is tracked in progress.db (SQLite).
Safe to Ctrl+C at any time -- already-completed jobs are always skipped on resume.
The daily cap (DAILY_CAP_SEC) is set to 999999 by default since s2.1-pro-free
has no hard usage limit. Adjust downward only if you want to throttle runs.

Batch / concurrency model
--------------------------
Jobs are grouped by whole question (q + opts + exp for each).  Up to BATCH_SIZE
(default 20) questions are fetched and their audio items dispatched concurrently
via a ThreadPoolExecutor.  A shared _AdaptiveRateLimiter caps outbound TTS
requests to â‰¤ MAX_RPS (2/s) regardless of concurrency.  On 429 responses the
throttler halves the effective rate and adds jittered back-off; the rate
recovers gradually once 429s stop.

Quick-start commands
--------------------
  # See what would be generated -- no API calls
  python generate_audio.py --folder gh/exams/high_school_graduate/waec/agricultural_science

  # Generate 10 full questions (q + opts + exp each) then stop
  python generate_audio.py --folder gh/exams/high_school_graduate/waec/agricultural_science --run --questions 10

  # Run all Ghana WAEC -- resumes automatically if stopped
  python generate_audio.py --folder gh/exams/high_school_graduate/waec --run

  # Specific question types only
  python generate_audio.py --folder gh/exams/high_school_graduate/waec --types objective,theory --run

  # Single file (legacy)
  python generate_audio.py --file ng/exams/university_entrance/jamb/accounts__principles_of_accounts/objective/1994.json --run

  # Progress stats
  python generate_audio.py --stats

Arguments
---------
  --folder FOLDER     Path relative to new_staging_area/ (subject, exam, or country root)
  --file FILE         Single year JSON relative to new_staging_area/ (legacy mode)
  --types LIST        Comma-separated: objective,theory,practical  (default: all three)
  --run               Actually call Fish Audio (omit for dry run)
  --questions N       Stop after N whole questions this session (default: unlimited)
  --limit N           Stop after N audio items this session (default: unlimited)
  --batch N           Concurrent questions per batch (default: 20, max: 20)
  --scan              Register jobs in DB only, no generation
  --stats             Show progress table and exit
  --preview           Print cleaned text preview for first 3 files, no API calls
"""

from __future__ import annotations

import argparse
import json
import os
import random
import re
import sqlite3
import sys
import threading
import time
from collections import deque
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import date, datetime
from pathlib import Path

# â”€â”€ Paths â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

_HERE         = Path(__file__).parent
_PROJECT_ROOT = _HERE.parent.parent
_STAGING_ROOT = _PROJECT_ROOT / "new_staging_area"
_OUTPUT_ROOT  = _HERE / "output"
_DB_PATH      = _HERE / "progress.db"

# Supported question type folder names
_ALL_TYPES = ("objective", "theory", "practical")

# â”€â”€ Credentials â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

def _load_env() -> None:
    env_file = _PROJECT_ROOT / ".env"
    if env_file.exists():
        for line in env_file.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, _, v = line.partition("=")
                k = k.strip()
                v = v.strip().strip('"').strip("'")
                if k and k not in os.environ:
                    os.environ[k] = v

_load_env()

FISH_API_KEY  = os.environ.get(
    "FISH_API_KEY",
    #"sk-fish-pNp0IRZPUgztIvnerJ1G5QM74WS6os5hFZhRIJXQjbk",
    "sk-fish-X5As4IkKNBCoNtflAf6T59tzbS3F8OdAdw_m31CNHww",
)
DAILY_CAP_SEC = 999999  # s2.1-pro-free has no hard daily limit -- set lower to throttle
WORDS_PER_SEC = 2.5

# â”€â”€ Batch / concurrency config â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

BATCH_SIZE   = 20          # whole questions processed concurrently
MAX_RPS      = 2.0         # Fish Audio free-tier: 2 requests/s recommended
_MIN_RPS     = 0.25        # floor when heavily rate-limited
_RECOVER_SEC = 30.0        # seconds before rate recovers by one step after a 429


# â”€â”€ Database â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

def _init_db() -> sqlite3.Connection:
    conn = sqlite3.connect(_DB_PATH, check_same_thread=False)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS audio_jobs (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            fingerprint     TEXT UNIQUE,
            question_id     TEXT NOT NULL,
            audio_type      TEXT NOT NULL,
            source_file     TEXT NOT NULL,
            status          TEXT NOT NULL DEFAULT 'pending',
            local_mp3       TEXT,
            local_json      TEXT,
            r2_mp3_key      TEXT,
            r2_json_key     TEXT,
            uploaded_at     TEXT,
            error_msg       TEXT,
            created_at      TEXT NOT NULL,
            updated_at      TEXT NOT NULL
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS daily_usage (
            day          TEXT PRIMARY KEY,
            seconds_used REAL NOT NULL DEFAULT 0
        )
    """)
    conn.execute("CREATE INDEX IF NOT EXISTS idx_status ON audio_jobs(status)")
    conn.commit()
    return conn


def _fp(source_file: str, qid: str, atype: str) -> str:
    """Stable fingerprint â€” readable for debugging."""
    return f"{Path(source_file).stem}_{qid}_{atype}"


def _upsert_pending(conn, fp, qid, atype, src, mp3_key, json_key) -> bool:
    now = datetime.now().isoformat(timespec="seconds")
    if conn.execute(
        "SELECT 1 FROM audio_jobs WHERE fingerprint=?", (fp,)
    ).fetchone():
        return False
    conn.execute("""
        INSERT INTO audio_jobs
          (fingerprint, question_id, audio_type, source_file,
           status, r2_mp3_key, r2_json_key, created_at, updated_at)
        VALUES (?,?,?,?,'pending',?,?,?,?)
    """, (fp, qid, atype, src, mp3_key, json_key, now, now))
    # NOTE: commit is intentionally NOT called here.
    # _scan_file commits once per file for a massive speed-up.
    return True


def _mark_done(conn, fp, mp3_path, json_path) -> None:
    now = datetime.now().isoformat(timespec="seconds")
    conn.execute("""
        UPDATE audio_jobs
           SET status='generated', local_mp3=?, local_json=?, updated_at=?
         WHERE fingerprint=?
    """, (mp3_path, json_path, now, fp))
    conn.commit()


def _mark_error(conn, fp, msg) -> None:
    now = datetime.now().isoformat(timespec="seconds")
    conn.execute("""
        UPDATE audio_jobs
           SET status='error', error_msg=?, updated_at=?
         WHERE fingerprint=?
    """, (msg[:400], now, fp))
    conn.commit()


def _get_today_usage(conn) -> float:
    row = conn.execute(
        "SELECT seconds_used FROM daily_usage WHERE day=?",
        (date.today().isoformat(),)
    ).fetchone()
    return row[0] if row else 0.0


def _add_usage(conn, seconds: float) -> None:
    day = date.today().isoformat()
    conn.execute("""
        INSERT INTO daily_usage (day, seconds_used) VALUES (?,?)
        ON CONFLICT(day) DO UPDATE SET seconds_used = seconds_used + ?
    """, (day, seconds, seconds))
    conn.commit()


def _pending_jobs(conn) -> list[tuple]:
    return conn.execute("""
        SELECT fingerprint, question_id, audio_type, source_file,
               r2_mp3_key, r2_json_key
          FROM audio_jobs
         WHERE status IN ('pending','error')
         ORDER BY source_file,
                  CAST(question_id AS INTEGER),
                  CASE audio_type WHEN 'q' THEN 0
                                  WHEN 'opts' THEN 1
                                  ELSE 2 END
    """).fetchall()


def _reconcile_disk(conn) -> int:
    """
    Scan all pending/error jobs and mark any whose MP3 already exists on disk
    as 'generated'.  This fixes the case where the program saved audio to disk
    but crashed before writing to the DB, so restarts correctly skip those files.
    Returns the number of jobs reconciled.
    """
    rows = conn.execute("""
        SELECT fingerprint, question_id, audio_type, source_file, local_mp3
          FROM audio_jobs
         WHERE status IN ('pending', 'error')
    """).fetchall()

    reconciled = 0
    now = datetime.now().isoformat(timespec="seconds")
    for fp, qid, atype, source_file, local_mp3 in rows:
        # Derive expected output path WITHOUT creating any directories.
        # (_local_output_dir calls mkdir, which would create empty folders on dry runs.)
        try:
            rel    = Path(source_file).relative_to(_STAGING_ROOT)
            folder = _OUTPUT_ROOT / rel.parent / rel.stem
        except ValueError:
            folder = _OUTPUT_ROOT / Path(source_file).stem
        expected      = folder / f"{qid}_{atype}.mp3"
        json_expected = folder / f"{qid}_{atype}.json"

        # Also check local_mp3 stored in DB (may differ if output dir changed)
        disk_hit = expected.exists() or (local_mp3 and Path(local_mp3).exists())
        if disk_hit:
            mp3_path  = str(expected) if expected.exists() else local_mp3
            json_path = str(json_expected) if json_expected.exists() else ""
            conn.execute("""
                UPDATE audio_jobs
                   SET status='generated', local_mp3=?, local_json=?, updated_at=?
                 WHERE fingerprint=?
            """, (mp3_path, json_path, now, fp))
            reconciled += 1

    if reconciled:
        conn.commit()
    return reconciled


def _print_stats(conn) -> None:
    rows  = conn.execute(
        "SELECT status, COUNT(*) FROM audio_jobs GROUP BY status"
    ).fetchall()
    total = conn.execute("SELECT COUNT(*) FROM audio_jobs").fetchone()[0]
    today = date.today().isoformat()
    used  = _get_today_usage(conn)
    remaining = max(0.0, DAILY_CAP_SEC - used)

    sep = "-" * 58
    print("\n" + sep)
    print("  Audio Generation Progress")
    print(sep)
    for status, count in sorted(rows):
        bar = "#" * min(40, int(count / max(total, 1) * 40))
        print(f"  {status:12s} {count:>6,}  {bar}")
    print(f"  {'TOTAL':12s} {total:>6,}")
    print(f"\n  Today ({today}): {used:.1f}s used / {DAILY_CAP_SEC}s cap")
    print(f"  Remaining     : ~{remaining:.0f}s "
          f"(~{int(remaining / WORDS_PER_SEC / 10)} avg questions)")
    print(sep + "\n")


# â”€â”€ Path helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

def _r2_key(source_file: str, qid: str, atype: str, ext: str) -> str:
    try:
        rel   = Path(source_file).relative_to(_STAGING_ROOT)
        parts = list(rel.parts[:-1]) + [rel.stem]
        return "/".join(parts) + f"/{qid}_{atype}{ext}"
    except ValueError:
        return f"misc/{Path(source_file).stem}/{qid}_{atype}{ext}"


def _local_output_dir(source_file: str) -> Path:
    try:
        rel    = Path(source_file).relative_to(_STAGING_ROOT)
        folder = _OUTPUT_ROOT / rel.parent / rel.stem
    except ValueError:
        folder = _OUTPUT_ROOT / Path(source_file).stem
    folder.mkdir(parents=True, exist_ok=True)
    return folder


# â”€â”€ File discovery â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

def _collect_files(target: Path, types: tuple[str, ...]) -> list[Path]:
    """
    Collect all year JSON files from the target path for the requested types.

    target can be:
      - A single .json file  (legacy --file mode)
      - A subject folder     (e.g. .../agricultural_science) â€” scans type subfolders
      - A type folder        (e.g. .../agricultural_science/objective)
      - A whole exam folder  (e.g. .../waec) â€” scans every subject + type
    """
    target = target.resolve()

    if target.is_file() and target.suffix == ".json":
        return [target]

    # Collect year files matching NNNN.json pattern
    files: list[Path] = []
    for qtype in types:
        # Try direct child e.g. target/objective/2000.json
        type_dir = target / qtype
        if type_dir.is_dir():
            files.extend(sorted(type_dir.glob("[0-9][0-9][0-9][0-9].json")))
        else:
            # Recurse: target might be an exam root with many subjects
            for f in sorted(target.rglob(f"{qtype}/[0-9][0-9][0-9][0-9].json")):
                files.append(f)

    # Deduplicate while preserving order
    seen  = set()
    dedup = []
    for f in files:
        if f not in seen:
            seen.add(f)
            dedup.append(f)
    return dedup


# â”€â”€ Per-file scan & register â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

def _scan_file(conn, json_path: Path) -> tuple[int, int]:
    """Register jobs for one year JSON file. Returns (new, existing)."""
    from text_cleaner import clean_for_tts, build_options_speech

    try:
        data = json.loads(json_path.read_text(encoding="utf-8"))
    except Exception as e:
        print(f"  [warn] Could not parse {json_path.name}: {e}")
        return 0, 0

    src    = str(json_path)
    new_j  = 0
    exist  = 0

    for qid, q in data.items():
        qt   = q.get("question_text", "") or ""
        exp  = q.get("explanation",   "") or ""
        opts = q.get("options", [])       or []

        items: list[str] = []
        if clean_for_tts(qt):
            items.append("q")
        if opts and build_options_speech(opts).strip():
            items.append("opts")
        if clean_for_tts(exp):
            items.append("exp")

        for atype in items:
            fingerprint = _fp(src, qid, atype)
            added = _upsert_pending(
                conn, fingerprint, qid, atype, src,
                _r2_key(src, qid, atype, ".mp3"),
                _r2_key(src, qid, atype, ".json"),
            )
            if added:
                new_j += 1
            else:
                exist += 1

    # Single commit per file â€” vastly faster than one commit per row
    conn.commit()
    return new_j, exist


# â”€â”€ Per-job processor â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

def _process_one(conn, client,
                 fp, qid, atype, source_file, mp3_key, json_key,
                 data: dict, dry_run: bool,
                 db_lock: threading.Lock | None = None,
                 rate_limiter=None) -> bool:
    """Generate + save one audio item. Returns True on success."""
    from text_cleaner import clean_for_tts, build_options_speech
    from emotion_engine import add_emotion

    q = data.get(qid)
    if q is None:
        _mark_error(conn, fp, "question_id not in data")
        return False

    qt   = q.get("question_text", "") or ""
    exp  = q.get("explanation",   "") or ""
    opts = q.get("options", [])       or []

    if atype == "q":
        clean_text = clean_for_tts(qt)
    elif atype == "opts":
        clean_text = build_options_speech(opts)
    elif atype == "exp":
        clean_text = clean_for_tts(exp)
    else:
        _mark_error(conn, fp, f"unknown audio_type: {atype}")
        return False

    if not clean_text.strip():
        _mark_error(conn, fp, "empty text after cleaning")
        return False

    # Fish receives emotion-tagged text; JSON stores tag-free clean_text
    fish_text = add_emotion(clean_text, atype, q)
    est_sec   = max(0.5, len(clean_text.split()) / WORDS_PER_SEC)
    order     = q.get("order_id", "?")
    qtype     = (q.get("question_type") or "objective").lower()

    if dry_run:
        tag_m = re.search(r"\[([^\]]+)\]", fish_text)
        tag_p = f"[{tag_m.group(1)[:45]}]" if tag_m else ""
        print(f"  [dry] Q{order:>3} id={qid} {atype:4s} "
              f"~{est_sec:.1f}s  {tag_p}")
        return True

    # Real generation
    print(f"  [gen] Q{order:>3} id={qid} {atype:4s} ~{est_sec:.1f}s  ",
          end="", flush=True)
    try:
        mp3_bytes, words, opt_bounds = client.generate(
            fish_text,
            audio_type=atype,
            options=opts if atype == "opts" else None,
            clean_text=clean_text,
        )
    except Exception as exc:
        msg = str(exc)
        print(f"FAILED: {msg}")
        # Notify limiter on 429 so it can throttle future requests
        if rate_limiter and "429" in msg:
            rate_limiter.on_429()
        if db_lock:
            with db_lock:
                _mark_error(conn, fp, msg[:400])
        else:
            _mark_error(conn, fp, msg[:400])
        return False

    # Save MP3 instantly
    out_dir   = _local_output_dir(source_file)
    mp3_path  = out_dir / f"{qid}_{atype}.mp3"
    json_path = out_dir / f"{qid}_{atype}.json"

    mp3_path.write_bytes(mp3_bytes)

    # Build timing JSON
    timing: dict = {
        "question_id":   qid,
        "audio_type":    atype,
        "question_type": qtype,
        "subject":       q.get("subject", ""),
        "exam_year":     q.get("exam_year", ""),
        "order_id":      q.get("order_id"),
        "clean_text":    clean_text,
        "words":         words,
        "duration_sec":  words[-1]["end"] if words else 0,
        "r2_mp3_key":    mp3_key,
        "r2_json_key":   json_key,
        "local_mp3":     str(mp3_path),
        "local_json":    str(json_path),
        "generated_at":  datetime.now().isoformat(timespec="seconds"),
    }
    if atype == "opts" and opt_bounds:
        timing["options"] = opt_bounds
    if atype == "q":
        timing["correct_option"] = next(
            (o.get("tag") for o in opts if o.get("is_correct")), None
        )

    json_path.write_text(
        json.dumps(timing, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )

    if db_lock:
        with db_lock:
            _mark_done(conn, fp, str(mp3_path), str(json_path))
            _add_usage(conn, est_sec)
    else:
        _mark_done(conn, fp, str(mp3_path), str(json_path))
        _add_usage(conn, est_sec)
    print(f"OK  {len(mp3_bytes)//1024}KB -> {mp3_path.name}")
    return True


# â”€â”€ Adaptive sliding-window rate limiter â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class _AdaptiveRateLimiter:
    """
    Sliding-window rate limiter with adaptive throttling.

    * Tracks the timestamps of the last N requests in a deque.
    * acquire() blocks until a slot is available (window-fill wait).
    * on_429()  halves the effective rate (floor: _MIN_RPS) and inserts
      a jittered back-off sleep so the batch pauses naturally.
    * _recover() gradually restores the rate toward MAX_RPS.
    """

    def __init__(self, max_rps: float = MAX_RPS, window_sec: float = 1.0) -> None:
        self._max_rps    = max_rps
        self._cur_rps    = max_rps
        self._window     = window_sec
        self._lock       = threading.Lock()
        self._timestamps: deque[float] = deque()
        self._last_429   = 0.0
        self._backoff    = 2.0   # initial back-off seconds after a 429

    # â”€â”€ public â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    def acquire(self) -> None:
        """Block until the caller is allowed to fire one request."""
        while True:
            with self._lock:
                self._prune()
                # Recover rate gradually after a quiet period
                if (time.monotonic() - self._last_429 > _RECOVER_SEC
                        and self._cur_rps < self._max_rps):
                    self._cur_rps = min(self._max_rps,
                                        self._cur_rps * 1.25)

                cap = max(1, int(self._cur_rps * self._window))
                if len(self._timestamps) < cap:
                    self._timestamps.append(time.monotonic())
                    return

                # How long until the oldest slot expires?
                oldest   = self._timestamps[0]
                wait_sec = self._window - (time.monotonic() - oldest) + 0.005

            if wait_sec > 0:
                time.sleep(wait_sec)

    def on_429(self) -> None:
        """Call when a 429 is received. Halves rate + jittered sleep."""
        with self._lock:
            self._cur_rps  = max(_MIN_RPS, self._cur_rps / 2.0)
            self._last_429 = time.monotonic()
            backoff        = self._backoff * (1 + random.random())   # jitter
            self._backoff  = min(self._backoff * 2, 60.0)            # cap at 60s
        print(f"  [429] Rate limited â€” throttling to "
              f"{self._cur_rps:.2f} rps, sleeping {backoff:.1f}s",
              flush=True)
        time.sleep(backoff)

    def reset_backoff(self) -> None:
        """Reset back-off counter after a successful run of requests."""
        with self._lock:
            self._backoff = 2.0

    # â”€â”€ private â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    def _prune(self) -> None:
        """Remove timestamps older than the current window (caller holds lock)."""
        cutoff = time.monotonic() - self._window
        while self._timestamps and self._timestamps[0] < cutoff:
            self._timestamps.popleft()


# â”€â”€ Main runner â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

def _run(args: argparse.Namespace) -> None:
    conn = _init_db()

    # â”€â”€ Stats only â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if args.stats:
        _print_stats(conn)
        conn.close()
        return

    # â”€â”€ Resolve target â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if args.file:
        raw_target = _STAGING_ROOT / args.file
    elif args.folder:
        raw_target = _STAGING_ROOT / args.folder
    else:
        # Legacy default: the original JAMB 1994 accounts file
        raw_target = (
            _STAGING_ROOT
            / "ng/exams/university_entrance/jamb"
            / "accounts__principles_of_accounts/objective/1994.json"
        )

    types = tuple(t.strip().lower() for t in args.types.split(","))
    files = _collect_files(raw_target, types)

    if not files:
        print(f"[error] No year JSON files found under: {raw_target}")
        print(f"        Types searched: {types}")
        sys.exit(1)

    print(f"\n[target] {raw_target}")
    print(f"[types ] {', '.join(types)}")
    print(f"[files ] {len(files)} year files found")

    # â”€â”€ Preview mode â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if args.preview:
        import text_cleaner as tc
        for f in files[:3]:
            tc._preview(f)
        return

    # â”€â”€ Scan and register â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    total_new = 0
    total_exist = 0
    for json_path in files:
        new_j, exist = _scan_file(conn, json_path)
        total_new  += new_j
        total_exist += exist

    print(f"[scan ] {total_new} new jobs  |  {total_exist} already tracked")
    _print_stats(conn)

    if args.scan:
        conn.close()
        return

    # â”€â”€ Dry-run or real? â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    dry_run = not args.run
    if dry_run:
        print("=" * 60)
        print("DRY RUN -- pass --run to actually call Fish Audio")
        print("=" * 60)

    if not dry_run and not FISH_API_KEY:
        print("[error] FISH_API_KEY not set.")
        sys.exit(1)

    client = None
    if not dry_run:
        from fish_client import FishClient
        client = FishClient(api_key=FISH_API_KEY)
        print(f"[voice] {client._voice_id} / {client._backend}")

    today_used = _get_today_usage(conn)
    print(f"[budget] {today_used:.1f}s used | "
          f"{DAILY_CAP_SEC - today_used:.1f}s remaining\n")

    # â”€â”€ Reconcile disk with DB (resume safety) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    reconciled = _reconcile_disk(conn)
    if reconciled:
        print(f"[resume] {reconciled} job(s) already on disk â€” marked as done, skipping")

    # â”€â”€ Collect pending jobs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    jobs = _pending_jobs(conn)
    print(f"[queue] {len(jobs)} jobs to process")

    batch_size = max(1, min(args.batch, BATCH_SIZE))
    print(f"[batch] {batch_size} concurrent questions per batch")

    # â”€â”€ Group jobs by (source_file, question_id) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    # Each value is a list of audio-item tuples for that question.
    from collections import OrderedDict
    q_map: OrderedDict[str, list] = OrderedDict()
    for job in jobs:
        fp, qid, atype, source_file, mp3_key, json_key = job
        key = f"{source_file}::{qid}"
        q_map.setdefault(key, []).append(job)

    all_qkeys   = list(q_map.keys())
    q_limit     = args.questions
    item_limit  = args.limit

    done_count     = 0
    err_count      = 0
    cap_stopped    = False
    questions_done: set[str] = set()

    # Cache loaded source JSON files to avoid repeated disk reads
    _data_cache: dict[str, dict] = {}
    _cache_lock  = threading.Lock()

    # Shared limiter â€” used by the worker threads
    limiter = _AdaptiveRateLimiter(max_rps=MAX_RPS)

    # Shared SQLite connection is NOT thread-safe; each worker uses the same
    # connection but serialises all writes through a lock.
    _db_lock = threading.Lock()

    def _load_data(source_file: str) -> dict:
        """Thread-safe cached JSON loader."""
        with _cache_lock:
            if source_file not in _data_cache:
                try:
                    _data_cache[source_file] = json.loads(
                        Path(source_file).read_text(encoding="utf-8")
                    )
                except Exception:
                    _data_cache[source_file] = {}
            return _data_cache[source_file]

    def _worker(job: tuple) -> tuple[str, bool]:
        """
        Worker executed in the thread-pool for a single audio item.
        Returns (fingerprint, success).
        """
        fp, qid, atype, source_file, mp3_key, json_key = job
        data = _load_data(source_file)

        # Budget guard (real runs only)
        if not dry_run:
            from text_cleaner import clean_for_tts, build_options_speech
            q_data = data.get(qid, {})
            if atype == "q":
                est_txt = clean_for_tts(q_data.get("question_text") or "")
            elif atype == "opts":
                est_txt = build_options_speech(q_data.get("options") or [])
            else:
                est_txt = clean_for_tts(q_data.get("explanation") or "")
            est_sec = max(0.5, len(est_txt.split()) / WORDS_PER_SEC)

            with _db_lock:
                today_used = _get_today_usage(conn)
            if today_used + est_sec > DAILY_CAP_SEC:
                return (fp, None)   # None signals cap-stop

            # Rate-limit gate (blocks until a slot opens)
            limiter.acquire()

        ok = _process_one(
            conn, client,
            fp, qid, atype, source_file, mp3_key, json_key,
            data, dry_run,
            db_lock=_db_lock,
            rate_limiter=limiter if not dry_run else None,
        )
        return (fp, ok)

    # â”€â”€ Batch loop â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    for batch_start in range(0, len(all_qkeys), batch_size):

        if len(questions_done) >= q_limit:
            print(f"\n[questions] Reached --questions {q_limit} "
                  f"({len(questions_done)} question(s) done)")
            break

        if done_count >= item_limit:
            print(f"\n[limit] Reached --limit {item_limit}")
            break

        if cap_stopped:
            break

        batch_qkeys = all_qkeys[batch_start : batch_start + batch_size]

        # Gather all audio items for this batch
        batch_jobs: list[tuple] = []
        for qkey in batch_qkeys:
            if len(questions_done) >= q_limit:
                break
            questions_done.add(qkey)
            batch_jobs.extend(q_map[qkey])

        if not batch_jobs:
            continue

        batch_num    = batch_start // batch_size + 1
        total_batches = (len(all_qkeys) + batch_size - 1) // batch_size
        print(f"\n[batch {batch_num}/{total_batches}] "
              f"{len(batch_qkeys)} question(s), "
              f"{len(batch_jobs)} audio item(s)")

        # Run batch concurrently
        with ThreadPoolExecutor(
            max_workers=len(batch_jobs), thread_name_prefix="tts"
        ) as executor:
            future_map = {
                executor.submit(_worker, job): job
                for job in batch_jobs
            }

            for future in as_completed(future_map):
                try:
                    fp_result, success = future.result()
                except Exception as exc:
                    # Unexpected exception from the worker itself
                    job = future_map[future]
                    print(f"  [err] {job[0]}: {exc}")
                    with _db_lock:
                        _mark_error(conn, job[0], str(exc)[:400])
                    err_count += 1
                    continue

                if success is None:
                    # Budget cap signalled
                    cap_stopped = True
                    print(f"\n[cap] Daily budget reached "
                          f"({DAILY_CAP_SEC}s). Run again tomorrow.")
                elif success:
                    done_count += 1
                    limiter.reset_backoff()
                else:
                    err_count += 1

        if cap_stopped:
            break

    # â”€â”€ Summary â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    print(f"\n{'-'*58}")
    print(f"  Generated : {done_count}")
    print(f"  Errors    : {err_count}")
    if cap_stopped:
        print("  Stopped   : daily cap reached")
    _print_stats(conn)
    conn.close()


# â”€â”€ Entry point â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Local TTS audio generator -- Fish Audio -> disk",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Dry run on whole Ghana WAEC agricultural_science (obj+theory+practical)
  python generate_audio.py --folder gh/exams/high_school_graduate/waec/agricultural_science

  # Only objective and theory
  python generate_audio.py --folder gh/exams/high_school_graduate/waec/agricultural_science --types objective,theory

  # Generate one full question (q + opts + exp) and listen before continuing
  python generate_audio.py --folder gh/exams/high_school_graduate/waec/agricultural_science --run --questions 1

  # Generate everything in the folder
  python generate_audio.py --folder gh/exams/high_school_graduate/waec/agricultural_science --run

  # Generate ALL WAEC subjects at once
  python generate_audio.py --folder gh/exams/high_school_graduate/waec --run

  # Legacy: single file
  python generate_audio.py --file ng/exams/university_entrance/jamb/accounts__principles_of_accounts/objective/1994.json --run --questions 1

  # Stats
  python generate_audio.py --stats
        """,
    )
    parser.add_argument(
        "--folder",
        default="",
        help="Path relative to new_staging_area/ (subject or exam folder)",
    )
    parser.add_argument(
        "--file",
        default="",
        help="Single year JSON file relative to new_staging_area/ (legacy)",
    )
    parser.add_argument(
        "--types",
        default="objective,theory,practical",
        help="Comma-separated question types to include. Default: objective,theory,practical",
    )
    parser.add_argument("--run",      action="store_true",
                        help="Actually call Fish Audio (default: dry run)")
    parser.add_argument("--scan",     action="store_true",
                        help="Register jobs in DB only, no generation")
    parser.add_argument("--stats",    action="store_true",
                        help="Show progress stats and exit")
    parser.add_argument("--preview",  action="store_true",
                        help="Print cleaned text preview, no API calls")
    parser.add_argument("--limit",    type=int, default=9999,
                        help="Max audio items this session (default: unlimited)")
    parser.add_argument("--questions", type=int, default=9999,
                        help="Max whole questions this session (default: unlimited)")
    parser.add_argument("--batch",    type=int, default=20,
                        help="Concurrent questions per batch (default: 20, max: 20)")
    args = parser.parse_args()
    _run(args)


if __name__ == "__main__":
    main()
