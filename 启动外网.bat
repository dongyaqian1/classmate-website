@echo off
cd /d "%~dp0"
echo 📖 正在启动同学录网站（后台运行）...
start /min "同学录服务器" cmd /c "node server.js"
timeout /t 2 /nobreak >nul
echo.
echo 🌐 正在生成外网地址，请稍候...
echo.
ssh -o StrictHostKeyChecking=no -R 80:localhost:3000 serveo.net
pause
