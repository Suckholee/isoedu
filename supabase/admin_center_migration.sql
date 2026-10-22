-- S01/S02/S03/S04/S21/S30~S35 & Electronic Dispatch Admin Center Migration
-- Apply after platform_migration.sql, work_tasks_migration.sql, managed_clients_migration.sql, company_projects_migration.sql.
BEGIN;

-- 1. Extend profiles & companies with metadata JSONB for rich admin/company/auditor attributes
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

-- 2. Allow platform ADMIN as well as company OWNER to manage company memberships & settings
CREATE OR REPLACE FUNCTION public.can_manage_company(c_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.is_active AND (
      p.role = 'ADMIN'
      OR EXISTS (
        SELECT 1 FROM public.company_members m
        WHERE m.user_id = p.id AND m.company_id = c_id AND m.is_active AND m.membership_role = 'OWNER'
      )
    )
  );
$$;
REVOKE ALL ON FUNCTION public.can_manage_company(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_manage_company(UUID) TO authenticated;

-- 3. Update company profile & multi-site metadata (S01, S03)
CREATE OR REPLACE FUNCTION public.update_company_profile_info(
  c_id UUID,
  next_name TEXT,
  next_industry TEXT DEFAULT '미분류',
  next_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS public.companies
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE updated_row public.companies;
BEGIN
  IF NOT public.can_edit_company(c_id) THEN
    RAISE EXCEPTION 'Company editor or owner required';
  END IF;
  IF length(trim(COALESCE(next_name, ''))) NOT BETWEEN 1 AND 180 THEN
    RAISE EXCEPTION 'Company name is required';
  END IF;

  UPDATE public.companies
  SET
    name = trim(next_name),
    industry = COALESCE(NULLIF(trim(next_industry), ''), '미분류'),
    metadata = COALESCE(metadata, '{}'::jsonb) || COALESCE(next_metadata, '{}'::jsonb)
  WHERE id = c_id
  RETURNING * INTO updated_row;

  IF updated_row.id IS NULL THEN
    RAISE EXCEPTION 'Company not found';
  END IF;

  INSERT INTO public.audit_logs(company_id, user_id, user_email, action_type, target_resource, resource_id, resource_title, details)
  VALUES (
    c_id,
    auth.uid(),
    auth.jwt()->>'email',
    'UPDATE',
    'COMPANY_SETTINGS',
    c_id,
    updated_row.name,
    jsonb_build_object('industry', updated_row.industry, 'updatedFields', jsonb_object_keys_array(COALESCE(next_metadata, '{}'::jsonb)))
  );

  RETURN updated_row;
END;
$$;

-- Helper for jsonb keys array used in audit log details
CREATE OR REPLACE FUNCTION public.jsonb_object_keys_array(input_json JSONB)
RETURNS JSONB LANGUAGE sql IMMUTABLE AS $$
  SELECT COALESCE(jsonb_agg(k), '[]'::jsonb)
  FROM jsonb_object_keys(CASE WHEN jsonb_typeof(input_json) = 'object' THEN input_json ELSE '{}'::jsonb END) AS k;
$$;

REVOKE ALL ON FUNCTION public.update_company_profile_info(UUID, TEXT, TEXT, JSONB), public.jsonb_object_keys_array(JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_company_profile_info(UUID, TEXT, TEXT, JSONB), public.jsonb_object_keys_array(JSONB) TO authenticated;

-- 4. Update active company member role (OWNER / EDITOR / VIEWER) (S04)
CREATE OR REPLACE FUNCTION public.update_company_member_role(
  c_id UUID,
  member_id UUID,
  next_role TEXT
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE existing_role TEXT;
BEGIN
  PERFORM 1 FROM public.companies WHERE id = c_id FOR UPDATE;
  IF NOT public.can_manage_company(c_id) THEN
    RAISE EXCEPTION 'Company owner required';
  END IF;
  IF next_role NOT IN ('EDITOR', 'VIEWER') THEN
    RAISE EXCEPTION 'Invalid membership role';
  END IF;

  SELECT membership_role INTO existing_role
  FROM public.company_members
  WHERE company_id = c_id AND user_id = member_id AND is_active;

  IF existing_role IS NULL THEN
    RAISE EXCEPTION 'Active membership not found';
  END IF;
  IF existing_role = 'OWNER' THEN
    RAISE EXCEPTION 'Owner role cannot be downgraded directly';
  END IF;

  UPDATE public.company_members
  SET membership_role = next_role
  WHERE company_id = c_id AND user_id = member_id AND is_active;

  INSERT INTO public.audit_logs(company_id, user_id, user_email, action_type, target_resource, details)
  VALUES (
    c_id,
    auth.uid(),
    auth.jwt()->>'email',
    'UPDATE',
    'COMPANY_MEMBERSHIP',
    jsonb_build_object('userId', member_id, 'previousRole', existing_role, 'role', next_role)
  );
END;
$$;
REVOKE ALL ON FUNCTION public.update_company_member_role(UUID, UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_company_member_role(UUID, UUID, TEXT) TO authenticated;

-- 5. Admin member profile & status update (S02, S30)
CREATE OR REPLACE FUNCTION public.admin_update_member_profile(
  target_user_id UUID,
  next_full_name TEXT DEFAULT NULL,
  next_phone TEXT DEFAULT NULL,
  next_role TEXT DEFAULT NULL,
  next_active BOOLEAN DEFAULT NULL,
  next_metadata JSONB DEFAULT NULL
) RETURNS public.profiles
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE caller_role TEXT; target_row public.profiles; updated_row public.profiles;
BEGIN
  caller_role := public.get_current_user_role();
  IF caller_role IS NULL THEN
    RAISE EXCEPTION 'Active login required';
  END IF;

  SELECT * INTO target_row FROM public.profiles WHERE id = target_user_id FOR UPDATE;
  IF target_row.id IS NULL THEN
    RAISE EXCEPTION 'Member profile not found';
  END IF;

  -- Non-ADMIN can only update their own name, phone, and metadata
  IF caller_role <> 'ADMIN' THEN
    IF target_user_id <> auth.uid() THEN
      RAISE EXCEPTION 'Platform admin required to modify another member';
    END IF;
    IF (next_role IS NOT NULL AND next_role <> target_row.role)
       OR (next_active IS NOT NULL AND next_active <> target_row.is_active) THEN
      RAISE EXCEPTION 'Platform admin required to change role or active status';
    END IF;
  END IF;

  -- Prevent self-lockout for ADMIN
  IF target_user_id = auth.uid() THEN
    IF next_active = false THEN
      RAISE EXCEPTION 'Cannot deactivate your own account';
    END IF;
    IF caller_role = 'ADMIN' AND next_role IS NOT NULL AND next_role <> 'ADMIN' THEN
      RAISE EXCEPTION 'Cannot demote your own admin role';
    END IF;
  END IF;

  IF next_role IS NOT NULL AND next_role NOT IN ('ADMIN', 'AUDITOR', 'MEMBER') THEN
    RAISE EXCEPTION 'Invalid member role';
  END IF;

  UPDATE public.profiles
  SET
    full_name = COALESCE(NULLIF(trim(next_full_name), ''), full_name),
    phone = CASE WHEN next_phone IS NULL THEN phone ELSE trim(next_phone) END,
    role = COALESCE(next_role, role),
    is_active = COALESCE(next_active, is_active),
    metadata = CASE WHEN next_metadata IS NULL THEN metadata ELSE COALESCE(metadata, '{}'::jsonb) || next_metadata END,
    updated_at = now()
  WHERE id = target_user_id
  RETURNING * INTO updated_row;

  INSERT INTO public.audit_logs(company_id, user_id, user_email, action_type, target_resource, resource_id, resource_title, details)
  VALUES (
    updated_row.company_id,
    auth.uid(),
    auth.jwt()->>'email',
    'UPDATE',
    'MEMBER_PROFILE',
    updated_row.id,
    updated_row.full_name,
    jsonb_build_object(
      'targetUserId', updated_row.id,
      'role', updated_row.role,
      'isActive', updated_row.is_active
    )
  );

  RETURN updated_row;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_update_member_profile(UUID, TEXT, TEXT, TEXT, BOOLEAN, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_update_member_profile(UUID, TEXT, TEXT, TEXT, BOOLEAN, JSONB) TO authenticated;

-- 6. Electronic Dispatch Queue & History Table (전자발송 대장: S04, S25, S27, S34)
CREATE TABLE IF NOT EXISTS public.electronic_dispatches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  channel TEXT NOT NULL CHECK (channel IN ('EMAIL', 'ALIMTALK', 'SMS')),
  template_key TEXT NOT NULL,
  recipient_name TEXT NOT NULL DEFAULT '',
  recipient_contact TEXT NOT NULL CHECK (length(trim(recipient_contact)) BETWEEN 1 AND 200),
  subject TEXT NOT NULL CHECK (length(trim(subject)) BETWEEN 1 AND 300),
  body TEXT NOT NULL CHECK (length(trim(body)) BETWEEN 1 AND 10000),
  status TEXT NOT NULL DEFAULT 'QUEUED' CHECK (status IN ('QUEUED', 'MAILTO_OPENED', 'COPIED', 'SENT', 'FAILED')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.electronic_dispatches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Read electronic dispatches" ON public.electronic_dispatches;
CREATE POLICY "Read electronic dispatches" ON public.electronic_dispatches
  FOR SELECT TO authenticated
  USING (
    created_by = auth.uid()
    OR (company_id IS NOT NULL AND public.can_read_company(company_id))
    OR COALESCE(public.get_current_user_role() = 'ADMIN', false)
  );
REVOKE ALL ON public.electronic_dispatches FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.electronic_dispatches TO authenticated;

CREATE OR REPLACE FUNCTION public.create_electronic_dispatch(payload JSONB)
RETURNS public.electronic_dispatches
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  target_company UUID;
  ch TEXT;
  st TEXT;
  result public.electronic_dispatches;
BEGIN
  IF public.get_current_user_role() IS NULL THEN
    RAISE EXCEPTION 'Active login required';
  END IF;

  IF NULLIF(payload->>'companyId', '') IS NOT NULL THEN
    target_company := (payload->>'companyId')::uuid;
    IF NOT public.can_edit_company(target_company) AND NOT public.can_manage_company(target_company) THEN
      RAISE EXCEPTION 'Company permission required for electronic dispatch';
    END IF;
  END IF;

  ch := COALESCE(NULLIF(trim(payload->>'channel'), ''), 'EMAIL');
  IF ch NOT IN ('EMAIL', 'ALIMTALK', 'SMS') THEN
    RAISE EXCEPTION 'Invalid dispatch channel';
  END IF;

  st := COALESCE(NULLIF(trim(payload->>'status'), ''), 'QUEUED');
  IF st NOT IN ('QUEUED', 'MAILTO_OPENED', 'COPIED', 'SENT', 'FAILED') THEN
    st := 'QUEUED';
  END IF;

  IF length(trim(COALESCE(payload->>'recipientContact', ''))) = 0 THEN
    RAISE EXCEPTION 'Recipient contact is required';
  END IF;
  IF length(trim(COALESCE(payload->>'subject', ''))) = 0 THEN
    RAISE EXCEPTION 'Dispatch subject is required';
  END IF;
  IF length(trim(COALESCE(payload->>'body', ''))) = 0 THEN
    RAISE EXCEPTION 'Dispatch body is required';
  END IF;

  INSERT INTO public.electronic_dispatches(
    company_id, created_by, channel, template_key, recipient_name, recipient_contact, subject, body, status, metadata
  ) VALUES (
    target_company,
    auth.uid(),
    ch,
    COALESCE(NULLIF(trim(payload->>'templateKey'), ''), 'CUSTOM'),
    COALESCE(trim(payload->>'recipientName'), ''),
    trim(payload->>'recipientContact'),
    trim(payload->>'subject'),
    trim(payload->>'body'),
    st,
    COALESCE(payload->'metadata', '{}'::jsonb)
  ) RETURNING * INTO result;

  INSERT INTO public.audit_logs(company_id, user_id, user_email, action_type, target_resource, resource_id, resource_title, details)
  VALUES (
    target_company,
    auth.uid(),
    auth.jwt()->>'email',
    'CREATE',
    'ELECTRONIC_DISPATCH',
    result.id,
    result.subject,
    jsonb_build_object(
      'channel', result.channel,
      'templateKey', result.template_key,
      'recipientContact', result.recipient_contact,
      'status', result.status
    )
  );

  RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.create_electronic_dispatch(JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_electronic_dispatch(JSONB) TO authenticated;

-- 7. Pre-registered Member & Trainee Roster Table (회원·수강생 단건/CSV 일괄 등록 및 수료 관리: S02, B01, B02)
CREATE TABLE IF NOT EXISTS public.member_roster (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL CHECK (length(trim(email)) BETWEEN 3 AND 200),
  full_name TEXT NOT NULL CHECK (length(trim(full_name)) BETWEEN 1 AND 120),
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'MEMBER' CHECK (role IN ('ADMIN', 'AUDITOR', 'MEMBER')),
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  company_name TEXT NOT NULL DEFAULT '어니스톤 교육생',
  is_active BOOLEAN NOT NULL DEFAULT true,
  linked_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.member_roster ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Read member roster" ON public.member_roster;
CREATE POLICY "Read member roster" ON public.member_roster
  FOR SELECT TO authenticated
  USING (
    COALESCE(public.get_current_user_role() = 'ADMIN', false)
    OR created_by = auth.uid()
    OR (company_id IS NOT NULL AND public.can_read_company(company_id))
  );
REVOKE ALL ON public.member_roster FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.member_roster TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_upsert_member_roster(payload JSONB)
RETURNS public.member_roster
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  clean_email TEXT;
  clean_name TEXT;
  clean_role TEXT;
  target_company UUID;
  matched_profile UUID;
  merged_meta JSONB;
  result_row public.member_roster;
BEGIN
  IF public.get_current_user_role() IS NULL THEN
    RAISE EXCEPTION 'Active login required';
  END IF;

  clean_email := lower(trim(COALESCE(payload->>'email', '')));
  clean_name := trim(COALESCE(payload->>'fullName', ''));
  IF length(clean_email) < 3 OR position('@' IN clean_email) = 0 THEN
    RAISE EXCEPTION 'Valid email is required';
  END IF;
  IF length(clean_name) = 0 THEN
    RAISE EXCEPTION 'Full name is required';
  END IF;

  clean_role := COALESCE(NULLIF(upper(trim(payload->>'role')), ''), 'MEMBER');
  IF clean_role NOT IN ('ADMIN', 'AUDITOR', 'MEMBER') THEN
    clean_role := 'MEMBER';
  END IF;
  IF clean_role = 'ADMIN' AND COALESCE(public.get_current_user_role(), '') <> 'ADMIN' THEN
    RAISE EXCEPTION 'Platform admin required to assign ADMIN role';
  END IF;

  IF NULLIF(payload->>'companyId', '') IS NOT NULL THEN
    target_company := (payload->>'companyId')::uuid;
    IF COALESCE(public.get_current_user_role(), '') <> 'ADMIN'
       AND NOT public.can_edit_company(target_company)
       AND NOT public.can_manage_company(target_company) THEN
      RAISE EXCEPTION 'Company editor/owner or platform admin required';
    END IF;
  ELSIF COALESCE(public.get_current_user_role(), '') <> 'ADMIN' THEN
    RAISE EXCEPTION 'Company editor/owner or platform admin required';
  END IF;

  merged_meta := jsonb_build_object(
    'cohort', COALESCE(trim(payload->>'cohort'), ''),
    'courseName', COALESCE(trim(payload->>'courseName'), ''),
    'completionStatus', COALESCE(NULLIF(upper(trim(payload->>'completionStatus')), ''), 'NONE'),
    'certificateNo', COALESCE(trim(payload->>'certificateNo'), ''),
    'completionDate', COALESCE(trim(payload->>'completionDate'), ''),
    'adminMemo', COALESCE(trim(payload->>'adminMemo'), ''),
    'department', COALESCE(trim(payload->>'department'), '')
  ) || COALESCE(payload->'metadata', '{}'::jsonb);

  SELECT id INTO matched_profile FROM public.profiles WHERE lower(email) = clean_email LIMIT 1;

  INSERT INTO public.member_roster(
    email, full_name, phone, role, company_id, company_name, is_active, linked_profile_id, metadata, created_by, updated_at
  ) VALUES (
    clean_email,
    clean_name,
    NULLIF(trim(COALESCE(payload->>'phone', '')), ''),
    clean_role,
    target_company,
    COALESCE(NULLIF(trim(payload->>'companyName'), ''), '어니스톤 교육생'),
    COALESCE((payload->>'isActive')::boolean, true),
    matched_profile,
    merged_meta,
    auth.uid(),
    now()
  )
  ON CONFLICT (email) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone = COALESCE(EXCLUDED.phone, public.member_roster.phone),
    role = EXCLUDED.role,
    company_id = COALESCE(EXCLUDED.company_id, public.member_roster.company_id),
    company_name = COALESCE(NULLIF(EXCLUDED.company_name, ''), public.member_roster.company_name),
    is_active = EXCLUDED.is_active,
    linked_profile_id = COALESCE(matched_profile, public.member_roster.linked_profile_id),
    metadata = COALESCE(public.member_roster.metadata, '{}'::jsonb) || EXCLUDED.metadata,
    updated_at = now()
  RETURNING * INTO result_row;

  -- If an Auth profile with this email already exists and caller is ADMIN, sync metadata & fields
  IF matched_profile IS NOT NULL AND COALESCE(public.get_current_user_role(), '') = 'ADMIN' THEN
    UPDATE public.profiles
    SET
      full_name = clean_name,
      phone = COALESCE(NULLIF(trim(COALESCE(payload->>'phone', '')), ''), phone),
      role = clean_role,
      company_id = COALESCE(target_company, company_id),
      metadata = COALESCE(metadata, '{}'::jsonb) || merged_meta,
      updated_at = now()
    WHERE id = matched_profile;
  END IF;

  INSERT INTO public.audit_logs(company_id, user_id, user_email, action_type, target_resource, resource_id, resource_title, details)
  VALUES (
    target_company,
    auth.uid(),
    auth.jwt()->>'email',
    'UPSERT',
    'MEMBER_ROSTER',
    result_row.id,
    result_row.full_name,
    jsonb_build_object(
      'email', result_row.email,
      'role', result_row.role,
      'cohort', merged_meta->>'cohort',
      'completionStatus', merged_meta->>'completionStatus',
      'certificateNo', merged_meta->>'certificateNo'
    )
  );

  RETURN result_row;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_upsert_member_roster(JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_upsert_member_roster(JSONB) TO authenticated;

-- 8. Custom Electronic Dispatch Templates Table (관리자 커스텀 발송 템플릿: S32, S34)
CREATE TABLE IF NOT EXISTS public.dispatch_custom_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL DEFAULT '관리자 커스텀 템플릿',
  title TEXT NOT NULL CHECK (length(trim(title)) BETWEEN 1 AND 160),
  default_channel TEXT NOT NULL DEFAULT 'EMAIL' CHECK (default_channel IN ('EMAIL', 'ALIMTALK', 'SMS')),
  subject_template TEXT NOT NULL CHECK (length(trim(subject_template)) BETWEEN 1 AND 300),
  body_template TEXT NOT NULL CHECK (length(trim(body_template)) BETWEEN 1 AND 10000),
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.dispatch_custom_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Read dispatch custom templates" ON public.dispatch_custom_templates;
CREATE POLICY "Read dispatch custom templates" ON public.dispatch_custom_templates
  FOR SELECT TO authenticated
  USING (true);
REVOKE ALL ON public.dispatch_custom_templates FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.dispatch_custom_templates TO authenticated;

CREATE OR REPLACE FUNCTION public.upsert_dispatch_custom_template(payload JSONB)
RETURNS public.dispatch_custom_templates
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  t_key TEXT;
  t_title TEXT;
  t_channel TEXT;
  t_subject TEXT;
  t_body TEXT;
  result_row public.dispatch_custom_templates;
BEGIN
  IF public.get_current_user_role() IS NULL THEN
    RAISE EXCEPTION 'Active login required';
  END IF;

  t_key := COALESCE(
    NULLIF(trim(payload->>'key'), ''),
    NULLIF(trim(payload->>'templateKey'), ''),
    'CUSTOM_' || replace(gen_random_uuid()::text, '-', '')
  );
  t_title := trim(COALESCE(payload->>'title', ''));
  t_channel := COALESCE(NULLIF(upper(trim(payload->>'defaultChannel')), ''), 'EMAIL');
  t_subject := trim(COALESCE(NULLIF(payload->>'subjectTemplate', ''), payload->>'subject', ''));
  t_body := trim(COALESCE(NULLIF(payload->>'bodyTemplate', ''), payload->>'body', ''));

  IF length(t_title) = 0 OR length(t_subject) = 0 OR length(t_body) = 0 THEN
    RAISE EXCEPTION 'Template title, subject, and body are required';
  END IF;
  IF t_channel NOT IN ('EMAIL', 'ALIMTALK', 'SMS') THEN
    t_channel := 'EMAIL';
  END IF;

  INSERT INTO public.dispatch_custom_templates(
    template_key, category, title, default_channel, subject_template, body_template, attachments, created_by, updated_at
  ) VALUES (
    t_key,
    COALESCE(NULLIF(trim(payload->>'category'), ''), '관리자 커스텀 템플릿'),
    t_title,
    t_channel,
    t_subject,
    t_body,
    COALESCE(payload->'attachments', '[]'::jsonb),
    auth.uid(),
    now()
  )
  ON CONFLICT (template_key) DO UPDATE SET
    category = EXCLUDED.category,
    title = EXCLUDED.title,
    default_channel = EXCLUDED.default_channel,
    subject_template = EXCLUDED.subject_template,
    body_template = EXCLUDED.body_template,
    attachments = EXCLUDED.attachments,
    updated_at = now()
  RETURNING * INTO result_row;

  RETURN result_row;
END;
$$;
REVOKE ALL ON FUNCTION public.upsert_dispatch_custom_template(JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.upsert_dispatch_custom_template(JSONB) TO authenticated;

NOTIFY pgrst, 'reload schema';
COMMIT;
