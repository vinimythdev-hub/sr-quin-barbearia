@echo off
chcp 65001 > nul
echo ===================================================
echo     INICIANDO AMBIENTE DE DESENVOLVIMENTO 🚀
echo             SR. QUIN BARBEARIA 💈
echo ===================================================
echo.

echo [1/2] Iniciando Painel Web (Next.js) em nova janela...
start "Web Admin - Sr. Quin" cmd /k "pnpm --filter web dev"

echo [2/2] Iniciando Aplicativo Mobile (Expo) em nova janela...
start "Mobile Client - Sr. Quin" cmd /k "pnpm --filter mobile start"

echo.
echo ===================================================
echo   Servidores iniciados em novas janelas!
echo   - Painel Web: http://localhost:3000
echo   - App Mobile: Escaneie o QR Code na janela do Expo
echo ===================================================
echo.
pause
