import {unstable_cache} from 'next/cache';
import {readFeed,mergeArticles} from '../../../lib/articles/feed.mjs';
import {fallbackCards} from '../../../lib/articles/fallback.mjs';
import {publicArticleDb,articleCard} from '../../../lib/articles/public';
export const dynamic='force-dynamic';
const cachedBlog=unstable_cache(()=>readFeed(),['honestone-blog-feed-v1'],{revalidate:300});
export async function GET(){
 const [blog,site]=await Promise.allSettled([cachedBlog(),(async()=>{const db=publicArticleDb();if(!db)throw Error();const r=await db.from('site_articles').select('id,title,category,published_at,ai_generated').order('published_at',{ascending:false}).limit(60);if(r.error)throw Error();return r.data.map(articleCard);})()]);
 const blogOk=blog.status==='fulfilled',siteOk=site.status==='fulfilled';
 // Only add known homepage counterparts to posts actually present in the RSS; removed posts stay removed.
 const blogRows=blogOk?blog.value.articles.map(a=>({...a,siteUrl:fallbackCards.find(b=>b.blogId===a.blogId)?.siteUrl||null})):fallbackCards;
 return Response.json({articles:mergeArticles(blogRows,siteOk?site.value:[]).slice(0,90),blog:{available:blogOk,checkedAt:blogOk?blog.value.checkedAt:null},site:{available:siteOk},refreshSeconds:300},{headers:{'Cache-Control':'no-store'}});
}
