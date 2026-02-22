# PowerShell Script: Consolidate Crownshift-main to Root Directory
# Purpose: Move all project files from Crownshift-main/ to parent directory
# Preserves: .vercel folder (not overwritten)
# Includes: Hidden files and folders

param(
    [switch]$Force = $false,
    [switch]$Verbose = $false
)

$ErrorActionPreference = "Continue"

# Color-coded output
function Write-Success { param($msg) Write-Host "✓ $msg" -ForegroundColor Green }
function Write-Error_ { param($msg) Write-Host "✗ $msg" -ForegroundColor Red }
function Write-Warning_ { param($msg) Write-Host "⚠ $msg" -ForegroundColor Yellow }
function Write-Info { param($msg) Write-Host "→ $msg" -ForegroundColor Cyan }

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Crownshift Project Directory Consolidation" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Validate current directory
$currentDir = Get-Location
$sourceDir = Join-Path $currentDir "Crownshift-main"
$destinationDir = "."

Write-Info "Current Directory: $currentDir"
Write-Info "Source: $sourceDir"
Write-Info "Destination: $destinationDir"
Write-Host ""

# Check if source exists
if (-not (Test-Path $sourceDir)) {
    Write-Error_ "Source directory '$sourceDir' does not exist!"
    exit 1
}

# Get all items (files and folders, including hidden)
Write-Host "Scanning Crownshift-main for items..." -ForegroundColor Cyan
$allItems = @(Get-ChildItem -Path $sourceDir -Force)
$itemCount = $allItems.Count

Write-Info "Found $itemCount items (including hidden files/folders)"
Write-Host ""

# Separate items into files and folders
$files = @($allItems | Where-Object { -not $_.PSIsContainer })
$folders = @($allItems | Where-Object { $_.PSIsContainer })

Write-Host "Items breakdown:" -ForegroundColor Yellow
Write-Host "  📄 Files: $($files.Count)"
Write-Host "  📁 Folders: $($folders.Count)"
Write-Host ""

# Track results
$movedFiles = 0
$movedFolders = 0
$skipped = 0
$errors = 0

# Step 1: Move all files first
Write-Host "Step 1: Moving files..." -ForegroundColor Yellow
foreach ($file in $files) {
    $sourcePath = $file.FullName
    $destPath = Join-Path $destinationDir $file.Name
    
    # Check if destination exists
    if (Test-Path $destPath) {
        # Special case: don't overwrite .vercel
        if ($file.Name -eq ".vercel") {
            Write-Warning_ "PRESERVING: .vercel (not overwriting existing)"
            $skipped++
            continue
        }
        
        # Overwrite other files
        Write-Info "REPLACING: $($file.Name)"
        try {
            Remove-Item -Path $destPath -Force -ErrorAction Stop
            Move-Item -Path $sourcePath -Destination $destPath -Force -ErrorAction Stop
            $movedFiles++
        } catch {
            Write-Error_ "Failed to move $($file.Name): $_"
            $errors++
        }
    } else {
        # Move new file
        Write-Info "MOVING: $($file.Name)"
        try {
            Move-Item -Path $sourcePath -Destination $destPath -Force -ErrorAction Stop
            $movedFiles++
        } catch {
            Write-Error_ "Failed to move $($file.Name): $_"
            $errors++
        }
    }
}

Write-Success "Files moved: $movedFiles"
Write-Host ""

# Step 2: Move all folders
Write-Host "Step 2: Moving folders..." -ForegroundColor Yellow
foreach ($folder in $folders) {
    $sourcePath = $folder.FullName
    $destPath = Join-Path $destinationDir $folder.Name
    
    # Skip .vercel folder
    if ($folder.Name -eq ".vercel") {
        Write-Warning_ "PRESERVING: .vercel/ (not overwriting existing)"
        $skipped++
        continue
    }
    
    # Check if destination exists
    if (Test-Path $destPath) {
        Write-Info "REPLACING: $($folder.Name)/"
        try {
            Remove-Item -Path $destPath -Recurse -Force -ErrorAction Stop
            Move-Item -Path $sourcePath -Destination $destPath -Force -ErrorAction Stop
            $movedFolders++
        } catch {
            Write-Error_ "Failed to move $($folder.Name): $_"
            $errors++
        }
    } else {
        # Move new folder
        Write-Info "MOVING: $($folder.Name)/"
        try {
            Move-Item -Path $sourcePath -Destination $destPath -Force -ErrorAction Stop
            $movedFolders++
        } catch {
            Write-Error_ "Failed to move $($folder.Name): $_"
            $errors++
        }
    }
}

Write-Success "Folders moved: $movedFolders"
Write-Host ""

# Step 3: Verify Crownshift-main is empty
Write-Host "Step 3: Verifying Crownshift-main is empty..." -ForegroundColor Yellow
$remaining = @(Get-ChildItem -Path $sourceDir -Force -ErrorAction SilentlyContinue)

if ($remaining.Count -eq 0) {
    Write-Success "Crownshift-main folder is empty"
    
    # Try to delete the folder
    Write-Info "Deleting empty Crownshift-main folder..."
    try {
        Remove-Item -Path $sourceDir -Force -ErrorAction Stop
        Write-Success "Crownshift-main folder deleted"
    } catch {
        Write-Warning_ "Could not delete folder (may be locked): $_"
        Write-Warning_ "The folder is empty but still exists - you can manually delete it"
    }
} else {
    Write-Error_ "Crownshift-main folder still contains items:"
    $remaining | ForEach-Object { Write-Warning_ "  - $($_.Name)" }
}

Write-Host ""

# Step 4: Verify key files exist at root
Write-Host "Step 4: Verifying project files at root..." -ForegroundColor Yellow
$requiredFiles = @(
    "package.json",
    "tsconfig.json", 
    "next.config.ts",
    "middleware.ts"
)

$requiredFolders = @(
    "src",
    "app",
    "public"
)

$allFound = $true

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Success "Found: $file"
    } else {
        Write-Error_ "MISSING: $file"
        $allFound = $false
    }
}

foreach ($folder in $requiredFolders) {
    if (Test-Path $folder) {
        Write-Success "Found: $folder/"
    } else {
        Write-Error_ "MISSING: $folder/"
        $allFound = $false
    }
}

Write-Host ""

# Final Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Migration Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host ""
Write-Host "Results:" -ForegroundColor Yellow
Write-Host "  Files moved:   $movedFiles"
Write-Host "  Folders moved: $movedFolders"
Write-Host "  Skipped:       $skipped"
Write-Host "  Errors:        $errors"

Write-Host ""

if ($allFound -and $errors -eq 0) {
    Write-Success "Migration COMPLETE - All project files are now at root!"
    exit 0
} elseif ($errors -eq 0) {
    Write-Warning_ "Migration complete but some verification warnings exist"
    exit 0
} else {
    Write-Error_ "Migration failed with errors"
    exit 1
}
