import {publicArticleDb} from '../articles/public';
import {articleUrl} from '../articles/seo.mjs';
export async function readContributions(slug){
 try{
  const db=publicArticleDb();if(!db)throw Error();
  const articles=[];
  for(let offset=0;;offset+=500){
   const {data,error}=await db.from('site_articles').select('id,title,category,published_at,author_slug,reviewer_slug,reviewed_on').or(`author_slug.eq.${slug},reviewer_slug.eq.${slug}`).order('id').range(offset,offset+499);
   if(error)throw error;
   articles.push(...data.map(a=>({...a,url:articleUrl(a.id),sourceLabel:'써티멘토',sourceDate:a.published_at})));
   if(data.length<500)break;
  }
  return {articles,available:true};
 }catch{return {articles:[],available:false};}
}
