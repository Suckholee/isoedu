BEGIN;
CREATE TABLE IF NOT EXISTS public.managed_client_links (
 user_id UUID NOT NULL REFERENCES public.profiles(id),
 company_id UUID NOT NULL REFERENCES public.companies(id),
 source_client_id TEXT NOT NULL,
 PRIMARY KEY(user_id,source_client_id), UNIQUE(user_id,company_id)
);
ALTER TABLE public.managed_client_links ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Own managed client mappings" ON public.managed_client_links;
CREATE POLICY "Own managed client mappings" ON public.managed_client_links FOR SELECT TO authenticated USING(user_id=auth.uid());
REVOKE ALL ON public.managed_client_links FROM anon,authenticated;
GRANT SELECT ON public.managed_client_links TO authenticated;
CREATE OR REPLACE FUNCTION public.register_managed_client(client_name TEXT,source_key TEXT) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE company UUID;
BEGIN
 IF COALESCE(public.get_current_user_role(),'') NOT IN ('MEMBER','ADMIN') THEN RAISE EXCEPTION 'Active editor account required'; END IF;
 IF length(trim(client_name)) NOT BETWEEN 1 AND 180 OR length(source_key) NOT BETWEEN 1 AND 100 THEN RAISE EXCEPTION 'Invalid client name or source key'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 SELECT company_id INTO company FROM public.managed_client_links WHERE user_id=auth.uid() AND source_client_id=source_key;
 IF company IS NOT NULL THEN RETURN company; END IF;
 INSERT INTO public.companies(name,industry) VALUES(trim(client_name),'미분류') RETURNING id INTO company;
 INSERT INTO public.company_members(company_id,user_id,membership_role) VALUES(company,auth.uid(),'OWNER');
 INSERT INTO public.managed_client_links(user_id,company_id,source_client_id) VALUES(auth.uid(),company,source_key);
 RETURN company;
END;
$$;
REVOKE ALL ON FUNCTION public.register_managed_client(TEXT,TEXT) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.register_managed_client(TEXT,TEXT) TO authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;
