# Product Requirements Document (PRD)

**프로젝트명:** 제미나이튜너 (GeminiTuner) v1.0

> 원본: `VibeCoding gemini-tuner prd.gdoc`  
> [Google Docs에서 열기](https://docs.google.com/document/d/1v3dYieChQET8CsPumaqzthEDw9uYTKwTuq4lzMuq5Rw/edit)

---

## 1. 제품 목적 (Product Vision)

제미나이튜너(GeminiTuner)는 사용자가 구글 제미나이 웹 서비스(`gemini.google.com`)를 이용할 때, 실시간 토큰 소모량과 비용($)을 대화창 바로 옆에서 직관적으로 모니터링할 수 있도록 돕는 **FinOps 관점의 크롬 확장 프로그램**입니다.

사용자가 비용 예측 가능성을 확보하여 심리적 안정감 속에서 AI와 소통할 수 있는 환경을 제공합니다.

---

## 2. 핵심 타겟 유저 및 페인 포인트 (User Pain Points)

- **대상:** 제미나이 앱 및 API를 헤비하게 사용하는 개발자, 인프라 엔지니어, 교육 강사.
- **Pain Point:**
  1. 현재 제미나이 웹 대화창에서는 대화당 소모되는 토큰 양을 알 수 없음.
  2. 누적 비용을 확인하려면 매번 구글 AI 스튜디오 관리자 페이지로 이동해야 하는 번거로움 존재.
  3. 24시간 상시 가동형 에이전트(스파크) 구동 시 백그라운드 비용 폭주에 대한 두려움.

---

## 3. 핵심 기능 요구사항 (Product Features)

### Phase 1: UI 주입 및 기본 레이아웃 (MVP)

- **F-1.1:** 제미나이 공식 웹사이트(`https://gemini.google.com/*`)의 DOM 구조를 스캔하여, 대화창 우측 영역에 슬림하고 세련된 고정형 사이드 패널(혹은 플로팅 패널)을 인젝션(Injection)한다.
- **F-1.2:** 패널 디자인은 오케스트로 아카데미 표준 스타일(딥 네이비 배경, 블루 강조색) 및 Tailwind CSS 규격을 준수하여 이질감 없는 UI를 구현한다.

### Phase 2: 실시간 데이터 계측 및 연동

- **F-2.1:** 구글 AI 스튜디오(Google AI Studio) 계정의 API 사용량 메타데이터(Usage Metadata)와 백그라운드에서 비동기 통신하여 현재 누적 토큰을 동기화한다.
- **F-2.2:** 사용자가 대화창에서 엔터를 쳐서 질문을 주고받을 때마다, 증가한 토큰과 예상 비용($)을 계측기(Meter) UI에 실시간 반영한다.

### Phase 3: FinOps 및 제어 기능

- **F-3.1:** 사용자가 설정한 월별 예산 한도(Budget Limit)에 도달할 경우, 패널 색상이 Red로 변하며 경고(Alert) 팝업을 띄운다.
- **F-3.2:** 확장 프로그램 팝업창(`popup.html`)을 통해 사용자가 자신의 AI Studio API Key를 안전하게 입력하고 로컬 스토리지에 저장할 수 있도록 관리한다.

---

## 4. 기술 스택 및 제약 조건 (Tech Stack & Constraints)

| 항목 | 내용 |
|------|------|
| 아키텍처 | Chrome Extension Manifest v3 규칙 준수 |
| 프론트엔드 UI | Vanilla JS + Tailwind CSS (Isolated) |
| 백엔드 통신 | Google AI Studio API 및 Chrome Storage API |
| 보안 제약 | 사용자 API 키는 외부 서버로 절대 전송하지 않으며, 오직 브라우저 로컬 가상 샌드박스(`chrome.storage.local`) 내에 암호화 보관 |

---

## 5. 타임라인 및 마일스톤 (Milestones)

- [ ] **Milestone 1:** `manifest.json` 세팅 및 제미나이 웹 DOM 내 기본 패널 안착 테스트
- [ ] **Milestone 2:** AI 스튜디오 실시간 데이터 스트리밍 연동 및 토큰 파싱
- [ ] **Milestone 3:** 예산 알림 및 UI 디테일 튜닝 (MVP 배포 준비)
