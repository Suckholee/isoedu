import Link from 'next/link';
import {publicArticleDb} from '../../lib/articles/public';
import {SITE_ORIGIN,KNOWLEDGE_CATEGORY,jsonLd} from '../../lib/articles/seo.mjs';
export const dynamic='force-dynamic';
export const metadata={title:'기업 실무 질문과 답변 | 써티멘토 지식',description:'사업계획서와 기업 실무의 질문을 매뉴얼 근거와 함께 설명합니다.',alternates:{canonical:SITE_ORIGIN+'/knowledge'}};
export default async function KnowledgePage(){
 const db=publicArticleDb();if(!db)throw Error('지식 저장소에 연결하지 못했습니다.');
 const {data:posts,error}=await db.from('site_articles').select('id,title,body,category,published_at,updated_at').eq('category',KNOWLEDGE_CATEGORY).order('updated_at',{ascending:false}).limit(300);
 if(error)throw Error('공개 답변을 불러오지 못했습니다.');
 const schema={'@context':'https://schema.org','@type':'CollectionPage',name:'써티멘토 기업 실무 질문과 답변',url:SITE_ORIGIN+'/knowledge',mainEntity:{'@type':'ItemList',itemListElement:posts.map((p,i)=>({'@type':'ListItem',position:i+1,name:p.title,url:`${SITE_ORIGIN}/insights/${p.id}`}))}};
 return <main className="min-h-screen bg-[#f9f8f5] px-6 py-5 text-slate-900"><div className="mx-auto max-w-6xl"><Link href="/" className="text-sm">← 써티멘토</Link><p className="mt-4 text-sm text-amber-800">써티멘토 지식</p><h1 className="my-3 text-2xl font-semibold">기업 실무 질문과 답변</h1><p className="mb-4 leading-7 text-slate-600">사업계획서와 기업 실무에서 자주 확인하는 개념을 질문별로 정리합니다. 답변에 사용한 매뉴얼과 적용 범위를 함께 확인하세요.</p><div className="divide-y divide-slate-300">{posts.map(p=><article key={p.id} className="py-4"><Link href={`/insights/${p.id}`} className="text-xl font-semibold underline-offset-4 hover:underline">{p.title}</Link><p className="my-3 leading-7 text-slate-600">{p.body.split('\n\n')[0].slice(0,260)}</p><p className="text-xs text-slate-500">최근 검토 · {new Date(p.updated_at).toLocaleDateString('ko-KR',{timeZone:'Asia/Seoul'})}</p></article>)}</div>{!posts.length&&<p className="py-5 text-slate-500">매뉴얼 근거를 검토한 답변을 준비하고 있습니다.</p>}<script type="application/ld+json" dangerouslySetInnerHTML={{__html:jsonLd(schema)}}/></div></main>;
}
