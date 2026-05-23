import tkinter as tk
from tkinter import messagebox
import json
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

CONFIG_FILE = "gmail_config.json"

def send_gmail(sender, app_pw, receiver, subject, body):
    try:
        smtp_server = "smtp.gmail.com"
        smtp_port = 587
        
        msg = MIMEMultipart()
        msg['From'] = sender
        msg['To'] = receiver
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'plain', 'utf-8'))
        
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(sender, app_pw)
        server.sendmail(sender, receiver, msg.as_string())
        server.quit()
        return True, "성공"
    except Exception as e:
        return False, str(e)

def load_config():
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except:
            pass
    return {}

def save_config(sender, app_pw, receiver):
    try:
        with open(CONFIG_FILE, "w", encoding="utf-8") as f:
            json.dump({"sender": sender, "app_pw": app_pw, "receiver": receiver}, f, ensure_ascii=False, indent=4)
    except:
        pass

def on_send():
    sender = ent_sender.get().strip()
    app_pw = ent_app_pw.get().strip()
    receiver = ent_receiver.get().strip()
    subject = ent_subject.get().strip()
    body = txt_body.get("1.0", tk.END).strip()

    if not all([sender, app_pw, receiver, subject, body]):
        messagebox.showwarning("입력 누락", "모든 항목을 성실히 입력해 주세요.")
        return

    btn_send.config(state="disabled", text="발송 중...")
    root.update()

    success, error_msg = send_gmail(sender, app_pw, receiver, subject, body)
    
    btn_send.config(state="normal", text="이메일 알림 전송 ➔")
    
    if success:
        save_config(sender, app_pw, receiver)
        messagebox.showinfo("성공", "✓ 이메일 알림이 성공적으로 전송되었습니다!")
    else:
        messagebox.showerror("실패", f"✗ 이메일 발송 실패:\n\n{error_msg}\n\n계정 정보 또는 16자리 앱 비밀번호를 다시 확인하세요.")

# UI 창 생성
root = tk.Tk()
root.title("GeminiTuner - 지메일 알림 제어기")
root.geometry("450x550")
root.configure(bg="#0b1320")

# 폰트 설정
font_title = ("Outfit", 16, "bold")
font_label = ("Inter", 10, "bold")
font_entry = ("Inter", 11)

# 헤더
lbl_header = tk.Label(root, text="GeminiTuner Email Panel", font=font_title, fg="#c084fc", bg="#0b1320")
lbl_header.pack(pady=20)

# 프레임
frame = tk.Frame(root, bg="#0b1320")
frame.pack(padx=20, fill="both", expand=True)

# 저장된 데이터 로드
config = load_config()

# Sender Input
tk.Label(frame, text="발신인 Gmail 주소 (Sender)", font=font_label, fg="#94a3b8", bg="#0b1320").pack(anchor="w", pady=(5, 2))
ent_sender = tk.Entry(frame, font=font_entry, bg="#1e293b", fg="#ffffff", insertbackground="white", bd=0, highlightthickness=1, highlightbackground="#334155", highlightcolor="#c084fc")
ent_sender.pack(fill="x", ipady=8, pady=(0, 10))
ent_sender.insert(0, config.get("sender", ""))

# App PW Input
tk.Label(frame, text="지메일 16자리 앱 비밀번호 (App Password)", font=font_label, fg="#94a3b8", bg="#0b1320").pack(anchor="w", pady=(5, 2))
ent_app_pw = tk.Entry(frame, font=font_entry, show="*", bg="#1e293b", fg="#ffffff", insertbackground="white", bd=0, highlightthickness=1, highlightbackground="#334155", highlightcolor="#c084fc")
ent_app_pw.pack(fill="x", ipady=8, pady=(0, 10))
ent_app_pw.insert(0, config.get("app_pw", ""))

# Receiver Input
tk.Label(frame, text="수신인 이메일 주소 (Receiver)", font=font_label, fg="#94a3b8", bg="#0b1320").pack(anchor="w", pady=(5, 2))
ent_receiver = tk.Entry(frame, font=font_entry, bg="#1e293b", fg="#ffffff", insertbackground="white", bd=0, highlightthickness=1, highlightbackground="#334155", highlightcolor="#c084fc")
ent_receiver.pack(fill="x", ipady=8, pady=(0, 10))
ent_receiver.insert(0, config.get("receiver", ""))

# Subject Input
tk.Label(frame, text="메일 제목 (Subject)", font=font_label, fg="#94a3b8", bg="#0b1320").pack(anchor="w", pady=(5, 2))
ent_subject = tk.Entry(frame, font=font_entry, bg="#1e293b", fg="#ffffff", insertbackground="white", bd=0, highlightthickness=1, highlightbackground="#334155", highlightcolor="#c084fc")
ent_subject.pack(fill="x", ipady=8, pady=(0, 10))
ent_subject.insert(0, "[GeminiTuner] 작업 완료 알림")

# Body Input
tk.Label(frame, text="메일 내용 (Message Body)", font=font_label, fg="#94a3b8", bg="#0b1320").pack(anchor="w", pady=(5, 2))
txt_body = tk.Text(frame, font=font_entry, height=6, bg="#1e293b", fg="#ffffff", insertbackground="white", bd=0, highlightthickness=1, highlightbackground="#334155", highlightcolor="#c084fc")
txt_body.pack(fill="x", pady=(0, 15))
txt_body.insert("1.0", "제미나이 튜너 확장 프로그램 UI 및 캐릭터 리뉴얼 작업이 완전히 완료되었습니다.\n지금 즉시 로컬 결과를 확인해 보세요!")

# Send Button
btn_send = tk.Button(root, text="이메일 알림 전송 ➔", font=("Inter", 11, "bold"), fg="#ffffff", bg="#8b5cf6", activebackground="#a855f7", activeforeground="#ffffff", bd=0, cursor="hand2", command=on_send)
btn_send.pack(fill="x", padx=20, ipady=12, pady=(0, 30))

root.mainloop()
