-- S05/S32/S36/B02/B03: administrator-managed personal branding.
-- Prerequisite: site_article_people_migration.sql. No company/project data is copied.
BEGIN;
CREATE TABLE IF NOT EXISTS public.partner_profile_drafts (
 slug text PRIMARY KEY, content jsonb NOT NULL, revision integer NOT NULL DEFAULT 1,
 updated_by uuid NOT NULL REFERENCES auth.users(id), updated_at timestamptz NOT NULL DEFAULT now(),
 published_at timestamptz, published_revision integer,
 CHECK(public.is_public_article_person(slug,false)), CHECK(octet_length(content::text)<=120000)
);
CREATE TABLE IF NOT EXISTS public.partner_profiles (
 slug text PRIMARY KEY REFERENCES public.partner_profile_drafts(slug), content jsonb NOT NULL,
 published_at timestamptz NOT NULL DEFAULT now(), is_visible boolean NOT NULL DEFAULT true
);
CREATE TABLE IF NOT EXISTS public.partner_profile_revisions (
 slug text NOT NULL REFERENCES public.partner_profile_drafts(slug), revision integer NOT NULL,
 content jsonb NOT NULL, action text NOT NULL, actor uuid NOT NULL REFERENCES auth.users(id),
 created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(slug,revision)
);
ALTER TABLE public.partner_profile_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_profile_revisions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.partner_profile_drafts,public.partner_profiles,public.partner_profile_revisions FROM anon,authenticated;
GRANT SELECT ON public.partner_profiles TO anon,authenticated;
GRANT SELECT ON public.partner_profile_drafts,public.partner_profile_revisions TO authenticated;
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='partner_profiles' AND policyname='partner_public_read') THEN
  CREATE POLICY partner_public_read ON public.partner_profiles FOR SELECT TO anon,authenticated USING(is_visible);
 END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='partner_profile_drafts' AND policyname='partner_admin_read') THEN
  CREATE POLICY partner_admin_read ON public.partner_profile_drafts FOR SELECT TO authenticated USING(public.get_current_user_role()='ADMIN');
 END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='partner_profile_revisions' AND policyname='partner_revision_read') THEN
  CREATE POLICY partner_revision_read ON public.partner_profile_revisions FOR SELECT TO authenticated USING(public.get_current_user_role()='ADMIN');
 END IF;
END $$;
CREATE OR REPLACE FUNCTION public.validate_partner_content(c jsonb) RETURNS void LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
DECLARE item jsonb; key text; val text; fields text[];
BEGIN
 IF c IS NULL OR jsonb_typeof(c)<>'object' OR octet_length(c::text)>120000 THEN RAISE EXCEPTION '프로필 형식을 확인해 주세요' USING ERRCODE='22023'; END IF;
 FOREACH key IN ARRAY ARRAY['headline','about','youtubeChannelId','publicationNote'] LOOP
  IF jsonb_typeof(c->key) IS DISTINCT FROM 'string' THEN RAISE EXCEPTION '소개 입력을 확인해 주세요' USING ERRCODE='22023'; END IF;
 END LOOP;
 IF length(c->>'headline')>160 OR length(c->>'about')>5000 OR length(c->>'publicationNote')>2000 OR ((c->>'youtubeChannelId')<>'' AND (c->>'youtubeChannelId')!~'^UC[A-Za-z0-9_-]{22}$') THEN RAISE EXCEPTION '소개 길이 또는 채널 ID를 확인해 주세요' USING ERRCODE='22023'; END IF;
 IF jsonb_typeof(c->'links') IS DISTINCT FROM 'object' THEN RAISE EXCEPTION '채널 주소를 확인해 주세요' USING ERRCODE='22023'; END IF;
 FOREACH key IN ARRAY ARRAY['website','instagram','youtube'] LOOP
  val:=c->'links'->>key;
  IF jsonb_typeof(c->'links'->key) IS DISTINCT FROM 'string' OR length(val)>1000 OR (val<>'' AND val!~'^https://[A-Za-z0-9.-]+(/|$)') THEN RAISE EXCEPTION 'https 채널 주소를 입력해 주세요' USING ERRCODE='22023'; END IF;
 END LOOP;
 val:=c->'links'->>'instagram';
 IF val<>'' AND val!~'^https://(www\.)?instagram\.com/[A-Za-z0-9._]{1,30}/?$' THEN RAISE EXCEPTION '인스타그램 프로필 주소를 확인해 주세요' USING ERRCODE='22023'; END IF;
 val:=c->'links'->>'youtube';
 IF val<>'' AND val!~'^https://(www\.)?youtube\.com/(channel/UC[A-Za-z0-9_-]{22}|@[A-Za-z0-9_.%\-]+)/?$' THEN RAISE EXCEPTION '유튜브 채널 주소를 확인해 주세요' USING ERRCODE='22023'; END IF;
 IF (c->>'youtubeChannelId')<>'' AND (val='' OR (val LIKE '%/channel/%' AND rtrim(split_part(val,'/channel/',2),'/')<>c->>'youtubeChannelId')) THEN RAISE EXCEPTION '유튜브 채널이 일치하지 않습니다' USING ERRCODE='22023'; END IF;
 IF jsonb_typeof(c->'services') IS DISTINCT FROM 'array' THEN RAISE EXCEPTION '전문 분야를 확인해 주세요' USING ERRCODE='22023'; END IF;
 IF jsonb_array_length(c->'services')>12 THEN RAISE EXCEPTION '전문 분야는 최대12개입니다' USING ERRCODE='22023'; END IF;
 FOR item IN SELECT value FROM jsonb_array_elements(c->'services') LOOP
  IF jsonb_typeof(item)<>'string' OR length(item#>>'{}')>60 THEN RAISE EXCEPTION '전문 분야를 확인해 주세요' USING ERRCODE='22023'; END IF;
 END LOOP;
 FOREACH key IN ARRAY ARRAY['clients','work'] LOOP
  IF jsonb_typeof(c->key) IS DISTINCT FROM 'array' THEN RAISE EXCEPTION '이력 목록을 확인해 주세요' USING ERRCODE='22023'; END IF;
  IF jsonb_array_length(c->key)>24 THEN RAISE EXCEPTION '이력은 최대24개입니다' USING ERRCODE='22023'; END IF;
  IF (SELECT count(*)<>count(DISTINCT value->>'id') FROM jsonb_array_elements(c->key)) THEN RAISE EXCEPTION '이력 식별자가 중복됩니다' USING ERRCODE='22023'; END IF;
  FOR item IN SELECT value FROM jsonb_array_elements(c->key) LOOP
   IF jsonb_typeof(item)<>'object' OR jsonb_typeof(item->'isPublic') IS DISTINCT FROM 'boolean' OR coalesce(item->>'id','')!~'^[A-Za-z0-9_-]{1,64}$' THEN RAISE EXCEPTION '이력별 공개 여부를 확인해 주세요' USING ERRCODE='22023'; END IF;
   fields:=CASE WHEN key='clients' THEN ARRAY['name','summary','url'] ELSE ARRAY['title','client','period','role','description','url'] END;
   FOREACH val IN ARRAY fields LOOP
    IF jsonb_typeof(item->val) IS DISTINCT FROM 'string' OR length(item->>val)>(CASE val WHEN 'description' THEN 2000 WHEN 'url' THEN 1000 WHEN 'summary' THEN 300 WHEN 'title' THEN 160 WHEN 'period' THEN 80 ELSE 100 END) THEN RAISE EXCEPTION '이력 입력을 확인해 주세요' USING ERRCODE='22023'; END IF;
   END LOOP;
   IF length(trim(item->>(CASE WHEN key='clients' THEN 'name' ELSE 'title' END)))=0 OR ((item->>'url')<>'' AND (item->>'url')!~'^https://[A-Za-z0-9.-]+(/|$)') THEN RAISE EXCEPTION '이름과 공개 주소를 확인해 주세요' USING ERRCODE='22023'; END IF;
  END LOOP;
 END LOOP;
END;$$;
CREATE OR REPLACE FUNCTION public.partner_public_content(c jsonb) RETURNS jsonb LANGUAGE sql IMMUTABLE SET search_path=public,pg_temp AS $$
 SELECT jsonb_build_object('headline',c->'headline','about',c->'about','services',c->'services','links',jsonb_build_object('website',c->'links'->'website','instagram',c->'links'->'instagram','youtube',c->'links'->'youtube'),'youtubeChannelId',c->'youtubeChannelId',
 'clients',coalesce((SELECT jsonb_agg(jsonb_build_object('id',x->'id','name',x->'name','summary',x->'summary','url',x->'url')) FROM jsonb_array_elements(c->'clients') x WHERE x->>'isPublic'='true'),'[]'::jsonb),
 'work',coalesce((SELECT jsonb_agg(jsonb_build_object('id',x->'id','title',x->'title','client',x->'client','period',x->'period','role',x->'role','description',x->'description','url',x->'url')) FROM jsonb_array_elements(c->'work') x WHERE x->>'isPublic'='true'),'[]'::jsonb));
$$;
CREATE OR REPLACE FUNCTION public.save_partner_profile(p_slug text,p_revision integer,p_content jsonb) RETURNS public.partner_profile_drafts LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE d public.partner_profile_drafts;
BEGIN
 IF COALESCE(public.get_current_user_role(),'')<>'ADMIN' THEN RAISE EXCEPTION '관리자 권한이 필요합니다' USING ERRCODE='42501'; END IF;
 IF NOT coalesce(public.is_public_article_person(p_slug,false),false) OR p_revision IS NULL OR p_revision<0 THEN RAISE EXCEPTION '파트너와 저장본을 확인해 주세요' USING ERRCODE='22023'; END IF;
 PERFORM public.validate_partner_content(p_content);
 IF p_revision=0 THEN
  INSERT INTO public.partner_profile_drafts(slug,content,updated_by) VALUES(p_slug,p_content,auth.uid()) RETURNING * INTO d;
 ELSE
  UPDATE public.partner_profile_drafts SET content=p_content,revision=revision+1,updated_by=auth.uid(),updated_at=clock_timestamp() WHERE slug=p_slug AND revision=p_revision RETURNING * INTO d;
  IF NOT FOUND THEN RAISE EXCEPTION '다른 곳에서 수정되었습니다' USING ERRCODE='40001'; END IF;
 END IF;
 INSERT INTO public.partner_profile_revisions(slug,revision,content,action,actor) VALUES(d.slug,d.revision,d.content,'save',auth.uid());
 RETURN d;
END;$$;
CREATE OR REPLACE FUNCTION public.publish_partner_profile(p_slug text,p_revision integer,p_publish boolean) RETURNS public.partner_profile_drafts LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE d public.partner_profile_drafts;
BEGIN
 IF COALESCE(public.get_current_user_role(),'')<>'ADMIN' THEN RAISE EXCEPTION '관리자 권한이 필요합니다' USING ERRCODE='42501'; END IF;
 IF p_publish IS NULL THEN RAISE EXCEPTION '공개 여부를 확인해 주세요' USING ERRCODE='22023'; END IF;
 SELECT * INTO d FROM public.partner_profile_drafts WHERE slug=p_slug FOR UPDATE;
 IF NOT FOUND OR p_revision IS NULL OR d.revision<>p_revision THEN RAISE EXCEPTION '최신 저장본을 확인해 주세요' USING ERRCODE='40001'; END IF;
 IF p_publish THEN
  PERFORM public.validate_partner_content(d.content);
  IF length(trim(d.content->>'publicationNote'))=0 OR length(trim(d.content->>'about'))=0 OR length(trim(d.content->>'headline'))=0 THEN RAISE EXCEPTION '소개와 공개 확인 근거를 작성해 주세요' USING ERRCODE='22023'; END IF;
  INSERT INTO public.partner_profiles(slug,content) VALUES(d.slug,public.partner_public_content(d.content)) ON CONFLICT(slug) DO UPDATE SET content=EXCLUDED.content,published_at=now(),is_visible=true;
 ELSE
  UPDATE public.partner_profiles SET is_visible=false WHERE slug=p_slug;
 END IF;
 UPDATE public.partner_profile_drafts SET published_at=CASE WHEN p_publish THEN now() ELSE NULL END,published_revision=CASE WHEN p_publish THEN revision ELSE NULL END,revision=revision+1,updated_by=auth.uid(),updated_at=clock_timestamp() WHERE slug=p_slug RETURNING * INTO d;
 INSERT INTO public.partner_profile_revisions(slug,revision,content,action,actor) VALUES(d.slug,d.revision,d.content,CASE WHEN p_publish THEN 'publish' ELSE 'withdraw' END,auth.uid());
 RETURN d;
END;$$;
REVOKE ALL ON FUNCTION public.validate_partner_content(jsonb),public.partner_public_content(jsonb) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.save_partner_profile(text,integer,jsonb),public.publish_partner_profile(text,integer,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.save_partner_profile(text,integer,jsonb),public.publish_partner_profile(text,integer,boolean) TO authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;
