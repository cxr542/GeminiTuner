# Execution Plan (plan.md)

**프로젝트명:** 제미나이튜너 (GeminiTuner) v1.0

> 원본: `VibeCoding gemini-tuner plan.gdoc`  
> [Google Docs에서 열기](https://docs.google.com/document/d/1F5Fk59qXSYi5CWB5V2rQ6kyf5Y53VbGB3uzJMNC0QMs/edit)

본 문서는 `prd.md` 및 IA/UI 설계안을 바탕으로 안티그래비티 에이전트가 순차적으로 수행할 실전 개발 체크리스트입니다. 각 단계 완료 후 강사님의 컨펌을 거쳐 다음 단계로 진입합니다.

---

## Phase 1: 개발 환경 구성 및 UI 주입 (MVP)

### [ ] Step 1.1: 크롬 확장 프로그램 기본 뼈대 세팅

- **목표:** Manifest v3 규격에 맞춘 기본 환경 설정
- **작업 내용:**
  - `manifest.json` 생성 (제미나이 웹 주소 권한 및 `background.js`, `content.js` 선언)
  - 확장 프로그램 팝업 기본 창 (`popup.html`, `popup.js`) 레이아웃 아웃라인 잡기
- **산출물:** `manifest.json`, `popup.html`

### [ ] Step 1.2: 제미나이 웹 DOM 분석 및 사이드 패널 주입 (Injection)

- **목표:** `gemini.google.com` 접속 시 우측 여백에 튜너 패널 안착시키기
- **작업 내용:**
  - `content.js` 작성: 제미나이 메인 화면의 우측 레이아웃 DOM 구조 파싱
  - `MutationObserver`를 활용하여 페이지 전환 및 대화 갱신 시에도 패널이 유지되도록 동적 감지 로직 구현
  - 오케스트로 딥 네이비 톤(`#0B192C`) 배경의 슬림 패널(가로 280px) 컴포넌트 주입
- **산출물:** `content.js`, `styles.css` (Isolated Tailwind 레이어)

---

## Phase 2: 크롬 백그라운드 서비스 워커 및 API 연동

### [ ] Step 2.1: `background.js` 통신 파이프라인 구축 (CORS/CSP 방화벽 우회)

- **목표:** 보안 규정을 준수하며 구글 AI 스튜디오 API와 통신할 징검다리 데몬 구현
- **작업 내용:**
  - `background.js` (Service Worker) 생성
  - `content.js`와 `background.js` 간의 메시지 교환(Message Passing) 인터페이스 규격 정의
- **산출물:** `background.js`

### [ ] Step 2.2: 구글 AI 스튜디오 사용량 메타데이터 파싱 및 실시간 갱신

- **목표:** 대화 시 발생하는 토큰 및 비용 계측 연동
- **작업 내용:**
  - API Key 안전 저장 로직 구현 (`chrome.storage.local` 샌드박스 보관)
  - AI Studio API의 `Usage Metadata` 엔드포인트 커넥션
  - 엔터 입력(대화 발생) 시 실시간으로 토큰 변화량을 계산하여 우측 패널 미터기에 반영하는 로직 완성
- **산출물:** `background.js` 내 API 파싱 모듈, `content.js` 데이터 매핑 로직

---

## Phase 3: FinOps 제어 및 예산 경고 시스템 (안정화)

### [ ] Step 3.1: 예산 리미트 및 알림(Alert) 팝업 구현

- **목표:** 비용 폭주 방지 방화벽 구축
- **작업 내용:**
  - `popup.html` 내 월별 예산(Budget) 한도 설정 UI 구현
  - 현재 누적 비용이 설정액의 80% 돌파 시 패널 라인을 Warning Red로 점멸하는 상태 관리 로직 추가
  - 100% 도달 시 제미나이 전송 버튼을 비활성화하거나 경고 모달을 띄우는 예산 브레이크 기능 구현
- **산출물:** `popup.html` 최종본, 전체 스크립트 리팩토링

### [ ] Step 3.2: 최종 디버깅 및 패키징

- **목표:** 로컬 크롬 브라우저에 임포트하여 최종 필드 테스트 수행
- **작업 내용:**
  - 크롬 확장 프로그램 제약사항(원격 코드 실행 금지 등) 위반 여부 교차 검증
  - 맥북 환경 가동 가이드 작성
- **산출물:** `README.md`, `GeminiTuner_v1.0.zip` 빌드본
