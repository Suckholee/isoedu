-- =======================================================
-- ISOEdu & Certification Radar - Supabase Database Schema
-- =======================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Companies (고객사 및 프로필)
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    industry TEXT NOT NULL, -- 제조업, IT/SaaS, 바이오/식품, 유통/서비스
    business_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Certifications (인증 규격 카테고리)
CREATE TABLE IF NOT EXISTS public.certifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL, -- ISO_9001, ISO_14001, ISO_27001, VENTURE, INNOBIZ, HACCP 등
    name TEXT NOT NULL,
    category TEXT NOT NULL, -- 품질, 환경, 정보보안, 혁신기업, 안전 등
    issuing_body TEXT,
    cycle_years INT DEFAULT 3,
    surveillance_months INT DEFAULT 12,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Documents (체계적 관리 대상 문서 - 핵심 테이블)
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    certification_code TEXT NOT NULL,
    hierarchy_level TEXT NOT NULL, -- LEVEL_1(매뉴얼), LEVEL_2(절차서), LEVEL_3(지침서), LEVEL_4(기록/양식), CERT(인증서)
    clause_number TEXT, -- ISO 표준 요구사항 번호 (예: 4.1, 7.5, 8.2)
    code TEXT, -- 문서 관리 번호 (예: QM-01, SOP-04, FORM-12)
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'READY', -- DRAFT(작성중), READY(작성완료), EXPIRING(갱신임박), EXPIRED(만료), ACTION_NEEDED(조치필요)
    expiry_date DATE,
    d_day INT,
    penalty_risk TEXT, -- 만기/누락 시 과태료 또는 제재사항
    summary TEXT,
    content_draft TEXT, -- AI 생성 규격 문서 초안 텍스트
    checklist JSONB DEFAULT '[]'::jsonb, -- 필수 구비 항목 체크리스트
    file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. AI Consultation Logs & Recommendations (AI 대화 및 문서 추천 이력)
CREATE TABLE IF NOT EXISTS public.ai_consultation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    scenario_title TEXT,
    user_prompt TEXT NOT NULL,
    ai_response TEXT NOT NULL,
    recommended_docs JSONB,
    is_imported BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Row Level Security (RLS) Enablement
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_consultation_logs ENABLE ROW LEVEL SECURITY;

-- Allow public read/write for demo/educational purposes
CREATE POLICY "Allow public read access on all tables" ON public.companies FOR ALL USING (true);
CREATE POLICY "Allow public read access on certifications" ON public.certifications FOR ALL USING (true);
CREATE POLICY "Allow public read access on documents" ON public.documents FOR ALL USING (true);
CREATE POLICY "Allow public read access on ai_consultation_logs" ON public.ai_consultation_logs FOR ALL USING (true);

-- 6. Seed Initial Data
INSERT INTO public.companies (id, name, industry, business_number)
VALUES ('11111111-1111-1111-1111-111111111111', '(주)하이테크정밀', '제조업 (정밀가공/금속)', '124-81-99201')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.documents (
    company_id, certification_code, hierarchy_level, clause_number, code, title, status, expiry_date, d_day, penalty_risk, summary, content_draft, checklist
) VALUES 
(
    '11111111-1111-1111-1111-111111111111',
    'ISO_9001',
    'CERT',
    '공식인증',
    'CERT-ISO9001-2024',
    'ISO 9001:2015 품질경영시스템 인증서',
    'EXPIRING',
    '2026-10-15',
    37,
    '만기 시 조달청 다수공급자계약(MAS) 가점 박탈 및 현대/기아차 1차 협력사 벤더 등록 취소 위험',
    '품질경영시스템 국제표준 규격 인증서 (발급기관: KSA 한국표준협회)',
    '인증등록번호: QMS-2023-8891 / 최초인증일: 2023-10-16 / 만기일: 2026-10-15',
    '[{"text": "인증서 원본 스캔본 등록 확인", "done": true}, {"text": "인증 유효기간(3년) 확인", "done": true}, {"text": "차기 사후심사 일정 사전 조율", "done": false}]'::jsonb
),
(
    '11111111-1111-1111-1111-111111111111',
    'VENTURE',
    'CERT',
    '법정확인서',
    'CERT-VENT-2024',
    '벤처기업확인서 (혁신성장유형)',
    'READY',
    '2027-04-30',
    234,
    '만기 시 법인세/소득세 50% 감면 혜택 즉시 소멸 및 신용보증기금 우대보증 중단',
    '벤처기업육성에 관한 특별조치법 제25조에 따른 혁신성장형 벤처기업 인증',
    '확인번호: 2024-0412-0091 / 유형: 혁신성장유형 / 유효기간: 2024-05-01 ~ 2027-04-30',
    '[{"text": "벤처확인기관 평가보고서 보관", "done": true}, {"text": "연구개발비 투자 비율 증빙 구비", "done": true}]'::jsonb
),
(
    '11111111-1111-1111-1111-111111111111',
    'ISO_9001',
    'LEVEL_1',
    'Clause 4~10',
    'QM-01',
    '품질경영 매뉴얼 (Quality Manual)',
    'READY',
    '2026-12-31',
    114,
    '심사 시 매뉴얼 미비 또는 최신화 누락 시 중부적합 판정으로 인증 취소',
    '조직의 상황, 리더십, 품질방침, 기획, 지원, 운용, 성과평가 및 개선 총괄 규정',
    '# 제1장 조직의 상황 및 품질방침\n1.1 목적: 품질경영시스템 구축 및 고객만족 보장\n1.2 품질방침: 불량률 0.01% 도전',
    '[{"text": "최고경영자 품질방침 서명", "done": true}, {"text": "품질목표 수립 완료", "done": true}]'::jsonb
),
(
    '11111111-1111-1111-1111-111111111111',
    'ISO_9001',
    'LEVEL_2',
    'Clause 7.5',
    'QP-01',
    '문서 및 기록관리 절차서 (Document Control SOP)',
    'READY',
    '2026-12-31',
    114,
    '버전 관리 실패로 인한 구버전 도면/절차서 현장 적용 시 불량 발생 및 심사 부적합',
    '사내 표준 문서의 제정, 개정, 승인, 배포, 보관 및 폐기 절차',
    '# 문서 및 기록관리 절차서 (QP-01)\n1. 적용 범위: 회사의 모든 품질경영시스템 관련 사내 표준 및 외부 문서.',
    '[{"text": "문서 제/개정 승인권자 전결표 작성", "done": true}, {"text": "최신본 관리대장 현행화", "done": true}]'::jsonb
),
(
    '11111111-1111-1111-1111-111111111111',
    'ISO_9001',
    'LEVEL_2',
    'Clause 9.2',
    'QP-05',
    '내부 품질심사 절차서 (Internal Audit SOP)',
    'ACTION_NEEDED',
    '2026-10-01',
    23,
    '연 1회 이상 내부심사 미실시 시 사후/갱신 심사 통과 불가 (심사 거절 사유)',
    '연간 내부심사 계획 수립, 심사원 자격 부여, 심사 수행 및 시정조치 프로세스',
    '# 내부심사 절차서 (QP-05)\n심사원은 자신의 직무에 대해 심사를 수행할 수 없다.',
    '[{"text": "내부심사원 자격 인정 기준", "done": false}, {"text": "내부심사 계획서 승인", "done": true}]'::jsonb
);
