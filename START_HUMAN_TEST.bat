@echo off
setlocal
cd /d "%~dp0"
chcp 65001 >nul

title Hitobito Games - Human Playtest

echo.
echo ==============================================
echo  Hitobito Games - Human Playtest
echo ==============================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js が見つかりません。
  echo Node.js 18 以上をインストールしてから、もう一度このファイルを実行してください。
  echo.
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo [ERROR] npm が見つかりません。
  echo Node.js を再インストールしてから、もう一度このファイルを実行してください。
  echo.
  pause
  exit /b 1
)

echo [1/3] GitHub の最新版を確認しています...
where git >nul 2>nul
if errorlevel 1 (
  echo       Git が見つからないため更新をスキップします。
) else (
  git pull --ff-only
  if errorlevel 1 (
    echo.
    echo [WARN] git pull に失敗しました。現在PCにあるコードでテストを続けます。
    echo.
  )
)

echo [2/3] テスト環境を確認しています...
if not exist "node_modules\uqr\package.json" (
  echo       初回セットアップを実行します...
  call npm install --no-fund --no-audit
  if errorlevel 1 (
    echo.
    echo [ERROR] npm install に失敗しました。
    echo.
    pause
    exit /b 1
  )
) else (
  echo       OK
)

echo [3/3] 人間テストプレイ環境を起動します...
echo.
echo 初回に Windows Defender Firewall が表示された場合は、
echo 「プライベート ネットワーク」を許可してください。
echo.

call npm run human-test

if errorlevel 1 (
  echo.
  echo [ERROR] テスト環境を起動できませんでした。
  echo.
  pause
)

endlocal
