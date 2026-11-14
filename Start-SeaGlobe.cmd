@echo off
rem SeaGlobe: starts a local server on 127.0.0.1 (this PC only) and opens your browser.
rem Needs Python 3 (the "py" launcher or python.exe). Without Python it opens web\index.html directly in lite mode.
setlocal
cd /d "%~dp0"
where py >nul 2>nul
if %errorlevel%==0 (
  echo Starting SeaGlobe with the py launcher. Close this window to stop it.
  py -3 serve.py --open %*
  goto :end
)
where python >nul 2>nul
if %errorlevel%==0 (
  echo Starting SeaGlobe with python. Close this window to stop it.
  python serve.py --open %*
  goto :end
)
echo Python was not found. Opening the offline lite version instead.
start "" "%~dp0web\index.html"
:end
endlocal
