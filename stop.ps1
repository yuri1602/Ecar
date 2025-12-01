# ECar Fleet Management System - Stop Script
# Този скрипт спира всички компоненти на системата

Write-Host "🛑 Спиране на ECar Fleet Management System..." -ForegroundColor Cyan
Write-Host ""

# Спиране на Node процеси
Write-Host "🔴 Спиране на Backend и Frontend..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Write-Host "✅ Node процеси спрени" -ForegroundColor Green
Write-Host ""

# Спиране на Docker контейнери
Write-Host "🐳 Спиране на Docker контейнери..." -ForegroundColor Yellow
docker-compose down
Write-Host "✅ Docker контейнери спрени" -ForegroundColor Green
Write-Host ""

Write-Host "✨ Системата е спряна успешно!" -ForegroundColor Green
Write-Host ""
Write-Host "Натиснете Enter за изход..."
Read-Host
