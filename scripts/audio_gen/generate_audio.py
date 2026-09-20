"""
generate_audio.py
=================
Local-first batch TTS generator for exam question JSON files.

Generates THREE audio items per question, saved INSTANTLY to disk:
  1. {qid}_q.mp3   + {qid}_q.json    ← question text
  2. {qid}_opts.mp3 + {qid}_opts.json ← all options read aloud
  3. {qid}_exp.mp3 + {qid}_exp.json  ← explanation (skipped if empty)

Output folder mirrors the source path:
  scripts/audio_gen/output/
    ng/university_entrance/jamb/accounts__principles_of_accounts/objective/1994/
      216_q.mp3
      216_q.json
      216_opts.mp3
      216_opts.json
      216_exp.mp3     (only if explanation exists)
      216_exp.json
      ...

Progress is tracked in progress.db (SQLite) — safe to Ctrl+C and resume.
Already-completed jobs are always skipped.

Usage
-----
  # Dry run — show what will be generated, no API calls
  python generate_audio.py

  # Run on the accounts 1994 file
  python generate_audio.py --run

  # Run with a per-session limit (useful on free tier)
  python generate_audio.py --run --limit 30

  # Show DB stats only
  python generate_audio.py --stats

  # Preview cleaned text for every question (no API calls)
  python generate_audio.py --preview

Environment
-----------
  FISH_API_KEY   — Fish Audio API key  (required for --run)
                   Set in .env or as environment variable.
                   Default: the key supplied during setup.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sqlite3
import sys
import time
from datetime import date, datetime
from pathlib import Path

# ── Paths ──────────────────────────────────────────────────────────────────────

_HERE         = Path(__file__).parent
_PROJECT_ROOT = _HERE.parent.parent
_STAGING_ROOT = _PROJECT_ROOT / "new_staging_area"

# Target file for this run
_TARGET_FILE  = (
    _STAGING_ROOT
    / "ng/exams/university_entrance/jamb"
    / "accounts__principles_of_accounts/objective/1994.json"
)

_OUTPUT_ROOT  = _HERE / "output"
_DB_PATH      = _HERE / "progress.db"

# ── Fish Audio credentials ─────────────────────────────────────────────────────

# Load .env from project root if present
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

FISH_API_KEY = os.environ.get(
    "FISH_API_KEY",
    "sk-fish-pNp0IRZPUgztIvnerJ1G5QM74WS6os5hFZhRIJXQjbk",   # supplied key
)

# Free-tier daily cap (seconds of audio, approximate)
DAILY_CAP_SEC   = 285
# Estimate: avg words per second of speech at 150 wpm
WORDS_PER_SEC   = 2.5


# ── Database ───────────────────────────────────────────────────────────────────

def _init_db() -> sqlite3.Connection:
    conn = sqlite3.connect(_DB_PATH)
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
    conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_status ON audio_jobs(status)
    """)
    conn.commit()
    return conn


def _fingerprint(source_file: str, question_id: str, audio_type: str) -> str:
    """Stable unique key: no crypto needed, just a readable composite."""
    # Keep it readable for debugging
    stem = Path(source_file).stem          # "1994"
    return f"{stem}_{question_id}_{audio_type}"


def _upsert_pending(conn: sqlite3.Connection,
                    fp: str, qid: str, atype: str,
                    src: str, mp3_key: str, json_key: str) -> bool:
    """Insert job if not already tracked. Returns True if newly inserted."""
    now = datetime.now().isoformat(timespec="seconds")
    cur = conn.execute(
        "SELECT status FROM audio_jobs WHERE fingerprint=?", (fp,)
    )
    row = cur.fetchone()
    if row is not None:
        return False   # already tracked
    conn.execute("""
        INSERT INTO audio_jobs
          (fingerprint, question_id, audio_type, source_file,
           status, r2_mp3_key, r2_json_key, created_at, updated_at)
        VALUES (?,?,?,?, 'pending', ?,?, ?,?)
    """, (fp, qid, atype, src, mp3_key, json_key, now, now))
    conn.commit()
    return True


def _mark_done(conn: sqlite3.Connection,
               fp: str, mp3_path: str, json_path: str) -> None:
    now = datetime.now().isoformat(timespec="seconds")
    conn.execute("""
        UPDATE audio_jobs
           SET status='generated', local_mp3=?, local_json=?, updated_at=?
         WHERE fingerprint=?
    """, (mp3_path, json_path, now, fp))
    conn.commit()


def _mark_error(conn: sqlite3.Connection, fp: str, msg: str) -> None:
    now = datetime.now().isoformat(timespec="seconds")
    conn.execute("""
        UPDATE audio_jobs
           SET status='error', error_msg=?, updated_at=?
         WHERE fingerprint=?
    """, (msg[:400], now, fp))
    conn.commit()


def _get_today_usage(conn: sqlite3.Connection) -> float:
    row = conn.execute(
        "SELECT seconds_used FROM daily_usage WHERE day=?",
        (date.today().isoformat(),)
    ).fetchone()
    return row[0] if row else 0.0


def _add_usage(conn: sqlite3.Connection, seconds: float) -> None:
    day = date.today().isoformat()
    conn.execute("""
        INSERT INTO daily_usage (day, seconds_used) VALUES (?,?)
        ON CONFLICT(day) DO UPDATE SET seconds_used = seconds_used + ?
    """, (day, seconds, seconds))
    conn.commit()


def _pending_jobs(conn: sqlite3.Connection) -> list[tuple]:
    return conn.execute("""
        SELECT fingerprint, question_id, audio_type, source_file,
               r2_mp3_key, r2_json_key
          FROM audio_jobs
         WHERE status IN ('pending', 'error')
         ORDER BY source_file, CAST(question_id AS INTEGER), audio_type
    """).fetchall()


def _print_stats(conn: sqlite3.Connection) -> None:
    rows = conn.execute("""
        SELECT status, COUNT(*) FROM audio_jobs GROUP BY status
    """).fetchall()
    total = conn.execute("SELECT COUNT(*) FROM audio_jobs").fetchone()[0]
    today = date.today().isoformat()
    used  = _get_today_usage(conn)

    print("\n─── Audio Generation Progress ───────────────────────────")
    for status, count in sorted(rows):
        bar = "█" * min(40, int(count / max(total, 1) * 40))
        print(f"  {status:12s} {count:>5,}  {bar}")
    print(f"  {'TOTAL':12s} {total:>5,}")
    print(f"\n  Today ({today}): {used:.1f}s used / {DAILY_CAP_SEC}s cap")
    remaining = max(0.0, DAILY_CAP_SEC - used)
    print(f"  Remaining today: ~{remaining:.0f}s "
          f"(≈ {int(remaining / WORDS_PER_SEC / 10)} avg questions)")
    print("──────────────────────────────────────────────────────────\n")


# ── Output path helpers ────────────────────────────────────────────────────────

def _r2_key(source_file: str, qid: str, atype: str, ext: str) -> str:
    """
    Pre-compute the R2 bucket key (path inside bucket).
    Mirrors the source file's path relative to new_staging_area.
      e.g. ng/university_entrance/jamb/accounts.../objective/1994/216_q.mp3
    """
    try:
        rel = Path(source_file).relative_to(_STAGING_ROOT)
        # Drop the .json filename, use year as folder
        parts = list(rel.parts[:-1]) + [rel.stem]
        return "/".join(parts) + f"/{qid}_{atype}{ext}"
    except ValueError:
        return f"misc/{Path(source_file).stem}/{qid}_{atype}{ext}"


def _local_output_dir(source_file: str) -> Path:
    """Mirror the staging path under output/."""
    try:
        rel = Path(source_file).relative_to(_STAGING_ROOT)
        folder = _OUTPUT_ROOT / rel.parent / rel.stem
    except ValueError:
        folder = _OUTPUT_ROOT / Path(source_file).parent.name / Path(source_file).stem
    folder.mkdir(parents=True, exist_ok=True)
    return folder


# ── Question loader ────────────────────────────────────────────────────────────

def _load_questions(json_path: Path) -> dict:
    return json.loads(json_path.read_text(encoding="utf-8"))


def _estimate_seconds(text: str) -> float:
    return max(0.5, len(text.split()) / WORDS_PER_SEC)


# ── Core processing ────────────────────────────────────────────────────────────

def _scan_and_register(conn: sqlite3.Connection,
                       json_path: Path) -> tuple[int, int]:
    """
    Walk the JSON, register every pending job in the DB.
    Returns (new_jobs, already_tracked).
    """
    from text_cleaner import clean_for_tts, build_options_speech

    data      = _load_questions(json_path)
    src       = str(json_path)
    new_jobs  = 0
    existing  = 0

    for qid, q in data.items():
        qt   = q.get("question_text", "")   or ""
        exp  = q.get("explanation", "")     or ""
        opts = q.get("options", [])         or []

        # Determine which audio items this question needs
        items: list[tuple[str, str]] = []   # (audio_type, clean_text)

        if clean_for_tts(qt):
            items.append(("q",   clean_for_tts(qt)))
        if opts:
            speech = build_options_speech(opts)
            if speech.strip():
                items.append(("opts", speech))
        if clean_for_tts(exp):
            items.append(("exp", clean_for_tts(exp)))

        for atype, _ in items:
            fp        = _fingerprint(src, qid, atype)
            mp3_key   = _r2_key(src, qid, atype, ".mp3")
            json_key  = _r2_key(src, qid, atype, ".json")
            added = _upsert_pending(conn, fp, qid, atype, src, mp3_key, json_key)
            if added:
                new_jobs += 1
            else:
                existing += 1

    return new_jobs, existing


def _process_one(conn: sqlite3.Connection,
                 client,
                 fp: str, qid: str, atype: str,
                 source_file: str, mp3_key: str, json_key: str,
                 data: dict,
                 dry_run: bool) -> bool:
    """
    Generate and save audio for one job.
    Returns True on success, False on error.
    """
    from text_cleaner import clean_for_tts, build_options_speech

    q    = data.get(qid)
    if q is None:
        _mark_error(conn, fp, "question_id not found in cached data")
        return False

    qt   = q.get("question_text", "") or ""
    exp  = q.get("explanation",   "") or ""
    opts = q.get("options", [])       or []

    # Build the clean text for this audio_type
    if atype == "q":
        text = clean_for_tts(qt)
    elif atype == "opts":
        text = build_options_speech(opts)
    elif atype == "exp":
        text = clean_for_tts(exp)
    else:
        _mark_error(conn, fp, f"unknown audio_type: {atype}")
        return False

    if not text or not text.strip():
        _mark_error(conn, fp, "empty text after cleaning")
        return False

    est_sec = _estimate_seconds(text)
    subject = q.get("subject", "")
    order   = q.get("order_id", "?")

    if dry_run:
        out_dir  = _local_output_dir(source_file)
        mp3_path = out_dir / f"{qid}_{atype}.mp3"
        print(f"  [dry] Q{order:>2} id={qid} {atype:4s} ~{est_sec:.1f}s → {mp3_path.name}")
        return True

    # ── Generate audio ──────────────────────────────────────────────────────
    print(f"  [gen] Q{order:>2} id={qid} {atype:4s} ~{est_sec:.1f}s  ", end="", flush=True)

    try:
        mp3_bytes, words, opt_bounds = client.generate(
            text,
            audio_type=atype,
            options=opts if atype == "opts" else None,
        )
    except Exception as exc:
        print(f"FAILED: {exc}")
        _mark_error(conn, fp, str(exc)[:400])
        return False

    # ── Save instantly to disk ──────────────────────────────────────────────
    out_dir   = _local_output_dir(source_file)
    mp3_path  = out_dir / f"{qid}_{atype}.mp3"
    json_path = out_dir / f"{qid}_{atype}.json"

    mp3_path.write_bytes(mp3_bytes)

    # Build timing JSON — different shape for options vs question/explanation
    actual_dur = len(mp3_bytes) * 8 / (128 * 1000)   # rough check
    timing: dict = {
        "question_id":  qid,
        "audio_type":   atype,
        "subject":      subject,
        "exam_year":    q.get("exam_year", ""),
        "order_id":     q.get("order_id"),
        "clean_text":   text,
        "words":        words,
        "duration_sec": words[-1]["end"] if words else 0,
        "r2_mp3_key":   mp3_key,
        "r2_json_key":  json_key,
        "local_mp3":    str(mp3_path),
        "local_json":   str(json_path),
        "generated_at": datetime.now().isoformat(timespec="seconds"),
    }

    if atype == "opts" and opt_bounds:
        timing["options"] = opt_bounds

    if atype == "q":
        # Embed correct answer tag for player reference
        correct = next(
            (o.get("tag") for o in opts if o.get("is_correct")), None
        )
        timing["correct_option"] = correct

    json_path.write_text(
        json.dumps(timing, indent=2, ensure_ascii=False),
        encoding="utf-8"
    )

    _mark_done(conn, fp, str(mp3_path), str(json_path))
    _add_usage(conn, est_sec)

    mp3_kb = len(mp3_bytes) / 1024
    print(f"OK  {mp3_kb:.0f}KB → {mp3_path.name}")
    return True


def _run(args: argparse.Namespace) -> None:
    from text_cleaner import clean_for_tts  # validate import

    conn = _init_db()
    json_path = _TARGET_FILE

    if not json_path.exists():
        print(f"[error] File not found: {json_path}")
        sys.exit(1)

    # ── Preview mode ────────────────────────────────────────────────────────
    if args.preview:
        print(f"\nCleaned text preview for: {json_path.name}\n")
        import text_cleaner as tc
        tc._preview(json_path)
        return

    # ── Stats only ──────────────────────────────────────────────────────────
    if args.stats:
        _print_stats(conn)
        return

    # ── Scan and register jobs ───────────────────────────────────────────────
    print(f"\n[scan] {json_path}")
    new_j, existing = _scan_and_register(conn, json_path)
    print(f"       {new_j} new jobs  |  {existing} already tracked")
    _print_stats(conn)

    if args.scan:
        return

    # ── Dry run header ───────────────────────────────────────────────────────
    dry_run = not args.run
    if dry_run:
        print("=" * 60)
        print("DRY RUN — pass --run to actually call Fish Audio")
        print("=" * 60)

    # ── Validate API key for real runs ───────────────────────────────────────
    if not dry_run and not FISH_API_KEY:
        print("[error] FISH_API_KEY not set. Add it to .env or set the env var.")
        sys.exit(1)

    # ── Load client ──────────────────────────────────────────────────────────
    client = None
    if not dry_run:
        from fish_client import FishClient
        client = FishClient(api_key=FISH_API_KEY)
        print(f"[voice] Using voice: {client._voice_id} / backend: {client._backend}")

    # ── Daily budget ─────────────────────────────────────────────────────────
    today_used = _get_today_usage(conn)
    remaining  = DAILY_CAP_SEC - today_used
    print(f"[budget] {today_used:.1f}s used today | {remaining:.1f}s remaining\n")

    # ── Load question data once ───────────────────────────────────────────────
    data = _load_questions(json_path)

    # ── Process jobs ─────────────────────────────────────────────────────────
    jobs = _pending_jobs(conn)
    print(f"[queue] {len(jobs)} jobs to process")

    done_count  = 0
    err_count   = 0
    cap_stopped = False

    for fp, qid, atype, source_file, mp3_key, json_key in jobs:
        if done_count >= args.limit:
            print(f"\n[limit] Reached --limit {args.limit}")
            break

        # Budget check (skip for dry run)
        if not dry_run:
            q     = data.get(qid, {})
            qt    = (q.get("question_text") or "") if atype == "q" else ""
            exp   = (q.get("explanation")   or "") if atype == "exp" else ""
            opts  = q.get("options", [])           if atype == "opts" else []
            from text_cleaner import clean_for_tts, build_options_speech
            if atype == "q":
                est_txt = clean_for_tts(qt)
            elif atype == "opts":
                est_txt = build_options_speech(opts)
            else:
                est_txt = clean_for_tts(exp)

            est_sec = _estimate_seconds(est_txt)
            today_used = _get_today_usage(conn)
            if today_used + est_sec > DAILY_CAP_SEC:
                print(
                    f"\n[cap] Daily budget ~{DAILY_CAP_SEC}s reached "
                    f"({today_used:.1f}s used). Run again tomorrow."
                )
                cap_stopped = True
                break

        ok = _process_one(
            conn, client,
            fp, qid, atype, source_file, mp3_key, json_key,
            data, dry_run
        )
        if ok:
            done_count += 1
        else:
            err_count  += 1

    # ── Summary ──────────────────────────────────────────────────────────────
    print(f"\n{'─'*58}")
    print(f"  Generated : {done_count}")
    print(f"  Errors    : {err_count}")
    if cap_stopped:
        print(f"  Stopped   : daily cap reached")
    _print_stats(conn)

    if done_count > 0 and not dry_run:
        out_dir = _local_output_dir(str(json_path))
        print(f"  Output    : {out_dir}")

    conn.close()


# ── Entry point ────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Local TTS audio generator — Fish Audio → disk",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python generate_audio.py               # dry run (no API calls)
  python generate_audio.py --run         # generate all
  python generate_audio.py --run --limit 20
  python generate_audio.py --stats
  python generate_audio.py --preview
        """
    )
    parser.add_argument("--run",     action="store_true",
                        help="Actually call Fish Audio and save files")
    parser.add_argument("--scan",    action="store_true",
                        help="Register jobs in DB only, no generation")
    parser.add_argument("--stats",   action="store_true",
                        help="Show progress stats and exit")
    parser.add_argument("--preview", action="store_true",
                        help="Print cleaned text for all questions, no API calls")
    parser.add_argument("--limit",   type=int, default=9999,
                        help="Max jobs to process this session (default: unlimited)")
    args = parser.parse_args()
    _run(args)


if __name__ == "__main__":
    main()
