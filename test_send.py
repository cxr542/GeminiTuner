from send_gmail import send_gmail_notification

# 사용자님이 제공하신 설정값 적용
SENDER = "cxr542@gmail.com"
APP_PW = "ojpl awmu qzhi xxxs"
RECEIVER = "cxr542@gmail.com"

SUBJECT = "[GeminiTuner] 작업 완료 알림 (에이전트 원격 발송)"
BODY = """안녕하세요, 사용자님!

요청하신 GeminiTuner 크롬 확장 프로그램 프론트엔드 UI 리뉴얼 및 인터랙티브 테스트 프로토타입 작업이 성공적으로 종료되어 본 알림 이메일을 전송합니다.

[주요 완료 사항]
1. 기존 'Codex' 브랜딩 명칭을 모두 'Gemini' 및 'Gemini Quota' 정식 테마로 변경 완료
2. 구글 제미나이 시그니처 4포인트 반짝임(Sparkle) 스타 기반의 정밀 SVG 캐릭터 개발 완료
3. 20% 이하 한도 도달 시 감지하여 경고색으로 색상 및 감정이 변화하는 동적 반응형 웹 환경 구축
4. 터미널 조작 없이 윈도우 파일 탐색기에서 마우스 더블클릭으로 편리하게 활용 가능한 지메일 전송 전용 그래픽 제어 도구(send_gmail_gui.pyw) 배치 완료

성공적으로 메일이 도착했다면 이메일함을 확인해 주세요!

감사합니다.
Antigravity 에이전트 드림
"""

if __name__ == "__main__":
    send_gmail_notification(
        sender_email=SENDER,
        app_password=APP_PW,
        receiver_email=RECEIVER,
        subject=SUBJECT,
        body=BODY
    )
