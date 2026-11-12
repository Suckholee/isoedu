# 사업계획서 한 번에 자동작성 검증 기록


## 회사 정보·신청 사업 기반 한 번에 자동작성 (2026-11-12)

상태: 로컬 구현·모의 검증 완료; 실제 AI 검증은 연결 계정 잔액 부족으로 차단; 운영 배포 전

동작: 회사 사업·제품과 실적·계획 입력 → 신청 사업·세부 양식 1회 선택 → 자동작성 버튼 1회. 같은 회사 자료 최대5개 자동 추천(변경 가능), 원문 읽기, 본문·표·그래프·도식 구성, 필요한 개념 그림 최대2개 생성·비공개 저장·문항 삽입. 기존 양식/AI대화 편집·수정 이력·Word 다운로드 사용. 자동작성 직전 OpenAI 전달 안내 제공. 이전 입력은 같은 회사의 기존 신청 문서에서 복원하며 회사 기본정보 자체를 수정하지 않는다.

기능 연결: S03 회사·프로젝트 → S11/S16 회사 자료·빈 양식 → S12 신청 사업 → S13 회사 사실·계획 → S14 문항별 본문/시각 자료/그림 작업 → S15 기존 편집·검토 → S17 저장/재조회/이력/Word

전달 데이터: companyId/projectId/documentId, applicationInput.companyProfile/autoCompose/sourceWarnings, template 원문·버전·출처, source IDs/본문/provenance, visualDrafts(sectionTitle/evidenceIds/evidence), ai.visuals(sectionId/type/basis/path), autoComposition(version/state/images[id,sectionId,prompt,state,attempts,attemptId,path,error]/warnings), documentFields/revision/history. 회사명·업종은 서버 조회 값으로 고정.

권한·저장: 기존 project RLS/can_edit_company 및 동일 회사 근거 검사 유지. AI 전후 권한·원문 버전 재검사. 단조 증가 updated_at으로 CAS 주장/완료/실패 저장. 그림은 회사/문서 private iso-vault 경로에 시도별 새 이름으로 저장, 동시 수동수정 덮어쓰기 방지. 문서 신규생성 회사당 시간당10회, 그림 최대2개·각3회 시도, provider timeout100초. 브라우저 회사·프로젝트 전환 시 후속 요청 중단. 서버 API key 비공개.

오류 처리: 읽지 못한 회사 자료는 결과 경고에 남김. 본문과 검증된 표/그래프/도식을 먼저 저장하고 그림 작업 순차 진행. 그림 실패 시 본문 보존, 남은 그림만 이어쓰기. 3회 소진 시 버튼 비활성화 및 한도 안내. 사용 잔액 부족과 일시적인 속도 제한을 구분. 숫자·단위·항목/원문 인용이 불일치한 그래프와 근거 없는 수치 표는 생략하고 확인 항목 표시.

검증: 전체233개 테스트 통과. 가상 응답 UI에서 버튼1회→본문 요청1/그림 요청1→시각 자료4개 배치·저장, 수정2 저장·새로고침 재조회 확인. 다운로드71884바이트 Word 호환 .doc에 PNG3개(도식/그림/그래프), 표, 수정 본문 포함. 가상 이미지 로딩900px 확인·브라우저 오류0. 서버 저장/권한/CAS/이미지 재시도 검증은 테스트 어댑터 사용. 최종 운영용 빌드 통과. 임시 검증 화면·가상 이미지 응답 제거 및 빌드 목록 제외 확인.

범위·한계: 실제 OpenAI 요청은 HTTP429 credit_balance_exhausted/insufficient_quota로 실패하여 이번 실제 본문·이미지 생성 전체 성공을 확인하지 못함. 운영 DB/스토리지 저장·운영 배포 미수행. 이미지 생성 API 구현은 모의 응답 계약 검증 단계. 가상 화면은 모델 품질 증거가 아님. 원문 HWP/PDF 페이지 배치 복제·자동 제출·실제 Word 앱 렌더링은 미검증. 실제 제품/현장 사진 및 증빙은 AI 개념 그림으로 대체하지 않음. PDF 내 그림 자동 추출·기존 사진 자동 선택은 미구현. 영상 제출은 촬영 대본/표 지원이며 생성 그림으로 촬영 대체 금지.

이전 기록의 별도 원문 읽기/확인 버튼 및 일반 삽화 미구현 상태는 이 후속 기록으로 갱신한다. UX-001 공통 셸·사이드바 및 회사/문서 상태 유지. 공식 제출·인증 심사·발급을 대신하지 않는다. 기존 신청 사업 30종의 종류·차수·분량·미확보8범위 안내 유지. 레지스트리 applicationOneClick20261112와 동기화.

이미지 API 계약 참고: https://developers.openai.com/api/docs/guides/image-generation

![가상 자료 화면 검증](business-plan-oneclick-20261112.png)
