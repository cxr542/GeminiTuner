import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import sys

def send_gmail_notification(sender_email, app_password, receiver_email, subject, body):
    """
    Gmail SMTP를 사용하여 알림 이메일을 전송합니다.
    Gmail 보안 정책상 일반 비밀번호 대신 Google 계정에서 발급받은 '앱 비밀번호(App Password)'를 사용해야 합니다.
    """
    try:
        # Gmail SMTP 서버 설정
        smtp_server = "smtp.gmail.com"
        smtp_port = 587
        
        # 이메일 메시지 생성
        msg = MIMEMultipart()
        msg['From'] = sender_email
        msg['To'] = receiver_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'plain', 'utf-8'))
        
        # SMTP 서버 연결 및 보안 세션 시작
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(sender_email, app_password)
        
        # 이메일 전송
        server.sendmail(sender_email, receiver_email, msg.as_string())
        server.quit()
        print("✓ [성공] 이메일 발송 완료!")
        return True
    except Exception as e:
        print(f"✗ [실패] 이메일 발송 오류: {e}", file=sys.stderr)
        return False

if __name__ == "__main__":
    # 사용 가이드라인 출력
    print("=" * 60)
    print(" GeminiTuner - Gmail SMTP 알림 전송 모듈")
    print("=" * 60)
    print("본 스크립트를 사용하여 작업 완료 시 지메일 알림을 보낼 수 있습니다.")
    print("\n[필수 준비 사항]")
    print("1. 구글 계정 설정 -> 보안 -> 2단계 인증 활성화")
    print("2. '앱 비밀번호' 검색 후 발급 (16자리 알파벳 코드)")
    print("\n[사용 방법 예시 (Python)]")
    print("  from send_gmail import send_gmail_notification")
    print("  send_gmail_notification(")
    print("      sender_email='your_email@gmail.com',")
    print("      app_password='xxxx xxxx xxxx xxxx', # 앱 비밀번호")
    print("      receiver_email='target_email@gmail.com',")
    print("      subject='[GeminiTuner] 작업 완료 알림',")
    print("      body='요청하신 작업이 성공적으로 완료되었습니다.'")
    print("  )")
    print("=" * 60)
