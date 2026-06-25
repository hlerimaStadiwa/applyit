# Start-all automation script for ApplyIt (Windows PowerShell)
# Usage: Right-click -> Run with PowerShell, or run in an elevated PowerShell session.
# This script will:
# 1. Create and activate a venv under backend/.venv
# 2. Install backend requirements
# 3. Start backend (uvicorn) in a new terminal window
# 4. Install frontend dependencies (if node_modules missing)
# 5. Start frontend dev server (Vite) in a new terminal window
# 6. Open the frontend URL in the default browser

set -e

$root = Split-Path -Parent $MyInvocation.MyCommand.Definition
Write-Host "ApplyIt root: $root"

# Backend venv setup
$backend = Join-Path $root 'backend'
$venv = Join-Path $backend '.venv'
if (!(Test-Path $venv)) {
    Write-Host "Creating virtual environment in $venv"
    python -m venv $venv
} else {
    Write-Host "Virtual environment already exists at $venv"
}

$activate = Join-Path $venv 'Scripts\Activate.ps1'
Write-Host "Activating venv"
& $activate

# Install backend requirements
Write-Host "Installing backend requirements (this may take a while)"
python -m pip install --upgrade pip setuptools wheel
try {
    python -m pip install -r (Join-Path $backend 'requirements.txt')
} catch {
    Write-Warning "Backend pip install failed. See the error above."
    Write-Warning "If cryptography/cffi build fails, install Microsoft C++ Build Tools or use Python 3.11/3.12."
}

# Start backend in new PowerShell window
$uvicornCmd = "cd `"$backend`"; .\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"
Write-Host "Launching backend: $uvicornCmd"
Start-Process powershell -ArgumentList "-NoExit","-Command`, $uvicornCmd

# Frontend install
$frontend = Join-Path $root 'frontend'
Set-Location $frontend
if (!(Test-Path (Join-Path $frontend 'node_modules'))) {
    Write-Host "Installing frontend npm dependencies"
    npm.cmd install
} else {
    Write-Host "Frontend node_modules already present"
}

# Start frontend in new PowerShell window
$viteCmd = "cd `"$frontend`"; npm.cmd run dev"
Write-Host "Launching frontend: $viteCmd"
Start-Process powershell -ArgumentList "-NoExit","-Command`, $viteCmd

# Open browser
Start-Sleep -Seconds 3
$frontendUrl = 'http://localhost:5173'
Write-Host "Opening $frontendUrl in default browser"
Start-Process $frontendUrl

Write-Host "Start-all completed. Backend and frontend should be running in new windows."
