@echo off
chcp 65001 >nul
title GeminiTuner 설치 도우미
cd /d "%~dp0"

echo.
echo  ========================================
echo   GeminiTuner - Chrome 확장 로컬 설치
echo  ========================================
echo.

if not exist "icons\icon128.png" (
    echo [1/3] 아이콘 생성 중...
    powershell -ExecutionPolicy Bypass -File "%~dp0scripts\generate-icons.ps1"
) else (
    echo [1/3] 아이콘 OK
)

echo [2/3] 이 폴더를 탐색기로 엽니다...
echo       아래 경로를 Chrome "폴더 선택" 창에 붙여넣으세요:
echo.
echo       %CD%
echo.
start "" explorer "%CD%"

echo [3/3] Chrome 확장 프로그램 페이지를 엽니다...
echo.
echo  *** Chrome에서 할 일 (순서대로) ***
echo  1) 우측 상단 "개발자 모드" 켜기
echo  2) "압축해제된 확장 프로그램을 로드합니다" 클릭
echo  3) 방금 연 탐색기 폴더(gemini_tuner) 선택
echo  4) gemini.google.com 새 탭 열기 - 우측에 패널 확인
echo.

timeout /t 2 >nul
start chrome "chrome://extensions/" 2>nul
if errorlevel 1 start msedge "edge://extensions/" 2>nul

echo 완료. 이 창은 닫아도 됩니다.
pause
