import Link from 'next/link';
import {notFound} from 'next/navigation';
import {publicArticleDb} from '../../../lib/articles/public';
export const dynamic='force-dynamic';
export default async function ArticlePage({params}){
 if(!/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(params.id))notFound();
 const db=publicArticleDb();if(!db)throw Error('글 저장소에 연결하지 못했습니다.');
 const {data:post,error}=await db.from('site_articles').select('*').eq('id',params.id).maybeSingle();if(error)throw Error('글을 불러오지 못했습니다.');if(!post)notFound();
 return <main className="min-h-screen bg-[#f9f8f5] px-6 py-10 text-slate-900"><article className="mx-auto max-w-3xl"><Link href="/#insights" className="text-sm">← 어니스톤 · 글 목록</Link><p className="mt-14 text-sm text-amber-800">{post.category} · {new Date(post.published_at).toLocaleDateString('ko-KR',{timeZone:'Asia/Seoul'})}</p><h1 className="my-6 text-3xl font-bold leading-snug sm:text-4xl">{post.title}</h1>{post.ai_generated&&<p className="mb-8 text-xs text-slate-500">AI 작성 · 관리자 검토 후 발행</p>}<div className="whitespace-pre-wrap break-words border-t border-slate-300 pt-8 text-base leading-8">{post.body}</div><footer className="mt-16 border-t border-slate-300 pt-6 text-sm text-slate-500">어니스톤 · 인증 준비 지원과 공식 기관의 심사·발급은 구분됩니다.</footer></article></main>;
}
