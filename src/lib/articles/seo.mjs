import {getProfile,profileEntity} from '../people/model.mjs';
export const SITE_ORIGIN=(process.env.NEXT_PUBLIC_SITE_URL||'https://isoedu-cyan.vercel.app').replace(/\/$/,'');
export const KNOWLEDGE_CATEGORY='지식 답변';
export const articleUrl=id=>`${SITE_ORIGIN}/insights/${id}`;
export const jsonLd=value=>JSON.stringify(value).replace(/</g,'\\u003c');
export function articleSchema(post){
 const url=articleUrl(post.id),publisher={'@type':'Organization',name:'써티멘토',url:SITE_ORIGIN};
 const article={'@context':'https://schema.org','@type':'Article','@id':url+'#article',headline:post.title,articleBody:post.body,inLanguage:'ko-KR',datePublished:post.published_at,dateModified:post.updated_at,author:getProfile(post.author_slug)?profileEntity(getProfile(post.author_slug),SITE_ORIGIN):publisher,publisher,mainEntityOfPage:url};
 const reviewer=getProfile(post.reviewer_slug);
 const reviewedPage=reviewer&&post.reviewed_on?{'@context':'https://schema.org','@type':'WebPage','@id':url,url,reviewedBy:profileEntity(reviewer,SITE_ORIGIN),lastReviewed:post.reviewed_on}:null;
 const schemas=post.category===KNOWLEDGE_CATEGORY?[article,{'@context':'https://schema.org','@type':'FAQPage','@id':url+'#question',url,inLanguage:'ko-KR',mainEntity:[{'@type':'Question',name:post.title,acceptedAnswer:{'@type':'Answer',text:post.body}}]}]:[article];
 return reviewedPage?[...schemas,reviewedPage]:schemas;
}
