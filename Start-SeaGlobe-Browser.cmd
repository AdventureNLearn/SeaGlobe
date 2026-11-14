@echo off
rem SeaGlobe in the system browser (fallback). Local server on 127.0.0.1 only.
setlocal
cd /d "%~dp0"
set "PYCMD=python"
where py >nul 2>nul
if %errorlevel%==0 set "PYCMD=py -3"
%PYCMD% run.py --browser %*
endlocal
