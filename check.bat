@echo off
rem Double-click repo health check (Windows)
where py >nul 2>nul && (py -3 scripts\check.py %*) || (python scripts\check.py %*)
echo.
pause
