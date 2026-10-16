@echo off
setlocal
cd /d "%~dp0"
title NETLAB - Iniciar pagina web

echo ================================================
echo  NETLAB - Inicio con servidor local
echo ================================================
echo.
echo IMPORTANTE: no cierres la ventana del servidor mientras uses NETLAB.
echo.

REM Java JDK 18+ incluye jwebserver. Se utiliza antes que Python cuando esta disponible.
where jwebserver >nul 2>&1
if not errorlevel 1 goto JAVA
where py >nul 2>&1
if not errorlevel 1 goto PY
where python >nul 2>&1
if not errorlevel 1 goto PYTHON

echo No encontre Java jwebserver ni Python en la ruta de Windows.
echo Abre la carpeta en VS Code, clic derecho index.html y elige Open with Live Server.
echo.
pause
exit /b 1

:JAVA
start "NETLAB - Servidor local" cmd /k "jwebserver -p 8765 -b 127.0.0.1 -d ."
goto BROWSER
:PY
start "NETLAB - Servidor local" cmd /k "py -3 -m http.server 8765 --bind 127.0.0.1"
goto BROWSER
:PYTHON
start "NETLAB - Servidor local" cmd /k "python -m http.server 8765 --bind 127.0.0.1"
goto BROWSER
:BROWSER
timeout /t 2 /nobreak >nul
start "" "http://127.0.0.1:8765/index.html"
echo Si el navegador se abre antes de que el servidor inicie, recarga con Ctrl + R.
echo Puedes cerrar esta ventana; conserva abierta la ventana de servidor.
timeout /t 3 /nobreak >nul
