-- S02/S03/S05/S11-S17: company knowledge. Apply after platform_migration.sql.
BEGIN;
CREATE TABLE IF NOT EXISTS public.knowledge_records (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 company_id uuid NOT NULL REFERENCES public.companies(id),
 title text NOT NULL CHECK(length(trim(title)) BETWEEN 1 AND 200),
 body text NOT NULL DEFAULT '' CHECK(length(body)<=50000),
 kind text NOT NULL CHECK(kind IN ('note','meeting','knowledge','link')),
 source_url text NOT NULL DEFAULT '' CHECK(length(source_url)<=2000 AND (source_url='' OR source_url ~* '^https?://[^/@[:space:]]+([/?#]|$)')),
 tags text[] NOT NULL DEFAULT '{}' CHECK(cardinality(tags)<=12), event_date date,
 project_id uuid REFERENCES public.audit_projects(id) ON DELETE SET NULL,
 document_id uuid REFERENCES public.documents(id) ON DELETE SET NULL,
 pinned boolean NOT NULL DEFAULT false, archived boolean NOT NULL DEFAULT false,
 revision integer NOT NULL DEFAULT 1,
 created_by uuid NOT NULL REFERENCES auth.users(id),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK(kind<>'link' OR source_url<>'')
);
CREATE INDEX IF NOT EXISTS knowledge_company_index ON public.knowledge_records(company_id,updated_at DESC);
ALTER TABLE public.knowledge_records ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.knowledge_records FROM anon,authenticated;
GRANT SELECT ON public.knowledge_records TO authenticated;
DROP POLICY IF EXISTS knowledge_company_read ON public.knowledge_records;
CREATE POLICY knowledge_company_read ON public.knowledge_records FOR SELECT TO authenticated USING(public.can_read_company(company_id));

CREATE OR REPLACE FUNCTION public.save_knowledge_record(p_id uuid,p_revision integer,p_record jsonb)
RETURNS public.knowledge_records LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE old public.knowledge_records; result public.knowledge_records;
 c uuid := (p_record->>'company_id')::uuid;
 p uuid := nullif(p_record->>'project_id','')::uuid;
 d uuid := nullif(p_record->>'document_id','')::uuid;
 topics text[];
BEGIN
 IF auth.uid() IS NULL OR NOT COALESCE(public.can_edit_company(c),false) THEN RAISE EXCEPTION 'Company editor required' USING ERRCODE='42501'; END IF;
 IF p_id IS NULL OR p_revision IS NULL OR p_revision<0 OR c IS NULL THEN RAISE EXCEPTION 'Invalid record' USING ERRCODE='22023'; END IF;
 SELECT * INTO old FROM public.knowledge_records WHERE id=p_id FOR UPDATE;
 IF FOUND AND old.company_id<>c THEN RAISE EXCEPTION 'Company mismatch' USING ERRCODE='42501'; END IF;
 IF (old.id IS NULL AND p_revision<>0) OR (old.id IS NOT NULL AND old.revision<>p_revision) THEN RAISE EXCEPTION 'Revision conflict' USING ERRCODE='40001'; END IF;
 IF p IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.audit_projects WHERE id=p AND company_id=c) THEN RAISE EXCEPTION 'Project mismatch' USING ERRCODE='42501'; END IF;
 IF d IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.documents WHERE id=d AND company_id=c) THEN RAISE EXCEPTION 'Document mismatch' USING ERRCODE='42501'; END IF;
 IF jsonb_typeof(p_record->'tags') IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Invalid topics' USING ERRCODE='22023'; END IF;
 SELECT COALESCE(array_agg(value),'{}') INTO topics FROM jsonb_array_elements_text(p_record->'tags');
 IF EXISTS(SELECT 1 FROM unnest(topics) t WHERE length(t)>40 OR t IS NULL) THEN RAISE EXCEPTION 'Invalid topics' USING ERRCODE='22023'; END IF;
 IF old.id IS NULL THEN
  INSERT INTO public.knowledge_records(id,company_id,title,body,kind,source_url,tags,event_date,project_id,document_id,pinned,archived,created_by)
  VALUES(p_id,c,trim(p_record->>'title'),p_record->>'body',p_record->>'kind',p_record->>'source_url',topics,nullif(p_record->>'event_date','')::date,p,d,COALESCE((p_record->>'pinned')::boolean,false),COALESCE((p_record->>'archived')::boolean,false),auth.uid()) RETURNING * INTO result;
 ELSE
  UPDATE public.knowledge_records SET title=trim(p_record->>'title'),body=p_record->>'body',kind=p_record->>'kind',source_url=p_record->>'source_url',tags=topics,event_date=nullif(p_record->>'event_date','')::date,project_id=p,document_id=d,pinned=COALESCE((p_record->>'pinned')::boolean,false),archived=COALESCE((p_record->>'archived')::boolean,false),revision=revision+1,updated_at=clock_timestamp()
  WHERE id=p_id RETURNING * INTO result;
 END IF;
 RETURN result;
END;$$;
REVOKE ALL ON FUNCTION public.save_knowledge_record(uuid,integer,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.save_knowledge_record(uuid,integer,jsonb) TO authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;
