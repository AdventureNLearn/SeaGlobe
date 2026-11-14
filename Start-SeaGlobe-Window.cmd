@echo off
rem SeaGlobe in a native window if pywebview is installed (pip install pywebview), otherwise the browser.
setlocal
cd /d "%~dp0"
set "PYCMD=python"
where py >nul 2>nul
if %errorlevel%==0 set "PYCMD=py -3"
%PYCMD% run.py %*
endlocal
