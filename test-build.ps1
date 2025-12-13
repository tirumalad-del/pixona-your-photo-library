# ===================================================================
# PIXONA Build Test Script
# Complete production build verification for Windows
# ===================================================================

Write-Host "`n" -NoNewline
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "  PIXONA Production Build Test" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "`n"

# Step 1: Download face recognition models (CRITICAL!)
Write-Host "🔍 Step 1/7: Downloading face recognition models..." -ForegroundColor Yellow
Write-Host "This may take a few minutes (~13MB download)" -ForegroundColor Gray

try {
    node download-models.js
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Models downloaded successfully!" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Error downloading models: $_" -ForegroundColor Red
    exit 1
}

# Step 2: Verify models downloaded
Write-Host "`n🔍 Step 2/7: Verifying model files..." -ForegroundColor Yellow

if (Test-Path "public\models\face_recognition_model.bin") {
    Write-Host "✅ Models verified successfully!" -ForegroundColor Green
    Write-Host "`nModel files:" -ForegroundColor Cyan
    Get-ChildItem "public\models" | Select-Object Name, @{Name="Size(MB)";Expression={[math]::Round($_.Length/1MB,2)}} | Format-Table -AutoSize
} else {
    Write-Host "❌ Models missing! Please run: node download-models.js" -ForegroundColor Red
    exit 1
}

# Step 3: Clean install dependencies
Write-Host "🔍 Step 3/7: Installing dependencies with Bun..." -ForegroundColor Yellow
Write-Host "Using frozen lockfile for reproducible builds" -ForegroundColor Gray

try {
    bun install --frozen-lockfile
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Dependencies installed!" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Error installing dependencies: $_" -ForegroundColor Red
    exit 1
}

# Step 4: Build the application
Write-Host "`n🔍 Step 4/7: Building application..." -ForegroundColor Yellow
Write-Host "Compiling TypeScript and bundling with Vite" -ForegroundColor Gray

try {
    bun run build
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Application built successfully!" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Build failed: $_" -ForegroundColor Red
    exit 1
}

# Step 5: Check build output
Write-Host "`n🔍 Step 5/7: Verifying build output..." -ForegroundColor Yellow

if ((Test-Path "dist") -and (Test-Path "dist-electron")) {
    Write-Host "✅ Build output verified!" -ForegroundColor Green
    
    Write-Host "`nBuild statistics:" -ForegroundColor Cyan
    $distSize = (Get-ChildItem dist -Recurse -File | Measure-Object -Property Length -Sum).Sum / 1MB
    $electronSize = (Get-ChildItem dist-electron -Recurse -File | Measure-Object -Property Length -Sum).Sum / 1MB
    
    Write-Host "  dist/ folder: {0:N2} MB" -f $distSize -ForegroundColor White
    Write-Host "  dist-electron/ folder: {0:N2} MB" -f $electronSize -ForegroundColor White
    Write-Host "  Total size: {0:N2} MB" -f ($distSize + $electronSize) -ForegroundColor White
} else {
    Write-Host "❌ Build failed - missing output folders" -ForegroundColor Red
    Write-Host "Expected folders: dist/ and dist-electron/" -ForegroundColor Gray
    exit 1
}

# Step 6: Package for Windows
Write-Host "`n🔍 Step 6/7: Creating Windows installer..." -ForegroundColor Yellow
Write-Host "This may take several minutes" -ForegroundColor Gray

try {
    bun run build:win
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Windows installer created!" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️ Installer creation failed: $_" -ForegroundColor Yellow
    Write-Host "Check electron-builder output above for details" -ForegroundColor Gray
}

# Step 7: Find and display installer info
Write-Host "`n🔍 Step 7/7: Locating installer..." -ForegroundColor Yellow

if (Test-Path "dist\*.exe") {
    Write-Host "✅ Installer found!" -ForegroundColor Green
    Write-Host "`n" -NoNewline
    Write-Host "===============================================" -ForegroundColor Green
    Write-Host "  🎉 BUILD COMPLETE!" -ForegroundColor Green
    Write-Host "===============================================" -ForegroundColor Green
    
    Write-Host "`nInstaller details:" -ForegroundColor Cyan
    Get-ChildItem "dist\*.exe" | ForEach-Object {
        Write-Host "  File: $($_.Name)" -ForegroundColor White
        Write-Host "  Size: {0:N2} MB" -f ($_.Length / 1MB) -ForegroundColor White
        Write-Host "  Location: $($_.FullName)" -ForegroundColor White
    }
    
    Write-Host "`n📦 Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Test the installer on a clean Windows machine" -ForegroundColor Gray
    Write-Host "  2. Verify face recognition works after installation" -ForegroundColor Gray
    Write-Host "  3. Test .pixona file association" -ForegroundColor Gray
    Write-Host "  4. Create GitHub release with installer" -ForegroundColor Gray
    
else {
    Write-Host "⚠️ Installer not found in dist/ folder" -ForegroundColor Yellow
    Write-Host "Check electron-builder output for errors" -ForegroundColor Gray
    
    # Check for other output locations
    if (Test-Path "release\*.exe") {
        Write-Host "`n✅ Found installer in release/ folder:" -ForegroundColor Green
        Get-ChildItem "release\*.exe" | Select-Object Name, @{Name="Size(MB)";Expression={[math]::Round($_.Length/1MB,2)}}
    }
}

Write-Host "`n" -NoNewline
