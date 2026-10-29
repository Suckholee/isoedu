-- S11/S13/S16/S17: persist unconfirmed candidates separately from certificate expiry.
BEGIN;
CREATE OR REPLACE FUNCTION public.save_document_date_reading(d_id UUID,expected_path TEXT,expected_updated_at TIMESTAMPTZ,reading JSONB) RETURNS public.documents LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE d public.documents;p TEXT;hash TEXT;v JSONB;state TEXT;
BEGIN
 SELECT * INTO d FROM public.documents WHERE id=d_id FOR UPDATE;
 IF d.id IS NULL OR NOT public.can_edit_company(d.company_id) THEN RAISE EXCEPTION 'Company editor required'; END IF;
 p:=COALESCE(NULLIF(d.file_url,''),d.metadata->>'originalPath','');
 IF p IS DISTINCT FROM COALESCE(expected_path,'') OR d.updated_at IS DISTINCT FROM expected_updated_at THEN RAISE EXCEPTION 'Concurrent update; reload required'; END IF;
 IF p<>'' AND p NOT LIKE 'companies/'||d.company_id||'/'||d.id||'/%' THEN RAISE EXCEPTION 'Invalid original path'; END IF;
 IF reading IS NULL OR jsonb_typeof(reading)<>'object' OR octet_length(reading::text)>180000 THEN RAISE EXCEPTION 'Invalid reading';END IF;
 IF reading ? 'evidence' AND jsonb_typeof(reading->'evidence')<>'object' THEN RAISE EXCEPTION 'Invalid evidence';END IF;
 IF reading ? 'warnings' AND jsonb_typeof(reading->'warnings')<>'array' OR reading ? 'conflicts' AND jsonb_typeof(reading->'conflicts')<>'array' THEN RAISE EXCEPTION 'Invalid reading notices';END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(COALESCE(reading->'warnings','[]')||COALESCE(reading->'conflicts','[]')) x WHERE jsonb_typeof(x)<>'string') THEN RAISE EXCEPTION 'Invalid notice text';END IF;
 state:=reading->>'status';
 IF state NOT IN ('review','no_candidates','failed') OR state IS NULL THEN RAISE EXCEPTION 'Invalid reading status';END IF;
 IF state<>'failed' THEN
  IF COALESCE(reading->>'sourceHash','')!~'^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'Original hash required';END IF;
  IF p='' THEN hash:=encode(sha256(convert_to(COALESCE(d.content_draft,''),'UTF8')),'hex');ELSE
  SELECT checksum INTO hash FROM public.document_versions WHERE document_id=d.id AND file_path=p ORDER BY created_at DESC LIMIT 1;IF hash IS NULL AND p=d.metadata->>'originalPath' THEN hash:=d.metadata->'migration'->>'sha256';END IF;END IF;
  IF reading->>'sourceUnavailable'='true' AND reading->>'textHash' IS DISTINCT FROM encode(sha256(convert_to(COALESCE(d.content_draft,''),'UTF8')),'hex') THEN RAISE EXCEPTION 'Stored text changed';END IF;
  IF hash IS NOT NULL AND hash<>reading->>'sourceHash' THEN RAISE EXCEPTION 'Original checksum changed';END IF;
  IF NULLIF(reading->>'issuedOn','') IS NOT NULL THEN PERFORM (reading->>'issuedOn')::date;END IF;
  IF NULLIF(reading->>'validUntil','') IS NOT NULL THEN PERFORM (reading->>'validUntil')::date;END IF;
  IF jsonb_typeof(reading->'coveredYears') IS DISTINCT FROM 'array' OR jsonb_array_length(reading->'coveredYears')>30 THEN RAISE EXCEPTION 'Invalid candidate years';END IF;
  IF EXISTS(SELECT 1 FROM jsonb_array_elements_text(reading->'coveredYears') y WHERE y IS NULL OR y!~'^20[0-9]{2}$') THEN RAISE EXCEPTION 'Invalid candidate year';END IF;
 END IF;
 v:=jsonb_build_object('id',gen_random_uuid(),'engine','browser-reader-20261029-v2','status',state,'sourcePath',p,'sourceHash',reading->>'sourceHash','sourceUnavailable',COALESCE((reading->>'sourceUnavailable')::boolean,false),'textHash',reading->>'textHash','readAt',now(),'readBy',auth.uid(),'issuedOn',COALESCE(reading->>'issuedOn',''),'validUntil',COALESCE(reading->>'validUntil',''),'coveredYears',COALESCE(reading->'coveredYears','[]'),'evidence',COALESCE(reading->'evidence','{}'),'conflicts',COALESCE(reading->'conflicts','[]'),'warnings',COALESCE(reading->'warnings','[]'),'error',left(COALESCE(reading->>'error',''),400),'requiresConfirmation',true);
 UPDATE public.documents SET metadata=COALESCE(metadata,'{}')||jsonb_build_object('dateReading',v),updated_at=clock_timestamp() WHERE id=d.id RETURNING * INTO d;
 INSERT INTO public.audit_logs(company_id,user_id,action_type,target_resource,resource_id,details) VALUES(d.company_id,auth.uid(),'UPDATE','DOCUMENT_DATE_READING',d.id,jsonb_build_object('readingId',v->>'id','sourceHash',v->>'sourceHash','status',state));
 RETURN d;
END;
$$;
CREATE OR REPLACE FUNCTION public.confirm_document_date_reading(d_id UUID,reading_id UUID,expected_updated_at TIMESTAMPTZ,issue_date DATE,expiry_date DATE,years INTEGER[],checked BOOLEAN) RETURNS public.documents LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE d public.documents;r JSONB;facts JSONB;p TEXT;
BEGIN
 SELECT * INTO d FROM public.documents WHERE id=d_id FOR UPDATE;
 IF d.id IS NULL OR NOT public.can_edit_company(d.company_id) THEN RAISE EXCEPTION 'Company editor required';END IF;
 r:=d.metadata->'dateReading';p:=COALESCE(NULLIF(d.file_url,''),d.metadata->>'originalPath','');
 IF d.updated_at IS DISTINCT FROM expected_updated_at OR r->>'id' IS DISTINCT FROM reading_id::text OR r->>'sourcePath' IS DISTINCT FROM p THEN RAISE EXCEPTION 'Concurrent update; reload required';END IF;
 IF r IS NULL OR reading_id IS NULL OR r->>'status' IS NULL OR r->>'status' NOT IN ('review','no_candidates') OR checked IS DISTINCT FROM true THEN RAISE EXCEPTION 'Original confirmation required';END IF;
 IF issue_date>(now() AT TIME ZONE 'Asia/Seoul')::date OR expiry_date<issue_date OR years IS NULL OR cardinality(years)>30 OR EXISTS(SELECT 1 FROM unnest(years) y WHERE y IS NULL OR y<1900 OR y>extract(year from (now() AT TIME ZONE 'Asia/Seoul'))::integer) THEN RAISE EXCEPTION 'Invalid confirmed dates';END IF;
 facts:=jsonb_build_object('issuedOn',issue_date,'validUntil',expiry_date,'coveredYears',years,'sourcePath',p,'sourceHash',r->>'sourceHash','readingId',reading_id,'confirmedAt',now(),'confirmedBy',auth.uid());
 -- Keep official certificate expiry_date and project validity untouched; these are source facts.
 UPDATE public.documents SET metadata=metadata||jsonb_build_object('dateFacts',facts,'dateReading',r||jsonb_build_object('status','confirmed','requiresConfirmation',false)),updated_at=clock_timestamp() WHERE id=d.id RETURNING * INTO d;
 INSERT INTO public.audit_logs(company_id,user_id,action_type,target_resource,resource_id,details) VALUES(d.company_id,auth.uid(),'UPDATE','DOCUMENT_DATE_CONFIRMATION',d.id,jsonb_build_object('facts',facts));RETURN d;
END;
$$;
REVOKE ALL ON FUNCTION public.save_document_date_reading(UUID,TEXT,TIMESTAMPTZ,JSONB),public.confirm_document_date_reading(UUID,UUID,TIMESTAMPTZ,DATE,DATE,INTEGER[],BOOLEAN) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.save_document_date_reading(UUID,TEXT,TIMESTAMPTZ,JSONB),public.confirm_document_date_reading(UUID,UUID,TIMESTAMPTZ,DATE,DATE,INTEGER[],BOOLEAN) TO authenticated;
CREATE OR REPLACE FUNCTION public.protect_document_date_fields() RETURNS TRIGGER LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
BEGIN
 IF current_user IN ('authenticated','anon') THEN
  NEW.metadata:=COALESCE(NEW.metadata,'{}')-'dateReading'-'dateFacts';
  IF TG_OP='UPDATE' THEN
   IF OLD.metadata ? 'dateReading' THEN NEW.metadata:=NEW.metadata||jsonb_build_object('dateReading',OLD.metadata->'dateReading');END IF;
   IF OLD.metadata ? 'dateFacts' THEN NEW.metadata:=NEW.metadata||jsonb_build_object('dateFacts',OLD.metadata->'dateFacts');END IF;
  END IF;
 END IF;
 IF TG_OP='UPDATE' AND (COALESCE(NULLIF(NEW.file_url,''),NEW.metadata->>'originalPath','') IS DISTINCT FROM COALESCE(NULLIF(OLD.file_url,''),OLD.metadata->>'originalPath','') OR ((COALESCE(NULLIF(NEW.file_url,''),NEW.metadata->>'originalPath','')='' OR OLD.metadata->'dateReading'->>'sourceUnavailable'='true') AND NEW.content_draft IS DISTINCT FROM OLD.content_draft)) THEN
  NEW.metadata:=NEW.metadata-'dateReading'-'dateFacts';
 END IF;
 RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.protect_document_date_fields() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS protect_document_date_fields ON public.documents;
CREATE TRIGGER protect_document_date_fields BEFORE INSERT OR UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.protect_document_date_fields();
NOTIFY pgrst,'reload schema';
COMMIT;
