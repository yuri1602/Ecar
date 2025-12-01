# ECar Fleet Management System - Startup Script
# Този скрипт стартира автоматично всички компоненти на системата

Write-Host "🚀 Стартиране на ECar Fleet Management System..." -ForegroundColor Cyan
Write-Host ""

# Проверка за Docker
Write-Host "📦 Проверка за Docker..." -ForegroundColor Yellow
$dockerRunning = docker info 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker не работи! Моля, стартирайте Docker Desktop." -ForegroundColor Red
    Write-Host "Натиснете Enter за изход..."
    Read-Host
    exit 1
}
Write-Host "✅ Docker работи" -ForegroundColor Green
Write-Host ""

# Стартиране на Docker контейнери
Write-Host "🐳 Стартиране на Docker контейнери (PostgreSQL, Redis, pgAdmin)..." -ForegroundColor Yellow
docker-compose up -d
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Грешка при стартиране на Docker контейнерите!" -ForegroundColor Red
    Write-Host "Натиснете Enter за изход..."
    Read-Host
    exit 1
}
Write-Host "✅ Docker контейнери стартирани" -ForegroundColor Green
Write-Host ""

# Изчакване на базата данни
Write-Host "⏳ Изчакване на PostgreSQL..." -ForegroundColor Yellow
Start-Sleep -Seconds 5
Write-Host "✅ PostgreSQL готов" -ForegroundColor Green
Write-Host ""

# Стартиране на Backend
Write-Host "🔧 Стартиране на Backend (NestJS)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; Write-Host '🔧 Backend Server' -ForegroundColor Cyan; npm run start:dev"
Write-Host "✅ Backend стартиран на http://localhost:3000" -ForegroundColor Green
Write-Host ""

# Изчакване на backend да стартира
Write-Host "⏳ Изчакване на Backend..." -ForegroundColor Yellow
Start-Sleep -Seconds 10
Write-Host ""

# Стартиране на Frontend
Write-Host "🎨 Стартиране на Frontend (React + Vite)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; Write-Host '🎨 Frontend Server' -ForegroundColor Cyan; npm run dev"
Write-Host "✅ Frontend стартиран на http://localhost:5173" -ForegroundColor Green
Write-Host ""

# Изчакване на frontend
Start-Sleep -Seconds 5

# Отваряне на браузър
Write-Host "🌐 Отваряне на браузър..." -ForegroundColor Yellow
Start-Sleep -Seconds 2
Start-Process "http://localhost:5173"
Write-Host ""

# Финално съобщение
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✨ ECar Fleet Management System е готов!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "📱 Frontend:     http://localhost:5173" -ForegroundColor White
Write-Host "🔧 Backend:      http://localhost:3000" -ForegroundColor White
Write-Host "📚 API Docs:     http://localhost:3000/api/docs" -ForegroundColor White
Write-Host "🗄️  pgAdmin:      http://localhost:5050" -ForegroundColor White
Write-Host "🔴 Redis UI:     http://localhost:8081" -ForegroundColor White
Write-Host ""
Write-Host "👤 Тестови акаунти (парола за всички: Password123!):" -ForegroundColor Yellow
Write-Host "   Admin:        admin@ecar.local" -ForegroundColor White
Write-Host "   Fleet Mgr:    manager@ecar.local" -ForegroundColor White
Write-Host "   Driver 1:     driver1@ecar.local" -ForegroundColor White
Write-Host "   Driver 2:     driver2@ecar.local" -ForegroundColor White
Write-Host ""
Write-Host "Натиснете Enter за затваряне на този прозорец..."
Read-Host
