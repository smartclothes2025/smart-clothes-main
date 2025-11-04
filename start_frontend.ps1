# Smart Clothes 前端啟動腳本

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Smart Clothes 前端啟動腳本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 設定工作目錄
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

# 檢查 Node.js
Write-Host "[檢查] Node.js 環境..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version 2>&1
    Write-Host "  ✓ Node.js $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Node.js 未安裝" -ForegroundColor Red
    Write-Host "  請先安裝 Node.js" -ForegroundColor Yellow
    pause
    exit
}

# 檢查 package.json
if (-not (Test-Path "package.json")) {
    Write-Host "  ✗ 找不到 package.json" -ForegroundColor Red
    Write-Host "  請確認在正確的目錄" -ForegroundColor Yellow
    pause
    exit
}

# 檢查 node_modules
Write-Host "[檢查] 依賴套件..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules")) {
    Write-Host "  ! 正在安裝依賴套件..." -ForegroundColor Yellow
    npm install
    Write-Host "  ✓ 依賴套件已安裝" -ForegroundColor Green
} else {
    Write-Host "  ✓ 依賴套件已安裝" -ForegroundColor Green
}
Write-Host ""

# 顯示資訊
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   前端資訊" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "前端地址: http://localhost:5173" -ForegroundColor White
Write-Host "修復工具: http://localhost:5173/fix.html" -ForegroundColor Yellow
Write-Host ""
Write-Host "⚠️  如果無法登入，請先開啟修復工具：" -ForegroundColor Yellow
Write-Host "   http://localhost:5173/fix.html" -ForegroundColor Cyan
Write-Host ""
Write-Host "按 Ctrl+C 停止服務" -ForegroundColor Gray
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 啟動前端
Write-Host "[啟動] 前端服務..." -ForegroundColor Green
Write-Host ""
npm run dev
