'use client';
import PlanVisualEditor from './PlanVisualEditor';
import {definitionForAi} from '../../lib/venture/catalog.mjs';
import {useEffect,useRef,useState} from 'react';
import {parsePlanForm,updatePlanSubcell} from '../../lib/venture/planForm.mjs';
import {parsePlanSubfields} from '../../lib/venture/planSubfields.mjs';
import styles from './VenturePlanForm.module.css';

function SubfieldCell({section,field,disabled,onChange,onFocus}){
 const input=useRef(null);
 useEffect(()=>{const el=input.current;if(!el)return;const resize=()=>{el.style.height='auto';el.style.height=Math.max(105,el.scrollHeight+3)+'px';};resize();let width=el.parentElement.clientWidth;const observer=new ResizeObserver(()=>{const next=el.parentElement.clientWidth;if(next!==width){width=next;resize();}});observer.observe(el.parentElement);return()=>observer.disconnect();},[field.value]);
 return <tr><th><span>{field.label}</span><small>{field.guide}</small></th><td><textarea ref={input} aria-label={`${section.title} · ${field.label}`} value={field.value} maxLength={16000} disabled={disabled} onFocus={onFocus} onChange={e=>onChange(field.key,e.target.value)} placeholder={field.guide+' · AI와 대화하거나 직접 작성해 주세요.'}/></td></tr>;
}
function FormCell({section,disabled,onChange,onFocus,changed,row,visuals,onVisualsChange,onGenerateVisual,onError,onBusy}){
 return <table className={`${styles.section} ${changed?styles.changed:''}`} id={`plan-${section.id}`}><colgroup><col style={{width:'23%'}}/><col style={{width:'77%'}}/></colgroup><thead><tr><th colSpan={2}>{section.number}. {section.title}{changed&&<span>AI 반영</span>}</th></tr></thead><tbody>{parsePlanSubfields(section).map(field=><SubfieldCell key={field.key} section={section} field={field} disabled={disabled} onChange={onChange} onFocus={onFocus}/>)}<tr><td colSpan={2}><PlanVisualEditor row={row} sectionId={section.id} visuals={visuals} onChange={onVisualsChange} onGenerate={onGenerateVisual} disabled={disabled} onError={onError} onBusy={onBusy}/></td></tr></tbody></table>;
}
export default function VenturePlanForm({row,content,onChange,canEdit,busy,focus,onFocus,onError,fill=false,documentFields,onFieldsChange,visuals=[],onVisualsChange=()=>{},onGenerateVisual=()=>{},onBusy}){
 const [mode,setMode]=useState('form'),paper=useRef(null);
 const definition=definitionForAi(row.metadata.ai),parsed=parsePlanForm(content,row.metadata.ai.input.type,definition),saved=parsePlanForm(row.content_draft,row.metadata.ai.input.type,definition);
 useEffect(()=>{if(focus==='all'&&paper.current)paper.current.scrollTop=0;else if(focus){const canvas=paper.current,section=canvas?.querySelector(`#plan-${focus}`);if(canvas&&section)canvas.scrollTop+=section.getBoundingClientRect().top-canvas.getBoundingClientRect().top-12;}},[focus]);
 return <section className={`${styles.editor} ${fill?styles.fill:''}`} aria-label="사업계획서 양식 편집">
  <div className={styles.toolbar}><span>칸을 눌러 직접 수정</span><div><button aria-pressed={mode==='form'} onClick={()=>setMode('form')}>양식 보기</button><button aria-pressed={mode==='text'} onClick={()=>setMode('text')}>본문 편집</button></div></div>
  {mode==='form'&&parsed?<div className={styles.canvas} ref={paper}><article className={styles.paper}>
   <h2>{definition.title}</h2><p className={styles.caption}>{row.metadata.ai.input.type==='application_plan'?'선택 양식 기반':'공식 문항 기반'} {parsed.sections.length}개 항목 · 신청 준비용 작성 양식</p>
   <table className={styles.metadata}><tbody><tr><th>기업명</th><td><input aria-label="문서 기업명" maxLength={200} value={documentFields.companyName} disabled={!!busy||!canEdit} onChange={e=>onFieldsChange({...documentFields,companyName:e.target.value})}/></td><th>신청 구분</th><td><select aria-label="문서 신청 구분" value={documentFields.application} disabled={!!busy||!canEdit} onChange={e=>onFieldsChange({...documentFields,application:e.target.value})}><option value="unknown">확인 필요</option><option value="new">신규 신청</option><option value="renewal">재확인 신청</option></select></td></tr><tr><th>대표자</th><td><input aria-label="문서 대표자" maxLength={100} placeholder="확인 후 입력" value={documentFields.representativeName} disabled={!!busy||!canEdit} onChange={e=>onFieldsChange({...documentFields,representativeName:e.target.value})}/></td><th>사업자등록번호</th><td><input aria-label="문서 사업자등록번호" maxLength={20} placeholder="확인 후 입력" value={documentFields.businessNumber} disabled={!!busy||!canEdit} onChange={e=>onFieldsChange({...documentFields,businessNumber:e.target.value})}/></td></tr><tr><th>문서 번호</th><td>{row.code}</td><th>수정</th><td>{row.metadata.revisionNo||1}</td></tr></tbody></table>
   {parsed.preamble.trim()&&<p className={styles.preamble}>{parsed.preamble}</p>}
   {parsed.sections.map((s,i)=><FormCell onBusy={onBusy} row={row} visuals={visuals} onVisualsChange={onVisualsChange} onGenerateVisual={onGenerateVisual} onError={onError} key={s.id} section={{...s,number:i+1}} disabled={!!busy||!canEdit} onFocus={()=>onFocus(s.id)} changed={!!row.metadata.ai.chat?.proposal&&saved?.sections.find(before=>before.id===s.id)?.value!==s.value} onChange={(key,value)=>{try{onChange(updatePlanSubcell(content,row.metadata.ai.input.type,s.id,key,value,definition));}catch(e){onError(e.message);}}}/>)}
  </article></div>:<div className={styles.text}><p>{!parsed?'기존 문항 제목이 변경되어 본문을 그대로 표시합니다. 내용을 보존하며 편집할 수 있습니다.':'전체 본문 편집 · 문항 제목을 유지하면 양식 보기에 반영됩니다.'}</p><textarea aria-label="생성 문서 본문" rows={24} value={content} maxLength={80000} disabled={!!busy||!canEdit} onChange={e=>onChange(e.target.value)}/></div>}
 </section>;
}
