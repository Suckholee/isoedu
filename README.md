# 인증 레이더 (Certification Radar) — ISOEdu

> **시연 및 교육용 프로토타입**  
> 1. 각 문서를 체계적으로 정리하는 화면 (ISO 4계층 분류 & D-Day 레이더)  
> 2. AI 어시스턴트와의 대화를 통해 상황에 맞는 문서들을 리스트에 자동 호출하는 기능  
> **Tech Stack:** Next.js (App Router), Tailwind CSS, Supabase, GitHub & Vercel Native

---

## 🌟 핵심 기능 안내

### 1. 체계적인 인증 및 규격 문서 관리 화면 (좌측 60%)
- **ISO 4단계 표준 계층 체계 준수:**
  - `0. 인증서 원본`: 정식 인증서 및 인허가 유효기간 관리
  - `1계층: 매뉴얼(Manual)`: 경영방침 및 최고 경영진 방침서
  - `2계층: 절차서(SOP)`: 공정관리, 내부심사, 부적합품관리 등 핵심 프로세스 표준
  - `3계층: 지침서(Work Instruction)`: 현장 실무 및 검사 지침
  - `4계층: 기록/양식(Records & Forms)`: 심사 증빙, 점검표, 모의훈련 보고서
- **D-Day 신호등 레이더 & 만기 알림:**
  - 정상 보관(녹색), 갱신 임박 D-30(주황색), 조치 필요(적색)
  - 갱신 누락 시 발생하는 **과태료, 공공입찰 감점, 세제 혜택 박탈 등 법적·사업상 리스크** 사전 안내
- **상세 뷰 & 체크리스트 & AI 초안:**
  - 규격 요구 조항 번호(Clause), 실시간 체크리스트 토글
  - AI 생성 표준 규격 문서 초안 전문 확인 및 복사/다운로드

### 2. AI 어시스턴트 상황 대화 및 문서 세트 자동 로더 (우측 40%)
- **대화형 상황 진단:** 기업의 업종, 규모, 목적(조달청 공공입찰, 투자 실사, 유통 납품 등) 분석
- **현장 시연용 4대 원클릭 프리셋:**
  1. 🏭 **제조업 / 공공조달:** 조달청 MAS 및 1차 벤더 협력사 등록용 ISO 9001/14001 필수 세트
  2. 💻 **IT/SaaS / 보안·투자:** 시리즈 A 투자 및 금융권 납품용 벤처기업인증 + ISO 27001
  3. 🥗 **식품/바이오 / 위생·안전:** 대형마트 및 마켓컬리 납품용 스마트 HACCP & ISO 22000
  4. ⚠️ **만기 점검 / 리스크 진단:** 보유 중인 벤처기업 및 ISO 인증 만기 누락 리스크 진단 및 갱신 서류 호출
- **원클릭 `[📦 이 문서 세트를 내 문서함에 불러오기]` 연동:**
  - 버튼 클릭 한 번으로 좌측 메인 문서함에 해당 산업군 맞춤 규격 문서들이 실시간으로 자동 편성

---

## 🚀 로컬 실행 방법 (Local Run)

```bash
# 1. 의존성 설치 (최초 1회)
npm install

# 2. 개발 서버 실행
npm run dev
```

브라우저에서 `http://localhost:3000` 으로 접속하면 즉시 시연 및 사용이 가능합니다.

---

## 🗄 Supabase 연동 방법 (선택 사항)

문서·프로젝트·파일은 연결된 Supabase를 기준으로 읽고 저장합니다. 연결 오류를 브라우저 저장으로 우회하지 않으며, 저장 성공은 DB 응답을 받은 후에 표시합니다.

1. 기존 프로젝트의 `.env.local`에 `NEXT_PUBLIC_SUPABASE_URL`과 공개용 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`(또는 기존 `NEXT_PUBLIC_SUPABASE_ANON_KEY`)를 설정합니다. 키를 커밋하지 마세요.
2. `NEXT_PUBLIC_DATA_MODE=cloud`로 클라우드 모드를 명시할 수 있습니다. 모드를 생략하면 유효한 Supabase 설정이 있을 때 클라우드를 사용합니다.
3. 테이블이 없는 새 프로젝트는 `supabase/schema.sql`을 먼저 실행합니다. 이 파일의 시드 데이터는 교육용입니다. **기존 프로젝트에 시드 SQL을 다시 실행하지 마세요.**
4. `supabase/platform_migration.sql`을 실행합니다. 기존 문서는 유지하며 `metadata`, `audit_projects`, 인증 프로필·파일 이력·권한 정책을 추가/정리합니다. 전체 변경은 트랜잭션으로 적용되고 재실행 가능합니다. 이 마이그레이션 전까지 기존 데모 공개 정책이 남아 있을 수 있습니다.
5. 신규 가입자는 DB 트리거가 `MEMBER` 프로필과 회사 멤버십을 생성합니다. 기존 Auth 계정에 프로필이 없다면 관리자가 해당 계정의 UUID로 `profiles`와 `company_members`를 먼저 등록해야 합니다. 기존 회사 문서는 관리자가 그 회사에 소속을 배정한 계정에서 조회할 수 있습니다. 가입 폼의 값으로 관리자 권한을 부여하지 않습니다.
6. `npm run check:connection`으로 주소와 공개 키의 연결을 점검하고, `npm run dev`에서 로그인합니다. 이 명령은 데이터나 스키마를 변경하지 않습니다.

데이터 연결 경로:

| 영역 | 코드 경로 | Supabase 저장 위치 |
| --- | --- | --- |
| 로그인 | `AuthContext` → 공유 브라우저 클라이언트 | Auth, `profiles`, `companies` |
| 문서 | `useDocuments` → `documentRepository` → `documentModel` | `documents` (DB 컬럼명과 화면 필드 변환) |
| 프로젝트 | `workspaceRepository` | `audit_projects`, `create_audit_project` RPC |
| 첨부파일 | `storageVault` | 비공개 `iso-vault` 버킷, `document_versions` |
| 감사 기록 | 문서 변경 DB 트리거 / 인증 RPC | `audit_logs` (사용자 식별은 DB에서 결정) |
| 문서 API | 요청별 서버 클라이언트 → `auth.getUser()` | 로그인 쿠키와 RLS 적용 |

선택한 회사의 문서만 메모리에 보관하고 클라우드 문서를 LocalStorage에 캐시하지 않습니다. 원본 파일은 회사/문서 경로로 업로드하고, 다운로드 시 새 서명 URL을 발급합니다. SHA-256 해시를 기록하며 바이러스 검사나 자동 승인 기능을 제공하는 것으로 표시하지 않습니다.

오프라인 수업은 `NEXT_PUBLIC_DATA_MODE=local`로 별도 실행합니다. 문서는 LocalStorage, 첨부파일은 IndexedDB에 저장합니다. 기존 로컬 문서를 클라우드로 자동 업로드하지 않습니다. 원투원 블로그 실습은 독립적인 브라우저 저장 도구이며 메모·외부 앱 연동 UI는 시연 기능입니다.

검증: `npm test`는 실제 프로젝트 SQL을 PGlite(PostgreSQL)에서 실행하여 RLS·가입 트리거·감사 로그를 검사하고, 파일의 IndexedDB 저장/재조회도 검사합니다. Supabase 플랫폼 자체의 Auth·Storage 서비스 통합은 연결된 프로젝트에서 별도로 검증해야 합니다.

---

## ☁️ Vercel 배포 방법

1. GitHub 저장소 생성 및 코드 Push:
```bash
git add .
git commit -m "feat: 인증 레이더 및 AI 문서 호출 플랫폼 프로토타입 구축"
git branch -M main
git remote add origin https://github.com/your-username/isoedu.git
git push -u origin main
```
2. [Vercel](https://vercel.com)에 로그인 후 GitHub 저장소 Import
3. 환경변수(Supabase URL/Key)가 있다면 입력 후 **Deploy** 클릭
4. 수초 내에 글로벌 CDN 주소(`https://your-app.vercel.app`)로 자동 배포 완료!

## 원투원 블로그 콘텐츠 제작 실습

홈 왼쪽의 **원투원 블로그 실습** 또는 `/practice/one-to-one`에서 시작합니다.
사업 자료, 사진 드라이브, 미팅 기록, 블로그 작성, 발행 기록의 다섯 단계로 구성됩니다.
수업 진행안과 구현 범위는 [실습 안내](docs/one-to-one-blog-workshop.md)를 참고하세요.

현재 버전은 브라우저에 자료를 저장하는 실습 도구입니다. 기본 초안과 외부 AI용 프롬프트를 제공하며,
회원 인증·외부 드라이브·양식 자동 분석·AI API·블로그 자동 발행은 연결하지 않았습니다.

검증: `node --test tests/one-to-one.test.mjs`

## 참고자료 기반 개발 관리

PPTX 36개 장표와 사업계획서를 반영하는 [작성·구현 기준](docs/reference/implementation-guide.md), [장표별 기능·디자인 연결표](docs/reference/slide-feature-map.md), [기능 레지스트리](docs/reference/feature-registry.json)를 사용합니다. 장표 번호와 기능 간 데이터 전달·화면 이동·사업 흐름을 함께 관리합니다.

### 거래처 문서 원문 뷰어

PDF·이미지는 직접 표시하고 DOC/DOCX·XLS/XLSX·PPT/PPTX는 로컬 LibreOffice로 PDF 미리보기를 자동 생성한다. Excel은 시트별 한 페이지로 표시한다. HWP는 한컴에서 생성한 PDF가 있으면 우선 사용하며, 없으면 `@ohah/hwpjs` HTML 렌더러와 pyhwp 보조 변환기를 사용한다. HWPX는 표·본문·이미지 렌더링을 제공한다. HTML 미리보기는 스크립트·외부 요청이 차단된 sandbox iframe에 표시한다. 복잡한 글꼴·개체는 원본과 배치 차이가 있을 수 있다.

- `ISOEDU_SOFFICE`: LibreOffice 실행 파일. 미설정 시 현재 Codex 번들 실행 경로 사용.
- `ISOEDU_PYTHON`: Python 실행 파일. HWP 보조 변환기 설치: 해당 Python으로 `-m pip install --target data/client-drive/pythonlibs -r scripts/preview-requirements.txt`.
- 원문은 유지하고 `data/client-drive/previews`에 원본 SHA256별 미리보기를 저장한다.
- 한컴에서 내보낸 PDF 연결: `node scripts/register-document-preview.mjs 파일ID PDF경로`.
- 현재 API는 localhost 개발 환경 전용이다. 운영 서비스에는 인증·회사별 저장 권한과 변환 실행 환경을 별도로 연결해야 한다.
