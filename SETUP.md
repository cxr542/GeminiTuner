# gemini_tuner — 개발 환경

## 문서

- [prd.md](./prd.md) — Google Docs에서 변환 (원본: `VibeCoding gemini-tuner prd.gdoc`)
- [plan.md](./plan.md) — Google Docs에서 변환 (원본: `VibeCoding gemini-tuner plan.gdoc`)

Docs를 다시보낼 때: 브라우저에서 `…/export?format=txt` URL을 열거나, **파일 → 다운로드 → 일반 텍스트(.txt)** 후 `prd.md` / `plan.md`에 반영하세요.

## Python (weasyprint SSRF 패치)

- **Python 3.10+** 필수 (macOS 기본 3.9는 weasyprint 68.x 불가)
- 미리 만든 venv: `~/.venvs/gemini-tuner` (weasyprint 68.1)

```bash
source ~/.venvs/gemini-tuner/activate.sh
cd "/Users/yhkim/Library/CloudStorage/GoogleDrive-cxr542@gmail.com/내 드라이브/VibeCoding/gemini_tuner"
pip install -r requirements.txt
python -c "import weasyprint; print(weasyprint.__version__)"
```

시스템 라이브러리(최초 1회, Homebrew):

```bash
brew install pango cairo gdk-pixbuf libffi
```

## GitHub Security Alert

`requirements.txt`를 커밋·푸시하면 Dependabot(weasyprint SSRF) 알림 해소에 도움이 됩니다.
