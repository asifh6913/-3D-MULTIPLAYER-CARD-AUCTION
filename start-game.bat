@echo off
title Card Auction - server
cd /d "%~dp0"

echo.
echo  ============================================
echo            CARD AUCTION  -  server
echo  ============================================
echo.

where node >nul 2>nul
if errorlevel 1 (
    echo  [ERROR] Node.js is not installed on this PC.
    echo.
    echo  Install the LTS version from  https://nodejs.org
    echo  then run this file again.
    echo.
    pause
    exit /b 1
)

echo  Server is starting...
echo.
echo   On this PC   :  http://localhost:8787
echo   On your LAN  :  (printed below by the server)
echo.
echo  Keep this window open while you play.
echo  To stop the server, close this window.
echo.

rem open the game in the default browser after the server is up
start "" powershell -WindowStyle Hidden -Command "Start-Sleep -Seconds 2; Start-Process 'http://localhost:8787/CardAuction.html'"

node server.js

echo.
echo  Server stopped.
pause
