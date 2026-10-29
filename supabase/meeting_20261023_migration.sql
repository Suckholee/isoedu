-- 2026-10-23 meeting: S02/S03/B03 -> S11/S13 -> S20/S23/S24/S26.
-- Apply after company_projects_migration.sql. No change to official institution roles.
BEGIN;
CREATE TABLE IF NOT EXISTS public.company_consultants(
 company_id UUID NOT NULL REFERENCES public.companies(id), user_id UUID NOT NULL REFERENCES public.profiles(id),
 is_primary BOOLEAN NOT NULL DEFAULT false, active BOOLEAN NOT NULL DEFAULT true,
 nominated_by UUID REFERENCES public.profiles(id), nominated_at TIMESTAMPTZ,
 PRIMARY KEY(company_id,user_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS one_primary_consultant ON public.company_consultants(company_id) WHERE is_primary AND active;
ALTER TABLE public.company_consultants ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.company_consultants FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE FUNCTION public.can_manage_consultants(c_id UUID) RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT public.can_manage_company(c_id) OR (public.can_edit_company(c_id) AND EXISTS(SELECT 1 FROM public.company_consultants WHERE company_id=c_id AND user_id=auth.uid() AND active AND is_primary));
$$;
CREATE OR REPLACE FUNCTION public.can_prepare_project(c_id UUID) RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT public.can_manage_company(c_id) OR (public.can_edit_company(c_id) AND EXISTS(SELECT 1 FROM public.company_consultants WHERE company_id=c_id AND user_id=auth.uid() AND active));
$$;
CREATE OR REPLACE FUNCTION public.consultant_team(c_id UUID) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF NOT public.can_read_company(c_id) THEN RAISE EXCEPTION 'Company access denied'; END IF;
 RETURN jsonb_build_object('canManage',public.can_manage_consultants(c_id),'canPrepare',public.can_prepare_project(c_id),'members',
 (SELECT COALESCE(jsonb_agg(jsonb_build_object('id',p.id,'name',p.full_name,'primary',COALESCE(c.is_primary,false),'consultant',COALESCE(c.active,false),'nominated',c.nominated_at IS NOT NULL)),'[]'::jsonb)
 FROM public.company_members m JOIN public.profiles p ON p.id=m.user_id LEFT JOIN public.company_consultants c ON c.company_id=m.company_id AND c.user_id=m.user_id
 WHERE m.company_id=c_id AND m.is_active AND p.is_active),
 'requests',CASE WHEN public.can_manage_consultants(c_id) THEN (SELECT COALESCE(jsonb_agg(jsonb_build_object('id',r.id,'name',p.full_name)),'[]'::jsonb) FROM public.company_join_requests r JOIN public.profiles p ON p.id=r.user_id WHERE r.company_id=c_id AND r.status='pending' AND p.is_active) ELSE '[]'::jsonb END);
END;
$$;
CREATE OR REPLACE FUNCTION public.manage_consultant(c_id UUID,member_id UUID,operation TEXT) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE target public.company_consultants;
BEGIN
 PERFORM 1 FROM public.companies WHERE id=c_id FOR UPDATE;
 IF operation='accept' THEN
  IF member_id<>auth.uid() OR NOT public.can_edit_company(c_id) THEN RAISE EXCEPTION 'Nominee required'; END IF;
  SELECT * INTO target FROM public.company_consultants WHERE company_id=c_id AND user_id=member_id AND active AND nominated_at IS NOT NULL;
  IF target.user_id IS NULL OR NOT public.can_manage_consultants(c_id) AND NOT EXISTS(SELECT 1 FROM public.company_consultants WHERE company_id=c_id AND user_id=target.nominated_by AND active AND is_primary) AND NOT EXISTS(SELECT 1 FROM public.company_members WHERE company_id=c_id AND user_id=target.nominated_by AND is_active AND membership_role='OWNER') THEN RAISE EXCEPTION 'Nomination no longer valid'; END IF;
  UPDATE public.company_consultants SET is_primary=false,nominated_at=NULL,nominated_by=NULL WHERE company_id=c_id;
  UPDATE public.company_consultants SET is_primary=true WHERE company_id=c_id AND user_id=member_id;
 ELSE
  IF NOT public.can_manage_consultants(c_id) THEN RAISE EXCEPTION 'Primary consultant or owner required'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.company_members m JOIN public.profiles p ON p.id=m.user_id WHERE m.company_id=c_id AND m.user_id=member_id AND m.is_active AND p.is_active AND m.membership_role IN ('OWNER','EDITOR')) THEN RAISE EXCEPTION 'Active company editor required'; END IF;
  IF operation='add' THEN
   INSERT INTO public.company_consultants(company_id,user_id,is_primary) VALUES(c_id,member_id,NOT EXISTS(SELECT 1 FROM public.company_consultants WHERE company_id=c_id AND active AND is_primary)) ON CONFLICT(company_id,user_id) DO UPDATE SET active=true;
  ELSIF operation='nominate' THEN
   IF NOT EXISTS(SELECT 1 FROM public.company_consultants WHERE company_id=c_id AND user_id=member_id AND active AND NOT is_primary) THEN RAISE EXCEPTION 'Active co-consultant required'; END IF;
   UPDATE public.company_consultants SET nominated_at=NULL,nominated_by=NULL WHERE company_id=c_id;
   UPDATE public.company_consultants SET nominated_at=now(),nominated_by=auth.uid() WHERE company_id=c_id AND user_id=member_id;
  ELSIF operation='remove' THEN
   IF member_id=auth.uid() OR EXISTS(SELECT 1 FROM public.company_consultants WHERE company_id=c_id AND user_id=member_id AND active AND is_primary) THEN RAISE EXCEPTION 'Transfer primary role before removal'; END IF;
   UPDATE public.company_consultants SET active=false,nominated_at=NULL,nominated_by=NULL WHERE company_id=c_id AND user_id=member_id;
   -- Removal only revokes access granted to a consultant, never the company owner's access.
   UPDATE public.company_members SET is_active=false,ended_at=now() WHERE company_id=c_id AND user_id=member_id AND membership_role<>'OWNER';
  ELSE RAISE EXCEPTION 'Invalid operation'; END IF;
 END IF;
 INSERT INTO public.audit_logs(company_id,user_id,action_type,target_resource,details) VALUES(c_id,auth.uid(),'UPDATE','CONSULTANT_TEAM',jsonb_build_object('memberId',member_id,'operation',operation));
END;
$$;
CREATE OR REPLACE FUNCTION public.approve_consultant(request_id UUID) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE req public.company_join_requests;
BEGIN
 SELECT * INTO req FROM public.company_join_requests WHERE id=request_id;
 PERFORM 1 FROM public.companies WHERE id=req.company_id FOR UPDATE;
 IF req.id IS NULL OR NOT public.can_manage_consultants(req.company_id) THEN RAISE EXCEPTION 'Primary consultant or owner required'; END IF;
 SELECT * INTO req FROM public.company_join_requests WHERE id=request_id FOR UPDATE;
 IF req.status<>'pending' THEN RAISE EXCEPTION 'Pending request required'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=req.user_id AND is_active AND role='MEMBER') THEN RAISE EXCEPTION 'Active editor account required'; END IF;
 INSERT INTO public.company_members(company_id,user_id,membership_role,invited_by) VALUES(req.company_id,req.user_id,'EDITOR',auth.uid()) ON CONFLICT(company_id,user_id) DO UPDATE SET is_active=true,ended_at=NULL,membership_role=CASE WHEN company_members.membership_role='OWNER' THEN 'OWNER' ELSE 'EDITOR' END;
 INSERT INTO public.company_consultants(company_id,user_id,is_primary) VALUES(req.company_id,req.user_id,NOT EXISTS(SELECT 1 FROM public.company_consultants WHERE company_id=req.company_id AND active AND is_primary)) ON CONFLICT(company_id,user_id) DO UPDATE SET active=true;
 UPDATE public.company_join_requests SET status='approved',decided_at=now(),decided_by=auth.uid() WHERE id=request_id;
 INSERT INTO public.audit_logs(company_id,user_id,action_type,target_resource,details) VALUES(req.company_id,auth.uid(),'UPDATE','CONSULTANT_TEAM',jsonb_build_object('approvedRequest',request_id,'memberId',req.user_id));
END;
$$;
CREATE OR REPLACE FUNCTION public.consultant_join_code(c_id UUID) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE result UUID;
BEGIN
 PERFORM 1 FROM public.companies WHERE id=c_id FOR UPDATE;
 IF NOT public.can_manage_consultants(c_id) THEN RAISE EXCEPTION 'Primary consultant or owner required'; END IF;
 INSERT INTO public.company_join_codes(company_id) VALUES(c_id) ON CONFLICT DO NOTHING;
 UPDATE public.company_join_codes SET code=gen_random_uuid(),updated_at=now() WHERE company_id=c_id AND updated_at<now()-interval '7 days';
 SELECT code INTO result FROM public.company_join_codes WHERE company_id=c_id; RETURN result;
END;
$$;

CREATE TABLE IF NOT EXISTS public.project_operations(
 project_id UUID PRIMARY KEY REFERENCES public.audit_projects(id),company_id UUID NOT NULL REFERENCES public.companies(id),
 revision INTEGER NOT NULL DEFAULT 0,data JSONB NOT NULL DEFAULT '{}'::jsonb,updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.project_document_requests(
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),project_id UUID NOT NULL REFERENCES public.audit_projects(id),company_id UUID NOT NULL REFERENCES public.companies(id),
 request_key TEXT NOT NULL,title TEXT NOT NULL, guidance TEXT NOT NULL DEFAULT '',conditional BOOLEAN NOT NULL DEFAULT false,
 status TEXT NOT NULL DEFAULT 'requested' CHECK(status IN ('requested','submitted','changes','accepted','not_applicable')),document_id UUID REFERENCES public.documents(id),
 feedback TEXT NOT NULL DEFAULT '',revision INTEGER NOT NULL DEFAULT 0,updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),UNIQUE(project_id,request_key)
);
ALTER TABLE public.project_document_requests ADD COLUMN IF NOT EXISTS submitted_file_path TEXT;
ALTER TABLE public.project_document_requests ADD COLUMN IF NOT EXISTS submitted_checksum TEXT;
ALTER TABLE public.project_document_requests ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ;
ALTER TABLE public.project_document_requests ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES public.profiles(id);
ALTER TABLE public.project_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_document_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.project_operations,public.project_document_requests FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.project_operations,public.project_document_requests TO authenticated;
DROP POLICY IF EXISTS "Company operation read" ON public.project_operations;
CREATE POLICY "Company operation read" ON public.project_operations FOR SELECT TO authenticated USING(public.can_read_company(company_id));
DROP POLICY IF EXISTS "Company request read" ON public.project_document_requests;
CREATE POLICY "Company request read" ON public.project_document_requests FOR SELECT TO authenticated USING(public.can_read_company(company_id));
CREATE OR REPLACE FUNCTION public.save_project_operations(p_id UUID,expected_revision INTEGER,payload JSONB) RETURNS public.project_operations LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE project public.audit_projects; result public.project_operations; value TEXT; k TEXT;
BEGIN
 SELECT * INTO project FROM public.audit_projects WHERE id=p_id FOR UPDATE;
 IF project.id IS NULL OR NOT public.can_prepare_project(project.company_id) THEN RAISE EXCEPTION 'Company consultant required'; END IF;
 IF jsonb_typeof(payload)<>'object' OR octet_length(payload::text)>50000 THEN RAISE EXCEPTION 'Invalid operations payload'; END IF;
 FOREACH k IN ARRAY ARRAY['quoteStatus','paymentStatus','scheduleStatus'] LOOP
  value:=payload->>k;
  IF value IS NULL OR (k='quoteStatus' AND value NOT IN ('none','draft','sent','accepted')) OR (k='paymentStatus' AND value NOT IN ('unpaid','partial','paid')) OR (k='scheduleStatus' AND value NOT IN ('unscheduled','tentative','confirmed','completed')) THEN RAISE EXCEPTION 'Invalid operations state'; END IF;
 END LOOP;
 FOREACH k IN ARRAY ARRAY['auditDate','certificateIssuedAt','certificateExpiresAt','nextAuditDate'] LOOP
  IF NULLIF(payload->>k,'') IS NOT NULL THEN PERFORM (payload->>k)::date; END IF;
 END LOOP;
 IF payload->>'scheduleStatus' IN ('tentative','confirmed','completed') AND NULLIF(payload->>'auditDate','') IS NULL THEN RAISE EXCEPTION 'Audit date required'; END IF;
 IF payload->>'scheduleStatus' IN ('confirmed','completed') AND (payload->>'scopeConfirmed' IS DISTINCT FROM 'true' OR NULLIF(trim(payload->>'scope'),'') IS NULL) THEN RAISE EXCEPTION 'Client scope confirmation required'; END IF;
 IF NULLIF(payload->>'certificateExpiresAt','')::date < NULLIF(payload->>'certificateIssuedAt','')::date THEN RAISE EXCEPTION 'Invalid certificate dates'; END IF;
 IF NULLIF(payload->>'certificateDocumentId','') IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.documents d JOIN storage.objects o ON o.bucket_id='iso-vault' AND o.name=COALESCE(NULLIF(d.file_url,''),d.metadata->>'originalPath') WHERE d.id=(payload->>'certificateDocumentId')::uuid AND d.company_id=project.company_id AND d.hierarchy_level='CERT') THEN RAISE EXCEPTION 'Company certificate required'; END IF;
 INSERT INTO public.project_operations(project_id,company_id) VALUES(p_id,project.company_id) ON CONFLICT DO NOTHING;
 UPDATE public.project_operations SET data=payload,revision=revision+1,updated_at=now() WHERE project_id=p_id AND revision=expected_revision RETURNING * INTO result;
 IF result.project_id IS NULL THEN RAISE EXCEPTION 'Concurrent update; reload required'; END IF;
 INSERT INTO public.work_tasks(company_id,project_id,project_task_key,created_by,title,due_date,status,notes)
 VALUES(project.company_id,p_id,'meeting-audit',auth.uid(),(SELECT name FROM public.companies WHERE id=project.company_id)||' · 심사 일정',NULLIF(payload->>'auditDate','')::date,CASE WHEN payload->>'scheduleStatus'='completed' THEN 'done' ELSE 'todo' END,'고객 제출·심사 운영에서 저장한 내부 기록 · '||(payload->>'scheduleStatus'))
 ON CONFLICT(project_id,project_task_key) DO UPDATE SET due_date=EXCLUDED.due_date,status=EXCLUDED.status,notes=EXCLUDED.notes;
 INSERT INTO public.work_tasks(company_id,project_id,project_task_key,created_by,title,due_date,notes)
 VALUES(project.company_id,p_id,'meeting-renewal-notice',auth.uid(),(SELECT name FROM public.companies WHERE id=project.company_id)||' · 차기 심사·만기 사전 안내',
 (COALESCE(NULLIF(payload->>'nextAuditDate','')::date,NULLIF(payload->>'certificateExpiresAt','')::date)-interval '1 month')::date,'차기 심사일 우선 · 없으면 만료일 한 달 전. 자동 발송 아님. 견적·고객 연락 확인 필요.')
 ON CONFLICT(project_id,project_task_key) DO UPDATE SET due_date=EXCLUDED.due_date,notes=EXCLUDED.notes,status=CASE WHEN work_tasks.due_date IS DISTINCT FROM EXCLUDED.due_date THEN 'todo' ELSE work_tasks.status END;

 INSERT INTO public.audit_logs(company_id,user_id,action_type,target_resource,resource_id,details) VALUES(project.company_id,auth.uid(),'UPDATE','PROJECT_OPERATIONS',p_id,jsonb_build_object('revision',result.revision));
 RETURN result;
END;
$$;
CREATE OR REPLACE FUNCTION public.request_project_documents(p_id UUID,items JSONB) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE project public.audit_projects; item JSONB;
BEGIN
 SELECT * INTO project FROM public.audit_projects WHERE id=p_id FOR UPDATE;
 IF project.id IS NULL OR NOT public.can_prepare_project(project.company_id) THEN RAISE EXCEPTION 'Company consultant required'; END IF;
 IF jsonb_typeof(items)<>'array' OR jsonb_array_length(items)>50 THEN RAISE EXCEPTION 'Invalid request items'; END IF;
 FOR item IN SELECT value FROM jsonb_array_elements(items) LOOP
  IF length(COALESCE(item->>'key','')) NOT BETWEEN 1 AND 80 OR length(trim(COALESCE(item->>'title',''))) NOT BETWEEN 1 AND 200 OR length(COALESCE(item->>'guidance',''))>2000 THEN RAISE EXCEPTION 'Invalid request item'; END IF;
  INSERT INTO public.project_document_requests(project_id,company_id,request_key,title,guidance,conditional) VALUES(p_id,project.company_id,item->>'key',item->>'title',COALESCE(item->>'guidance',''),COALESCE((item->>'conditional')::boolean,false)) ON CONFLICT(project_id,request_key) DO NOTHING;
  INSERT INTO public.work_tasks(company_id,project_id,project_task_key,created_by,title,status,notes)
  VALUES(project.company_id,p_id,'intake-'||(item->>'key'),auth.uid(),left((SELECT name FROM public.companies WHERE id=project.company_id)||' · '||(item->>'title'),180),'waiting',COALESCE(item->>'guidance','')) ON CONFLICT(project_id,project_task_key) DO NOTHING;
 END LOOP;
 INSERT INTO public.audit_logs(company_id,user_id,action_type,target_resource,resource_id,details) VALUES(project.company_id,auth.uid(),'CREATE','DOCUMENT_REQUESTS',p_id,jsonb_build_object('count',jsonb_array_length(items)));
END;
$$;
CREATE OR REPLACE FUNCTION public.review_project_document(r_id UUID,expected_revision INTEGER,next_status TEXT,doc_id UUID DEFAULT NULL,note TEXT DEFAULT '') RETURNS public.project_document_requests LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE req public.project_document_requests; submitted public.documents; checksum_value TEXT;
BEGIN
 SELECT * INTO req FROM public.project_document_requests WHERE id=r_id FOR UPDATE;
 IF req.id IS NULL OR NOT public.can_edit_company(req.company_id) THEN RAISE EXCEPTION 'Company editor required'; END IF;
 IF expected_revision<>req.revision THEN RAISE EXCEPTION 'Concurrent update; reload required'; END IF;
 IF length(note)>2000 OR next_status NOT IN ('submitted','changes','accepted','not_applicable','requested') OR next_status IS NULL THEN RAISE EXCEPTION 'Invalid review'; END IF;
 IF next_status='submitted' THEN
  SELECT * INTO submitted FROM public.documents WHERE id=doc_id AND company_id=req.company_id;
  IF submitted.id IS NULL OR submitted.file_url IS NULL OR NOT EXISTS(SELECT 1 FROM storage.objects WHERE bucket_id='iso-vault' AND name=submitted.file_url) THEN RAISE EXCEPTION 'Uploaded company document required'; END IF;
  SELECT v.checksum INTO checksum_value FROM public.document_versions v WHERE v.document_id=doc_id AND v.file_path=submitted.file_url ORDER BY v.created_at DESC LIMIT 1;
  IF checksum_value IS NULL THEN RAISE EXCEPTION 'Uploaded version required'; END IF;
  IF req.status NOT IN ('requested','changes','submitted') THEN RAISE EXCEPTION 'Reviewed submission cannot be replaced'; END IF;
 ELSIF next_status='not_applicable' THEN
  IF NOT public.can_prepare_project(req.company_id) OR NOT req.conditional OR length(trim(note))=0 THEN RAISE EXCEPTION 'Conditional exemption needs consultant and reason'; END IF;
 ELSIF next_status='requested' THEN
  IF NOT public.can_prepare_project(req.company_id) OR req.status<>'not_applicable' THEN RAISE EXCEPTION 'Only exempted request can be reopened'; END IF;
 ELSE
  IF NOT public.can_prepare_project(req.company_id) OR req.document_id IS NULL OR req.status<>'submitted' THEN RAISE EXCEPTION 'Consultant review of submitted document required'; END IF;
  IF next_status='changes' AND length(trim(note))=0 THEN RAISE EXCEPTION 'Feedback required'; END IF;
 END IF;
 UPDATE public.project_document_requests SET submitted_file_path=CASE WHEN next_status='submitted' THEN submitted.file_url ELSE submitted_file_path END,submitted_checksum=CASE WHEN next_status='submitted' THEN checksum_value ELSE submitted_checksum END,submitted_at=CASE WHEN next_status='submitted' THEN now() ELSE submitted_at END,reviewed_by=CASE WHEN next_status='submitted' THEN NULL ELSE auth.uid() END,document_id=CASE WHEN next_status='submitted' THEN doc_id ELSE document_id END,status=next_status,feedback=note,revision=revision+1,updated_at=now() WHERE id=r_id RETURNING * INTO req;
 UPDATE public.work_tasks SET status=CASE next_status WHEN 'accepted' THEN 'done' WHEN 'not_applicable' THEN 'done' WHEN 'submitted' THEN 'doing' ELSE 'waiting' END WHERE project_id=req.project_id AND project_task_key='intake-'||req.request_key;
 INSERT INTO public.audit_logs(company_id,user_id,action_type,target_resource,resource_id,details) VALUES(req.company_id,auth.uid(),'UPDATE','DOCUMENT_REQUESTS',r_id,jsonb_build_object('status',next_status,'revision',req.revision,'documentId',req.document_id,'feedback',note,'submittedChecksum',req.submitted_checksum,'submittedFilePath',req.submitted_file_path));
 RETURN req;
END;
$$;
REVOKE ALL ON FUNCTION public.can_manage_consultants(UUID),public.can_prepare_project(UUID),public.consultant_team(UUID),public.manage_consultant(UUID,UUID,TEXT),public.approve_consultant(UUID),public.consultant_join_code(UUID),public.save_project_operations(UUID,INTEGER,JSONB),public.request_project_documents(UUID,JSONB),public.review_project_document(UUID,INTEGER,TEXT,UUID,TEXT) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.can_manage_consultants(UUID),public.can_prepare_project(UUID),public.consultant_team(UUID),public.manage_consultant(UUID,UUID,TEXT),public.approve_consultant(UUID),public.consultant_join_code(UUID),public.save_project_operations(UUID,INTEGER,JSONB),public.request_project_documents(UUID,JSONB),public.review_project_document(UUID,INTEGER,TEXT,UUID,TEXT) TO authenticated;

CREATE TABLE IF NOT EXISTS public.crm_import_links(
 company_id UUID NOT NULL REFERENCES public.companies(id),source TEXT NOT NULL,external_id TEXT NOT NULL,
 project_id UUID NOT NULL REFERENCES public.audit_projects(id),fingerprint TEXT NOT NULL,
 PRIMARY KEY(company_id,source,external_id)
);
ALTER TABLE public.crm_import_links ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.crm_import_links FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE FUNCTION public.import_crm_projects(source_name TEXT,items JSONB) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE item JSONB; company UUID; imported public.crm_import_links; project public.audit_projects; doc TEXT; saved INTEGER:=0; skipped INTEGER:=0;
BEGIN
 IF length(trim(source_name)) NOT BETWEEN 1 AND 100 OR jsonb_typeof(items)<>'array' OR jsonb_array_length(items)>100 THEN RAISE EXCEPTION 'Invalid CRM export'; END IF;
 PERFORM pg_advisory_xact_lock(hashtext('crm-import-'||auth.uid()::text));
 FOR item IN SELECT value FROM jsonb_array_elements(items) LOOP
  company:=(item->>'companyId')::uuid;
  PERFORM 1 FROM public.companies WHERE id=company FOR UPDATE;
  IF NOT public.can_manage_company(company) THEN RAISE EXCEPTION 'Company owner required for CRM import'; END IF;
  IF length(COALESCE(item->>'externalId','')) NOT BETWEEN 1 AND 100 OR length(trim(COALESCE(item->>'title',''))) NOT BETWEEN 1 AND 120 OR COALESCE(item->>'kind','') NOT IN ('ISO','DOMESTIC','SUPPORT','GENERAL') OR length(COALESCE(item->>'notes',''))>10000 THEN RAISE EXCEPTION 'Invalid CRM project'; END IF;
  IF NULLIF(item->>'targetDate','') IS NOT NULL THEN PERFORM (item->>'targetDate')::date; END IF;
  SELECT * INTO imported FROM public.crm_import_links WHERE company_id=company AND source=source_name AND external_id=item->>'externalId';
  IF imported.project_id IS NOT NULL THEN
   IF imported.fingerprint<>md5(item::text) THEN RAISE EXCEPTION 'Imported source changed; manual reconciliation required'; END IF;
   skipped:=skipped+1; CONTINUE;
  END IF;
  IF jsonb_typeof(item->'documentIds')<>'array' OR jsonb_array_length(item->'documentIds')>100 THEN RAISE EXCEPTION 'Invalid CRM document links'; END IF;
  INSERT INTO public.audit_projects(company_id,data) VALUES(company,jsonb_build_object('workflowVersion',2,'title',item->>'title','clientName',(SELECT name FROM public.companies WHERE id=company),'kind',item->>'kind','targetDate',item->>'targetDate','notes',item->>'notes','createdBy',auth.uid(),'crmOrigin',jsonb_build_object('source',source_name,'externalId',item->>'externalId','importedAt',now()))) RETURNING * INTO project;
  FOR doc IN SELECT jsonb_array_elements_text(item->'documentIds') LOOP
   IF NOT EXISTS(SELECT 1 FROM public.documents WHERE id=doc::uuid AND company_id=company) THEN RAISE EXCEPTION 'CRM document company mismatch'; END IF;
   INSERT INTO public.project_requirements(project_id,company_id,requirement_key,title,source_version,document_id) SELECT project.id,company,'crm-'||doc,title,'crm-import-reviewed-v1',id FROM public.documents WHERE id=doc::uuid;
  END LOOP;
  INSERT INTO public.crm_import_links VALUES(company,source_name,item->>'externalId',project.id,md5(item::text));
  INSERT INTO public.audit_logs(company_id,user_id,action_type,target_resource,resource_id,details) VALUES(company,auth.uid(),'CREATE','CRM_IMPORT',project.id,jsonb_build_object('source',source_name,'externalId',item->>'externalId'));
  saved:=saved+1;
 END LOOP;
 RETURN jsonb_build_object('saved',saved,'skipped',skipped);
END;
$$;
REVOKE ALL ON FUNCTION public.import_crm_projects(TEXT,JSONB) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.import_crm_projects(TEXT,JSONB) TO authenticated;

NOTIFY pgrst,'reload schema';
COMMIT;
