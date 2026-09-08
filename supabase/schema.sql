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
