'use client';
import SourceVisualWorkshop from './SourceVisualWorkshop';
import {useEffect,useRef,useState} from 'react';
import {retryVisionOperation,retryPlanOperation,visionIdentity} from '../../lib/businessPlans/retryPlanOperation.mjs';
import {put} from '../../lib/venture/sourceClient.mjs';
import {prepareVisionSource} from '../../lib/businessPlans/visionClient.mjs';
import {criteriaFor} from '../../lib/businessPlans/visionReview.mjs';
import {needsHwpImageRefresh,usesNativeHwpRenderer} from '../../lib/businessPlans/hwpRenderVersion.mjs';
import SourceTextFallback from './SourceTextFallback';
import PriorityConversation from './PriorityConversation';
import DocumentReviewSummary from './DocumentReviewSummary';
import ProgramRubricEditor from './ProgramRubricEditor';
import styles from './VisionReviewPanel.module.css';
export default function VisionReviewPanel({actorId,row,onRow,content,onContent,api,canEdit,disabled,onBusy,position,onPosition,autosave,onReview}){
  const {pageId,point,message}=position;const setPageId=value=>onPosition({...position,pageId:typeof value==='function'?value(pageId):value,point:0}),setPoint=value=>onPosition({...position,point:value}),setMessage=value=>onPosition({...position,message:value});
  const [activeVisual,setActiveVisual]=useState(null),[visualBusy,setVisualBusy]=useState(false);
  const [evaluation,setEvaluation]=useState(null),[report,setReport]=useState(null),[coverage,setCoverage]=useState({completed:0,total:0});
  const [attemptedAnalysis,setAttemptedAnalysis]=useState(false);
  const [working,setWorking]=useState(false),[progress,setProgress]=useState(''),[error,setError]=useState(''),[zoom,setZoom]=useState('100'),[wide,setWide]=useState(false),[showMarks,setShowMarks]=useState(true),[pageRatio,setPageRatio]=useState(.707),[imageFailed,setImageFailed]=useState(false);
  const pdfPicker=useRef(null),[sameOriginal,setSameOriginal]=useState(false);
  const alive=useRef(true),abort=useRef(null),request=useRef(null),resultRequest=useRef(0);
  const vision=row.metadata.sourceVision,coach=row.metadata.sourceCoach||{},program=coach.program;
  const staleImages=needsHwpImageRefresh(row),refreshAttempt=useRef(null);
  const page=vision?.pages.find(p=>p.id===pageId),criteria=criteriaFor(program),note=evaluation?.annotations[point];
  const programKey=JSON.stringify(program||null);
  useEffect(()=>{alive.current=true;return()=>{alive.current=false;abort.current?.abort();};},[]);
  useEffect(()=>{let active=true;const id=++resultRequest.current;setEvaluation(null);setImageFailed(false);setError('');
    if(vision?.prepared&&!staleImages)api({action:'source-page-result',sourceId:row.id,pageId}).then(result=>{if(active&&id===resultRequest.current)setEvaluation(result.evaluation);}).catch(e=>{if(active&&e.status!==404)setError(e.message);});
    return()=>{active=false;};
  },[pageId,vision?.key,vision?.prepared,programKey,staleImages]);
  useEffect(()=>{let active=true;api({action:'source-document-result',sourceId:row.id}).then(result=>{if(active){setCoverage(result.progress);setReport(result.report);}}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;};},[vision?.key,vision?.prepared,programKey]);
  async function run(label,job){if(working||disabled)return;setWorking(true);onBusy(true);setProgress(label);setError('');try{await job();}catch(e){if(alive.current){setError(e.name==='AbortError'?'중지했습니다. 준비된 페이지와 기존 결과는 보존됩니다.':e.message);try{const fresh=await api({action:'source-list'});if(alive.current){const source=fresh.sources.find(s=>s.id===row.id);if(source)onRow(source);}}catch{}}}finally{if(alive.current){setWorking(false);onBusy(false);setProgress('');}}}
  function prepare(){run('페이지 이미지 준비 중…',async()=>{const controller=new AbortController();abort.current=controller;await prepareVisionSource(row,{api,signal:controller.signal,onSource:source=>{if(alive.current)onRow(source);},onProgress:label=>{if(alive.current)setProgress(label);}});});}
  function attachPdf(file){if(!file)return;run('PDF 내보내기본을 연결하고 있습니다…',async()=>{if(!sameOriginal||file.size>100*1024*1024)throw Error('동일 원문의 PDF인지 확인해 주세요. 최대100MB입니다.');const path=`companies/${row.company_id}/${row.id}/vision-render/${crypto.randomUUID()}.pdf`;await put(path,file,'application/pdf');const result=await api({action:'source-render-attach',sourceId:row.id,expectedUpdatedAt:row.updated_at,fingerprint:row.metadata.sourceUpload.fingerprint,path,confirmed:sameOriginal});if(alive.current)onRow(result.source);});}
  function discard(){run('수정안을 보류합니다…',async()=>{const result=await api({action:'source-coach-discard',sourceId:row.id,expectedUpdatedAt:row.updated_at,...(coach.proposal?.content===content?{resolution:'applied',content}:{})});if(alive.current)onRow(result.source);});}
  function evaluate(){run('전체 문서 분석을 시작합니다…',async()=>{
    setAttemptedAnalysis(true);
    const controller=new AbortController();abort.current=controller;
    let source=await retryPlanOperation(()=>prepareVisionSource(row,{api,signal:controller.signal,onSource:source=>{if(alive.current)onRow(source);},onProgress:label=>{if(alive.current)setProgress(label);}}),{signal:controller.signal,onRetry:({attempt})=>setProgress(`저장된 페이지 준비를 자동으로 이어갑니다 (${attempt}/2)…`)});
    const saved=await retryPlanOperation(()=>api({action:'source-document-result',sourceId:row.id}),{signal:controller.signal});
    if(visionIdentity(saved.source)!==visionIdentity(source))throw Error('원문 또는 평가 기준이 변경됐습니다. 최신 자료에서 다시 시작해 주세요.');
    source=saved.source;
    const completedPages=new Set(saved.progress.completedPageIds);
    if(alive.current){onRow(source);setCoverage(saved.progress);}
    if(saved.report){if(alive.current)setReport(saved.report);return;}
    for(const current of source.metadata.sourceVision.pages){
      if(!alive.current||controller.signal.aborted)throw new DOMException('중지','AbortError');
      if(completedPages.has(current.id))continue;
      setProgress(`전체 ${source.metadata.sourceVision.total}쪽 중 ${current.id}쪽 분석 중… 저장된 평가는 건너뜁니다.`);
      const result=await retryVisionOperation({source,body:{action:'source-page-evaluate',pageId:current.id},api,signal:controller.signal,onSource:s=>{if(alive.current)onRow(s);},onRetry:({kind,attempt})=>{if(alive.current)setProgress(kind==='pending'?`${current.id}쪽 처리 결과를 기다린 뒤 자동으로 이어갑니다…`:`${current.id}쪽 연결·평가 응답을 확인하고 자동 재시도 중 (${attempt}/2)…`);}});source=result.source;
      completedPages.add(current.id);
      if(alive.current){onRow(source);setCoverage({completed:completedPages.size,total:source.metadata.sourceVision.total});if(current.id===pageId)setEvaluation(result.evaluation);}
    }
    if(!alive.current||controller.signal.aborted)throw new DOMException('중지','AbortError');
    setProgress('모든 페이지 분석 완료 · 문서 전체의 연결성과 보완 우선순위를 평가하고 있습니다…');
    const result=await retryVisionOperation({source,body:{action:'source-document-evaluate'},api,signal:controller.signal,onSource:s=>{if(alive.current)onRow(s);},onRetry:({kind,attempt})=>{if(alive.current)setProgress(kind==='pending'?'전체 평가 결과를 기다린 뒤 자동으로 이어갑니다…':`저장된 페이지로 종합 평가 자동 재시도 중 (${attempt}/2)…`);}});
    if(alive.current){onRow(result.source);setCoverage(result.progress);setReport(result.report);}
  });}
  function saveRubric(program){run('평가기준 저장 중…',async()=>{const result=await api({action:'source-rubric-save',sourceId:row.id,expectedUpdatedAt:row.updated_at,program});if(alive.current){onRow(result.source);setEvaluation(null);setReport(null);setCoverage({completed:0,total:vision?.total||0});}});}
  const pageDraft=evaluation?[`[${row.title} · ${pageId}쪽 분석 기반 보완 메모]`,evaluation.summary,...evaluation.annotations.map(a=>`[원문 근거] ${a.evidence}\n[확인·보완 필요] ${a.issue}\n[개선 제안] ${a.suggestion}`)].join('\n\n'):'';
  function addPage(){if(content.includes(`[${row.title} · ${pageId}쪽 분석 기반 보완 메모]`)){setError('이 페이지 메모가 이미 본문에 있습니다. 기존 내용을 직접 보완하세요.');return;}if(content.length+pageDraft.length+2>60000){setError('보완본은 60,000자 이내로 정리해 주세요.');return;}onContent([content,pageDraft].filter(Boolean).join('\n\n'));}
  function chat(){run('AI가 답변을 읽고 수정안을 제안하고 있습니다…',async()=>{
    const identity=JSON.stringify([pageId,point,message,content]);if(request.current?.identity!==identity)request.current={identity,id:crypto.randomUUID()};
    const controller=new AbortController();abort.current=controller;
    const result=await retryVisionOperation({source:row,body:{action:'source-coach-chat',pageId,annotationIndex:point,turnId:request.current.id,message,content},api,signal:controller.signal,onSource:s=>{if(alive.current)onRow(s);},onRetry:()=>setProgress('같은 대화의 저장 결과를 확인하고 자동으로 이어갑니다…')});
    if(alive.current){onRow(result.source);setMessage('');request.current=null;}
  });}
  const proposal=coach.proposal,proposalCurrent=proposal?.key===evaluation?.key,turns=(coach.turns||[]).filter(t=>t.key===evaluation?.key&&t.annotationIndex===point);
  const block=visualBusy||working||disabled;
  useEffect(()=>{
    if(!staleImages||!canEdit||block||refreshAttempt.current===row.id)return;
    // Defer past React's mount/cleanup probe so its cleanup cannot abort the
    // only automatic attempt before any image has been prepared.
    const timer=setTimeout(()=>{refreshAttempt.current=row.id;prepare();},0);
    return()=>clearTimeout(timer);
  },[staleImages,canEdit,block,row.id]);
  const activePriority=report&&position.activePriority?.startsWith(report.key+':')?Number(position.activePriority.split(':')[1]):null;
  function discuss(index){onPosition({...position,activePriority:`${report.key}:${index}`});}
  function cardMessage(value){onPosition({...position,cardMessages:{...position.cardMessages,[position.activePriority]:value}});}
  function cardChat(){run('AI가 보완 카드를 확인하고 수정안을 준비합니다…',async()=>{
    const item=report.priorities[activePriority],message=position.cardMessages?.[position.activePriority]||'';
    const marker=`[전체 평가 보완 카드 ${activePriority+1}: ${item.issue}]`;
    const base=content.includes(`[전체 평가 보완 카드 ${activePriority+1}:`)?content:[content,`${marker}\n[확인·보완 필요] ${item.issue}\n[개선 방향] ${item.suggestion}`].filter(Boolean).join('\n\n');
    if(base.length>60000)throw Error('보완본은 60,000자 이내로 정리해 주세요.');
    let source=row;
    if(coach.proposal?.content===content)source=(await api({action:'source-coach-discard',sourceId:row.id,expectedUpdatedAt:row.updated_at,resolution:'applied',content})).source;
    if(base!==content)onContent(base);
    const identity=JSON.stringify([report.key,activePriority,message,base]);if(request.current?.identity!==identity)request.current={identity,id:crypto.randomUUID()};
    const controller=new AbortController();abort.current=controller;
    const result=await retryVisionOperation({source,body:{action:'source-coach-chat',reportKey:report.key,priorityIndex:activePriority,turnId:request.current.id,message,content:base},api,signal:controller.signal,onSource:s=>{if(alive.current)onRow(s);},onRetry:()=>setProgress('같은 보완 카드 대화의 저장 결과를 확인하고 자동으로 이어갑니다…')});
    if(alive.current){onRow(result.source);cardMessage('');request.current=null;}
  });}
  const viewerRef=useRef(null);
  function openEvidence(n){setPageId(n);viewerRef.current?.scrollIntoView({behavior:'smooth',block:'start'});viewerRef.current?.focus({preventScroll:true});}
  return <div className="space-y-3">
    <ProgramRubricEditor key={programKey} program={program} onSave={saveRubric} disabled={!canEdit||block}/>
    <div className={styles.toolbar}><strong>사업계획서 전체 분석</strong><button disabled={!canEdit||block||Boolean(report)} onClick={evaluate}>{report?`전체 ${report.total}쪽 평가 완료`:coverage.completed||attemptedAnalysis?'분석 다시 시작':'전체 문서 AI 분석'}</button><button disabled={!canEdit||block||(vision?.prepared&&!staleImages)} onClick={prepare}>{staleImages?'개선된 한글 페이지로 새로 준비':vision?.prepared?`전체 ${vision.total}쪽 이미지 준비됨`:'페이지 이미지 준비'}</button>{working&&abort.current&&<button onClick={()=>abort.current.abort()}>분석 중지 · 결과 보존</button>}<span>공개 기준 미등록 시 공통 평가만 제공</span></div>
    {progress&&<p role="status" className={styles.status}>{progress}</p>}{error&&<p role="alert" className={styles.error}>{error}</p>}
    {!vision?.pages?.length&&!['PDF','PNG','JPG','JPEG'].includes(row.metadata.format)&&<details className={styles.rubric}><summary>변환이 안 되면 같은 원문의 PDF 연결</summary><p>한글·워드·PPT·엑셀 앱에서 PDF로 내보내 연결하세요. 원본은 별도로 유지하며 이 PDF의 페이지를 보고 평가합니다.</p><label><input type="checkbox" checked={sameOriginal} disabled={block||!canEdit} onChange={e=>setSameOriginal(e.target.checked)}/> 동일한 원문에서 내보낸 PDF임을 확인했습니다.</label><input ref={pdfPicker} type="file" accept=".pdf" className="sr-only" onChange={e=>{attachPdf(e.target.files[0]);e.target.value='';}}/><button disabled={block||!canEdit||!sameOriginal} onClick={()=>pdfPicker.current.click()}>PDF 연결</button></details>}
    {usesNativeHwpRenderer(row)&&<p className={styles.hint}>{staleImages?'이전에 만든 한글 이미지를 선명한 페이지로 갱신합니다. 기존 평가·대화·보완본은 활동 기록에 보관됩니다.':'한글 페이지 미리보기 · 글꼴과 표 안쪽 여백을 반영해 줄바꿈을 계산합니다. 한글 앱의 인쇄 페이지 구분과는 차이가 있을 수 있습니다.'}</p>}
    {usesNativeHwpRenderer(row)&&!report&&row.metadata.sourceVisionHistory?.length>0&&<p className={styles.hint}>페이지 배치가 갱신되어 이전 위치 표시는 숨겼습니다. 전체 문서 AI 분석을 실행하면 새 페이지에 맞춰 평가합니다. 이전 평가와 보완본은 저장된 활동 기록에서 확인할 수 있습니다.</p>}
    {row.metadata.sourceRender?.note&&<p className={styles.hint}>{row.metadata.sourceRender.note} · {row.metadata.format} → PDF 페이지</p>}
    {!vision?.prepared&&<p className={styles.status}>페이지를 이미지로 준비한 뒤 평가합니다. 텍스트 추출만 된 자료나 변환에 실패한 페이지는 채점하지 않습니다.</p>}
    {report&&<DocumentReviewSummary report={report} onVisual={setActiveVisual} activeVisual={activeVisual} visualState={row.metadata.sourceVisuals} visualWorkshop={activeVisual!==null&&<SourceVisualWorkshop key={`${report.key}:${activeVisual}`} actorId={actorId} row={row} report={report} index={activeVisual} api={api} onRow={onRow} canEdit={canEdit} disabled={disabled||working} onBusy={value=>{setVisualBusy(value);onBusy(value);}} onClose={()=>setActiveVisual(null)}/>} criteria={criteria} program={program} onPage={openEvidence} disabled={block} activePriority={activePriority} onDiscuss={discuss} conversation={activePriority!==null&&report.priorities[activePriority]&&<PriorityConversation report={report} index={activePriority} row={row} content={content} onContent={onContent} message={position.cardMessages?.[position.activePriority]||''} onMessage={cardMessage} onSend={cardChat} onDiscard={discard} disabled={block} canEdit={canEdit} autosave={autosave} onClose={()=>onPosition({...position,activePriority:null})} onReview={onReview}/>}/>}
    {!report&&coverage.completed>0&&<p role="status">{coverage.completed}/{coverage.total}쪽 평가가 저장됐습니다. 다시 시작하면 {coverage.completed===coverage.total?'저장된 평가로 종합 평가를 만듭니다.':'저장된 페이지를 건너뛰고 남은 페이지를 분석합니다.'}</p>}
    {page&&<div className={`${styles.workspace} ${wide?styles.wide:''}`}>
      <section ref={viewerRef} tabIndex={-1} className={styles.viewer} aria-label="사업계획서 페이지 뷰어">
        <div className={styles.toolbar}><button disabled={block||pageId<=1} onClick={()=>setPageId(n=>n-1)}>이전</button><select aria-label="원문 페이지 선택" value={pageId} disabled={block} onChange={e=>setPageId(Number(e.target.value))}>{vision.pages.map(p=><option key={p.id} value={p.id}>{p.id}쪽</option>)}</select><span>/ {vision.total||vision.pages.length}</span><button disabled={block||pageId>=vision.pages.length} onClick={()=>setPageId(n=>n+1)}>다음</button><select aria-label="페이지 확대" value={zoom} onChange={e=>setZoom(e.target.value)}><option value="fit">한 페이지 전체</option>{[75,100,125,150,200].map(z=><option key={z} value={z}>{z===100?'폭 맞춤':`${z}%`}</option>)}</select><button onClick={()=>{setWide(!wide);setZoom('100');}}>{wide?'문서·AI 나란히':'문서 넓게 보기'}</button><button aria-pressed={showMarks} onClick={()=>setShowMarks(!showMarks)}>{showMarks?'평가 표시 숨기기':'평가 표시 보이기'}</button><a href={'/api/vault-file?path='+encodeURIComponent(row.metadata.originalPath)} target="_blank" rel="noreferrer">원본 열기</a></div>
        <div className={styles.canvas}><div className={styles.page} style={{width:zoom==='fit'?`min(100%, calc((var(--page-height) - 24px) * ${pageRatio}))`:zoom+'%'}}>
          <img key={page.path} src={'/api/vault-file?path='+encodeURIComponent(page.path)} alt={`${row.title} ${pageId}쪽 · AI가 읽는 전체 이미지`} onError={()=>setImageFailed(true)} onLoad={e=>{setImageFailed(false);setPageRatio(e.currentTarget.naturalWidth/e.currentTarget.naturalHeight);}}/>
          {report&&showMarks&&!imageFailed&&evaluation?.annotations.map((item,i)=><button key={i} className={styles.mark} aria-label={`${i+1}번 평가 지점: ${item.role}`} aria-pressed={point===i} title={item.role} onClick={()=>setPoint(i)} style={{left:item.box.x/10+'%',top:item.box.y/10+'%',width:item.box.width/10+'%',height:item.box.height/10+'%'}}><span>{i+1}</span></button>)}
        </div></div>{imageFailed&&<p role="alert">페이지 이미지를 표시하지 못했습니다. 새로 열거나 원본을 확인해 주세요.</p>}
        {['HWP','HWPX'].includes(row.metadata.format)&&<SourceTextFallback row={row}/>}
      </section>
      <aside className={styles.coach} aria-label="페이지 평가와 AI 보완 질문">
        <h3>{report?`${pageId}쪽 근거와 AI 보완`:'전체 분석 후 근거 확인'}</h3>
        <p className={styles.hint}>{report?'종합 평가의 근거와 원문 위치를 확인하세요. 위치 표시는 AI 추정이므로 원문과 대조하세요.':'먼저 전체 문서를 분석해 주세요. 모든 페이지 분석과 종합 평가가 끝나면 위치별 설명과 보완 질문이 표시됩니다.'}</p>
        {report&&evaluation&&<>

          <details className={styles.pageSummary}><summary>이 페이지의 종합 의견 보기</summary><p>{evaluation.summary}</p></details><button disabled={!canEdit||block} onClick={addPage}>이 페이지 근거를 보완본에 추가</button>
          <details><summary>이 페이지의 기준별 보완 의견</summary>{evaluation.scores.map(s=><p key={s.criterionId}><strong>{criteria.find(c=>c.id===s.criterionId)?.title}</strong><br/>{s.reason}</p>)}</details>
          <div className={styles.points}>{evaluation.annotations.map((a,i)=><button key={i} aria-pressed={i===point} onClick={()=>setPoint(i)}>{i+1}. {criteria.find(c=>c.id===a.criterionId)?.title}</button>)}</div>
          {note&&<div className={styles.reason}>
            <h3 className={styles.noteTitle}><span>{point+1}</span>{note.role}</h3>
            <details className={styles.pageSummary}><summary>구조·맥락과 평가기준</summary><p>{note.context}</p><p><strong>평가기준</strong><br/>{criteria.find(c=>c.id===note.criterionId)?.description}</p></details>
            <div className={styles.evidence}><strong>원문 근거</strong><blockquote>{note.evidence}</blockquote></div>
            <div className={styles.issue}><strong>보완이 필요한 이유</strong><p>{note.issue}</p></div>
            <div className={styles.suggestion}><strong>이렇게 고쳐보세요</strong><p>{note.suggestion}</p></div>
            <div className={styles.question}><strong>함께 보완할 질문</strong><p>{note.question}</p></div>
            {turns.map(t=><div className={styles.history} key={t.id}><p><strong>내 답변</strong> {t.message}</p><p>{t.reply}</p>{t.questions.map((q,i)=><p key={i}>다음 질문: {q}</p>)}</div>)}
            {!content.trim()&&<p>위 ‘이 페이지 근거를 보완본에 추가’를 누르거나 아래 본문을 작성한 뒤 AI와 수정하세요.</p>}
            <label>근거와 확인한 사실로 답하기<textarea maxLength={4000} value={message} disabled={!canEdit||block} onChange={e=>setMessage(e.target.value)} placeholder="모르는 내용은 확인 필요로 남겨 달라고 답할 수 있습니다."/></label>
            <button disabled={!canEdit||block||!message.trim()||!content.trim()||Boolean(proposalCurrent&&proposal?.content!==content)} onClick={chat}>답변 보내고 수정안 받기</button>
          </div>}
          {proposal&&proposalCurrent&&<div className={styles.proposal}><h3>AI 수정 제안 · 아직 검토 저장 전</h3>{coach.turns.find(t=>t.id===proposal.turnId)?.changes.map((c,i)=><details key={i}><summary>{c.reason}</summary><p>이전</p><pre>{c.before}</pre><p>제안</p><pre>{c.after}</pre></details>)}<button disabled={!canEdit||block||content!==proposal.baseContent} onClick={()=>onContent(proposal.content)}>수정안을 보완본에 적용</button>{content!==proposal.baseContent&&content!==proposal.content&&<p>직접 수정한 본문이 있어 자동 적용하지 않습니다. 제안을 참고해 편집해 주세요.</p>}<button disabled={!canEdit||block} onClick={discard}>수정안 보류</button><p>아래에서 원문 검토 후 보완본을 저장하면 다음 사업 작성에 사용할 수 있습니다.</p></div>}
        </>}
      </aside>
    </div>}
  </div>;
}
