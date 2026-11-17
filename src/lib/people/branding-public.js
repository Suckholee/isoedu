import {cache} from 'react';
import {unstable_cache} from 'next/cache';
import {publicArticleDb} from '../articles/public';
import {brandingDefaults,publishedBranding} from './branding.mjs';
import {youtubeFeed,instagramFeed} from './social.mjs';

export const readBranding=cache(async slug=>{
 const fallback=publishedBranding(brandingDefaults(slug));
 try{
  const db=publicArticleDb();if(!db)return {content:fallback,available:false};
  const {data,error}=await db.from('partner_profiles').select('content,published_at').eq('slug',slug).eq('is_visible',true).maybeSingle();
  if(error)throw error;
  // Validate the public snapshot again before using remote URLs or structured data.
  const content=data?publishedBranding({...data.content,clients:data.content.clients.map(x=>({...x,isPublic:true})),work:data.content.work.map(x=>({...x,isPublic:true}))}):fallback;
  return {content,available:true,publishedAt:data?.published_at||null};
 }catch{return {content:fallback,available:false};}
});
export async function readSocialContent(slug,branding){
 const jobs=[];
 if(branding.links.youtube)jobs.push(['youtube',()=>youtubeFeed(branding)]);
 if(branding.links.instagram)jobs.push(['instagram',()=>instagramFeed(slug,branding)]);
 return Promise.all(jobs.map(async([provider,read])=>{
  try{return await unstable_cache(read,['partner-social-v1',slug,provider,branding.links[provider],branding.youtubeChannelId,process.env.PARTNER_SOCIAL_CACHE_VERSION||'1'],{revalidate:900})();}
  catch{return {provider,status:'unavailable',items:[]};}
 }));
}
