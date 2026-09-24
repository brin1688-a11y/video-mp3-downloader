@echo off
title Borin Downloader - Installer Builder
echo =================================================================
echo   Borin Downloader - setup.exe Builder
echo =================================================================
echo.

:: 1. Find Inno Setup compiler
set "ISCC="
for %%P in ("%LOCALAPPDATA%\Programs\Inno Setup 6\ISCC.exe" "%ProgramFiles(x86)%\Inno Setup 6\ISCC.exe" "%ProgramFiles%\Inno Setup 6\ISCC.exe") do (
    if exist %%P set "ISCC=%%~P"
)
if "%ISCC%"=="" (
    echo [ERROR] Inno Setup 6 not found. Install it with:  winget install JRSoftware.InnoSetup
    pause
    exit /b 1
)

:: 2. Install / update Python dependencies
echo [1/3] Installing dependencies...
pip install -q -r requirements.txt
pip install -q -U "yt-dlp[default,curl-cffi]"

:: 3. Build the app folder with PyInstaller
echo.
echo [2/3] Building app with PyInstaller...
if exist "dist\BorinDownloader" rmdir /s /q "dist\BorinDownloader"
pyinstaller --noconfirm installer.spec
if not exist "dist\BorinDownloader\BorinDownloader.exe" (
    echo [ERROR] PyInstaller build failed. Check the logs above.
    pause
    exit /b 1
)

:: 4. Package into setup.exe
echo.
echo [3/3] Creating setup.exe with Inno Setup...
"%ISCC%" /Q installer.iss
if %errorlevel% neq 0 (
    echo [ERROR] Inno Setup failed.
    pause
    exit /b 1
)

echo.
echo =================================================================
echo   SUCCESS! Installer created in the "installer" folder.
echo =================================================================
pause
