'use client';
import {useEffect,useState,useRef} from 'react';
import {useRouter,useSearchParams,usePathname} from 'next/navigation';
import {Building2,RefreshCw,ArrowRight} from 'lucide-react';
import {useAuth} from '../context/AuthContext';
import {validateUploadFile,uploadDocumentFile} from '../lib/storageVault';
import {saveEnterpriseUpload} from '../lib/enterpriseUpload.mjs';
import {supabase} from '../lib/supabaseClient';
import ProjectOperationsPanel from './meeting/ProjectOperationsPanel';
import ManagedClientDrive from './ManagedClientDrive';
import {preparationPath,parsePreparationPath} from '../lib/preparationRoutes.mjs';
import styles from './EnterpriseWorkspace.module.css';
import {PLAN_SECTIONS,definitionForAi} from '../lib/venture/catalog.mjs';
import {loadEnterpriseOverview,enterpriseProjectSummary,requestMatches} from '../lib/enterpriseOverview.mjs';
const requestLabels={requested:'제출 필요',changes:'보완 필요',submitted:'검토 중',accepted:'확인 완료',not_applicable:'해당 없음'};
export default function EnterpriseWorkspace({context,company,projects,documents,activeNav,activeProject,onProjectsLoaded,onSelectCompany,onSelectProject,onRefresh,onOpenDocument,onAddDocument,onUpdateDocument,onOpenUpload,onOpenDocuments}){
 const {user,profile}=useAuth(),[overview,setOverview]=useState(null),[error,setError]=useState(''),[loading,setLoading]=useState(false),[filter,setFilter]=useState('todo'),[revision,setRevision]=useState(0),[uploading,setUploading]=useState(false),[uploadNotice,setUploadNotice]=useState('');
 const router=useRouter(),search=useSearchParams(),pathname=usePathname(),detailRoute=parsePreparationPath(pathname);
 const workRef=useRef(null);
 const [activeForm,setActiveForm]=useState(null);
 useEffect(()=>{const select=e=>setActiveForm(e.detail);window.addEventListener('honestone:plan-selected',select);return()=>window.removeEventListener('honestone:plan-selected',select);},[]);
 const picker=useRef(null),uploadScope=useRef('');uploadScope.current=`${user?.id}/${company?.id}`;
 const pending=useRef(null);
 const overviewKey=`${user?.id}/${company?.id}`,current=overview?.key===overviewKey?overview:null;
 const requests=current?.requests||[],tasks=current?.tasks||[],myProjects=current?.projects||projects.filter(p=>p.companyId===company?.id);
 const canEdit=context.companies.find(c=>c.id===company?.id)?.canEdit===true;
 useEffect(()=>{const refresh=()=>setRevision(v=>v+1);window.addEventListener('honestone-intake-saved',refresh);return()=>window.removeEventListener('honestone-intake-saved',refresh);},[]);
 useEffect(()=>{
  let active=true;setError('');if(!company)return;setLoading(true);
  loadEnterpriseOverview(supabase,company.id).then(data=>{if(active){setOverview({...data,key:overviewKey});onProjectsLoaded?.(company.id,data.projects);}})
   .catch(e=>{if(active)setError(e.message);}).finally(()=>{if(active)setLoading(false);});
  return()=>{active=false;};
 },[company?.id,user?.id,revision]);

 async function uploadFile(e){const file=e.target.files?.[0];e.target.value='';if(!file||uploading||!canEdit||!company)return;const check=validateUploadFile(file);if(!check.valid){setError(check.error);return;}const scope=uploadScope.current;setUploading(true);setError('');setUploadNotice('원본 파일을 저장하고 있습니다.');try{await saveEnterpriseUpload(file,{companyId:company.id,user:profile||user,getScope:()=>uploadScope.current,retryState:pending,createDocument:onAddDocument,updateDocument:onUpdateDocument,uploadFile:uploadDocumentFile});setUploadNotice('원본 파일을 회사 문서함에 저장했습니다.');await refresh();}catch(e){if(scope===uploadScope.current){setError(e.message);setUploadNotice('완료되지 않은 단계가 있습니다. 같은 파일을 다시 선택해 재시도할 수 있습니다.');}}finally{setUploading(false);}}
 const uploadControl=<><input ref={picker} type="file" className="sr-only" aria-label="회사 원본 파일 업로드" accept=".pdf,.doc,.docx,.xls,.xlsx,.hwp,.hwpx,.png,.jpg,.jpeg" onChange={uploadFile}/>{uploadNotice&&<p role="status" className={styles.notice}>{uploadNotice}</p>}</>;
 async function refresh(){setRevision(v=>v+1);await onRefresh();}
 if(activeNav==='settings'||!company)return <div className={styles.page}><header className={styles.header}><div><h1>{company?'회사·계정':'회사 정보 확인'}</h1><p className={styles.subtitle}>{profile?.fullName}님 · 기업회원</p></div><button className={styles.button} onClick={refresh}><RefreshCw size={14}/>다시 불러오기</button></header><section className={styles.card}><h2>가입 즉시 사용</h2><p className={styles.note}>가입한 계정의 회사 공간을 바로 사용할 수 있습니다. 별도 가입 승인은 없습니다. 문서를 올리고 준비할 내용을 정리해 보세요.</p><p className={styles.note}>{profile?.fullName} · {profile?.email}</p></section>{context.companies.length>0&&<section className={styles.card}><h2>내 회사</h2><div className={styles.row}>{context.companies.map(c=><button key={c.id} className={styles.button} onClick={()=>onSelectCompany(c)}><Building2 size={15}/>{c.name}</button>)}</div></section>}</div>;
 if(activeNav==='drive')return <>{uploadControl}{error&&<p role="alert" className={styles.error}>{error}</p>}<ManagedClientDrive clients={context.companies} selectedClient={company} documents={documents} onSelectClient={onSelectCompany} onOpenDocument={onOpenDocument} onAddDocument={canEdit?()=>picker.current?.click():undefined} enterprise/></>;
 if(activeNav==='project')return <div className={styles.page}><header className={styles.header}><div><h1>{activeProject?.title||'프로젝트 확인'}</h1><p className={styles.subtitle}>{company.name} · 필요문서별 준비 안내를 확인하고 원본을 업로드하세요.</p></div></header>{activeProject&&activeProject.companyId===company.id&&myProjects.some(p=>p.id===activeProject.id)?<ProjectOperationsPanel key={activeProject.id} project={activeProject} documents={documents.filter(d=>d.companyId===company.id)} onAddDocument={onAddDocument} onUpdateDocument={onUpdateDocument} canEdit={canEdit} onChanged={refresh} enterprise/>:<p role="alert" className={styles.error}>해당 회사의 프로젝트가 없거나 접근 권한이 없습니다.</p>}</div>;
 const list=requests.filter(r=>requestMatches(r,filter));
 const progress=activeNav==='compliance';
 const selectedProject=myProjects.find(p=>p.id===(detailRoute?.projectId||search.get('prepareProject'))&&p.companyId===company.id);
 const selectedRequest=requests.find(r=>r.id===(detailRoute?.requestId||search.get('request'))&&r.project_id===selectedProject?.id&&r.company_id===company.id);
 const selectedKey=detailRoute?.requestId||search.get('request');
 const workOpen=!progress&&selectedProject&&(selectedRequest||selectedKey==='business-plan'||selectedKey==='overview');
 function openWork(project,requestId='business-plan'){
  router.push(preparationPath({projectId:project.id,requestId,companyId:company.id}),{scroll:false});
 }
 function closeWork(){router.push(`/dashboard?company=${company.id}`,{scroll:false});}

 const projectName=id=>myProjects.find(p=>p.id===id)?.title||'연결된 프로젝트에 접근할 수 없습니다.';
 return <div className={`${styles.page} ${workOpen?styles.workPage:''}`}>
  {!workOpen&&<header className={styles.header}><div><h1>{workOpen?'문서 작업':progress?'진행 현황':'우리 회사 준비'}</h1><p className={styles.subtitle}>{company.name} · {progress?'프로젝트별 서류 검토 상태와 준비 일정을 확인하세요.':'프로젝트를 선택해 AI 문서를 작성하고 필요한 원본을 올리세요.'}</p></div><div className={styles.row}>{!progress&&canEdit&&<button disabled={uploading} className={`${styles.button} ${styles.primary}`} onClick={()=>picker.current?.click()}>{uploading?'저장 중…':'보유 서류 올리기'}</button>}<button className={styles.button} onClick={refresh}><RefreshCw size={14}/>새로고침</button></div></header>}
  {!progress&&uploadControl}{error&&<p role="alert" className={styles.error}>{error}</p>}
  {workOpen&&<div className={styles.workbench}>
   <aside className={styles.documentRail} aria-label="프로젝트 문서 목록"><div className={styles.railTools}><button onClick={closeWork}>← 준비 목록</button>{canEdit&&<button disabled={uploading} onClick={()=>selectedKey==='business-plan'?window.dispatchEvent(new CustomEvent('honestone:source-upload-open',{detail:{projectId:selectedProject.id}})):picker.current?.click()}>{selectedKey==='business-plan'?'자료 분석':'원본 업로드'}</button>}</div><p>{selectedKey==='business-plan'?'사업계획서 목차':'준비 문서'}</p><button aria-current={selectedKey==='business-plan'&&!search.get('section')?'page':undefined} onClick={()=>openWork(selectedProject)}>사업계획서 전체</button>{selectedKey==='business-plan'&&(activeForm?.projectId===selectedProject.id&&activeForm?.companyId===company.id?activeForm.sections:definitionForAi(documents.find(d=>d.id===detailRoute?.documentId)?.ai).sections).map((s,i)=><button key={s.id} aria-current={search.get('section')===s.id?'page':undefined} onClick={()=>router.push(preparationPath({projectId:selectedProject.id,documentId:detailRoute?.documentId,companyId:company.id})+`&section=${s.id}`,{scroll:false})}>{i+1}. {s.title}</button>)}<details open={selectedKey!=='business-plan'||undefined}><summary className={styles.note}>필요한 증빙 서류</summary>{requests.filter(r=>r.project_id===selectedProject.id).map(r=><button key={r.id} aria-current={selectedKey===r.id?'page':undefined} onClick={()=>openWork(selectedProject,r.id)}>{r.title}<small>{requestLabels[r.status]||r.status}</small></button>)}</details></aside>
   <section ref={workRef} className={`${styles.workPanel} ${selectedKey==='business-plan'?styles.planPanel:''}`} aria-label="선택 서류 작업">
   {selectedKey!=='business-plan'&&<header className={styles.header}><div><h2>{selectedRequest?.title||(selectedKey==='business-plan'?'사업계획서 작성':'프로젝트 문서 준비')}</h2>{selectedKey!=='business-plan'&&<p className={styles.note}>{selectedProject.title} · 매뉴얼 확인 → 원본 업로드 또는 AI 작성 → 검토·저장</p>}</div><div className={styles.row}>{selectedKey==='business-plan'&&canEdit&&<button className={styles.button} disabled={uploading} onClick={()=>picker.current?.click()}>기존 계획서 업로드</button>}<button className={styles.button} onClick={closeWork}>목록</button></div></header>}
   <ProjectOperationsPanel key={`${overviewKey}/${selectedProject.id}`} project={selectedProject} documents={documents.filter(d=>d.companyId===company.id)} onAddDocument={onAddDocument} onUpdateDocument={onUpdateDocument} canEdit={canEdit} onChanged={()=>setRevision(v=>v+1)} enterprise focused requestId={selectedKey}/>
  </section></div>}
  {workOpen?null:loading?<p role="status" className={styles.empty}>회사 프로젝트와 서류를 불러오는 중입니다…</p>:error?null:progress?<>
   <section className={styles.card}><h2>프로젝트별 준비·검토 현황 <span className={styles.pill}>{myProjects.length}</span></h2>
    <p className={styles.note}>작성 문서의 검토 기록과 제출 서류의 확인 상태를 따로 표시합니다. 해당 없음은 확인 완료에 포함하지 않습니다.</p>
    <div className={styles.scroll}><table className={`${styles.table} ${styles.progressTable}`}><thead><tr><th>프로젝트 / 목표일</th><th>준비·보완</th><th>제출 후 검토 중</th><th>확인 완료</th><th>해당 없음</th><th>AI 작성 문서</th><th>준비 업무</th><th>상세</th></tr></thead><tbody>{myProjects.map(p=>{const count=enterpriseProjectSummary(p,requests,tasks,documents);return <tr key={p.id}><td><strong>{p.title||'프로젝트'}</strong><small>{p.targetDate||p.targetAuditDate||'목표일 미정'}</small></td><td>{count.pending}개</td><td>{count.submitted}개</td><td>{count.accepted}개</td><td>{count.excluded}개</td><td>{count.drafts}개<small>검토 기록 {count.reviewed}개</small></td><td>{count.tasks?`${count.doneTasks} / ${count.tasks} 완료`:'등록 없음'}</td><td><button className={styles.link} onClick={()=>onSelectProject(p)}>상세 보기 →</button></td></tr>;})}</tbody></table></div>
    {!myProjects.length&&<p className={styles.empty}>연결된 준비 프로젝트가 없습니다. 프로젝트가 연결되면 이곳에서 진행 상황을 확인할 수 있습니다.</p>}
   </section>
   <section className={styles.card}><h2>준비 일정·업무</h2><div className={styles.scroll}><table className={styles.table}><thead><tr><th>할 일</th><th>프로젝트</th><th>내부 목표일</th><th>담당</th><th>상태</th></tr></thead><tbody>{tasks.map(t=><tr key={t.id}><td>{t.title}</td><td>{t.project_id?projectName(t.project_id):'회사 공통'}</td><td>{t.due_date||'미정'}</td><td>{t.assignee||'미정'}</td><td>{({todo:'준비 전',doing:'진행 중',waiting:'대기',done:'완료'})[t.status]||'확인 필요'}</td></tr>)}</tbody></table></div>{!tasks.length&&<p className={styles.empty}>등록된 준비 일정이 없습니다.</p>}</section>
   <p className={styles.note}>기업 내부의 준비 현황입니다. 공식 기관의 접수·심사·인증 결과를 의미하지 않습니다.</p>
  </>:<>
   {!canEdit&&<p className={styles.notice}>현재 열람 권한입니다. 문서 작성·제출에는 회사 편집 권한이 필요합니다.</p>}
   {!workOpen&&<section className={styles.card}><h2>문서 준비 시작</h2><div className={styles.projects}>{myProjects.map(p=><button key={p.id} className={styles.project} onClick={()=>openWork(p,requests.some(r=>r.project_id===p.id&&r.request_key.startsWith('venture_growth-'))?'business-plan':'overview')}><strong>{p.title||'프로젝트'}</strong><span>{canEdit?'AI 작성·매뉴얼·원본 제출':'작성 문서·준비 안내 보기'} <ArrowRight size={12}/></span></button>)}</div>{!myProjects.length&&<><p className={styles.empty}>연결된 프로젝트가 없습니다. 보유한 서류부터 회사 문서함에 모아 두세요.</p><button className={styles.link} onClick={onOpenDocuments}>회사 문서함 열기 →</button></>}</section>}
   <section className={styles.card}><h2>필요한 서류 준비</h2><div className={styles.tabs}>{[['todo','준비·보완 필요'],['submitted','검토 중'],['done','처리됨'],['all','전체']].map(([key,label])=><button key={key} aria-pressed={filter===key} className={filter===key?styles.active:''} onClick={()=>setFilter(key)}>{label} {requests.filter(r=>requestMatches(r,key)).length}</button>)}</div>
    <div className={styles.scroll}><table className={styles.table}><thead><tr><th>서류</th><th>프로젝트</th><th>상태</th><th>다음 행동</th></tr></thead><tbody>{list.map(r=>{const p=myProjects.find(p=>p.id===r.project_id);return <tr key={r.id}><td>{p?<button className={styles.link} aria-label={`${r.title} 준비하기`} onClick={()=>openWork(p,r.id)}><strong>{r.title}</strong></button>:<strong>{r.title}</strong>}{r.conditional&&<small>해당 시 준비</small>}{r.feedback&&<small>{r.feedback}</small>}</td><td>{projectName(r.project_id)}</td><td><span className={styles.pill}>{requestLabels[r.status]||r.status}</span></td><td>{p?<button className={styles.link} onClick={()=>openWork(p,r.id)}>{canEdit?'매뉴얼·업로드·AI 작성':'매뉴얼·저장 문서 보기'} →</button>:<span className={styles.note}>회사·프로젝트 연결 확인 필요</span>}</td></tr>;})}</tbody></table></div>{!list.length&&<p className={styles.empty}>해당하는 요청 서류가 없습니다.</p>}
   </section>
  </>}
 </div>;
}
