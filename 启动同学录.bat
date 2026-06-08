@echo off
cd /d "%~dp0"
echo 📖 正在启动同学录网站（后台运行）...
start /min "同学录服务器" cmd /c "node server.js"
timeout /t 2 /nobreak >nul
start http://localhost:3000
start http://localhost:3000/admin.html
echo ✅ 已启动！可以关闭本窗口，服务器在后台运行。
echo    关闭服务器：打开任务管理器 → 结束 node.exe
pause
