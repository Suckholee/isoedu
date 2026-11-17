'use client';

import {useState} from 'react';
import {useRouter, useSearchParams} from 'next/navigation';
import VentureSourcePanel from './venture/VentureSourcePanel';
import SourceReviewEditor from './venture/SourceReviewEditor';
import ApplicationPlanSetup from './venture/ApplicationPlanSetup';

export default function BusinessPlanAnalysis({project, documents, canEdit}) {
  const [busy, setBusy] = useState('');
  const [reviewSource, setReviewSource] = useState(null);
  const [applicationSource, setApplicationSource] = useState(null);
  const [error, setError] = useState('');
  const [listVersion, setListVersion] = useState(0);
  const router = useRouter(), search = useSearchParams();

  async function api(body) {
    const response = await fetch('/api/venture-documents', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({...body, projectId: project.id}),
    });
    let result;
    try { result = await response.json(); }
    catch { throw Object.assign(new Error('서버 응답을 읽지 못했습니다. 저장된 결과는 보존됩니다.'),{status:response.ok?502:response.status}); }
    if (!response.ok) {
      const error = new Error(result.error || '사업계획서 분석 요청에 실패했습니다.');
      error.status = response.status;
      error.document = result.document;
      throw error;
    }
    return result;
  }

  return <div className="flex min-h-0 flex-1 flex-col">
    <div className="border-b px-4 py-3 text-sm text-slate-600">
      <p>① 기존 계획서 분석 → ② 내용 보완·저장 → ③ 다른 사업 선택·양식에 맞춰 작성</p>
      <p>자료와 분석 결과는 이 회사의 접근 권한이 있는 계정과 공유됩니다.</p>
      {!canEdit && <p>열람 전용입니다. 자료 업로드와 재분석에는 회사 편집 권한이 필요합니다.</p>}
      {busy && <p role="status">{busy}</p>}
    </div>
    {applicationSource ? <section className="space-y-4 p-4">
      <header className="flex flex-wrap justify-between gap-2"><h2 className="font-semibold">다른 사업 양식으로 작성</h2><button disabled={!!busy} className="underline" onClick={()=>{setApplicationSource(null);setError('');}}>보완본으로 돌아가기</button></header>
      <p className="text-sm">{applicationSource.title} · 보완본 {applicationSource.metadata.sourceReview.revision}차를 근거로 새 신청서를 만듭니다. 기존 원본과 보완본은 유지됩니다.</p>
      {error&&<p role="alert" className="text-red-700">{error}</p>}
      <ApplicationPlanSetup key={`${applicationSource.id}/${applicationSource.updated_at}`} api={api}
        requiredSource={{id:applicationSource.id,updatedAt:applicationSource.updated_at,title:applicationSource.title}}
        canEdit={canEdit} busy={busy} onBusy={setBusy} onError={setError}
        onResult={document=>{
          window.dispatchEvent(new CustomEvent('honestone:documents-saved',{detail:{companyId:project.companyId}}));
          const params=new URLSearchParams(search.toString());
          params.set('company',project.companyId);params.set('planProject',project.id);params.set('document',document.id);params.delete('section');
          router.push('/business-plan?'+params,{scroll:false});
        }} />
    </section> : reviewSource ? <SourceReviewEditor key={reviewSource.id} source={reviewSource} api={api} canEdit={canEdit}
      onClose={()=>{setReviewSource(null);setListVersion(value=>value+1);}}
      onUse={source=>{setReviewSource(source);setApplicationSource(source);}} /> :
    <VentureSourcePanel key={listVersion} project={project} documents={documents} api={api}
      canEdit={canEdit} busy={busy} onBusy={setBusy} onReview={setReviewSource} />}
  </div>;
}
