# ECar Fleet Management System - Restart Script
# Този скрипт рестартира всички компоненти

Write-Host "🔄 Рестартиране на ECar Fleet Management System..." -ForegroundColor Cyan
Write-Host ""

# Спиране
Write-Host "🛑 Спиране на текущи процеси..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
docker-compose down
Write-Host "✅ Спряно" -ForegroundColor Green
Write-Host ""

# Изчакване
Write-Host "⏳ Изчакване 3 секунди..." -ForegroundColor Yellow
Start-Sleep -Seconds 3
Write-Host ""

# Стартиране
& "$PSScriptRoot\start.ps1"
