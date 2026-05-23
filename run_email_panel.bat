@echo off
:: Pure ASCII Launcher with Pause for Diagnostic Debugging
cd /d "%~dp0"
echo Launching GeminiTuner Email Panel...
powershell -NoProfile -ExecutionPolicy Bypass -File send_gmail_gui.ps1
echo.
echo Process finished. If the window did not open, please check the error message above.
pause
