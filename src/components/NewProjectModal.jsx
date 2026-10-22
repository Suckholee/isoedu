'use client';
import {useEffect,useState} from 'react';
import ModalLayer from './ui/ModalLayer';
import {ISO_STANDARDS_INFO,ISO_MANDATORY_REQUIREMENTS} from '../lib/isoRequirementsData';
import {
 PROJECT_KINDS,
 projectDraft,
 requirementsForStandards,
 suggestedProjectTasks,
 syncSuggestedTaskDates,
 suggestProjectTitle,
} from '../lib/projectWorkflow.mjs';
import {useAuth} from '../context/AuthContext';
import {isCloudMode} from '../lib/dataConfig';

export default function NewProjectModal({isOpen,onClose,onCreateProject,initialProgram=null,companies=[],currentCompany=null}){
 const {user}=useAuth();
 const [form,setForm]=useState(null),[tasks,setTasks]=useState([]),[manualDateKeys,setManualDateKeys]=useState([]),[titleEdited,setTitleEdited]=useState(false),[custom,setCustom]=useState(''),[error,setError]=useState(''),[saving,setSaving]=useState(false),[reviewed,setReviewed]=useState(false);
 useEffect(()=>{
  if(isOpen){
   const defaultCompanyId=currentCompany?.id||'';
   const companyName=companies.find(c=>c.id===defaultCompanyId)?.name||currentCompany?.name||'';
   const defaultKind=initialProgram?'SUPPORT':'ISO';
   const defaultStandards=['ISO_9001'];
   setForm({
    requestId:crypto.randomUUID(),
    companyId:defaultCompanyId,
    clientName:'',
    title:suggestProjectTitle({companyName,kind:defaultKind,standards:defaultStandards,programTitle:initialProgram?.title||''}),
    kind:defaultKind,
    standards:defaultStandards,
    targetDate:'',
    notes:'',
    programId:initialProgram?.id||'',
   });
   setTasks(suggestedProjectTasks(''));
   setManualDateKeys([]);
   setTitleEdited(Boolean(initialProgram?.title));
   setCustom('');
   setError('');
   setReviewed(false);
  }
 },[isOpen,currentCompany?.id,currentCompany?.name,initialProgram,companies]);
 if(!isOpen||!form)return null;
 const requirements=form.kind==='ISO'?requirementsForStandards(form.standards,ISO_MANDATORY_REQUIREMENTS):custom.split('\n').filter(s=>s.trim()).map((s,i)=>({key:`custom-${i+1}`,title:s.trim(),standard:''}));
 function resolveCompanyName(nextForm){
  if(nextForm.companyId)return companies.find(c=>c.id===nextForm.companyId)?.name||currentCompany?.name||'';
  return nextForm.clientName||'';
 }
 function field(key,value){
  setForm(prev=>{
   const next={...prev,[key]:value};
   if(key==='title')return next;
   if(!titleEdited&&['companyId','clientName','kind','standards'].includes(key)){
    next.title=suggestProjectTitle({
     companyName:resolveCompanyName(next),
     kind:next.kind,
     standards:next.standards,
     programTitle:initialProgram?.title||'',
    });
   }
   return next;
  });
  setReviewed(false);
 }
 function handleTargetDateChange(nextDate){
  field('targetDate',nextDate);
  setTasks(prev=>syncSuggestedTaskDates(prev,nextDate,manualDateKeys));
 }
 async function submit(e){
  e.preventDefault();
  if(saving)return;
  setError('');
  try{
   if(!reviewed)throw Error('구비서류와 준비 일정을 검토해 주세요.');
   const fields=new FormData(e.currentTarget);
   const payload=projectDraft({
    ...form,
    targetDate:String(fields.get('targetDate')||''),
    requirements,
    tasks:tasks.map((t,i)=>({...t,dueDate:String(fields.get(`taskDate-${i}`)||'')})),
   });
   setSaving(true);
   const saved=await onCreateProject(payload);
   if(saved)onClose();
   else setError('프로젝트를 저장하지 못했습니다. 회사 권한과 서버 설정을 확인해 주세요.');
  }catch(e){setError(e.message);}finally{setSaving(false);}
 }
 const input='w-full border border-slate-300 rounded-lg p-2 mt-1 bg-white text-sm';
 return <ModalLayer onClose={()=>{if(!saving)onClose();}} className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4"><section role="dialog" aria-modal="true" aria-label="거래처 프로젝트 만들기" className="bg-white rounded-2xl w-full max-w-2xl max-h-[90dvh] overflow-auto p-6">
 <header className="flex justify-between mb-4"><h2 className="text-lg font-bold">거래처 프로젝트 만들기</h2><button disabled={saving} type="button" onClick={onClose} aria-label="닫기">닫기</button></header>
 <form onSubmit={submit} className="space-y-4 text-sm">
 <label className="block">거래처<select aria-label="프로젝트 거래처" className={input} value={form.companyId} onChange={e=>field('companyId',e.target.value)}><option value="">새 거래처 등록</option>{companies.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
 {!form.companyId&&<label className="block">새 거래처명<input aria-label="새 거래처명" required maxLength={150} className={input} value={form.clientName} onChange={e=>field('clientName',e.target.value)}/><small className="text-slate-500">새 관리 공간을 만듭니다. 기존 회사의 소속 승인이나 대표자 확인을 대신하지 않습니다.</small></label>}
 <div><div className="flex justify-between items-center"><label htmlFor="new-project-title">프로젝트명</label><button type="button" className="text-xs text-blue-700 underline" onClick={()=>{setTitleEdited(false);setForm(prev=>({...prev,title:suggestProjectTitle({companyName:resolveCompanyName(prev),kind:prev.kind,standards:prev.standards,programTitle:initialProgram?.title||''})}));setReviewed(false);}}>규격·거래처 기준 자동 입력</button></div><input id="new-project-title" aria-label="프로젝트명" required maxLength={120} className={input} value={form.title} onChange={e=>{setTitleEdited(true);field('title',e.target.value);}} placeholder="예: 2026 통합 ISO 인증 준비"/></div>
 <label className="block">진행 종류<select aria-label="프로젝트 종류" className={input} value={form.kind} onChange={e=>field('kind',e.target.value)}>{Object.entries(PROJECT_KINDS).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label>
 {form.kind==='ISO'?<fieldset><legend>준비할 규격 · 복수 선택</legend><div className="flex flex-wrap gap-3 mt-2">{ISO_STANDARDS_INFO.map(s=><label key={s.code}><input type="checkbox" checked={form.standards.includes(s.code)} onChange={e=>field('standards',e.target.checked?[...form.standards,s.code]:form.standards.filter(x=>x!==s.code))}/> {s.name}</label>)}</div><p className="text-xs text-slate-500 mt-2">저장소의 기존 기준 목록입니다. 최신 판본·적용 범위는 별도 검토가 필요합니다.</p></fieldset>:<label className="block">구비서류 · 한 줄에 하나<textarea aria-label="프로젝트 구비서류" className={input} rows={3} value={custom} onChange={e=>{setCustom(e.target.value);setReviewed(false);}} placeholder="공고·상담에서 확인한 서류명을 입력하세요."/><small>공식 기준이 없는 인증·지원사업의 서류는 임의로 확정하지 않습니다.</small></label>}
 <details><summary className="cursor-pointer">구비서류 미리보기 · {requirements.length}개</summary><ul className="text-xs max-h-40 overflow-auto mt-2 space-y-1">{requirements.map(r=><li key={r.key}>{r.title}</li>)}</ul><p className="text-xs text-slate-500 mt-2">목록 등록은 문서 작성·승인·심사 적합 완료를 의미하지 않습니다.</p></details>
 <label className="block">내부 목표일<input aria-label="프로젝트 목표일" name="targetDate" className={input} type="date" value={form.targetDate} onInput={e=>handleTargetDateChange(e.currentTarget.value)} onChange={e=>handleTargetDateChange(e.target.value)}/></label>
 <div className="flex justify-between items-center"><strong>준비 일정</strong><button type="button" className="text-blue-700 underline" onClick={e=>{const targetDate=String(new FormData(e.currentTarget.form).get('targetDate')||'');setForm(prev=>({...prev,targetDate}));setManualDateKeys([]);setTasks(suggestedProjectTasks(targetDate));setReviewed(false);}}>목표일 기준 제안 불러오기</button></div>
 <p className="text-xs text-slate-500">목표일 선택 시 30·14·3일 전 초기 제안이 자동 반영되며, 직접 수정한 일정 날짜는 보존됩니다. 공식 심사·접수 일정이 아니며 비워 두면 기한 미정으로 저장합니다.</p>
 {tasks.map((t,i)=><div className="flex gap-2" key={t.key}><input aria-label={`준비 업무 ${i+1}`} required maxLength={180} className={input} value={t.title} onChange={e=>{setTasks(tasks.map((x,j)=>j===i?{...x,title:e.target.value}:x));setReviewed(false);}}/><input aria-label={`준비 업무 ${i+1} 날짜`} name={`taskDate-${i}`} type="date" className={input} value={t.dueDate} onInput={e=>{const date=e.currentTarget.value;setManualDateKeys(prev=>prev.includes(t.key)?prev:[...prev,t.key]);setTasks(prev=>prev.map((x,j)=>j===i?{...x,dueDate:date}:x));setReviewed(false);}} onChange={e=>{const date=e.target.value;setManualDateKeys(prev=>prev.includes(t.key)?prev:[...prev,t.key]);setTasks(prev=>prev.map((x,j)=>j===i?{...x,dueDate:date}:x));setReviewed(false);}}/></div>)}
 <label className="block">메모<textarea className={input} rows={2} maxLength={10000} value={form.notes} onChange={e=>field('notes',e.target.value)}/></label>
 <label className="flex gap-2"><input required type="checkbox" checked={reviewed} onChange={e=>setReviewed(e.target.checked)}/>구비서류와 준비 일정을 확인했습니다.</label>
 {error&&<p role="alert" className="text-rose-700">{error}</p>}{!isCloudMode&&<p>프로젝트·업무 통합 저장은 클라우드 로그인 후 사용할 수 있습니다.</p>}
 <footer className="flex justify-end gap-3"><button disabled={saving} type="button" onClick={onClose}>취소</button><button disabled={saving||!isCloudMode||!user} className="work-primary" type="submit">{saving?'저장 중…':!user?'로그인 후 저장할 수 있습니다':'프로젝트·구비서류·일정 저장'}</button></footer>
 </form></section></ModalLayer>;
}
