-- S02/S03/S04 -> S07/S12/S13 -> S05/S11. Apply after platform/work_tasks migrations.
BEGIN;
ALTER TABLE public.company_members ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.company_members ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ;
-- Tombstones are retained so the legacy profile.company_id cannot restore access.
CREATE OR REPLACE FUNCTION public.is_member_of_company(c_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.is_active AND
  (EXISTS(SELECT 1 FROM public.company_members m WHERE m.company_id=c_id AND m.user_id=p.id AND m.is_active)
   OR (p.company_id=c_id AND NOT EXISTS(SELECT 1 FROM public.company_members m WHERE m.company_id=c_id AND m.user_id=p.id))));
$$;
CREATE OR REPLACE FUNCTION public.can_read_company(c_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT COALESCE(public.get_current_user_role()='ADMIN',false) OR public.is_member_of_company(c_id);
$$;
CREATE OR REPLACE FUNCTION public.can_edit_company(c_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.is_active AND
 (p.role='ADMIN' OR (p.role='MEMBER' AND
 (EXISTS(SELECT 1 FROM public.company_members m WHERE m.company_id=c_id AND m.user_id=p.id AND m.is_active AND m.membership_role IN ('OWNER','EDITOR'))
 OR (p.company_id=c_id AND NOT EXISTS(SELECT 1 FROM public.company_members m WHERE m.company_id=c_id AND m.user_id=p.id))))));
$$;
CREATE OR REPLACE FUNCTION public.can_manage_company(c_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT EXISTS(SELECT 1 FROM public.profiles p JOIN public.company_members m ON m.user_id=p.id
 WHERE p.id=auth.uid() AND p.is_active AND m.company_id=c_id AND m.is_active AND m.membership_role='OWNER');
$$;
REVOKE ALL ON FUNCTION public.can_manage_company(UUID) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.can_manage_company(UUID) TO authenticated;
REVOKE INSERT,UPDATE,DELETE ON public.company_members FROM anon,authenticated;

CREATE TABLE IF NOT EXISTS public.company_join_codes(
 company_id UUID PRIMARY KEY REFERENCES public.companies(id), code UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.company_join_requests(
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), company_id UUID NOT NULL REFERENCES public.companies(id),
 user_id UUID NOT NULL REFERENCES public.profiles(id), status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(), decided_at TIMESTAMPTZ, decided_by UUID REFERENCES public.profiles(id), UNIQUE(company_id,user_id)
);
ALTER TABLE public.company_join_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_join_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.company_join_codes,public.company_join_requests FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.company_access(c_id UUID) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE result JSONB; manageable BOOLEAN;
BEGIN
 IF NOT public.can_read_company(c_id) THEN RAISE EXCEPTION 'Company access denied'; END IF;
 manageable:=public.can_manage_company(c_id);
 SELECT jsonb_build_object('canManage',manageable,'members',COALESCE(jsonb_agg(jsonb_build_object(
 'userId',m.user_id,'name',p.full_name,'email',p.email,'role',m.membership_role,'active',m.is_active,'endedAt',m.ended_at)),'[]'::jsonb))
 INTO result FROM public.company_members m JOIN public.profiles p ON p.id=m.user_id
 WHERE m.company_id=c_id AND (manageable OR m.user_id=auth.uid());
 RETURN result || jsonb_build_object('requests',CASE WHEN manageable THEN
 (SELECT COALESCE(jsonb_agg(jsonb_build_object('id',r.id,'userId',r.user_id,'name',p.full_name,'email',p.email,'createdAt',r.created_at)),'[]'::jsonb)
 FROM public.company_join_requests r JOIN public.profiles p ON p.id=r.user_id WHERE r.company_id=c_id AND r.status='pending') ELSE '[]'::jsonb END);
END;
$$;
CREATE OR REPLACE FUNCTION public.company_join_code(c_id UUID, rotate BOOLEAN DEFAULT false) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE result UUID;
BEGIN
 IF NOT public.can_manage_company(c_id) THEN RAISE EXCEPTION 'Company owner required'; END IF;
 PERFORM 1 FROM public.companies WHERE id=c_id FOR UPDATE;
 INSERT INTO public.company_join_codes(company_id) VALUES(c_id) ON CONFLICT DO NOTHING;
 IF rotate THEN UPDATE public.company_join_codes SET code=gen_random_uuid(),updated_at=now() WHERE company_id=c_id; END IF;
 SELECT code INTO result FROM public.company_join_codes WHERE company_id=c_id; RETURN result;
END;
$$;
CREATE OR REPLACE FUNCTION public.request_company_join(join_code UUID) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE company UUID; result UUID;
BEGIN
 IF public.get_current_user_role() IS NULL THEN RAISE EXCEPTION 'Active login required'; END IF;
 SELECT company_id INTO company FROM public.company_join_codes WHERE code=join_code;
 IF company IS NULL THEN RAISE EXCEPTION 'Invalid company join code'; END IF;
 IF public.is_member_of_company(company) THEN RAISE EXCEPTION 'Already a member'; END IF;
 INSERT INTO public.company_join_requests(company_id,user_id) VALUES(company,auth.uid())
 ON CONFLICT(company_id,user_id) DO UPDATE SET status='pending',created_at=now(),decided_at=NULL,decided_by=NULL
 RETURNING id INTO result; RETURN result;
END;
$$;
CREATE OR REPLACE FUNCTION public.decide_company_join(request_id UUID, approve BOOLEAN, member_role TEXT DEFAULT 'VIEWER') RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE request public.company_join_requests;
BEGIN
 SELECT * INTO request FROM public.company_join_requests WHERE id=request_id FOR UPDATE;
 IF request.id IS NULL OR NOT public.can_manage_company(request.company_id) THEN RAISE EXCEPTION 'Company owner required'; END IF;
 -- Serialize with removal/other decisions, including owner eligibility checks.
 PERFORM 1 FROM public.companies WHERE id=request.company_id FOR UPDATE;
 IF NOT public.can_manage_company(request.company_id) OR request.status<>'pending' THEN RAISE EXCEPTION 'Request cannot be decided'; END IF;
 IF member_role NOT IN ('EDITOR','VIEWER') THEN RAISE EXCEPTION 'Invalid membership role'; END IF;
 IF approve THEN
  INSERT INTO public.company_members(company_id,user_id,membership_role,invited_by) VALUES(request.company_id,request.user_id,member_role,auth.uid())
  ON CONFLICT(company_id,user_id) DO UPDATE SET is_active=true,ended_at=NULL,membership_role=EXCLUDED.membership_role,invited_by=auth.uid();
 END IF;
 UPDATE public.company_join_requests SET status=CASE WHEN approve THEN 'approved' ELSE 'rejected' END,decided_at=now(),decided_by=auth.uid() WHERE id=request_id;
 INSERT INTO public.audit_logs(company_id,user_id,action_type,target_resource,details) VALUES(request.company_id,auth.uid(),'UPDATE','COMPANY_MEMBERSHIP',jsonb_build_object('requestId',request_id,'userId',request.user_id,'approved',approve,'role',member_role));
END;
$$;
CREATE OR REPLACE FUNCTION public.end_company_membership(c_id UUID, member_id UUID) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 PERFORM 1 FROM public.companies WHERE id=c_id FOR UPDATE;
 IF NOT public.can_manage_company(c_id) THEN RAISE EXCEPTION 'Company owner required'; END IF;
 IF member_id=auth.uid() THEN RAISE EXCEPTION 'Self removal is not available'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.company_members WHERE company_id=c_id AND user_id=member_id AND is_active) THEN RAISE EXCEPTION 'Active membership not found'; END IF;
 IF EXISTS(SELECT 1 FROM public.company_members WHERE company_id=c_id AND user_id=member_id AND membership_role='OWNER') THEN RAISE EXCEPTION 'Owner transfer requires separate review'; END IF;
 UPDATE public.company_members SET is_active=false,ended_at=now() WHERE company_id=c_id AND user_id=member_id;
 INSERT INTO public.audit_logs(company_id,user_id,action_type,target_resource,details) VALUES(c_id,auth.uid(),'UPDATE','COMPANY_MEMBERSHIP',jsonb_build_object('userId',member_id,'active',false));
END;
$$;
REVOKE ALL ON FUNCTION public.company_access(UUID),public.company_join_code(UUID,BOOLEAN),public.request_company_join(UUID),public.decide_company_join(UUID,BOOLEAN,TEXT),public.end_company_membership(UUID,UUID) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.company_access(UUID),public.company_join_code(UUID,BOOLEAN),public.request_company_join(UUID),public.decide_company_join(UUID,BOOLEAN,TEXT),public.end_company_membership(UUID,UUID) TO authenticated;

ALTER TABLE public.work_tasks ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.audit_projects(id);
ALTER TABLE public.work_tasks ADD COLUMN IF NOT EXISTS project_task_key TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS work_tasks_project_key ON public.work_tasks(project_id,project_task_key);
CREATE TABLE IF NOT EXISTS public.project_requirements(
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), project_id UUID NOT NULL REFERENCES public.audit_projects(id),
 company_id UUID NOT NULL REFERENCES public.companies(id), requirement_key TEXT NOT NULL,
 title TEXT NOT NULL CHECK(length(trim(title)) BETWEEN 1 AND 300), standard TEXT NOT NULL DEFAULT '',
 source_version TEXT NOT NULL, document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
 UNIQUE(project_id,requirement_key)
);
ALTER TABLE public.project_requirements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Read project requirements" ON public.project_requirements;
CREATE POLICY "Read project requirements" ON public.project_requirements FOR SELECT TO authenticated USING(public.can_read_company(company_id));
DROP POLICY IF EXISTS "Edit project requirement links" ON public.project_requirements;
CREATE POLICY "Edit project requirement links" ON public.project_requirements FOR UPDATE TO authenticated USING(public.can_edit_company(company_id)) WITH CHECK(public.can_edit_company(company_id));
REVOKE ALL ON public.project_requirements FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.project_requirements TO authenticated;
GRANT UPDATE(document_id) ON public.project_requirements TO authenticated;
CREATE OR REPLACE FUNCTION public.validate_project_company() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
BEGIN
 IF NEW.project_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.audit_projects p WHERE p.id=NEW.project_id AND p.company_id=NEW.company_id) THEN RAISE EXCEPTION 'Project must belong to the selected company'; END IF;
 IF NEW.document_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.documents d WHERE d.id=NEW.document_id AND d.company_id=NEW.company_id) THEN RAISE EXCEPTION 'Document must belong to the selected company'; END IF;
 RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS project_requirement_company ON public.project_requirements;
CREATE TRIGGER project_requirement_company BEFORE INSERT OR UPDATE ON public.project_requirements FOR EACH ROW EXECUTE FUNCTION public.validate_project_company();
DROP TRIGGER IF EXISTS work_task_project_company ON public.work_tasks;
CREATE TRIGGER work_task_project_company BEFORE INSERT OR UPDATE ON public.work_tasks FOR EACH ROW EXECUTE FUNCTION public.validate_project_company();

CREATE OR REPLACE FUNCTION public.create_work_project(payload JSONB) RETURNS public.audit_projects
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE company UUID; result public.audit_projects; item JSONB; request_key UUID; existing public.audit_projects;
BEGIN
 IF COALESCE(public.get_current_user_role(),'') NOT IN ('ADMIN','MEMBER') THEN RAISE EXCEPTION 'Active editor required'; END IF;
 IF length(trim(COALESCE(payload->>'title',''))) NOT BETWEEN 1 AND 120 THEN RAISE EXCEPTION 'Project title is required'; END IF;
 request_key:=(payload->>'requestId')::uuid;
 IF request_key IS NULL THEN RAISE EXCEPTION 'Request ID required'; END IF;
 -- Serializes retries of the same operation across network interruptions.
 PERFORM pg_advisory_xact_lock(hashtext(auth.uid()::text || request_key::text));
 SELECT * INTO existing FROM public.audit_projects WHERE data->>'requestId'=request_key::text AND data->>'createdBy'=auth.uid()::text;
 IF existing.id IS NOT NULL THEN
  IF existing.data->>'requestHash' IS DISTINCT FROM md5(payload::text) THEN RAISE EXCEPTION 'Request content changed; reopen the project form'; END IF;
  IF NOT public.can_edit_company(existing.company_id) THEN RAISE EXCEPTION 'Company access denied'; END IF;
  RETURN existing;
 END IF;
 IF NULLIF(payload->>'companyId','') IS NOT NULL THEN
  company:=(payload->>'companyId')::uuid;
  PERFORM 1 FROM public.companies WHERE id=company FOR UPDATE;
  IF NOT public.can_edit_company(company) THEN RAISE EXCEPTION 'Company editor required'; END IF;
 ELSE
  IF length(trim(COALESCE(payload->>'clientName',''))) NOT BETWEEN 1 AND 150 THEN RAISE EXCEPTION 'New company name required'; END IF;
  INSERT INTO public.companies(name,industry) VALUES(trim(payload->>'clientName'),COALESCE(NULLIF(trim(payload->>'industry'),''),'미분류')) RETURNING id INTO company;
  INSERT INTO public.company_members(company_id,user_id,membership_role) VALUES(company,auth.uid(),'OWNER');
 END IF;
 IF payload->>'kind' NOT IN ('ISO','DOMESTIC','SUPPORT','GENERAL') OR payload->>'kind' IS NULL THEN RAISE EXCEPTION 'Invalid project type'; END IF;
 IF COALESCE(jsonb_typeof(payload->'requirements'),'null')<>'array' OR jsonb_array_length(payload->'requirements')>300 THEN RAISE EXCEPTION 'Invalid requirements'; END IF;
 IF COALESCE(jsonb_typeof(payload->'tasks'),'null')<>'array' OR jsonb_array_length(payload->'tasks')>30 THEN RAISE EXCEPTION 'Invalid project tasks'; END IF;
 IF NULLIF(payload->>'targetDate','') IS NOT NULL THEN PERFORM (payload->>'targetDate')::date; END IF;
 INSERT INTO public.audit_projects(company_id,data) VALUES(company,
  (payload-'id'-'companyId'-'requirements'-'tasks'-'createdBy'-'clientName') || jsonb_build_object('workflowVersion',2,'createdBy',auth.uid(),'clientName',(SELECT name FROM public.companies WHERE id=company),'status','ACTIVE','requestHash',md5(payload::text))) RETURNING * INTO result;
 FOR item IN SELECT value FROM jsonb_array_elements(payload->'requirements') LOOP
  IF length(COALESCE(item->>'key','')) NOT BETWEEN 1 AND 100 OR length(COALESCE(item->>'sourceVersion','')) NOT BETWEEN 1 AND 100 THEN RAISE EXCEPTION 'Requirement source required'; END IF;
  INSERT INTO public.project_requirements(project_id,company_id,requirement_key,title,standard,source_version) VALUES(result.id,company,item->>'key',item->>'title',COALESCE(item->>'standard',''),item->>'sourceVersion');
 END LOOP;
 FOR item IN SELECT value FROM jsonb_array_elements(payload->'tasks') LOOP
  IF length(COALESCE(item->>'key','')) NOT BETWEEN 1 AND 100 THEN RAISE EXCEPTION 'Task key required'; END IF;
  IF NULLIF(payload->>'targetDate','') IS NOT NULL AND NULLIF(item->>'dueDate','')::date > (payload->>'targetDate')::date THEN RAISE EXCEPTION 'Task exceeds project target date'; END IF;
  INSERT INTO public.work_tasks(company_id,project_id,project_task_key,created_by,title,due_date,notes)
  VALUES(company,result.id,item->>'key',auth.uid(),item->>'title',NULLIF(item->>'dueDate','')::date,'프로젝트 준비 일정 · 사용자 검토 후 생성. 공식 심사·접수 확정 일정이 아닙니다.');
 END LOOP;
 INSERT INTO public.audit_logs(company_id,user_id,action_type,target_resource,resource_id,details) VALUES(company,auth.uid(),'CREATE','AUDIT_PROJECT',result.id,jsonb_build_object('workflowVersion',2,'requestId',request_key));
 RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.create_work_project(JSONB) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.create_work_project(JSONB) TO authenticated;
-- Prevent changing the authoritative company or creation identity through JSON updates.
CREATE OR REPLACE FUNCTION public.keep_project_identity() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.company_id<>OLD.company_id OR NEW.data->>'createdBy' IS DISTINCT FROM OLD.data->>'createdBy' OR NEW.data->>'requestId' IS DISTINCT FROM OLD.data->>'requestId' OR NEW.data->>'requestHash' IS DISTINCT FROM OLD.data->>'requestHash' THEN RAISE EXCEPTION 'Project identity cannot be changed'; END IF;
 RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS keep_project_identity ON public.audit_projects;
CREATE TRIGGER keep_project_identity BEFORE UPDATE ON public.audit_projects FOR EACH ROW EXECUTE FUNCTION public.keep_project_identity();
REVOKE UPDATE ON public.audit_projects FROM authenticated;
GRANT UPDATE(data) ON public.audit_projects TO authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;
