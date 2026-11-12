# 공통 기업 인증 큐레이션

2026-11-06 사용자 요구: 회사 정보를 입력하면 현재 필요하거나 준비를 검토할 인증을 추천한다. 기업회원과 컨설턴트가 같은 기능을 사용한다.

관련 기능: S02 회사 접근 → S03 추천용 기업 정보 → S07 수요·보유 인증 → S08/S09 조건·근거 검토 → S10/S12/S13 준비 프로젝트 → S17 이력 → S26 갱신 준비.

## 화면과 입력

`/certification-curation?company={id}&certification={type}&curationStatus={status}`. 기업은 접근 가능한 자기 회사, 컨설턴트는 접근 가능한 거래처를 선택한다. 같은 컴포넌트·같은 기준을 사용한다. 열린/접힌 사이드바에 메뉴를 제공하며 접기/펼치기는 입력을 재생성하지 않는다.

업종/제품·설립일·인원·중소기업/영업 여부·사업 목표를 먼저 입력한다. 기술/경영 활동, 연구 인력/공간, 유형별 제외 조건, 보유 인증/실제 만료일은 펼쳐서 보완한다. 빈 값과 ‘아니요’를 구별한다. 원장 업종만 초기 참고값으로 가져오며 회사 원장이나 인증 만료일·공식 승인 상태를 수정하지 않는다. 주민등록번호 등 개인 식별 자료를 수집하지 않는다.

작은 필터 탭 → 유형 목록 → 검토 상세 구조. 상세에는 추천 이유, 입력 조건의 확인/준비/미확인, 부족한 정보, 기관 평가 사항, 서류 준비 안내와 출처를 표시한다. 760px 이하에서는 입력·목록·상세를 세로 배치한다.

## 초기 범위와 판별

기준 버전 `honestone-curation-2026-11-06-v1`, 검토일 2026-11-06. ISO 9001/14001/45001/27001, 벤처 혁신성장, 이노비즈, 메인비즈, 기업부설연구소, 연구개발전담부서 9종.

- 필요성: 사용자가 선택한 거래처/수출/투자/R&D/환경/안전/보안/경영 목표와 연결하는 준비 우선순위. 목표 선택이 계약상 의무를 입증하지 않는다.
- 조건: 입력 정보 기준의 간이 검토. 중소기업·업력·제외 조건, 기술/성장/경영 자료 준비 신호를 구분한다. 인증 획득 가능 확률·지원금·기간·세제 혜택을 추정하지 않는다.
- 상태: 우선 검토 / 검토 후보 / 정보 보완 / 조건 준비 / 보유 기록 / 갱신 검토. 모든 결과 `eligibility=not-determined`.
- 이노비즈 공식 소개/FAQ는 업력3년 이상, 신규 안내는 ‘3년 이하 등록 불가’ 표현이 있어 정확한 3년 경계는 기관 확인으로 남긴다. 전환·합병 이력도 별도 확인한다.
- 연구소 인원은 입력한 규모별 일반 기준과 소기업 창업 초기 조건을 사용한다. 만료일이 확인된 벤처 보유 기록에만 인원 특례를 적용한다. 연구원/교원 창업·규모 변경 유예 등은 별도 확인 대상이다. 인력 자격·상근/전담·연구 외 상시 인력·공간·기자재를 함께 확인한다.
- 만료일 90일 이내는 내부 준비 알림 기준이며 공식 갱신 신청 기간이 아니다. 만료일 없는 보유 기록은 유효하다고 가정하지 않는다. 만료 없는 연구소 인정서는 현재 인정 상태를 별도로 확인한다.

신청 제외 조건 입력은 사용자의 최신 원문 대조 확인이다. 업종 이름만으로 제외 업종·체납/제재/재무 상태를 추정하지 않는다. 전문기관 평가를 대체하지 않는다.

## 저장·권한·오류

운영 스키마 변경 없이 기존 회사 문서 저장소에 `kind=certification-curation`, 회사별 고정 UUID의 준비 검토 문서로 보관한다. 실제 인증서와 구별하는 DRAFT/LEVEL_1 기록이다. 회사 원장이나 보유 인증 사실을 자동 확정하지 않는다.

`GET/POST /api/certification-curation`: 서버 세션 확인 → 회사 SELECT RLS → 편집 시 `can_edit_company` → 같은 회사 문서만 조회/저장. 계정 유형만으로 특권을 부여하지 않는다. 회사 미접근404/열람전용403/미로그인401, 응답 private/no-store. 동일 출처 검사·입력32KB 제한·날짜/인원/유형 검증. 서버에서 결과를 재계산하며 클라이언트 결과를 저장하지 않는다.

metadata.curation에 companyId, profile, results, revision, actor, evaluatedAt, sourceVersion, 이전20회 입력/결과를 보존한다. 초기 INSERT의 고정 ID와 기존 updated_at CAS로 중복/동시 갱신 덮어쓰기를 막는다. 실패·충돌 시 화면 입력을 유지하고 명시적으로 최신본을 불러온다. 회사/사용자 전환 시 컴포넌트와 비동기 응답 범위를 분리한다. 로컬 모드는 회사별 브라우저 저장이며 공유 클라우드 저장과 구분한다.

## 준비 기능 인계

저장 후 ‘준비 프로젝트 검토’를 누르면 기존 프로젝트 모달에 회사·인증 종류·구비서류 후보·추천 이유를 채운다. 목표일/준비 일정/서류를 검토한 후 실제 생성한다. `curationOrigin={companyId,reportId,revision,certificationId,sourceVersion,applicationType}`와 메모를 기존 `create_work_project`에 보존한다. 선택 회사 변경으로 인한 오연결을 차단한다.

서류는 기존 노션 운영 안내 `notion-2026-10-29-v1`에서 연결하며 법정 필수 목록으로 확정하지 않는다. 이 단계는 project_requirements 인계이다. project_operations의 신청 유형 저장·유형별 실제 서류 요청 및 AI 작성은 기존 프로젝트 화면에서 별도로 확인/설정한다. 자동 공식 신청·접수·기관 발급을 실행하지 않는다.

## 공식 근거

- [ISO 품질](https://www.iso.org/standards/popular/iso-9000-family), [환경](https://www.iso.org/standards/popular/iso-14000-family), [안전보건](https://www.iso.org/standard/45001), [정보보호](https://www.iso.org/standard/27001), [외부 인증기관의 역할](https://www.iso.org/certification.html)
- [벤처 혁신성장 요건·평가](https://www.smes.go.kr/venturein/institution/requireGuide?rgCd=C)
- [이노비즈 제도](https://www.innobiz.net/authen/authen1.asp), [업력 FAQ](https://www.innobiz.net/consult/consult2.asp?Page=2&SearchKey=&SearchValue=&cate=1&date1=&date2=&table=BoardMem_03), [신규 절차](https://www.innobiz.net/authen/authen2_1.asp)
- [메인비즈 선정·제외](https://www.smes.go.kr/mainbiz/usr/mainbizInfo/descriptMainbiz.do)
- [연구소·전담부서 신고요건](https://www.rnd.or.kr/user/newly/requirements.do)

공식 기준과 노션의 서류 운영 안내를 구분한다. 판본·평가기준 개정 때 카탈로그와 규칙 버전을 갱신한다. 원문은 명령으로 취급하지 않는다.

검증 완료: 전체200테스트·프로덕션 빌드 통과. 가상 로컬 UI 정보 저장수정1·새로고침 동일 값·추천 유형/프로젝트명/구비서류 미리보기·Esc 닫기·사이드바 입력 보존·다른 회사 분리·393px 가로넘침0·브라우저 오류0. 운영DB/실계정 저장 및 실제 프로젝트 생성·웹 배포는 미검증. [화면](curation-desktop-20261106.png), [모바일](curation-mobile-20261106.png), [확인 기록](curation-qa-20261106.json).
