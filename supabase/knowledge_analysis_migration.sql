-- K01 extension: source-grounded concepts, atomic analysis save, durable per-account quota.
BEGIN;
ALTER TABLE public.knowledge_records ADD COLUMN IF NOT EXISTS analysis jsonb;
CREATE OR REPLACE FUNCTION public.clear_stale_knowledge_analysis() RETURNS trigger LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
BEGIN IF NEW.source_url IS DISTINCT FROM OLD.source_url THEN NEW.analysis:=NULL; END IF; RETURN NEW; END $$;
DROP TRIGGER IF EXISTS knowledge_source_change ON public.knowledge_records;
CREATE TRIGGER knowledge_source_change BEFORE UPDATE ON public.knowledge_records FOR EACH ROW EXECUTE FUNCTION public.clear_stale_knowledge_analysis();
CREATE TABLE IF NOT EXISTS public.knowledge_link_reads(user_id uuid NOT NULL REFERENCES auth.users(id),company_id uuid NOT NULL REFERENCES public.companies(id),created_at timestamptz NOT NULL DEFAULT clock_timestamp());
CREATE INDEX IF NOT EXISTS knowledge_link_reads_user_time ON public.knowledge_link_reads(user_id,created_at);
ALTER TABLE public.knowledge_link_reads ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.knowledge_link_reads FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE FUNCTION public.claim_knowledge_link_read(p_company uuid) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT COALESCE(public.can_edit_company(p_company),false) THEN RAISE EXCEPTION 'Editor required' USING ERRCODE='42501'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(auth.uid()::text,718));
 IF (SELECT count(*) FROM public.knowledge_link_reads WHERE user_id=auth.uid() AND created_at>now()-interval '5 minutes')>=10 OR (SELECT count(*) FROM public.knowledge_link_reads WHERE user_id=auth.uid() AND created_at>now()-interval '1 day')>=100 THEN RAISE EXCEPTION 'Link read limit' USING ERRCODE='P0001'; END IF;
 INSERT INTO public.knowledge_link_reads(user_id,company_id) VALUES(auth.uid(),p_company);RETURN true;
END $$;
CREATE OR REPLACE FUNCTION public.save_knowledge_analysis(p_id uuid,p_revision integer,p_record jsonb,p_analysis jsonb) RETURNS public.knowledge_records LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE saved public.knowledge_records;
BEGIN
 IF p_analysis IS NULL OR jsonb_typeof(p_analysis)<>'object' OR octet_length(p_analysis::text)>30000
 OR p_analysis->>'method' IS DISTINCT FROM 'extractive-v1'
 OR jsonb_typeof(p_analysis->'summary') IS DISTINCT FROM 'array'
 OR jsonb_typeof(p_analysis->'concepts') IS DISTINCT FROM 'array'
 OR jsonb_typeof(p_analysis->'relations') IS DISTINCT FROM 'array'
 THEN RAISE EXCEPTION 'Invalid analysis' USING ERRCODE='22023'; END IF;
 IF jsonb_array_length(p_analysis->'concepts')>20 OR jsonb_array_length(p_analysis->'summary')>5 OR jsonb_array_length(p_analysis->'relations')>30 THEN RAISE EXCEPTION 'Analysis too large' USING ERRCODE='22023'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(p_analysis->'concepts') c WHERE jsonb_typeof(c)<>'object' OR length(COALESCE(c->>'key','')) NOT BETWEEN 1 AND 80 OR length(COALESCE(c->>'label','')) NOT BETWEEN 1 AND 80 OR length(COALESCE(c->>'evidence','')) NOT BETWEEN 1 AND 1000) THEN RAISE EXCEPTION 'Invalid concept' USING ERRCODE='22023'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(p_analysis->'summary') x WHERE jsonb_typeof(x)<>'string' OR length(x#>>'{}')>1000) OR EXISTS(SELECT 1 FROM jsonb_array_elements(p_analysis->'relations') r WHERE jsonb_typeof(r)<>'object' OR length(COALESCE(r->>'evidence','')) NOT BETWEEN 1 AND 1000 OR NOT EXISTS(SELECT 1 FROM jsonb_array_elements(p_analysis->'concepts') c WHERE c->>'key'=r->>'source') OR NOT EXISTS(SELECT 1 FROM jsonb_array_elements(p_analysis->'concepts') c WHERE c->>'key'=r->>'target')) THEN RAISE EXCEPTION 'Invalid evidence' USING ERRCODE='22023'; END IF;
 SELECT * INTO saved FROM public.save_knowledge_record(p_id,p_revision,p_record);
 UPDATE public.knowledge_records SET analysis=p_analysis WHERE id=saved.id RETURNING * INTO saved;
 RETURN saved;
END $$;
REVOKE ALL ON FUNCTION public.claim_knowledge_link_read(uuid) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.save_knowledge_analysis(uuid,integer,jsonb,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.claim_knowledge_link_read(uuid),public.save_knowledge_analysis(uuid,integer,jsonb,jsonb) TO authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;
