-- S02/S03 -> S05/S11/S13/S16. Read-only portal context; no membership grants.
BEGIN;
CREATE OR REPLACE FUNCTION public.my_company_connections() RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE actor public.profiles; mode TEXT;
BEGIN
 SELECT * INTO actor FROM public.profiles WHERE id=auth.uid() AND is_active;
 IF actor.id IS NULL THEN RAISE EXCEPTION 'Active login required'; END IF;
 mode:=CASE WHEN actor.role='ADMIN' THEN 'admin' WHEN actor.role='AUDITOR' THEN 'auditor'
 WHEN EXISTS(SELECT 1 FROM public.managed_client_links l WHERE l.user_id=actor.id AND public.can_read_company(l.company_id))
 OR EXISTS(SELECT 1 FROM public.company_consultants c WHERE c.user_id=actor.id AND c.active AND public.can_edit_company(c.company_id))
 THEN 'consultant' ELSE 'enterprise' END;
 RETURN jsonb_build_object('mode',mode,'companies',COALESCE((
 SELECT jsonb_agg(jsonb_build_object('id',c.id,'name',c.name,'canEdit',public.can_edit_company(c.id)) ORDER BY c.name)
 FROM public.companies c WHERE public.can_read_company(c.id)
 ),'[]'::jsonb),'requests',COALESCE((
 SELECT jsonb_agg(jsonb_build_object('id',r.id,'companyName',c.name,'status',CASE WHEN r.status='approved' AND NOT public.can_read_company(r.company_id) THEN 'revoked' ELSE r.status END,'createdAt',r.created_at,'decidedAt',r.decided_at) ORDER BY r.created_at DESC)
 FROM public.company_join_requests r JOIN public.companies c ON c.id=r.company_id WHERE r.user_id=actor.id
 ),'[]'::jsonb));
END;
$$;
REVOKE ALL ON FUNCTION public.my_company_connections() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.my_company_connections() TO authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;
