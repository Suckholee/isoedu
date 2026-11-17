import {getProfile,profilePath} from '../../../lib/people/model.mjs';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import {publicArticleDb} from '../../../lib/articles/public';
import {cache} from 'react';
import {articleUrl,articleSchema,jsonLd,KNOWLEDGE_CATEGORY} from '../../../lib/articles/seo.mjs';
export const dynamic='force-dynamic';
const readPost=cache(async id=>{
 if(!/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(id))notFound();
 const db=publicArticleDb();if(!db)throw Error('글 저장소에 연결하지 못했습니다.');
 const {data:post,error}=await db.from('site_articles').select('*').eq('id',id).maybeSingle();if(error)throw Error('글을 불러오지 못했습니다.');if(!post)notFound();return post;
});
export async function generateMetadata({params}){const p=await readPost(params.id);return {title:`${p.title} | 써티멘토`,description:p.body.slice(0,160),alternates:{canonical:articleUrl(p.id)},openGraph:{type:'article',title:p.title,description:p.body.slice(0,160),url:articleUrl(p.id),publishedTime:p.published_at,modifiedTime:p.updated_at},robots:{index:true,follow:true}};}
export default async function ArticlePage({params}){
 const post=await readPost(params.id),knowledge=post.category===KNOWLEDGE_CATEGORY;
 const author=getProfile(post.author_slug),reviewer=getProfile(post.reviewer_slug);
 let related=[];if(knowledge){const r=await publicArticleDb().from('site_articles').select('id,title').eq('category',KNOWLEDGE_CATEGORY).neq('id',post.id).order('updated_at',{ascending:false}).limit(6);related=r.data||[];}
 return <main className="min-h-screen bg-[#f9f8f5] px-6 py-5 text-slate-900"><article className="mx-auto max-w-3xl"><Link href={knowledge?'/knowledge':'/#insights'} className="text-sm">← 써티멘토 · {knowledge?'질문과 답변':'글 목록'}</Link><p className="mt-4 text-sm text-amber-800">{post.category} · {new Date(post.published_at).toLocaleDateString('ko-KR',{timeZone:'Asia/Seoul'})}</p><h1 className="my-3 text-2xl font-bold leading-snug sm:text-3xl">{post.title}</h1><p className="mb-4 text-xs text-slate-500">{author?<>작성 <Link className="underline" href={profilePath(author)}>{author.name}</Link></>:'써티멘토 편집'} · 수정 {new Date(post.updated_at).toLocaleDateString('ko-KR',{timeZone:'Asia/Seoul'})}{reviewer&&post.reviewed_on&&<> · 검토 <Link className="underline" href={profilePath(reviewer)}>{reviewer.name}</Link> ({post.reviewed_on})</>}</p>{post.ai_generated&&<p className="mb-4 text-xs text-slate-500">AI 작성 · 관리자 검토 후 발행</p>}<div className="whitespace-pre-wrap break-words border-t border-slate-300 pt-5 text-base leading-8">{post.body}</div>{related.length>0&&<nav aria-label="관련 질문" className="mt-8 border-t pt-6"><h2 className="mb-4 text-lg font-semibold">함께 확인할 질문</h2>{related.map(p=><Link className="my-3 block underline" key={p.id} href={`/insights/${p.id}`}>{p.title}</Link>)}</nav>}<footer className="mt-8 border-t border-slate-300 pt-6 text-sm text-slate-500"><Link href="/knowledge" className="mb-4 block underline">써티멘토 기업 실무 질문과 답변</Link>써티멘토 · 인증 준비 지원과 공식 기관의 심사·발급은 구분됩니다.</footer>{articleSchema(post).map((schema,i)=><script key={i} type="application/ld+json" dangerouslySetInnerHTML={{__html:jsonLd(schema)}}/>)}</article></main>;
}
