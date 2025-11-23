# QR Attendance - Project Repair Script
# Run this in PowerShell to fully repair the project

Write-Host "🔧 QR Attendance Project Repair Script" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

# Get current directory
$projectRoot = Get-Location
Write-Host "📁 Project root: $projectRoot" -ForegroundColor Yellow

# Step 1: Clean
Write-Host "`n📦 Step 1: Cleaning old installations..." -ForegroundColor Green
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .expo -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue
Write-Host "✅ Cleaned successfully" -ForegroundColor Green

# Step 2: Clear npm cache
Write-Host "`n🧹 Step 2: Clearing npm cache..." -ForegroundColor Green
npm cache clean --force
Write-Host "✅ Cache cleared" -ForegroundColor Green

# Step 3: Reinstall dependencies
Write-Host "`n📥 Step 3: Installing dependencies (this may take 2-3 minutes)..." -ForegroundColor Green
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ npm install failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Dependencies installed" -ForegroundColor Green

# Step 4: Verify key files exist
Write-Host "`n✔️  Step 4: Verifying project structure..." -ForegroundColor Green
$requiredFiles = @(
    "metro.config.js",
    "app/_layout.tsx",
    "app/(tabs)/_layout.tsx",
    "components/navigation/TabBarIcon.tsx",
    "constants/Colors.ts",
    "hooks/useColorScheme.ts"
)

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "  ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $file (MISSING)" -ForegroundColor Red
    }
}

Write-Host "`n✨ Project repair complete!" -ForegroundColor Cyan
Write-Host "Run 'npm start' or 'expo start' to begin development" -ForegroundColor Yellow
