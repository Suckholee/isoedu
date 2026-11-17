-- S05/S32/B02: explicit public attribution, independent of account/company access.
BEGIN;
ALTER TABLE public.site_article_drafts ADD COLUMN IF NOT EXISTS author_slug text;
ALTER TABLE public.site_article_drafts ADD COLUMN IF NOT EXISTS reviewer_slug text;
ALTER TABLE public.site_article_drafts ADD COLUMN IF NOT EXISTS attribution_note text NOT NULL DEFAULT '';
ALTER TABLE public.site_article_drafts ADD COLUMN IF NOT EXISTS reviewed_on date;
ALTER TABLE public.site_articles ADD COLUMN IF NOT EXISTS author_slug text;
ALTER TABLE public.site_articles ADD COLUMN IF NOT EXISTS reviewer_slug text;
ALTER TABLE public.site_articles ADD COLUMN IF NOT EXISTS reviewed_on date;
CREATE INDEX IF NOT EXISTS site_articles_author ON public.site_articles(author_slug);
CREATE INDEX IF NOT EXISTS site_articles_reviewer ON public.site_articles(reviewer_slug);
-- Legacy save callers must not silently carry an old attribution onto changed content.
CREATE OR REPLACE FUNCTION public.clear_changed_article_people() RETURNS trigger LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
BEGIN
 IF ROW(NEW.title,NEW.body,NEW.category,NEW.ai_generated,NEW.source_notes) IS DISTINCT FROM ROW(OLD.title,OLD.body,OLD.category,OLD.ai_generated,OLD.source_notes) THEN
  NEW.author_slug:=NULL;NEW.reviewer_slug:=NULL;NEW.attribution_note:='';NEW.reviewed_on:=NULL;
 END IF;
 RETURN NEW;
END;$$;
DO $migration$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgname='clear_changed_article_people' AND tgrelid='public.site_article_drafts'::regclass) THEN
  CREATE TRIGGER clear_changed_article_people BEFORE UPDATE ON public.site_article_drafts FOR EACH ROW EXECUTE FUNCTION public.clear_changed_article_people();
 END IF;
END $migration$;
CREATE OR REPLACE FUNCTION public.is_public_article_person(slug text,person_only boolean) RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path=public,pg_temp AS $$ SELECT slug IN ('youngbin-cho','seokho-lee','harim-lee','hongseok-park','yeonwoo-seo','yonghwan-lee','ara-ryu','jeongyong-lee','jongbin-lee','hyunjin-joo','jaeeon-moon','yujin-wi','kyungi-park','suhyung-ahn','wanggyu-song','kyungjin-son','hyunbae-bang','youngmoon-kim','taehoon-kim','ryunc-safety','hohyun-park','resting-friends','alchemist-k','insook-yeom','jeonghyun-yoon','cheering-ryan','hwayoung-lee','tax-beauty','muhyun-kim','jeongyul','hyunsu-ham','bb','seungwoo-yoon') AND (NOT person_only OR slug NOT IN ('ryunc-safety')) $$;
REVOKE ALL ON FUNCTION public.is_public_article_person(text,boolean) FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE FUNCTION public.save_site_article_with_people(p_id uuid,p_revision integer,p_title text,p_body text,p_category text,p_topic text,p_source_notes text,p_ai_generated boolean,p_author_slug text,p_reviewer_slug text,p_attribution_note text,p_reviewed_on date)
RETURNS public.site_article_drafts LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE result public.site_article_drafts;
BEGIN
 IF COALESCE(public.get_current_user_role(),'')<>'ADMIN' THEN RAISE EXCEPTION '관리자 권한이 필요합니다' USING ERRCODE='42501'; END IF;
 IF (p_author_slug IS NOT NULL AND NOT public.is_public_article_person(p_author_slug,false)) OR (p_reviewer_slug IS NOT NULL AND NOT public.is_public_article_person(p_reviewer_slug,true)) THEN RAISE EXCEPTION '공개 프로필을 확인해 주세요' USING ERRCODE='22023'; END IF;
 IF p_attribution_note IS NULL OR length(p_attribution_note)>2000 OR ((p_author_slug IS NOT NULL OR p_reviewer_slug IS NOT NULL) AND length(trim(p_attribution_note))=0) THEN RAISE EXCEPTION '작성·검토 참여 및 이름 공개 근거가 필요합니다' USING ERRCODE='22023'; END IF;
 IF p_reviewer_slug IS NOT NULL AND (p_reviewed_on IS NULL OR p_reviewed_on>(now() AT TIME ZONE 'Asia/Seoul')::date) THEN RAISE EXCEPTION '검토일을 확인해 주세요' USING ERRCODE='22023'; END IF;
 SELECT * INTO result FROM public.save_site_article(p_id,p_revision,p_title,p_body,p_category,p_topic,p_source_notes,p_ai_generated);
 UPDATE public.site_article_drafts SET author_slug=p_author_slug,reviewer_slug=p_reviewer_slug,attribution_note=trim(p_attribution_note),reviewed_on=CASE WHEN p_reviewer_slug IS NOT NULL THEN p_reviewed_on ELSE NULL END WHERE id=result.id RETURNING * INTO result;
 RETURN result;
END;$$;
-- Copy only public attribution during the existing atomic publish transaction.
CREATE OR REPLACE FUNCTION public.publish_article_people() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE d public.site_article_drafts;
BEGIN
 SELECT * INTO STRICT d FROM public.site_article_drafts WHERE id=NEW.id;
 NEW.author_slug:=d.author_slug;NEW.reviewer_slug:=d.reviewer_slug;NEW.reviewed_on:=d.reviewed_on;
 RETURN NEW;
END;$$;
DO $migration$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgname='publish_article_people' AND tgrelid='public.site_articles'::regclass) THEN
  CREATE TRIGGER publish_article_people BEFORE INSERT OR UPDATE ON public.site_articles FOR EACH ROW EXECUTE FUNCTION public.publish_article_people();
 END IF;
END $migration$;
REVOKE ALL ON FUNCTION public.save_site_article_with_people(uuid,integer,text,text,text,text,text,boolean,text,text,text,date) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.save_site_article_with_people(uuid,integer,text,text,text,text,text,boolean,text,text,text,date) TO authenticated;
REVOKE ALL ON FUNCTION public.clear_changed_article_people(),public.publish_article_people() FROM PUBLIC,anon,authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;
