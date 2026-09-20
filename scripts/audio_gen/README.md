# Audio Generation Script

Batch-generates MP3 audio for every exam question and explanation in
`new_staging_area` using Fish Audio TTS, then stores the files in
Cloudflare R2.

---

## Setup

### 1. Set environment variables
Copy `.env.example` to `.env.audio` and fill in each value, **or** export
them in your shell before running.

```
FISH_API_KEY      = your Fish Audio API key
FISH_VOICE_ID     = reference_id of the voice you picked
R2_ACCOUNT_ID     = Cloudflare account ID
R2_ACCESS_KEY     = R2 Access Key ID
R2_SECRET_KEY     = R2 Secret Access Key
R2_BUCKET         = audio              (or whatever you named the bucket)
R2_PUBLIC_DOMAIN  = audio.yourdomain.com
```

Load them in PowerShell:
```powershell
Get-Content .env.audio | ForEach-Object {
    if ($_ -match "^\s*([^#][^=]+)=(.+)$") {
        [System.Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim())
    }
}
```

### 2. Install dependencies
```
pip install httpx boto3
```

---

## Commands

### Dry run (safe — no API calls, no uploads)
```
python generate_audio.py
```
Shows every job it *would* process without touching anything.

### Scan only — register all jobs into the DB
```
python generate_audio.py --scan
```
Use this first to see how many total jobs you have.

### Show progress statistics
```
python generate_audio.py --stats
```

### Real run — generate and upload
```
python generate_audio.py --run
```

### Real run with a daily limit (recommended for free tier)
```
python generate_audio.py --run --limit 50
```
Processes 50 items, then stops. Run again tomorrow for the next batch.

---

## Free-tier strategy

The Fish Audio free plan gives roughly **300 seconds of audio per day**.
An average exam question reads in ~5 s, an explanation in ~15–25 s.

| Content type | ~seconds each | Items per day |
|---|---|---|
| Questions only | ~5 s | ~55/day |
| Explanations only | ~20 s | ~14/day |
| Mixed | ~12 s avg | ~25/day |

At that rate, **a full pass over all ~290,000 items would take years on
the free tier.** Options:

1. **Upgrade Fish Audio** — the paid plan removes the daily cap.
2. **Prioritise popular questions first** — add an `ORDER BY` on
   question popularity or exam year in `pending_jobs()`.
3. **Generate on-demand** — only call Fish when a user first opens a
   question, cache the result in R2, serve from cache on subsequent views.
   This is the most cost-efficient approach on free tier.

---

## File naming

Each audio file is named with a 12-character SHA-256 fingerprint of
`{voice_id}||{cleaned_text}`, e.g. `a3f9c1d8b2e4.mp3`.

This means:
- If the text changes, a new fingerprint is generated → new recording.
- The old file stays in R2 (no wrong cache reuse).
- Re-running the script skips already-done files (idempotent).

---

## R2 folder layout

```
audio/
  a3f9c1d8b2e4.mp3    ← question audio
  b7e2f49a1c3d.mp3    ← explanation audio
  ...
```

All files are uploaded with `Cache-Control: public, max-age=31536000, immutable`.

---

## Resuming after interruption

Progress is tracked in `progress.db` (SQLite). If the script crashes or
you stop it, just run it again — already-done jobs are skipped.

To retry failed jobs:
```python
# In progress.db:
UPDATE audio_jobs SET status='pending', error_msg=NULL WHERE status='error';
```
