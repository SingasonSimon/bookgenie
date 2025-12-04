Write-Host "Launching BookGenie..." -ForegroundColor Cyan

# Configuration
$venvPython = "$PSScriptRoot\Backend\venv\Scripts\python.exe"
$backendScript = "$PSScriptRoot\Backend\app.py"
$frontendDir = "$PSScriptRoot\Frontend"
$frontendPort = 8000
$backendPort = 5000

# 1. Check Environment
if (-not (Test-Path $venvPython)) {
    Write-Error "Virtual environment not found at $venvPython"
    Write-Host "Please ensure you have set up the backend environment correctly." -ForegroundColor Yellow
    exit 1
}

# 2. Start Backend (Flask)
Write-Host "Starting Backend Server..." -ForegroundColor Yellow
$backendProcess = Start-Process -FilePath $venvPython -ArgumentList $backendScript -WorkingDirectory "$PSScriptRoot\Backend" -PassThru -WindowStyle Minimized

if ($backendProcess.Id) {
    Write-Host "   Backend running (PID: $($backendProcess.Id))" -ForegroundColor Green
} else {
    Write-Error "   Failed to start Backend."
    exit 1
}

# 3. Start Frontend (HTTP Server)
Write-Host "Starting Frontend Server..." -ForegroundColor Yellow
$frontendProcess = Start-Process -FilePath $venvPython -ArgumentList "-m http.server --directory `"$frontendDir`" $frontendPort" -WorkingDirectory $PSScriptRoot -PassThru -WindowStyle Minimized

if ($frontendProcess.Id) {
    Write-Host "   Frontend running (PID: $($frontendProcess.Id))" -ForegroundColor Green
} else {
    Write-Error "   Failed to start Frontend."
    Stop-Process -Id $backendProcess.Id -ErrorAction SilentlyContinue
    exit 1
}

# 4. Launch Browser
$url = "http://localhost:$frontendPort"
Write-Host "Opening $url ..." -ForegroundColor Cyan
Start-Process $url

Write-Host "`nBookGenie is running!" -ForegroundColor Green
Write-Host "   - Backend API: http://localhost:$backendPort"
Write-Host "   - Frontend UI: http://localhost:$frontendPort"
Write-Host "`nTo stop the app, close the two minimized terminal windows." -ForegroundColor Gray