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

> **안내:** 본 프로토타입은 **하이브리드 모드**를 지원합니다. Supabase 환경변수가 설정되지 않아도 브라우저 LocalStorage 및 내장 시드 DB를 통해 오프라인 환경이나 발표장에서도 100% 정상 작동합니다.

1. [Supabase](https://supabase.com) 프로젝트 생성
2. `supabase/schema.sql` 의 쿼리를 Supabase **SQL Editor**에 복사하여 실행 (테이블 생성 및 RLS 설정)
3. `.env.local` 파일 생성 후 키 입력:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

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
