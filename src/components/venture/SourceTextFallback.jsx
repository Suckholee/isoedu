'use client';
import {useState} from 'react';
import {readSourceUnits} from '../../lib/venture/sourceReader.mjs';
export default function SourceTextFallback({row}){
 const [text,setText]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 async function read(){if(text||busy)return;setBusy(true);setError('');try{
  if(row.metadata.sourceUpload.size>100*1024*1024)throw Error('100MB 이하 원문의 글자 보기를 지원합니다. 원본 열기로 확인해 주세요.');
  const response=await fetch('/api/vault-file?path='+encodeURIComponent(row.metadata.originalPath));if(!response.ok)throw Error('원문을 불러오지 못했습니다.');
  const file=new File([await response.blob()],row.title);let parts=[];
  if(row.metadata.format==='HWP'){const {hwpUnits}=await import('../../lib/meeting/readDocumentDates.mjs');const warnings=[];const units=await hwpUnits(new Uint8Array(await file.arrayBuffer()),warnings);parts=units.map(u=>u.text);if(warnings.length)setError(warnings.join(' · '));}
  else for await(const unit of readSourceUnits(file)){if(unit.text)parts.push(unit.text);}
  const value=parts.join('\n\n');if(!value.trim())throw Error('추출할 글자가 없습니다. 그림 안의 글자는 페이지 이미지에서 확인하세요.');setText(value);
 }catch(e){setError(e.message);}finally{setBusy(false);}}
 return <details onToggle={e=>{if(e.currentTarget.open)read();}} className="border-t p-3 text-xs"><summary className="cursor-pointer font-semibold">원문 텍스트 확인</summary><p className="my-2 text-slate-600">원본에서 추출한 전체 텍스트입니다. 페이지 배치·표 모양과 그림 속 글자는 위 페이지 이미지에서 확인하세요.</p>{busy&&<p role="status">원문 글자를 읽고 있습니다…</p>}{error&&<p role="alert">{error}</p>}{text&&<pre className="max-h-96 overflow-auto whitespace-pre-wrap break-words rounded bg-slate-50 p-3 leading-6">{text}</pre>}{error&&!text&&<button onClick={read} disabled={busy}>다시 읽기</button>}</details>;
}
