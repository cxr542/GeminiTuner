@echo off
chcp 65001 >nul
title GeminiTuner - Gemini 테스트
echo gemini.google.com 을 Chrome에서 엽니다...
start chrome "https://gemini.google.com/app" 2>nul
if errorlevel 1 start msedge "https://gemini.google.com/app" 2>nul
echo.
echo 확장을 먼저 설치했는지 확인하세요 (1-확장-설치-도우미.bat)
pause
