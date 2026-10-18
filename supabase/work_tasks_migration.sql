-- S02/S03 -> S05 work management. Apply after platform_migration.sql.
BEGIN;
CREATE TABLE IF NOT EXISTS public.work_tasks (
 id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
 created_by UUID NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id),
 company_id UUID REFERENCES public.companies(id),
 document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
 title TEXT NOT NULL CHECK (length(trim(title)) BETWEEN 1 AND 180),
 status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo','doing','waiting','done')),
 due_date DATE, official_due_date DATE,
 assignee TEXT NOT NULL DEFAULT '나' CHECK (length(assignee) BETWEEN 1 AND 80),
 notes TEXT NOT NULL DEFAULT '' CHECK (length(notes)<=10000),
 source_url TEXT NOT NULL DEFAULT '' CHECK (source_url='' OR source_url ~* '^https?://[^[:space:]]+$'),
 checklist JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(checklist)='array' AND jsonb_array_length(checklist)<=50),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS work_tasks_company_due ON public.work_tasks(company_id,due_date);
CREATE INDEX IF NOT EXISTS work_tasks_creator ON public.work_tasks(created_by);
ALTER TABLE public.work_tasks ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.validate_work_task() RETURNS trigger
LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
BEGIN
 IF TG_OP='UPDATE' THEN
  IF NEW.created_by<>OLD.created_by THEN RAISE EXCEPTION 'Task creator cannot be changed'; END IF;
  NEW.created_at:=OLD.created_at;
 END IF;
 IF NEW.document_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM public.documents d WHERE d.id=NEW.document_id AND d.company_id=NEW.company_id
 ) THEN RAISE EXCEPTION 'Document must belong to the selected company'; END IF;
 IF EXISTS (SELECT 1 FROM jsonb_array_elements(NEW.checklist) item WHERE jsonb_typeof(item)<>'object'
  OR jsonb_typeof(item->'text') IS DISTINCT FROM 'string' OR length(item->>'text')>200
  OR jsonb_typeof(item->'done') IS DISTINCT FROM 'boolean') THEN RAISE EXCEPTION 'Invalid checklist'; END IF;
 NEW.updated_at:=now();RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS validate_work_task ON public.work_tasks;
CREATE TRIGGER validate_work_task BEFORE INSERT OR UPDATE ON public.work_tasks FOR EACH ROW EXECUTE FUNCTION public.validate_work_task();
DROP POLICY IF EXISTS "Read authorized work tasks" ON public.work_tasks;
CREATE POLICY "Read authorized work tasks" ON public.work_tasks FOR SELECT TO authenticated USING (
 public.get_current_user_role() IS NOT NULL AND ((company_id IS NULL AND created_by=auth.uid())
 OR (company_id IS NOT NULL AND public.can_read_company(company_id)))
);
DROP POLICY IF EXISTS "Create authorized work tasks" ON public.work_tasks;
CREATE POLICY "Create authorized work tasks" ON public.work_tasks FOR INSERT TO authenticated WITH CHECK (
 public.get_current_user_role() IS NOT NULL AND created_by=auth.uid() AND
 (company_id IS NULL OR public.can_edit_company(company_id))
);
DROP POLICY IF EXISTS "Update authorized work tasks" ON public.work_tasks;
CREATE POLICY "Update authorized work tasks" ON public.work_tasks FOR UPDATE TO authenticated USING (
 public.get_current_user_role() IS NOT NULL AND ((company_id IS NULL AND created_by=auth.uid())
 OR (company_id IS NOT NULL AND public.can_edit_company(company_id)))
) WITH CHECK (public.get_current_user_role() IS NOT NULL AND
 ((company_id IS NULL AND created_by=auth.uid()) OR (company_id IS NOT NULL AND public.can_edit_company(company_id))));
REVOKE ALL ON public.work_tasks FROM anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON public.work_tasks TO authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;
