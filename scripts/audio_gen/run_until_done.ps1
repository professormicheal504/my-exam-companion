# ── Auto-restart loop for generate_audio.py ───────────────────────────────────
# Keeps re-running the script until all pending jobs are finished.
# Safe to Ctrl+C at any time — progress is saved in the SQLite DB.
# Usage:  .\run_until_done.ps1

$python     = "c:\myproject\my_exam_companion\.venv\Scripts\python.exe"
$script     = "c:\myproject\my_exam_companion\scripts\audio_gen\generate_audio.py"
$waitSec    = 10          # seconds to wait before each restart
$maxRetries = 9999        # effectively infinite

$attempt = 0

while ($attempt -lt $maxRetries) {
    $attempt++
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host "  [$timestamp] Starting attempt #$attempt" -ForegroundColor Cyan
    Write-Host "============================================================" -ForegroundColor Cyan

    # Run the script with --run flag
    & $python $script --run

    $exitCode = $LASTEXITCODE
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

    Write-Host ""
    Write-Host "  [$timestamp] Script exited with code $exitCode" -ForegroundColor Yellow

    # Check how many pending jobs remain
    $statsOutput = & $python $script --stats 2>&1
    Write-Host $statsOutput

    # If no pending jobs left -- we're done!
    if ($statsOutput -match "pending\s*\|\s*0" -or $statsOutput -notmatch "pending") {
        Write-Host ""
        Write-Host "============================================================" -ForegroundColor Green
        Write-Host "  ALL JOBS COMPLETE! Nothing left to process." -ForegroundColor Green
        Write-Host "============================================================" -ForegroundColor Green
        break
    }

    Write-Host ""
    Write-Host "  Restarting in $waitSec seconds... (Ctrl+C to stop)" -ForegroundColor Yellow
    Start-Sleep -Seconds $waitSec
}
