@echo off
REM ---------------------------------------------------------------------------
REM  Card Auction - Cloudflare live server
REM  Game files public/ me copy kar ke server ko Cloudflare par bhejta hai.
REM  Pehli baar:  npm install   phir   npx wrangler login
REM                npx wrangler d1 create cardauction  (id wrangler.toml me daalein)
REM                npm run cf:db:init
REM ---------------------------------------------------------------------------
setlocal
cd /d "%~dp0"

echo.
echo  [1/2] Game files public me copy ho rahi hain...
call npm run sync
if errorlevel 1 goto :fail

echo.
echo  [2/2] Cloudflare par deploy ho raha hai...
echo        (pehli baar 2-3 minute lag sakte hain)
echo.
call npm run cf:deploy
if errorlevel 1 goto :fail

echo.
echo  ============================================================
echo   Deploy ho gaya!
echo   Neeche jo workers.dev address aaya hai usay kisi ko
echo   bhej dein - wohi permanent server address hai.
echo   Mobile par bhi wahi address khol ke khelo.
echo  ============================================================
echo.
pause
exit /b 0

:fail
echo.
echo  DEPLOY FAIL HO GAYA - upar ka error message parhein.
echo  CLOUDFLARE.md me har masale ka hal likha hai.
echo.
pause
exit /b 1
