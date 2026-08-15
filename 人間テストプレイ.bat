@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Hitobito Games - 人間テストプレイ

where node >nul 2>&1
if errorlevel 1 (
  echo.
  echo Node.js が見つかりません。
  echo Node.js をインストールしてから、もう一度このファイルをダブルクリックしてください。
  echo.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo.
  echo 初回準備をしています...
  call npm install
  if errorlevel 1 (
    echo.
    echo npm install に失敗しました。
    pause
    exit /b 1
  )
)

echo.
echo ==============================================
echo  Hitobito Games - 人間テストプレイを起動します
echo ==============================================
echo.
echo ブラウザは自動で開きます。
echo 終了するときは、この黒いウィンドウを閉じてください。
echo.

call npm run human-test

if errorlevel 1 (
  echo.
  echo 起動中にエラーが発生しました。
  pause
)
