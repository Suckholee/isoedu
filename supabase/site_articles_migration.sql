-- S32 public editorial CMS. Drafts and published snapshots have separate access boundaries.
BEGIN;
CREATE TABLE IF NOT EXISTS public.site_article_drafts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL DEFAULT '', body text NOT NULL DEFAULT '',
 category text NOT NULL DEFAULT '어니스톤 이야기', topic text NOT NULL DEFAULT '', source_notes text NOT NULL DEFAULT '',
 ai_generated boolean NOT NULL DEFAULT false, revision integer NOT NULL DEFAULT 1,
 created_by uuid NOT NULL REFERENCES auth.users(id), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 published_revision integer, published_at timestamptz,
 CHECK(length(title)<=200 AND length(body)<=40000 AND length(category)<=40 AND length(topic)<=500 AND length(source_notes)<=20000)
);
CREATE TABLE IF NOT EXISTS public.site_articles (
 id uuid PRIMARY KEY REFERENCES public.site_article_drafts(id),title text NOT NULL,body text NOT NULL,category text NOT NULL,
 ai_generated boolean NOT NULL,published_at timestamptz NOT NULL,updated_at timestamptz NOT NULL
);
CREATE TABLE IF NOT EXISTS public.site_article_ai_requests(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),actor uuid NOT NULL REFERENCES auth.users(id),created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS site_article_ai_actor_date ON public.site_article_ai_requests(actor,created_at);
ALTER TABLE public.site_article_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_article_ai_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.site_article_drafts,public.site_articles,public.site_article_ai_requests FROM anon,authenticated;
GRANT SELECT ON public.site_articles TO anon,authenticated;
GRANT SELECT ON public.site_article_drafts TO authenticated;
DROP POLICY IF EXISTS site_articles_public_read ON public.site_articles;
CREATE POLICY site_articles_public_read ON public.site_articles FOR SELECT TO anon,authenticated USING(true);
DROP POLICY IF EXISTS site_drafts_admin_read ON public.site_article_drafts;
CREATE POLICY site_drafts_admin_read ON public.site_article_drafts FOR SELECT TO authenticated USING(public.get_current_user_role()='ADMIN');
CREATE OR REPLACE FUNCTION public.save_site_article(p_id uuid,p_revision integer,p_title text,p_body text,p_category text,p_topic text,p_source_notes text,p_ai_generated boolean)
RETURNS public.site_article_drafts LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE result public.site_article_drafts;
BEGIN
 IF COALESCE(public.get_current_user_role(),'')<>'ADMIN' THEN RAISE EXCEPTION '관리자 권한이 필요합니다' USING ERRCODE='42501'; END IF;
 IF p_id IS NULL OR p_revision IS NULL OR p_revision<0 THEN RAISE EXCEPTION '입력 형식 오류'; END IF;
 IF p_revision=0 THEN
  INSERT INTO public.site_article_drafts(id,title,body,category,topic,source_notes,ai_generated,created_by)
  VALUES(p_id,p_title,p_body,p_category,p_topic,p_source_notes,p_ai_generated,auth.uid()) RETURNING * INTO result;
 ELSE
  UPDATE public.site_article_drafts SET title=p_title,body=p_body,category=p_category,topic=p_topic,source_notes=p_source_notes,ai_generated=(ai_generated OR p_ai_generated),revision=revision+1,updated_at=clock_timestamp()
  WHERE id=p_id AND revision=p_revision RETURNING * INTO result;
  IF NOT FOUND THEN RAISE EXCEPTION '다른 곳에서 수정되었습니다. 저장본을 다시 확인해 주세요' USING ERRCODE='40001'; END IF;
 END IF;
 RETURN result;
END;$$;
CREATE OR REPLACE FUNCTION public.publish_site_article(p_id uuid,p_revision integer,p_publish boolean)
RETURNS public.site_article_drafts LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE d public.site_article_drafts;
BEGIN
 IF COALESCE(public.get_current_user_role(),'')<>'ADMIN' THEN RAISE EXCEPTION '관리자 권한이 필요합니다' USING ERRCODE='42501'; END IF;
 IF p_id IS NULL OR p_revision IS NULL OR p_publish IS NULL THEN RAISE EXCEPTION '입력 형식 오류' USING ERRCODE='22023'; END IF;
 SELECT * INTO d FROM public.site_article_drafts WHERE id=p_id FOR UPDATE;
 IF NOT FOUND OR d.revision<>p_revision THEN RAISE EXCEPTION '최신 저장본을 확인해 주세요' USING ERRCODE='40001'; END IF;
 IF p_publish THEN
  IF length(trim(d.title))<2 OR length(trim(d.body))<80 THEN RAISE EXCEPTION '제목과 본문을 작성해 주세요' USING ERRCODE='22023'; END IF;
  INSERT INTO public.site_articles(id,title,body,category,ai_generated,published_at,updated_at)
  VALUES(d.id,d.title,d.body,d.category,d.ai_generated,COALESCE(d.published_at,now()),now())
  ON CONFLICT(id) DO UPDATE SET title=EXCLUDED.title,body=EXCLUDED.body,category=EXCLUDED.category,ai_generated=EXCLUDED.ai_generated,updated_at=now();
  UPDATE public.site_article_drafts SET published_revision=revision,published_at=COALESCE(published_at,now()),revision=revision+1 WHERE id=p_id RETURNING * INTO d;
 ELSE
  DELETE FROM public.site_articles WHERE id=p_id;
  UPDATE public.site_article_drafts SET published_revision=NULL,published_at=NULL,revision=revision+1 WHERE id=p_id RETURNING * INTO d;
 END IF;
 RETURN d;
END;$$;
CREATE OR REPLACE FUNCTION public.claim_site_article_ai() RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE result uuid;
BEGIN
 IF COALESCE(public.get_current_user_role(),'')<>'ADMIN' THEN RAISE EXCEPTION '관리자 권한이 필요합니다' USING ERRCODE='42501'; END IF;
 PERFORM pg_advisory_xact_lock(hashtext('site-article-ai-'||auth.uid()::text));
 IF (SELECT count(*) FROM public.site_article_ai_requests WHERE actor=auth.uid() AND created_at>now()-interval '1 hour')>=10 THEN RAISE EXCEPTION '시간당 10회까지 작성할 수 있습니다' USING ERRCODE='P0001'; END IF;
 INSERT INTO public.site_article_ai_requests(actor) VALUES(auth.uid()) RETURNING id INTO result;
 RETURN result;
END;$$;
REVOKE ALL ON FUNCTION public.save_site_article(uuid,integer,text,text,text,text,text,boolean),public.publish_site_article(uuid,integer,boolean),public.claim_site_article_ai() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.save_site_article(uuid,integer,text,text,text,text,text,boolean),public.publish_site_article(uuid,integer,boolean),public.claim_site_article_ai() TO authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;
