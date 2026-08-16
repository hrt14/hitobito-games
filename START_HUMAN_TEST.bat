@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"
set "RUN_ROOT=%CD%"

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
  echo       Git was not found. Using the local copy.
) else (
  git pull --ff-only
  if errorlevel 1 (
    echo.
    echo [WARN] The working copy could not be updated safely.
    echo        Starting a clean latest playtest copy instead.
    echo.
    set "FRESH_ROOT=%LOCALAPPDATA%\HitobitoPlaytestLatest"
    if exist "!FRESH_ROOT!\.git" (
      git -C "!FRESH_ROOT!" fetch origin main
      if errorlevel 1 goto update_failed
      git -C "!FRESH_ROOT!" reset --hard origin/main
      if errorlevel 1 goto update_failed
    ) else (
      if exist "!FRESH_ROOT!" rmdir /s /q "!FRESH_ROOT!"
      git clone --depth 1 --branch main https://github.com/hrt14/hitobito-games.git "!FRESH_ROOT!"
      if errorlevel 1 goto update_failed
    )
    set "RUN_ROOT=!FRESH_ROOT!"
  )
)

cd /d "%RUN_ROOT%"
for /f %%i in ('git rev-parse --short HEAD 2^>nul') do echo       Version: %%i

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
  powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%RUN_ROOT%\scripts\human-test-windows.ps1"
)

if errorlevel 1 (
  echo.
  echo [ERROR] The playtest server could not start.
  echo        If another Human Playtest window is already open, close it and run this file again.
  echo.
  pause
)

endlocal
exit /b 0

:update_failed
echo.
echo [ERROR] Could not download the latest playtest copy from GitHub.
echo        Check the internet connection and run this file again.
echo.
pause
endlocal
exit /b 1
