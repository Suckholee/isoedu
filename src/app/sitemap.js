import {PROFILES,profilePath} from '../lib/people/model.mjs';
import {publicArticleDb} from '../lib/articles/public';
import {SITE_ORIGIN,articleUrl} from '../lib/articles/seo.mjs';
export const dynamic='force-dynamic';
export default async function sitemap(){
 const db=publicArticleDb();if(!db)throw Error('사이트맵 저장소 연결 실패');
 const {data,error}=await db.from('site_articles').select('id,updated_at').order('id').limit(5000);
 if(error)throw Error('사이트맵 조회 실패');
 return [{url:SITE_ORIGIN},{url:SITE_ORIGIN+'/knowledge'},{url:SITE_ORIGIN+'/programs'},{url:SITE_ORIGIN+'/people'},...PROFILES.map(p=>({url:SITE_ORIGIN+profilePath(p)})),...data.map(p=>({url:articleUrl(p.id),lastModified:p.updated_at}))];
}
