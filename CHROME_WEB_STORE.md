# Chrome Web Store 등록 가이드 (GeminiTuner)

이 문서는 중단했던 **Chrome Web Store** 등록을 이어서 완료하는 절차입니다.

## 0. 사전 준비 (한 번만)

1. **개발자 계정**: https://chrome.google.com/webstore/devconsole  
   - 최초 등록 시 **일회성 등록비** (약 $5) 결제 필요
2. **개인정보 처리방침 URL** (필수)  
   - **공개 URL:** https://cxr542.github.io/GeminiTuner/privacy.html  
   - 스토어 등록 화면의 *Privacy policy* 항목에 위 주소 붙여넣기

## 1. 로컬에서 패키지 만들기

PowerShell에서 프로젝트 루트 기준:

```powershell
cd "G:\내 드라이브\VibeCoding\gemini_tuner"
.\scripts\generate-icons.ps1
.\scripts\build-store-zip.ps1
```

생성 파일: `dist/GeminiTuner-v1.0.7.zip`  
→ **이 ZIP만** Developer Dashboard에 업로드합니다. (Gmail 스크립트·데모 HTML은 포함되지 않음)

## 2. 업로드 전 로컬 검증 (권장)

1. Chrome에서 `chrome://extensions` 열기
2. **개발자 모드** 켜기 → **압축해제된 확장 프로그램을 로드합니다**
3. `gemini_tuner` 폴더 선택 (ZIP 풀지 않고 폴더 그대로)
4. https://gemini.google.com 접속 후 우측 **GeminiTuner** 패널·대화 후 토큰 갱신 확인
5. 오류가 없으면 ZIP도 동일 구조이므로 스토어 업로드 가능

## 3. Developer Dashboard — 새 항목 / 이어하기

1. https://chrome.google.com/webstore/devconsole 로그인
2. **새 항목** (또는 중단했던 **GeminiTuner** 초안) 선택
3. **Package** 탭 → `dist/GeminiTuner-v1.0.0.zip` 업로드  
   - 오류 *Cannot parse the manifest* → `manifest.json`에 주석 없는지 확인
   - *Missing icons* → `scripts/generate-icons.ps1` 재실행 후 ZIP 재생성

## 4. 스토어 등록 정보 (Listing) — 복사용 초안

| 항목 | 권장 내용 |
|------|-----------|
| **이름** | GeminiTuner |
| **요약** (132자 이내) | Real-time token and cost monitor for gemini.google.com. FinOps side panel, budget alerts. Data stays on your device. |
| **설명** | GeminiTuner adds a side panel on gemini.google.com showing session token usage, estimated cost (Gemini Flash pricing), and monthly budget progress. Optional API key and budget limits are stored locally only—never sent to our servers. |
| **카테고리** | Productivity |
| **언어** | Korean, English |
| **단일 목적** | Monitor Gemini web chat token usage and estimated cost on gemini.google.com. |

### 스크린샷 (필수)

- 최소 **1장**, 권장 1280×800 또는 640×400
- `gemini.google.com` + 우측 패널이 보이게 캡처
- 확장 팝업(예산 설정) 1장 추가 권장

### 프로모션 이미지

| 자산 | 크기 |
|------|------|
| 스토어 아이콘 | 128×128 (`icons/icon128.png` 업로드) |
| 작은 타일 | 440×280 |
| 마키(선택) | 1400×560 |

`icons/icon128.png`는 ZIP에 포함되어 있으므로 동일 파일을 리스팅 아이콘으로도 사용 가능합니다.

## 5. 권한·데이터 공개 (Data usage / Privacy)

심사 양식에서 대략 다음처럼 기재:

- **단일 목적**: gemini.google.com에서 토큰·비용 모니터링
- **호스트 권한**: `gemini.google.com` — 패널 주입 및 해당 페이지 API 응답에서 usage 메타데이터 추출
- **storage**: 로컬 설정·누적 사용량
- **notifications**: 예산 임계치 알림
- **원격 코드 없음**: MV3, 번들된 JS/CSS만 사용 (외부 폰트 제거됨)
- **API 키**: 사용자 선택 입력, 로컬 저장만, 개발자 서버 미전송

## 6. 심사 제출

1. **Package** 업로드 완료
2. **Store listing** 필수 항목·스크린샷·개인정보 URL 입력
3. **Privacy** / **Data usage** 설문 완료
4. **Submit for review** 클릭  
   - 보통 수일~1주 소요 (거절 시 이메일·대시보드에 사유 표시)

## 7. 거절 시 자주 나오는 원인

| 사유 | 대응 |
|------|------|
| 설명이 기능과 불일치 | Listing 설명을 실제 동작(사이드 패널·로컬 저장)에 맞게 수정 |
| 권한 과다 | `activeTab`, `alarms` 제거됨 — 최소 권한만 유지 |
| 원격 호스팅 코드 | Google Fonts 등 외부 스크립트 제거 완료 |
| 개인정보 URL 없음 | `store/privacy.html` 공개 URL 등록 |
| 아이콘/매니페스트 | `generate-icons.ps1` + `build-store-zip.ps1` 재실행 |

## 8. 승인 후

- 대시보드에서 **Publish** → 전 세계 또는 지정 국가
- 업데이트 시: `manifest.json`의 `version` 올리기 → ZIP 재빌드 → 새 패키지 업로드

---

**지금 할 일:**  
1) `generate-icons.ps1` + `build-store-zip.ps1` 실행  
2) devconsole에 ZIP 업로드  
3) privacy URL + 스크린샷만 채우면 심사 제출 가능
