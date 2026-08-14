@echo off
setlocal
cd /d "%~dp0"

title Hitobito Games - Human Playtest

echo.
echo ==============================================
echo  Hitobito Games - Human Playtest
echo ==============================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js was not found.
  echo Install Node.js 18 or newer, then run this file again.
  echo.
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo [ERROR] npm was not found.
  echo Reinstall Node.js, then run this file again.
  echo.
  pause
  exit /b 1
)

echo [1/3] Updating from GitHub...
where git >nul 2>nul
if errorlevel 1 (
  echo       Git was not found. Skipping update.
) else (
  git pull --ff-only
  if errorlevel 1 (
    echo.
    echo [WARN] git pull failed. Continuing with the local copy.
    echo.
  )
)

echo [2/3] Checking playtest environment...
if not exist "node_modules\uqr\package.json" (
  echo       First-time setup: installing packages...
  call npm install --no-fund --no-audit
  if errorlevel 1 (
    echo.
    echo [ERROR] npm install failed.
    echo.
    pause
    exit /b 1
  )
) else (
  echo       OK
)

echo [3/3] Starting Human Playtest...
echo.
echo If Windows Defender Firewall appears, allow Node.js on Private networks only.
echo While this server is running, Windows sleep will be prevented automatically.
echo The display is still allowed to turn off.
echo.

where powershell >nul 2>nul
if errorlevel 1 (
  echo [WARN] PowerShell was not found. Starting without sleep prevention.
  call npm run human-test
) else (
  powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\human-test-windows.ps1"
)

if errorlevel 1 (
  echo.
  echo [ERROR] The playtest server could not start.
  echo.
  pause
)

endlocal
