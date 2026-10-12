@echo off
title Zahi Ice Stock - Application Windows
chcp 65001 > nul
echo ===================================================
echo      ZAHI ICE STOCK - GESTION LOGISTIQUE
echo      Application Bureau Windows (Stockage Local)
echo ===================================================
echo.

cd /d "%~dp0"

if not exist "dist\server.cjs" (
    echo [1/2] Compilation initiale du projet...
    call npm run build
)

echo [2/2] Lancement de l'application...
start "" npx electron electron/main.cjs

echo.
echo Application demarree avec succes !
timeout /t 3 > nul
exit
