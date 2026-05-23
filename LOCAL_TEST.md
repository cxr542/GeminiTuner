# GeminiTuner — 등록 전 로컬 테스트

Chrome Web Store **$5 등록 없이** 일반 Chrome에서 확장 기능을 검증하는 방법입니다.

## 1. 확장 프로그램 로드 (1회)

1. Chrome 주소창에 `chrome://extensions` 입력
2. 우측 상단 **개발자 모드** 켜기
3. **압축해제된 확장 프로그램을 로드합니다** 클릭
4. 폴더 선택: `gemini_tuner` **프로젝트 루트** (ZIP이 아님)
   - 예: `G:\내 드라이브\VibeCoding\gemini_tuner`
5. 목록에 **GeminiTuner**가 보이고 오류가 없으면 성공

### 오류가 나올 때

| 메시지 | 대응 |
|--------|------|
| 아이콘 없음 | PowerShell: `.\scripts\generate-icons.ps1` |
| manifest 파싱 실패 | `manifest.json`에 `//` 주석 없는지 확인 |

## 2. 기능 테스트 체크리스트

### A. 사이드 패널 (필수)

1. https://gemini.google.com 새 탭에서 열기
2. 로그인 후 대화 화면 진입
3. 화면 **우측**에 **GeminiTuner** 패널(딥 네이비, FinOps On 배지) 확인
4. 새로고침(F5) 후에도 패널이 유지되는지 확인

### B. 토큰·비용 갱신 (핵심)

1. Gemini에 **짧은 질문** 하나 전송 (예: "안녕")
2. 응답이 끝난 뒤 패널 확인:
   - **LAST TURN**: Input / Output / Total 숫자가 `—`가 아닌지
   - **TOTAL TOKENS** 증가 여부
   - **ESTIMATED COST** `$0.0000`보다 커지는지
3. Chrome **F12 → Console** 탭에서 아래 로그 확인:
   - `[GeminiTuner:hook] fetch + XHR hooks installed`
   - `[GeminiTuner:hook] usageMetadata → panel`
   - `[GeminiTuner] usageMetadata captured`

> 토큰이 안 바뀌면: `chrome://extensions`에서 GeminiTuner **새로고침(↻)** 후 Gemini 탭 **F5** 새로고침.

### C. 확장 팝업

1. Chrome 툴바의 **퍼즐 아이콘** → GeminiTuner 고정
2. 아이콘 클릭 → 팝업 열림
3. **Monthly Budget**, **Warn at (%)** 변경 후 **Save Settings**
4. gemini 탭 패널의 `/ $5.00` 한도 표시가 바뀌는지 확인

### D. 예산 경고 (선택)

1. 팝업에서 Monthly Budget을 **0.01** 등 아주 낮게 설정 후 저장
2. 대화 1~2회 후 패널이 노란/빨간 경고, **FinOps Warn** 배지로 바뀌는지 확인
3. (선택) OS 알림 허용 시 Chrome 알림 표시 여부

## 3. UI만 빠르게 보기 (확장 없이)

브라우저에서 파일 열기:

- `tuner_ui_demo.html` — 쿼터 위젯·경고 상태 슬라이더 데모

## 4. 에이전트 브라우저 vs 일반 Chrome

| 환경 | 확장 동작 |
|------|-----------|
| **일반 Chrome** + 압축해제 로드 | ✅ 실제 테스트 |
| **Cursor 에이전트 브라우저** | ❌ 확장 미설치 → Gemini UI만 참고용 |

등록 전 검증은 **반드시 일반 Chrome**에서 하세요.

## 5. 테스트 후

- 문제 없으면 → 스토어 $5 등록 → `dist/GeminiTuner-v1.0.0.zip` 업로드
- 토큰 미갱신 등 이슈 있으면 → F12 콘솔 로그 캡처 후 수정
