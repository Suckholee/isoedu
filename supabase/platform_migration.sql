BEGIN;
-- ==============================================================================
-- ISOEdu Enterprise Platform Migration & Security Hardening
-- Multi-Tenancy, Membership Profiles, Document Revisions, Audit Logs & Strict RLS
-- ==============================================================================

-- 1. Profiles Table (회원 프로필 및 권한 체계)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'MEMBER' CHECK (role IN ('ADMIN', 'AUDITOR', 'MEMBER')),
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    phone TEXT,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Company Members Table (기업별 다중 회원 및 테넌트 멤버십)
CREATE TABLE IF NOT EXISTS public.company_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    membership_role TEXT NOT NULL DEFAULT 'EDITOR' CHECK (membership_role IN ('OWNER', 'EDITOR', 'VIEWER')),
    invited_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(company_id, user_id)
);

-- 3. Document Versions Table (ISO 9001 규격 준수: 문서 제/개정 이력 및 전자 결재선)
CREATE TABLE IF NOT EXISTS public.document_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    rev_no INT NOT NULL DEFAULT 0, -- Rev 0, Rev 1, Rev 2...
    change_reason TEXT NOT NULL, -- 개정 사유 (예: 2026년 내부심사 지적사항 반영 및 부서명 변경)
    author_id UUID REFERENCES public.profiles(id),
    author_name TEXT NOT NULL,
    approved_by TEXT, -- 승인권자 (예: 품질책임이사, 대표이사)
    approved_at TIMESTAMP WITH TIME ZONE,
    file_path TEXT, -- Supabase Storage Vault 경로
    file_name TEXT,
    file_size BIGINT,
    checksum TEXT,
    content_snapshot TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Audit Logs Table (보안 및 ISO 감사 추적 로그 - 열람, 수정, 다운로드, 결재)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    user_email TEXT,
    action_type TEXT NOT NULL, -- VIEW, CREATE, UPDATE, DELETE, DOWNLOAD, APPROVE
    target_resource TEXT NOT NULL, -- DOCUMENT, AUDIT_PROJECT, COMPANY_SETTINGS
    resource_id UUID,
    resource_title TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Storage Bucket Configuration for 'iso-vault'
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'iso-vault',
    'iso-vault',
    false, -- Private bucket (Signed URL or Authenticated Token required)
    52428800, -- 50MB
    ARRAY[
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/x-hwp',
        'image/png',
        'image/jpeg'
    ]
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 52428800;

-- ==============================================================================
-- 6. Row Level Security (RLS) - 보안 격리 및 테넌트 분리 정책
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Existing projects can rerun this migration. Apply after schema.sql.
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid() AND is_active;
$$;

CREATE OR REPLACE FUNCTION public.is_member_of_company(c_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
    SELECT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_active
        AND (p.company_id = c_id OR EXISTS (SELECT 1 FROM public.company_members m
            WHERE m.company_id = c_id AND m.user_id = p.id)));
$$;

CREATE OR REPLACE FUNCTION public.can_read_company(c_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
    SELECT COALESCE(public.get_current_user_role() IN ('ADMIN', 'AUDITOR'), false)
        OR public.is_member_of_company(c_id);
$$;

CREATE OR REPLACE FUNCTION public.can_edit_company(c_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
    SELECT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_active AND (
        p.role = 'ADMIN' OR (p.role = 'MEMBER' AND (
            EXISTS (SELECT 1 FROM public.company_members m WHERE m.user_id = p.id
                AND m.company_id = c_id AND m.membership_role IN ('OWNER', 'EDITOR'))
            OR (p.company_id = c_id AND NOT EXISTS (SELECT 1 FROM public.company_members m
                WHERE m.user_id = p.id AND m.company_id = c_id))
        ))));
$$;

REVOKE ALL ON FUNCTION public.get_current_user_role(), public.is_member_of_company(UUID),
    public.can_read_company(UUID), public.can_edit_company(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_current_user_role(), public.is_member_of_company(UUID),
    public.can_read_company(UUID), public.can_edit_company(UUID) TO authenticated;

DROP POLICY IF EXISTS "Users can view their own profile and teammates" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile and teammates" ON public.profiles FOR SELECT TO authenticated
    USING (id = auth.uid() OR public.can_read_company(company_id));
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated
    USING (id = auth.uid()) WITH CHECK (id = auth.uid());
-- Row ownership does not authorize changing role or company membership.
REVOKE ALL ON public.profiles FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.profiles FROM authenticated;
GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE (full_name, phone, avatar_url) ON public.profiles TO authenticated;

DROP POLICY IF EXISTS "Members can view memberships" ON public.company_members;
CREATE POLICY "Members can view memberships" ON public.company_members FOR SELECT TO authenticated
    USING (user_id = auth.uid() OR public.get_current_user_role() = 'ADMIN');

DROP POLICY IF EXISTS "Allow public read access on all tables" ON public.companies;
DROP POLICY IF EXISTS "Company members can read companies" ON public.companies;
CREATE POLICY "Company members can read companies" ON public.companies FOR SELECT TO authenticated
    USING (public.can_read_company(id));
REVOKE ALL ON public.companies FROM anon;

DROP POLICY IF EXISTS "Allow public read access on documents" ON public.documents;
DROP POLICY IF EXISTS "Public demo view documents" ON public.documents;
DROP POLICY IF EXISTS "Multi-tenant document isolation" ON public.documents;
DROP POLICY IF EXISTS "Authorized members can insert documents" ON public.documents;
DROP POLICY IF EXISTS "Authorized members can update documents" ON public.documents;
DROP POLICY IF EXISTS "Authorized members can delete documents" ON public.documents;
CREATE POLICY "Multi-tenant document isolation" ON public.documents FOR SELECT TO authenticated
    USING (public.can_read_company(company_id));
CREATE POLICY "Authorized members can insert documents" ON public.documents FOR INSERT TO authenticated
    WITH CHECK (public.can_edit_company(company_id));
CREATE POLICY "Authorized members can update documents" ON public.documents FOR UPDATE TO authenticated
    USING (public.can_edit_company(company_id)) WITH CHECK (public.can_edit_company(company_id));
CREATE POLICY "Authorized members can delete documents" ON public.documents FOR DELETE TO authenticated
    USING (public.can_edit_company(company_id));
REVOKE ALL ON public.documents FROM anon;

DROP POLICY IF EXISTS "Allow public read access on ai_consultation_logs" ON public.ai_consultation_logs;
DROP POLICY IF EXISTS "Company members can read consultations" ON public.ai_consultation_logs;
CREATE POLICY "Company members can read consultations" ON public.ai_consultation_logs FOR SELECT TO authenticated
    USING (public.can_read_company(company_id));
REVOKE ALL ON public.ai_consultation_logs FROM anon;

DROP POLICY IF EXISTS "Admins and Auditors can view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "System can record audit logs" ON public.audit_logs;
CREATE POLICY "Admins and Auditors can view audit logs" ON public.audit_logs FOR SELECT TO authenticated
    USING (public.can_read_company(company_id));
REVOKE ALL ON public.audit_logs FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.audit_logs FROM authenticated;

CREATE OR REPLACE FUNCTION public.audit_document_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE doc public.documents;
BEGIN
    IF TG_OP = 'DELETE' THEN doc := OLD; ELSE doc := NEW; END IF;
    INSERT INTO public.audit_logs (company_id, user_id, user_email, action_type, target_resource, resource_id, resource_title)
    VALUES (doc.company_id, (SELECT id FROM public.profiles WHERE id = auth.uid()),
        auth.jwt()->>'email', TG_OP, 'DOCUMENT', doc.id, doc.title);
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS audit_document_change ON public.documents;
CREATE TRIGGER audit_document_change AFTER INSERT OR UPDATE OR DELETE ON public.documents
    FOR EACH ROW EXECUTE FUNCTION public.audit_document_change();

CREATE OR REPLACE FUNCTION public.record_auth_event(event_type TEXT)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
    IF auth.uid() IS NULL OR event_type NOT IN ('LOGIN', 'LOGOUT') THEN
        RAISE EXCEPTION 'Invalid authentication event';
    END IF;
    INSERT INTO public.audit_logs (company_id, user_id, user_email, action_type, target_resource)
    SELECT company_id, id, email, event_type, 'AUTH' FROM public.profiles WHERE id = auth.uid();
END;
$$;
REVOKE ALL ON FUNCTION public.record_auth_event(TEXT), public.audit_document_change() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_auth_event(TEXT) TO authenticated;

-- Signup metadata never determines role or access to an existing company.
CREATE OR REPLACE FUNCTION public.create_member_profile()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE company UUID; member_name TEXT;
BEGIN
    member_name := COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name', ''), split_part(NEW.email, '@', 1));
    INSERT INTO public.companies(name, industry)
    VALUES (COALESCE(NULLIF(NEW.raw_user_meta_data->>'company_name', ''), member_name || ' 워크스페이스'), '미분류') RETURNING id INTO company;
    INSERT INTO public.profiles(id, email, full_name, role, company_id)
    VALUES (NEW.id, NEW.email, member_name, 'MEMBER', company);
    INSERT INTO public.company_members(company_id, user_id, membership_role)
    VALUES (company, NEW.id, 'OWNER');
    RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.create_member_profile() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS isoedu_create_member_profile ON auth.users;
CREATE TRIGGER isoedu_create_member_profile AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.create_member_profile();

DROP POLICY IF EXISTS "Members can read document versions" ON public.document_versions;
DROP POLICY IF EXISTS "Editors can insert document versions" ON public.document_versions;
CREATE POLICY "Members can read document versions" ON public.document_versions FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.documents d WHERE d.id = document_id AND public.can_read_company(d.company_id)));
CREATE POLICY "Editors can insert document versions" ON public.document_versions FOR INSERT TO authenticated
    WITH CHECK (author_id = auth.uid() AND EXISTS (SELECT 1 FROM public.documents d
        WHERE d.id = document_id AND public.can_edit_company(d.company_id)
        AND file_path LIKE 'companies/' || d.company_id::text || '/' || d.id::text || '/%'));
REVOKE ALL ON public.document_versions FROM anon;

DROP POLICY IF EXISTS "Tenants can access their own storage folder" ON storage.objects;
DROP POLICY IF EXISTS "Members can read vault files" ON storage.objects;
DROP POLICY IF EXISTS "Editors can insert vault files" ON storage.objects;
DROP POLICY IF EXISTS "Editors can delete vault files" ON storage.objects;
CREATE POLICY "Members can read vault files" ON storage.objects FOR SELECT TO authenticated
    USING (bucket_id = 'iso-vault' AND EXISTS (SELECT 1 FROM public.documents d
        WHERE d.company_id::text = (storage.foldername(name))[2] AND d.id::text = (storage.foldername(name))[3]
        AND public.can_read_company(d.company_id)));
CREATE POLICY "Editors can insert vault files" ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'iso-vault' AND EXISTS (SELECT 1 FROM public.documents d
        WHERE d.company_id::text = (storage.foldername(name))[2] AND d.id::text = (storage.foldername(name))[3]
        AND public.can_edit_company(d.company_id)));
CREATE POLICY "Editors can delete vault files" ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'iso-vault' AND EXISTS (SELECT 1 FROM public.documents d
        WHERE d.company_id::text = (storage.foldername(name))[2] AND d.id::text = (storage.foldername(name))[3]
        AND public.can_edit_company(d.company_id)));

CREATE TABLE IF NOT EXISTS public.audit_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members can read projects" ON public.audit_projects;
DROP POLICY IF EXISTS "Editors can update projects" ON public.audit_projects;
CREATE POLICY "Members can read projects" ON public.audit_projects FOR SELECT TO authenticated
    USING (public.can_read_company(company_id));
CREATE POLICY "Editors can update projects" ON public.audit_projects FOR UPDATE TO authenticated
    USING (public.can_edit_company(company_id)) WITH CHECK (public.can_edit_company(company_id));
REVOKE ALL ON public.audit_projects FROM anon;
GRANT SELECT, UPDATE ON public.audit_projects TO authenticated;

CREATE OR REPLACE FUNCTION public.create_audit_project(project_data JSONB)
RETURNS public.audit_projects LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE company UUID; result public.audit_projects;
BEGIN
    IF COALESCE(public.get_current_user_role(), '') NOT IN ('ADMIN', 'MEMBER') THEN
        RAISE EXCEPTION 'Project creation requires an active member';
    END IF;
    IF length(trim(COALESCE(project_data->>'clientName', ''))) = 0 THEN
        RAISE EXCEPTION 'Company name is required';
    END IF;
    INSERT INTO public.companies(name, industry)
    VALUES (project_data->>'clientName', COALESCE(project_data->>'industry', '미분류')) RETURNING id INTO company;
    INSERT INTO public.company_members(company_id, user_id, membership_role) VALUES (company, auth.uid(), 'OWNER');
    INSERT INTO public.audit_projects(company_id, data) VALUES (company, project_data - 'id' - 'companyId') RETURNING * INTO result;
    RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.create_audit_project(JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_audit_project(JSONB) TO authenticated;

COMMIT;
