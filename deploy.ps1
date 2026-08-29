# ============================================================
#  DEPLOY TO CLOUDFLARE PAGES
#  Site: https://my-exam-companion.pages.dev
# ============================================================
#
# HOW TO USE:
#   1. Open PowerShell in this project folder
#   2. Run: .\deploy.ps1
#
# FIRST TIME SETUP:
#   If you don't have your API token saved yet, set it here:
#   $env:CLOUDFLARE_API_TOKEN = "your_token_here"
# ============================================================

Write-Host ""
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "  Deploying to Cloudflare Pages..." -ForegroundColor Cyan
Write-Host "  https://myexamcompanion.pages.dev" -ForegroundColor Cyan  
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# Set your Cloudflare API Token
# This token was created from: Cloudflare Dashboard > Profile > API Tokens
$env:CLOUDFLARE_API_TOKEN = "cfat_9lt9dRahrGpZeZN9DwQLEsPeqLw3RWf09fkg7x98853c9e7a"

# Run the deploy
npx wrangler pages deploy public --project-name=myexamcompanion

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "SUCCESS! Your site is live at:" -ForegroundColor Green
    Write-Host "  https://myexamcompanion.pages.dev" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "DEPLOY FAILED. Common fixes:" -ForegroundColor Red
    Write-Host "  1. Check your internet connection" -ForegroundColor Yellow
    Write-Host "  2. Try a different network or mobile hotspot" -ForegroundColor Yellow
    Write-Host "  3. Run: ipconfig /flushdns" -ForegroundColor Yellow
    Write-Host ""
}
