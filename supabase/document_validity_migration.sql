-- S11/S13/S17/S26/S27/S33: dated original metadata, Notion snapshot, daily in-app re-requests.
-- Apply after meeting_20261023_migration.sql. No messages are sent to external services.
BEGIN;
CREATE TABLE IF NOT EXISTS public.document_policy_templates(application_type TEXT NOT NULL,request_key TEXT NOT NULL,template JSONB NOT NULL,PRIMARY KEY(application_type,request_key));
ALTER TABLE public.document_policy_templates ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.document_policy_templates FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.document_policy_templates TO authenticated;
DROP POLICY IF EXISTS "Read document policy templates" ON public.document_policy_templates;
CREATE POLICY "Read document policy templates" ON public.document_policy_templates FOR SELECT TO authenticated USING(true);
ALTER TABLE public.project_document_requests ADD COLUMN IF NOT EXISTS policy_key TEXT;
ALTER TABLE public.project_document_requests ADD COLUMN IF NOT EXISTS policy JSONB;
ALTER TABLE public.project_document_requests ADD COLUMN IF NOT EXISTS issued_on DATE;
ALTER TABLE public.project_document_requests ADD COLUMN IF NOT EXISTS valid_until DATE;
ALTER TABLE public.project_document_requests ADD COLUMN IF NOT EXISTS covered_years INTEGER[] NOT NULL DEFAULT '{}';
ALTER TABLE public.project_document_requests ADD COLUMN IF NOT EXISTS period_confirmed BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.project_document_requests ADD COLUMN IF NOT EXISTS validity JSONB;
ALTER TABLE public.project_document_requests ADD COLUMN IF NOT EXISTS renewal_reason TEXT;
ALTER TABLE public.project_document_requests ADD COLUMN IF NOT EXISTS renewal_cycle INTEGER NOT NULL DEFAULT 0;
CREATE TABLE IF NOT EXISTS public.document_renewal_events(
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),company_id UUID NOT NULL REFERENCES public.companies(id),request_id UUID NOT NULL REFERENCES public.project_document_requests(id),
 cycle INTEGER NOT NULL,reason TEXT NOT NULL,snapshot JSONB NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT now(),UNIQUE(request_id,cycle)
);
ALTER TABLE public.document_renewal_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.document_renewal_events FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.document_renewal_events TO authenticated;
DROP POLICY IF EXISTS "Company renewal history" ON public.document_renewal_events;
CREATE POLICY "Company renewal history" ON public.document_renewal_events FOR SELECT TO authenticated USING(public.can_read_company(company_id));
CREATE TABLE IF NOT EXISTS public.document_check_runs(id UUID PRIMARY KEY DEFAULT gen_random_uuid(),created_at TIMESTAMPTZ NOT NULL DEFAULT now(),summary JSONB NOT NULL);
ALTER TABLE public.document_check_runs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.document_check_runs FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.document_validity_result(r public.project_document_requests,ctx JSONB,today DATE) RETURNS JSONB LANGUAGE plpgsql STABLE SET search_path=public,pg_temp AS $$
DECLARE rule JSONB:=COALESCE(r.policy->'rule','{"kind":"none"}'::jsonb);kind TEXT:=rule->>'kind';plan DATE;expiry DATE;window_date DATE;last_year INTEGER;start_year INTEGER;y INTEGER;expected INTEGER[]:='{}';missing INTEGER[]:='{}';base JSONB:=jsonb_build_object('checkedOn',today);
BEGIN
 IF r.policy_key IS NULL THEN RETURN base||jsonb_build_object('status','unspecified','reason','원문 기준을 연결하지 않은 자료'); END IF;
 IF r.policy->>'applicationType' IS DISTINCT FROM ctx->>'applicationType' THEN RETURN base||jsonb_build_object('status','inactive','reason','현재 선택한 신청 유형과 다릅니다.'); END IF;
 IF r.status='not_applicable' THEN RETURN base||jsonb_build_object('status','exempt','reason','컨설턴트가 근거를 기록했습니다.'); END IF;
 IF NULLIF(ctx->>'applicationSubmittedAt','') IS NOT NULL THEN RETURN base||jsonb_build_object('status','closed','reason','접수 후 자동 재요청을 중지한 기록입니다.'); END IF;
 IF r.document_id IS NULL THEN RETURN base||jsonb_build_object('status','missing','reason','제출할 서류가 있습니다.'); END IF;
 plan:=NULLIF(ctx->>'applicationDate','')::date;IF plan<today THEN plan:=today;END IF;
 IF r.issued_on>today THEN RETURN base||jsonb_build_object('status','unknown','reason','발급일이 미래입니다.'); END IF;
 IF r.valid_until<today THEN RETURN base||jsonb_build_object('status','expired','reason','원문 유효기간이 지났습니다.','expiresOn',r.valid_until); END IF;
 IF kind IN ('age_days','age_months') THEN
  IF plan IS NULL THEN RETURN base||jsonb_build_object('status','unknown','reason','예정 신청일을 입력해 주세요.'); END IF;
  IF r.issued_on IS NULL THEN RETURN base||jsonb_build_object('status','unknown','reason','원문 발급일을 확인해 주세요.'); END IF;
  IF kind='age_days' THEN expiry:=r.issued_on+(rule->>'days')::integer; window_date:=plan-(rule->>'days')::integer;
  ELSE expiry:=(r.issued_on+make_interval(months=>(rule->>'months')::integer))::date;window_date:=(plan-make_interval(months=>(rule->>'months')::integer))::date;
   WHILE (window_date+make_interval(months=>(rule->>'months')::integer))::date<plan LOOP window_date:=window_date+1;END LOOP;
  END IF;
  base:=base||jsonb_build_object('expiresOn',expiry);
  IF expiry<plan THEN
   IF today<window_date THEN RETURN base||jsonb_build_object('status','scheduled','reason','보유본을 우선 검토하고 신청 전 최신본을 요청합니다.','nextRequestOn',window_date); END IF;
   RETURN base||jsonb_build_object('status','expired','reason','예정 신청일 기준 발급 허용 기간을 넘었습니다.');
  END IF;
  IF expiry<today THEN RETURN base||jsonb_build_object('status','expired','reason','발급 허용 기간을 넘었습니다.'); END IF;
 END IF;
 IF r.valid_until IS NOT NULL THEN
  IF r.valid_until<today THEN RETURN base||jsonb_build_object('status','expired','reason','원문 유효기간이 지났습니다.','expiresOn',r.valid_until); END IF;
  IF plan IS NOT NULL AND r.valid_until<plan THEN RETURN base||jsonb_build_object('status','scheduled','reason','예정 신청일 전에 만료됩니다.','expiresOn',r.valid_until,'nextRequestOn',r.valid_until+1); END IF;
 ELSIF kind='expiry' AND COALESCE((rule->>'required')::boolean,false) THEN RETURN base||jsonb_build_object('status','unknown','reason','원문에 적힌 유효기간을 확인해 주세요.');
 END IF;
 IF kind='years' THEN
  IF plan IS NULL OR NULLIF(ctx->>'companyFoundedDate','') IS NULL THEN RETURN base||jsonb_build_object('status','unknown','reason','신청 기준일과 회사 설립일이 필요합니다.'); END IF;
  IF cardinality(r.covered_years)=0 THEN RETURN base||jsonb_build_object('status','unknown','reason','원문에 포함된 자료 연도를 확인해 주세요.'); END IF;
  last_year:=extract(year from plan)::integer-1;
  IF NOT COALESCE((rule->>'allowShortHistory')::boolean,false) AND extract(year from (ctx->>'companyFoundedDate')::date)::integer>last_year-(rule->>'years')::integer+1 THEN RETURN base||jsonb_build_object('status','unknown','reason','업력과 3개년 요구기간을 담당자에게 확인해 주세요.'); END IF;
  start_year:=greatest(last_year-(rule->>'years')::integer+1,extract(year from (ctx->>'companyFoundedDate')::date)::integer);
  IF start_year>last_year THEN RETURN base||jsonb_build_object('status','unknown','reason','신설기업의 제출 가능한 회계기간을 별도로 확인해 주세요.'); END IF;
  FOR y IN start_year..last_year LOOP expected:=array_append(expected,y);IF NOT y=ANY(r.covered_years) THEN missing:=array_append(missing,y);END IF;END LOOP;
  base:=base||jsonb_build_object('requiredYears',to_jsonb(expected));
  IF cardinality(missing)>0 THEN RETURN base||jsonb_build_object('status','expired','reason','필요 자료 연도 미충족: '||array_to_string(missing,', ')); END IF;
  IF (COALESCE((rule->>'manualPeriod')::boolean,false) OR COALESCE((rule->>'yearEnd')::boolean,false)) AND NOT COALESCE(r.period_confirmed,false) THEN RETURN base||jsonb_build_object('status','unknown','reason',CASE WHEN COALESCE((rule->>'yearEnd')::boolean,false) THEN '연도별 12월 말 기준을 원문과 대조해 주세요.' ELSE '직전 분기·최근 신고분 범위를 원문과 대조해 주세요.' END); END IF;
  RETURN base||jsonb_build_object('status','valid','reason','신청 기준 연도와 업력 내 자료를 확인했습니다.');
 END IF;
 IF kind='none' AND r.valid_until IS NULL THEN RETURN base||jsonb_build_object('status','unspecified','reason','노션에 일수 제한이 없어 임의 만기를 적용하지 않습니다.'); END IF;
 RETURN base||jsonb_build_object('status','valid','reason','입력한 원문 날짜 기준. 내용 검토는 별도입니다.');
END;
$$;
REVOKE ALL ON FUNCTION public.document_validity_result(public.project_document_requests,JSONB,DATE) FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.internal_refresh_document_checks(p_id UUID,today DATE DEFAULT (now() AT TIME ZONE 'Asia/Seoul')::date) RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE r public.project_document_requests;ctx JSONB;v JSONB;n INTEGER:=0;
BEGIN
 PERFORM 1 FROM public.audit_projects WHERE id=p_id FOR UPDATE;
 SELECT data INTO ctx FROM public.project_operations WHERE project_id=p_id;
 IF ctx IS NULL OR ctx->>'documentMonitoring' IS DISTINCT FROM 'true' THEN RETURN 0; END IF;
 FOR r IN SELECT * FROM public.project_document_requests WHERE project_id=p_id AND policy_key IS NOT NULL ORDER BY id FOR UPDATE LOOP
  v:=public.document_validity_result(r,ctx,today);
  IF v->>'status'='expired' AND r.status IN ('accepted','submitted') THEN
   UPDATE public.project_document_requests SET status='changes',validity=v,renewal_reason=v->>'reason',renewal_cycle=renewal_cycle+1,revision=revision+1,updated_at=now() WHERE id=r.id RETURNING * INTO r;
   INSERT INTO public.document_renewal_events(company_id,request_id,cycle,reason,snapshot) VALUES(r.company_id,r.id,r.renewal_cycle,v->>'reason',jsonb_build_object('documentId',r.document_id,'filePath',r.submitted_file_path,'checksum',r.submitted_checksum,'issuedOn',r.issued_on,'validUntil',r.valid_until,'coveredYears',r.covered_years,'policy',r.policy,'check',v));
   UPDATE public.work_tasks SET status='waiting',notes='최신본 재요청 · '||(v->>'reason'),due_date=COALESCE(NULLIF(ctx->>'applicationDate','')::date,today) WHERE project_id=p_id AND project_task_key='intake-'||r.request_key;
   INSERT INTO public.audit_logs(company_id,user_id,action_type,target_resource,resource_id,details) VALUES(r.company_id,NULL,'UPDATE','DOCUMENT_RENEWAL',r.id,jsonb_build_object('cycle',r.renewal_cycle,'reason',v->>'reason'));
   n:=n+1;
  ELSE UPDATE public.project_document_requests SET validity=v WHERE id=r.id; END IF;
 END LOOP;
 RETURN n;
END;
$$;
REVOKE ALL ON FUNCTION public.internal_refresh_document_checks(UUID,DATE) FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE FUNCTION public.refresh_project_document_checks(p_id UUID) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE c UUID;n INTEGER;
BEGIN
 SELECT company_id INTO c FROM public.audit_projects WHERE id=p_id;
 IF c IS NULL OR NOT public.can_edit_company(c) THEN RAISE EXCEPTION 'Company editor required'; END IF;
 n:=public.internal_refresh_document_checks(p_id);RETURN jsonb_build_object('reRequested',n,'checkedOn',(now() AT TIME ZONE 'Asia/Seoul')::date);
END;
$$;
CREATE OR REPLACE FUNCTION public.configure_document_checks(p_id UUID,expected_revision INTEGER,application_type TEXT,application_date DATE DEFAULT NULL,founded_date DATE DEFAULT NULL) RETURNS public.project_operations LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE p public.audit_projects;ops public.project_operations;items JSONB;v JSONB;
BEGIN
 SELECT * INTO p FROM public.audit_projects WHERE id=p_id FOR UPDATE;
 IF p.id IS NULL OR NOT public.can_prepare_project(p.company_id) THEN RAISE EXCEPTION 'Company consultant required'; END IF;
 IF application_type NOT IN ('ISO','VENTURE_GROWTH','VENTURE_INVEST','INNOBIZ','MAINBIZ','RESEARCH','OTHER') OR application_type IS NULL THEN RAISE EXCEPTION 'Invalid application type'; END IF;
 IF founded_date>(now() AT TIME ZONE 'Asia/Seoul')::date THEN RAISE EXCEPTION 'Company foundation cannot be in future'; END IF;
 SELECT * INTO ops FROM public.project_operations WHERE project_id=p_id;
 IF expected_revision IS NULL OR expected_revision<>COALESCE(ops.revision,0) THEN RAISE EXCEPTION 'Concurrent update; reload required'; END IF;
 v:='{"quoteStatus":"none","paymentStatus":"unpaid","scheduleStatus":"unscheduled"}'::jsonb||COALESCE(ops.data,'{}')||jsonb_build_object('applicationType',application_type,'applicationDate',COALESCE(application_date::text,''),'companyFoundedDate',COALESCE(founded_date::text,''),'documentMonitoring',true);
 SELECT * INTO ops FROM public.save_project_operations(p_id,expected_revision,v);
 SELECT COALESCE(jsonb_agg(jsonb_build_object('key',request_key,'title',template->>'title','guidance',COALESCE(template->>'guidance','원문과 기관의 최신 요청 내용을 대조해 주세요.'),'conditional',COALESCE((template->>'conditional')::boolean,false))),'[]') INTO items FROM public.document_policy_templates t WHERE t.application_type=configure_document_checks.application_type;
 PERFORM public.request_project_documents(p_id,items);
 UPDATE public.project_document_requests r SET policy_key=t.application_type||':'||t.request_key,policy=t.template FROM public.document_policy_templates t WHERE r.project_id=p_id AND r.request_key=t.request_key AND t.application_type=configure_document_checks.application_type AND r.policy_key IS NULL;
 -- Unclassified legacy requests get only explicit expiry dates, never guessed age limits.
 UPDATE public.project_document_requests SET policy_key='manual-original-date',policy=jsonb_build_object('applicationType',application_type,'rule',jsonb_build_object('kind','none'),'version','original-date-v1','url','https://honestone.notion.site/applications') WHERE project_id=p_id AND policy_key IS NULL;
 PERFORM public.internal_refresh_document_checks(p_id);RETURN ops;
END;
$$;
CREATE OR REPLACE FUNCTION public.record_document_dates(r_id UUID,expected_revision INTEGER,issue_date DATE DEFAULT NULL,expiry_date DATE DEFAULT NULL,years INTEGER[] DEFAULT '{}',period_checked BOOLEAN DEFAULT false) RETURNS public.project_document_requests LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE r public.project_document_requests;
BEGIN
 PERFORM 1 FROM public.audit_projects WHERE id=(SELECT project_id FROM public.project_document_requests WHERE id=r_id) FOR UPDATE;
 SELECT * INTO r FROM public.project_document_requests WHERE id=r_id FOR UPDATE;
 IF r.id IS NULL OR NOT public.can_edit_company(r.company_id) THEN RAISE EXCEPTION 'Company editor required'; END IF;
 IF expected_revision IS DISTINCT FROM r.revision THEN RAISE EXCEPTION 'Concurrent update; reload required'; END IF;
 IF r.document_id IS NULL OR r.status='not_applicable' THEN RAISE EXCEPTION 'Submitted original required'; END IF;
 IF r.status='accepted' AND NOT public.can_prepare_project(r.company_id) THEN RAISE EXCEPTION 'Consultant must reopen reviewed dates'; END IF;
 IF issue_date>(now() AT TIME ZONE 'Asia/Seoul')::date OR expiry_date<issue_date OR years IS NULL OR cardinality(years)>20 OR EXISTS(SELECT 1 FROM unnest(years) y WHERE y IS NULL OR y<1900 OR y>extract(year from (now() AT TIME ZONE 'Asia/Seoul'))::integer) OR cardinality(years)<>(SELECT count(DISTINCT y) FROM unnest(years) y) THEN RAISE EXCEPTION 'Invalid original dates or years'; END IF;
 UPDATE public.project_document_requests SET issued_on=issue_date,valid_until=expiry_date,covered_years=years,period_confirmed=COALESCE(period_checked,false),status=CASE WHEN status='accepted' THEN 'submitted' ELSE status END,revision=revision+1,reviewed_by=NULL,updated_at=now() WHERE id=r_id RETURNING * INTO r;
 INSERT INTO public.audit_logs(company_id,user_id,action_type,target_resource,resource_id,details) VALUES(r.company_id,auth.uid(),'UPDATE','DOCUMENT_DATES',r.id,jsonb_build_object('issuedOn',issue_date,'validUntil',expiry_date,'years',years,'periodConfirmed',period_checked,'filePath',r.submitted_file_path,'checksum',r.submitted_checksum));
 PERFORM public.internal_refresh_document_checks(r.project_id);SELECT * INTO r FROM public.project_document_requests WHERE id=r_id;RETURN r;
END;
$$;
-- Keep the already-tested original workflow private; the public wrapper adds date controls.
DO $$ BEGIN
 IF to_regprocedure('public.review_project_document_unchecked(uuid,integer,text,uuid,text)') IS NULL THEN
  ALTER FUNCTION public.review_project_document(UUID,INTEGER,TEXT,UUID,TEXT) RENAME TO review_project_document_unchecked;
 END IF;
END $$;
REVOKE ALL ON FUNCTION public.review_project_document_unchecked(UUID,INTEGER,TEXT,UUID,TEXT) FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE FUNCTION public.review_project_document(r_id UUID,expected_revision INTEGER,next_status TEXT,doc_id UUID DEFAULT NULL,note TEXT DEFAULT '') RETURNS public.project_document_requests LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE r public.project_document_requests;old_path TEXT;new_path TEXT;ctx JSONB;v JSONB;
BEGIN
 PERFORM 1 FROM public.audit_projects WHERE id=(SELECT project_id FROM public.project_document_requests WHERE id=r_id) FOR UPDATE;
 SELECT * INTO r FROM public.project_document_requests WHERE id=r_id FOR UPDATE;
 IF r.id IS NULL OR NOT public.can_edit_company(r.company_id) THEN RAISE EXCEPTION 'Company editor required'; END IF;
 IF expected_revision IS DISTINCT FROM r.revision THEN RAISE EXCEPTION 'Concurrent update; reload required'; END IF;
 SELECT data INTO ctx FROM public.project_operations WHERE project_id=r.project_id;
 v:=public.document_validity_result(r,COALESCE(ctx,'{}'),(now() AT TIME ZONE 'Asia/Seoul')::date);old_path:=r.submitted_file_path;
 IF next_status='accepted' AND v->>'status' IN ('expired','unknown') THEN RAISE EXCEPTION 'Document validity check required: %',v->>'reason'; END IF;
 IF next_status='submitted' THEN
  SELECT file_url INTO new_path FROM public.documents WHERE id=doc_id AND company_id=r.company_id;
  IF new_path=old_path AND v->>'status'='expired' THEN RAISE EXCEPTION 'Latest original required: %',v->>'reason'; END IF;
 END IF;
 SELECT * INTO r FROM public.review_project_document_unchecked(r_id,expected_revision,next_status,doc_id,note);
 IF next_status='submitted' AND old_path IS DISTINCT FROM r.submitted_file_path THEN
  UPDATE public.project_document_requests SET issued_on=NULL,valid_until=NULL,covered_years='{}',period_confirmed=false,renewal_reason=NULL WHERE id=r_id;
 END IF;
 PERFORM public.internal_refresh_document_checks(r.project_id);SELECT * INTO r FROM public.project_document_requests WHERE id=r_id;RETURN r;
END;
$$;
CREATE OR REPLACE FUNCTION public.validate_document_check_context() RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE k TEXT;
BEGIN
 IF NEW.data ? 'applicationType' AND NEW.data->>'applicationType' NOT IN ('ISO','VENTURE_GROWTH','VENTURE_INVEST','INNOBIZ','MAINBIZ','RESEARCH','OTHER') THEN RAISE EXCEPTION 'Invalid application type'; END IF;
 FOREACH k IN ARRAY ARRAY['applicationDate','companyFoundedDate','applicationSubmittedAt'] LOOP
  IF NULLIF(NEW.data->>k,'') IS NOT NULL THEN PERFORM (NEW.data->>k)::date; END IF;
 END LOOP;
 IF NULLIF(NEW.data->>'companyFoundedDate','')::date>(now() AT TIME ZONE 'Asia/Seoul')::date THEN RAISE EXCEPTION 'Invalid foundation date'; END IF;
 IF NEW.data ? 'documentMonitoring' AND jsonb_typeof(NEW.data->'documentMonitoring')<>'boolean' THEN RAISE EXCEPTION 'Invalid monitoring flag'; END IF;
 RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS validate_document_check_context ON public.project_operations;
CREATE TRIGGER validate_document_check_context BEFORE INSERT OR UPDATE ON public.project_operations FOR EACH ROW EXECUTE FUNCTION public.validate_document_check_context();
CREATE OR REPLACE FUNCTION public.refresh_changed_document_context() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 PERFORM public.internal_refresh_document_checks(NEW.project_id);RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS refresh_document_check_context ON public.project_operations;
CREATE TRIGGER refresh_document_check_context AFTER INSERT OR UPDATE ON public.project_operations FOR EACH ROW EXECUTE FUNCTION public.refresh_changed_document_context();
CREATE OR REPLACE FUNCTION public.run_document_checks() RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE p RECORD;n INTEGER:=0;checked INTEGER:=0;errors INTEGER:=0;failures JSONB:='[]'::jsonb;result JSONB;
BEGIN
 FOR p IN SELECT project_id FROM public.project_operations WHERE data->>'documentMonitoring'='true' AND NULLIF(data->>'applicationSubmittedAt','') IS NULL LOOP
  BEGIN n:=n+public.internal_refresh_document_checks(p.project_id);checked:=checked+1;
  EXCEPTION WHEN OTHERS THEN errors:=errors+1;failures:=failures||jsonb_build_array(jsonb_build_object('projectId',p.project_id,'errorCode',SQLSTATE,'message',SQLERRM));END;
 END LOOP;
 result:=jsonb_build_object('projects',checked,'reRequested',n,'errors',errors,'failures',failures,'checkedAt',now());
 INSERT INTO public.document_check_runs(summary) VALUES(result);RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.run_document_checks(),public.validate_document_check_context(),public.refresh_changed_document_context() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.refresh_project_document_checks(UUID),public.configure_document_checks(UUID,INTEGER,TEXT,DATE,DATE),public.record_document_dates(UUID,INTEGER,DATE,DATE,INTEGER[],BOOLEAN),public.review_project_document(UUID,INTEGER,TEXT,UUID,TEXT) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.refresh_project_document_checks(UUID),public.configure_document_checks(UUID,INTEGER,TEXT,DATE,DATE),public.record_document_dates(UUID,INTEGER,DATE,DATE,INTEGER[],BOOLEAN),public.review_project_document(UUID,INTEGER,TEXT,UUID,TEXT) TO authenticated;
INSERT INTO public.document_policy_templates(application_type,request_key,template) VALUES
('ISO','iso-application','{"key": "iso-application", "title": "ISO 인증 신청서", "guidance": "251210 양식. 어려운 항목은 비워 두고 함께 작성합니다.", "rule": {"kind": "none"}, "applicationType": "ISO", "url": "https://honestone.notion.site/", "version": "notion-2026-10-29-v1", "reviewedAt": "2026-10-29"}'::jsonb),
('ISO','business-registration','{"key": "business-registration", "title": "사업자등록증", "guidance": "현재 사업장·업종을 대조합니다.", "rule": {"kind": "none"}, "applicationType": "ISO", "url": "https://honestone.notion.site/", "version": "notion-2026-10-29-v1", "reviewedAt": "2026-10-29"}'::jsonb),
('ISO','insurance-roster','{"key": "insurance-roster", "title": "4대보험 가입자 명부", "guidance": "실제 인원·대표자·외부·교대 인원 대조. 노션에 일수 제한 없음.", "rule": {"kind": "none"}, "applicationType": "ISO", "url": "https://honestone.notion.site/", "version": "notion-2026-10-29-v1", "reviewedAt": "2026-10-29"}'::jsonb),
('ISO','permits','{"key": "permits", "title": "인허가 서류", "conditional": true, "guidance": "해당 업종의 허가증. 원문에 유효기간이 있으면 입력합니다.", "rule": {"kind": "none"}, "applicationType": "ISO", "url": "https://honestone.notion.site/", "version": "notion-2026-10-29-v1", "reviewedAt": "2026-10-29"}'::jsonb),
('ISO','company-stamp','{"key": "company-stamp", "title": "회사 명판·직인", "guidance": "법인은 법인/사용인감, 개인사업자는 개인도장.", "rule": {"kind": "none"}, "applicationType": "ISO", "url": "https://honestone.notion.site/", "version": "notion-2026-10-29-v1", "reviewedAt": "2026-10-29"}'::jsonb),
('ISO','representative-signature','{"key": "representative-signature", "title": "대표자 서명", "guidance": "A4에 서명 후 스캔·사진. 해당 신청 목적 확인.", "rule": {"kind": "none"}, "applicationType": "ISO", "url": "https://honestone.notion.site/", "version": "notion-2026-10-29-v1", "reviewedAt": "2026-10-29"}'::jsonb),
('ISO','quality-signature','{"key": "quality-signature", "title": "품질 담당자 서명", "rule": {"kind": "none"}, "applicationType": "ISO", "url": "https://honestone.notion.site/", "version": "notion-2026-10-29-v1", "reviewedAt": "2026-10-29"}'::jsonb),
('ISO','manual','{"key": "manual", "title": "회사 매뉴얼·절차서", "rule": {"kind": "none"}, "applicationType": "ISO", "url": "https://honestone.notion.site/", "version": "notion-2026-10-29-v1", "reviewedAt": "2026-10-29"}'::jsonb),
('ISO','improvement','{"key": "improvement", "title": "개선보고서·실행 증빙", "conditional": true, "rule": {"kind": "none"}, "applicationType": "ISO", "url": "https://honestone.notion.site/", "version": "notion-2026-10-29-v1", "reviewedAt": "2026-10-29"}'::jsonb),
('ISO','onsite-signature','{"key": "onsite-signature", "title": "현장 심사 서명 기록", "conditional": true, "rule": {"kind": "none"}, "applicationType": "ISO", "url": "https://honestone.notion.site/", "version": "notion-2026-10-29-v1", "reviewedAt": "2026-10-29"}'::jsonb),
('VENTURE_GROWTH','venture_growth-sme-certificate','{"key": "sme-certificate", "title": "중소기업확인서", "rule": {"kind": "expiry", "required": true}, "guidance": "신청일 현재 유효한 확인서.", "applicationType": "VENTURE_GROWTH", "url": "https://honestone.notion.site/vc1", "version": "notion-2026-10-29-v1", "reviewedAt": "2026-10-29"}'::jsonb),
('VENTURE_GROWTH','venture_growth-business-registration','{"key": "business-registration", "title": "사업자등록증", "rule": {"kind": "none"}, "applicationType": "VENTURE_GROWTH", "url": "https://honestone.notion.site/vc1", "version": "notion-2026-10-29-v1", "reviewedAt": "2026-10-29"}'::jsonb),
('VENTURE_GROWTH','venture_growth-corporate-registry','{"key": "corporate-registry", "title": "법인등기부등본", "conditional": true, "rule": {"kind": "age_days", "days": 14}, "guidance": "말소 포함 제출용. 보유본 우선, 신청 기준 2주 이내 최신본 재요청.", "applicationType": "VENTURE_GROWTH", "url": "https://honestone.notion.site/vc1", "version": "notion-2026-10-29-v1", "reviewedAt": "2026-10-29"}'::jsonb),
('VENTURE_GROWTH','venture_growth-vat','{"key": "vat", "title": "부가가치세 과세표준증명원", "rule": {"kind": "years", "years": 3, "manualPeriod": true, "allowShortHistory": true}, "guidance": "최근 3개년 또는 업력 내 기간. 최근 신고기간도 원문 대조.", "applicationType": "VENTURE_GROWTH", "url": "https://honestone.notion.site/vc1", "version": "notion-2026-10-29-v1", "reviewedAt": "2026-10-29"}'::jsonb),
('VENTURE_GROWTH','venture_growth-financial-statements','{"key": "financial-statements", "title": "재무제표·감사보고서", "rule": {"kind": "years", "years": 3, "allowShortHistory": true}, "applicationType": "VENTURE_GROWTH", "url": "https://honestone.notion.site/vc1", "version": "notion-2026-10-29-v1", "reviewedAt": "2026-10-29"}'::jsonb),
('VENTURE_GROWTH','venture_growth-employment-history','{"key": "employment-history", "title": "고용보험 사업장 취득자 명부", "rule": {"kind": "years", "years": 3, "yearEnd": true, "allowShortHistory": true}, "guidance": "연도별 12월 말 기준, 업력 내 기간.", "applicationType": "VENTURE_GROWTH", "url": "https://honestone.notion.site/vc1", "version": "notion-2026-10-29-v1", "reviewedAt": "2026-10-29"}'::jsonb),
('VENTURE_GROWTH','venture_growth-insurance-roster','{"key": "insurance-roster", "title": "4대보험 가입자 명부", "rule": {"kind": "age_days", "days": 14}, "applicationType": "VENTURE_GROWTH", "url": "https://honestone.notion.site/vc1", "version": "notion-2026-10-29-v1", "reviewedAt": "2026-10-29"}'::jsonb),
('VENTURE_GROWTH','venture_growth-career-proof','{"key": "career-proof", "title": "대표자 경력 증빙", "guidance": "안내된 경력 증빙 중 택1, 동종업계 경력 원문 검토.", "rule": {"kind": "none"}, "applicationType": "VENTURE_GROWTH", "url": "https://honestone.notion.site/vc1", "version": "notion-2026-10-29-v1", "reviewedAt": "2026-10-29"}'::jsonb),
('VENTURE_GROWTH','venture_growth-qualification','{"key": "qualification", "title": "대표자 국가기술자격 증빙", "conditional": true, "rule": {"kind": "none"}, "applicationType": "VENTURE_GROWTH", "url": "https://honestone.notion.site/vc1", "version": "notion-2026-10-29-v1", "reviewedAt": "2026-10-29"}'::jsonb),
('VENTURE_INVEST','venture_invest-business-registration','{"key": "business-registration", "title": "사업자등록증", "rule": {"kind": "none"}, "applicationType": "VENTURE_INVEST", "url": "https://honestone.notion.site/ventureappli", "version": "notion-2026-10-29-v1", "reviewedAt": "2026-10-29"}'::jsonb),
('VENTURE_INVEST','venture_invest-corporate-registry','{"key": "corporate-registry", "title": "법인등기부등본", "conditional": true, "rule": {"kind": "age_days", "days": 14}, "guidance": "보유본 우선, 신청 시 2주 이내 발급분.", "applicationType": "VENTURE_INVEST", "url": "https://honestone.notion.site/ventureappli", "version": "notion-2026-10-29-v1", "reviewedAt": "2026-10-29"}'::jsonb),
('VENTURE_INVEST','venture_invest-vat','{"key": "vat", "title": "부가가치세 과세표준증명원", "rule": {"kind": "years", "years": 3, "manualPeriod": true, "allowShortHistory": true}, "guidance": "최근 3개년·업력 내 기간 + 최근 신고분 별도 확인.", "applicationType": "VENTURE_INVEST", "url": "https://honestone.notion.site/ventureappli", "version": "notion-2026-10-29-v1", "reviewedAt": "2026-10-29"}'::jsonb),
('VENTURE_INVEST','venture_invest-financial-statements','{"key": "financial-statements", "title": "재무제표·감사보고서", "rule": {"kind": "years", "years": 3, "allowShortHistory": true}, "applicationType": "VENTURE_INVEST", "url": "https://honestone.notion.site/ventureappli", "version": "notion-2026-10-29-v1", "reviewedAt": "2026-10-29"}'::jsonb),
('VENTURE_INVEST','venture_invest-employment-history','{"key": "employment-history", "title": "고용보험 사업장 취득자 명부", "rule": {"kind": "years", "years": 3, "yearEnd": true, "allowShortHistory": true}, "applicationType": "VENTURE_INVEST", "url": "https://honestone.notion.site/ventureappli", "version": "notion-2026-10-29-v1", "reviewedAt": "2026-10-29"}'::jsonb),
('VENTURE_INVEST','venture_invest-shareholders','{"key": "shareholders", "title": "현재 주주명부", "guidance": "최신 여부는 회사에 확인. 임의 일수 제한 없음.", "rule": {"kind": "none"}, "applicationType": "VENTURE_INVEST", "url": "https://honestone.notion.site/ventureappli", "version": "notion-2026-10-29-v1", "reviewedAt": "2026-10-29"}'::jsonb),
('VENTURE_INVEST','venture_invest-signing','{"key": "signing", "title": "법무사 제출·서명 확인", "guidance": "서명 절차·민감한 투자자 정보는 별도 권한과 목적 확인.", "rule": {"kind": "none"}, "applicationType": "VENTURE_INVEST", "url": "https://honestone.notion.site/ventureappli", "version": "notion-2026-10-29-v1", "reviewedAt": "2026-10-29"}'::jsonb),
('INNOBIZ','innobiz-business-registration','{"key": "business-registration", "title": "사업자등록증·증명원", "rule": {"kind": "none"}, "applicationType": "INNOBIZ", "url": "https://honestone.notion.site/ino", "version": "notion-2026-10-29-v1", "reviewedAt": "2026-10-29"}'::jsonb),
('INNOBIZ','innobiz-corporate-registry','{"key": "corporate-registry", "title": "법인등기부등본", "conditional": true, "rule": {"kind": "age_months", "months": 1}, "guidance": "제출용·말소 포함. 개인사업자 생략 가능.", "applicationType": "INNOBIZ", "url": "https://honestone.notion.site/ino", "version": "notion-2026-10-29-v1", "reviewedAt": "2026-10-29"}'::jsonb),
('INNOBIZ','innobiz-shareholders','{"key": "shareholders", "title": "주주명부", "conditional": true, "rule": {"kind": "none"}, "applicationType": "INNOBIZ", "url": "https://honestone.notion.site/ino", "version": "notion-2026-10-29-v1", "reviewedAt": "2026-10-29"}'::jsonb),
('INNOBIZ','innobiz-organization','{"key": "organization", "title": "조직도", "rule": {"kind": "none"}, "applicationType": "INNOBIZ", "url": "https://honestone.notion.site/ino", "version": "notion-2026-10-29-v1", "reviewedAt": "2026-10-29"}'::jsonb),
('INNOBIZ','innobiz-financial-statements','{"key": "financial-statements", "title": "표준재무제표증명원", "rule": {"kind": "years", "years": 3}, "applicationType": "INNOBIZ", "url": "https://honestone.notion.site/ino", "version": "notion-2026-10-29-v1", "reviewedAt": "2026-10-29"}'::jsonb),
('INNOBIZ','innobiz-vat','{"key": "vat", "title": "부가가치세 과세표준증명원", "rule": {"kind": "years", "years": 3, "manualPeriod": true}, "guidance": "최근 3개년~직전 분기까지. 최근 신고기간 원문 대조 필요.", "applicationType": "INNOBIZ", "url": "https://honestone.notion.site/ino", "version": "notion-2026-10-29-v1", "reviewedAt": "2026-10-29"}'::jsonb),
('INNOBIZ','innobiz-national-tax','{"key": "national-tax", "title": "국세 납세증명서", "rule": {"kind": "age_months", "months": 1}, "applicationType": "INNOBIZ", "url": "https://honestone.notion.site/ino", "version": "notion-2026-10-29-v1", "reviewedAt": "2026-10-29"}'::jsonb),
('INNOBIZ','innobiz-local-tax','{"key": "local-tax", "title": "지방세 납세증명서", "rule": {"kind": "age_months", "months": 1}, "applicationType": "INNOBIZ", "url": "https://honestone.notion.site/ino", "version": "notion-2026-10-29-v1", "reviewedAt": "2026-10-29"}'::jsonb),
('INNOBIZ','innobiz-insurance-payment','{"key": "insurance-payment", "title": "4대보험 완납증명서", "rule": {"kind": "age_months", "months": 1}, "applicationType": "INNOBIZ", "url": "https://honestone.notion.site/ino", "version": "notion-2026-10-29-v1", "reviewedAt": "2026-10-29"}'::jsonb),
('INNOBIZ','innobiz-insurance-roster','{"key": "insurance-roster", "title": "4대보험 사업장 가입자 명부", "rule": {"kind": "age_months", "months": 1}, "applicationType": "INNOBIZ", "url": "https://honestone.notion.site/ino", "version": "notion-2026-10-29-v1", "reviewedAt": "2026-10-29"}'::jsonb),
('INNOBIZ','innobiz-ip','{"key": "ip", "title": "지식재산권 등록원부", "conditional": true, "rule": {"kind": "none"}, "applicationType": "INNOBIZ", "url": "https://honestone.notion.site/ino", "version": "notion-2026-10-29-v1", "reviewedAt": "2026-10-29"}'::jsonb),
('INNOBIZ','innobiz-research','{"key": "research", "title": "연구소 인정서·인력 현황 또는 연구부서 증빙", "rule": {"kind": "none"}, "applicationType": "INNOBIZ", "url": "https://honestone.notion.site/ino", "version": "notion-2026-10-29-v1", "reviewedAt": "2026-10-29"}'::jsonb),
('INNOBIZ','innobiz-ir','{"key": "ir", "title": "기업 소개·IR 자료", "conditional": true, "rule": {"kind": "none"}, "applicationType": "INNOBIZ", "url": "https://honestone.notion.site/ino", "version": "notion-2026-10-29-v1", "reviewedAt": "2026-10-29"}'::jsonb),
('INNOBIZ','innobiz-certifications','{"key": "certifications", "title": "인증·수상·지역 우수기업 증빙", "conditional": true, "rule": {"kind": "none"}, "applicationType": "INNOBIZ", "url": "https://honestone.notion.site/ino", "version": "notion-2026-10-29-v1", "reviewedAt": "2026-10-29"}'::jsonb),
('INNOBIZ','innobiz-manual','{"key": "manual", "title": "ISO 매뉴얼·절차서·조직관리 서류", "rule": {"kind": "none"}, "applicationType": "INNOBIZ", "url": "https://honestone.notion.site/ino", "version": "notion-2026-10-29-v1", "reviewedAt": "2026-10-29"}'::jsonb),
('MAINBIZ','mainbiz-corporate-registry','{"key": "corporate-registry", "title": "법인등기부등본", "conditional": true, "guidance": "말소 포함, 개인기업 제외. 노션에 발급 일수 제한 없음.", "rule": {"kind": "none"}, "applicationType": "MAINBIZ", "url": "https://honestone.notion.site/mainbiz", "version": "notion-2026-10-29-v1", "reviewedAt": "2026-10-29"}'::jsonb),
('MAINBIZ','mainbiz-credit','{"key": "credit", "title": "신용정보조회서", "guidance": "평가기관별 요구 상이. 최신 요구 확인.", "rule": {"kind": "none"}, "applicationType": "MAINBIZ", "url": "https://honestone.notion.site/mainbiz", "version": "notion-2026-10-29-v1", "reviewedAt": "2026-10-29"}'::jsonb),
('MAINBIZ','mainbiz-financial-statements','{"key": "financial-statements", "title": "표준재무제표 증명원", "rule": {"kind": "years", "years": 3}, "applicationType": "MAINBIZ", "url": "https://honestone.notion.site/mainbiz", "version": "notion-2026-10-29-v1", "reviewedAt": "2026-10-29"}'::jsonb),
('MAINBIZ','mainbiz-accident-rate','{"key": "accident-rate", "title": "사업장 산업재해율", "conditional": true, "guidance": "제조·건설업 해당.", "rule": {"kind": "none"}, "applicationType": "MAINBIZ", "url": "https://honestone.notion.site/mainbiz", "version": "notion-2026-10-29-v1", "reviewedAt": "2026-10-29"}'::jsonb),
('MAINBIZ','mainbiz-introduction','{"key": "introduction", "title": "기업 소개·조직도", "rule": {"kind": "none"}, "applicationType": "MAINBIZ", "url": "https://honestone.notion.site/mainbiz", "version": "notion-2026-10-29-v1", "reviewedAt": "2026-10-29"}'::jsonb),
('MAINBIZ','mainbiz-business-plan','{"key": "business-plan", "title": "경영계획서", "rule": {"kind": "none"}, "applicationType": "MAINBIZ", "url": "https://honestone.notion.site/mainbiz", "version": "notion-2026-10-29-v1", "reviewedAt": "2026-10-29"}'::jsonb),
('MAINBIZ','mainbiz-procedures','{"key": "procedures", "title": "생산 표준·업무 프로세스·고객관리 문서", "rule": {"kind": "none"}, "applicationType": "MAINBIZ", "url": "https://honestone.notion.site/mainbiz", "version": "notion-2026-10-29-v1", "reviewedAt": "2026-10-29"}'::jsonb),
('MAINBIZ','mainbiz-hr-rules','{"key": "hr-rules", "title": "경영방침·사내규정", "rule": {"kind": "none"}, "applicationType": "MAINBIZ", "url": "https://honestone.notion.site/mainbiz", "version": "notion-2026-10-29-v1", "reviewedAt": "2026-10-29"}'::jsonb),
('MAINBIZ','mainbiz-customer-sales','{"key": "customer-sales", "title": "핵심고객 매출자료", "rule": {"kind": "years", "years": 3}, "applicationType": "MAINBIZ", "url": "https://honestone.notion.site/mainbiz", "version": "notion-2026-10-29-v1", "reviewedAt": "2026-10-29"}'::jsonb),
('MAINBIZ','mainbiz-employee-count','{"key": "employee-count", "title": "상시근로자·퇴사인원 자료", "rule": {"kind": "years", "years": 3}, "applicationType": "MAINBIZ", "url": "https://honestone.notion.site/mainbiz", "version": "notion-2026-10-29-v1", "reviewedAt": "2026-10-29"}'::jsonb),
('MAINBIZ','mainbiz-satisfaction','{"key": "satisfaction", "title": "고객만족 측정 결과", "rule": {"kind": "none"}, "applicationType": "MAINBIZ", "url": "https://honestone.notion.site/mainbiz", "version": "notion-2026-10-29-v1", "reviewedAt": "2026-10-29"}'::jsonb),
('RESEARCH','research-business-registration','{"key": "business-registration", "title": "사업자등록증", "rule": {"kind": "none"}, "applicationType": "RESEARCH", "url": "https://honestone.notion.site/rndask", "version": "notion-2026-10-29-v1", "reviewedAt": "2026-10-29"}'::jsonb),
('RESEARCH','research-insurance-roster','{"key": "insurance-roster", "title": "4대보험 가입자 명부", "rule": {"kind": "none"}, "applicationType": "RESEARCH", "url": "https://honestone.notion.site/rndask", "version": "notion-2026-10-29-v1", "reviewedAt": "2026-10-29"}'::jsonb),
('RESEARCH','research-sme-certificate','{"key": "sme-certificate", "title": "중소기업확인서", "rule": {"kind": "expiry", "required": true}, "applicationType": "RESEARCH", "url": "https://honestone.notion.site/rndask", "version": "notion-2026-10-29-v1", "reviewedAt": "2026-10-29"}'::jsonb),
('RESEARCH','research-industry-proof','{"key": "industry-proof", "title": "주업종 확인서류", "guidance": "세무사 요청 중소기업 기준검토표·명판·날인.", "rule": {"kind": "none"}, "applicationType": "RESEARCH", "url": "https://honestone.notion.site/rndask", "version": "notion-2026-10-29-v1", "reviewedAt": "2026-10-29"}'::jsonb),
('RESEARCH','research-financial-statements','{"key": "financial-statements", "title": "직전 3개년 재무제표", "rule": {"kind": "years", "years": 3}, "applicationType": "RESEARCH", "url": "https://honestone.notion.site/rndask", "version": "notion-2026-10-29-v1", "reviewedAt": "2026-10-29"}'::jsonb),
('RESEARCH','research-degree','{"key": "degree", "title": "연구원 졸업증명서", "rule": {"kind": "none"}, "applicationType": "RESEARCH", "url": "https://honestone.notion.site/rndask", "version": "notion-2026-10-29-v1", "reviewedAt": "2026-10-29"}'::jsonb),
('RESEARCH','research-facility','{"key": "facility", "title": "연구소 명판·내부 사진", "rule": {"kind": "none"}, "applicationType": "RESEARCH", "url": "https://honestone.notion.site/rndask", "version": "notion-2026-10-29-v1", "reviewedAt": "2026-10-29"}'::jsonb)
ON CONFLICT(application_type,request_key) DO UPDATE SET template=EXCLUDED.template;
NOTIFY pgrst,'reload schema';
COMMIT;
