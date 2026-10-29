'use client';
import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import {useAuth} from '../context/AuthContext';
import {useGrowthIntake} from '../context/GrowthIntakeContext';
import {supabase} from '../lib/supabaseClient';
import {INTERESTS,growthTaskPayload,saveGrowthTask} from '../lib/growthIntake.mjs';
export default function GrowthIntakeHandoff({companies=[],currentCompany}){
 const {user,profile}=useAuth(),{draft,hydrated,setDraft,clearIf}=useGrowthIntake();
 const [target,setTarget]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[saved,setSaved]=useState(false);const account=useRef();account.current=user?.id;
 const isProgram=draft?.kind==='program',program=isProgram?draft.program:null;
 const writable=companies.filter(c=>c.canEdit);
 useEffect(()=>{if(!writable.some(c=>c.id===target))setTarget(writable.find(c=>c.id===currentCompany?.id)?.id||writable.find(c=>c.id===profile?.company?.id)?.id||writable[0]?.id||'');},[companies,currentCompany?.id,target,profile?.company?.id]);
 useEffect(()=>{if(draft&&user&&!draft.ownerId)setDraft({...draft,ownerId:user.id});},[draft?.id,user?.id]);
 async function save(){const uid=user?.id,id=draft?.id;if(!uid||!writable.some(c=>c.id===target)||busy)return;setBusy(true);setError('');try{await saveGrowthTask(supabase,growthTaskPayload(draft,{userId:uid,companyId:target,assignee:profile?.full_name||'나',origin:window.location.origin}));if(account.current!==uid)return;clearIf(id);setSaved(true);window.dispatchEvent(new Event('honestone-intake-saved'));}catch(e){if(account.current===uid)setError(e.message);}finally{if(account.current===uid)setBusy(false);}}
 return <section className="m-4 p-5 rounded-xl border border-emerald-200 bg-emerald-50" aria-label="회사 준비 정보 연결">{saved?<><strong>준비할 일을 저장했습니다.</strong><p className="my-2">선택한 정보와 준비 항목을 업무에 보관했습니다.</p><Link href={'/dashboard?company='+encodeURIComponent(target)} className="underline">업무 확인하기 →</Link></>:!hydrated?<p>입력 정보를 확인하고 있습니다.</p>:!draft?<><p>연결할 준비 정보가 없습니다.</p><Link href="/">기업 준비 시작하기 →</Link></>:<><strong>{isProgram?program.title:`${draft.companyName} · ${INTERESTS[draft.interest].label} 준비`}</strong><p className="my-2 text-sm">{isProgram?`공고 기준 마감: ${program.applicationEndDate||'미확인'} · 원문에서 최신 일정을 확인하세요.`:`${draft.industry} · ${draft.employees}${draft.region?' · '+draft.region:''}`} — 저장할 회사 공간을 확인해 주세요. 신청 자격 판정·공식 신청은 아닙니다.</p><label>저장할 회사 <select className="border rounded p-2 mx-2" value={target} onChange={e=>setTarget(e.target.value)}><option value="">회사 선택</option>{writable.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><button className="work-primary" disabled={!target||busy||!user} onClick={save}>{busy?'저장 중…':isProgram?(program.action==='prepare'?'신청 준비 업무로 저장':'관심사업 업무로 저장'):'내 준비할 일로 저장'}</button>{!writable.length&&<p className="text-sm mt-2">로그인과 회사 연결 정보를 확인한 뒤 저장할 수 있습니다.</p>}{error&&<p role="alert" className="text-red-700 mt-2">{error}</p>}</>}</section>;
}
