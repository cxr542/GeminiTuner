@echo off
chcp 65001 >nul
echo.
echo  [1] chrome://extensions 에서 GeminiTuner 버전이 1.0.4 인지 확인
echo      (1.0.0 이면 이 bat 말고 1-확장-설치-도우미.bat 로 다시 설치)
echo  [2] GeminiTuner 카드에서 "새로고침(↻)" 클릭
echo  [3] gemini.google.com 탭 전부 닫고 다시 열기
echo  [4] 패널 맨 아래 v1.0.4 / 헤더 드래그로 위치 이동 확인
echo.
start chrome "chrome://extensions/"
timeout /t 2 >nul
start chrome "https://gemini.google.com/app"
pause
