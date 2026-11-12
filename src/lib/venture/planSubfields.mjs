// Preparation editor fields under the official 13 questions; not additional official requirements.
const fields=entries=>entries.map(([id,label,guide,pattern])=>({id,label,guide,pattern}));
export const PLAN_SUBFIELDS=Object.fromEntries(Object.entries({
 problem:[['background','개발 배경','개발을 시작한 계기와 상황',/^(네오앤피터|개발 배경|현재|본 문서)/],['pain','고객 문제','고객의 불편과 발생 상황',/^(본 기능.*고객 불편|고객|첫째|문제)/],['need','해결 필요성','해결해야 하는 이유와 중요성',/^(해결|필요성|이러한)/],['evidence','문제 확인 근거','인터뷰·조사 등 확인 자료',/^(확인 근거|확인 필요|근거)/]],
 solution:[['overview','기술·서비스 개요','무엇을 제공하는 기술·서비스인지',/^(네오앤피터|본 기술|본 서비스|솔루션)/],['features','핵심 기능','주요 기능과 작동 방식',/^(핵심 기능|주요 기능|첫째)/],['model','사업모델','고객·수익 구조·과금 방식',/^(사업모델|비즈니스 모델|수익 모델|과금)/],['difference','차별성·경쟁력','대안 대비 우위와 확보 방안',/^(차별점|차별성|경쟁력|기존 기술 대비)/],['proof','차별성 입증 자료','시험·비교 결과 등 근거',/^(검증|입증|비교 근거|증빙)/]],
 development:[['progress','개발 추진 경과','현재 단계와 확보한 산출물',/^(현재|지금까지|개발 경과)/],['goals','향후 개발 목표','향후 3년 기술개발 목표',/^(향후|개발 목표|장기|단기)/],['schedule','개발 일정','단계별 추진 일정과 점검 기준',/^(개발 일정|추진 일정|일정|1차년도)/],['resources','개발 인력·예산','담당 인력과 필요한 자원',/^(개발 인력|담당|인력|예산|확인 필요)/]],
 market:[['customer','목표 고객','초기 고객군과 고객 범위',/^(목표 고객|초기 고객|주요 고객)/],['size','시장 범위·규모','목표시장 정의와 규모',/^(목표 시장|시장 범위|시장규모|시장 규모)/],['outlook','향후 3년 전망','시장 변화와 확장 방향',/^(향후|시장 전망)/],['sources','시장 조사 근거','수치 출처·조사 방법·미확인 자료',/^(시장 관련 확인|확인 필요|조사|출처|근거)/]],
 competition:[['targets','비교 대상','경쟁사·대체재 최대 3개',/^(경쟁사 분석|경쟁사명|구체적인 경쟁)/],['comparison','경쟁사 특장점','기능·고객군·가격 등 비교',/^(비교 대상|첫째|경쟁사 현황)/],['strategy','경쟁우위 전략','차별화와 경쟁력 확보 방법',/^(네오앤피터|비교 포인트|경쟁 전략)/],['evidence','비교 근거','비교표와 확인할 자료',/^(확인 필요|비교 근거|증빙)/]],
 expansion:[['progress','시장진입 추진 현황','현재까지의 추진 경과와 실적',/^(현재|지금까지|추진 경과)/],['entry','초기 진입 전략','초기 고객 접근과 시범 검증',/^(시장진입 전략|초기|진입 전략)/],['growth','향후 3년 확대 계획','연차별 시장 확대와 목표',/^(향후|확대 계획|1차년도)/],['channels','고객 확보 경로','마케팅·판매 채널과 운영 계획',/^(고객 확보|고객 접근|마케팅|판매)/]],
 funding:[['secured','확보 자금 현황','확보된 자금과 확인 근거',/^(자금조달 현황|현재|확보된)/],['raising','자금조달 계획','향후 3년 조달 방식과 시점',/^(향후|조달 계획|자금조달 계획)/],['uses','자금 사용 계획','인건비·개발비 등 사용 목적',/^(사용 계획|자금 사용|필요 자금)/],['basis','조달·집행 세부 근거','금액 산정과 조달·사용 증빙',/^(구체적인|확인 필요|산정 근거)/]],
 team:[['founder','대표자 경력·경험','주요 경력과 기업가정신 사례',/^(네오앤피터|대표자|창업자)/],['organization','조직·역할 구성','조직 구성과 담당 업무',/^(현재 문서|팀의 역할|조직|팀 구성)/],['staff','기술개발 인력','연구조직·기술인력의 전문성',/^(기술인력|연구조직|개발 인력)/],['proof','인력 확인 자료','경력·재직·자격 등 증빙',/^(확인 필요|경력 증빙|인력 증빙)/]],
 researchCost:[['total','당기 연구개발비','신청일 기준 당기 합계',/^(신청일|당기|연구개발비 총액)/],['period','산정 기간·기준','회계기간과 비용 산정 기준',/^(산정 기간|회계기간|산정 기준)/],['breakdown','연구개발비 내역','인건비·외주비 등 비용 내역',/^(본 기능|세부 내역|비용 내역)/],['proof','지출 증빙·대조','장부·계약·지급 증빙',/^(제출 전|증빙|확인 필요)/]],
 researchResults:[['records','연구개발 수행 현황','정부·공동·자체 R&D 과제',/^(기술개발 실적|현재|수행 현황)/],['outputs','개발 산출물·성과','개발 결과와 확인 자료',/^(기능 시험|산출물|개발 결과)/],['status','과제 진행·완료 상태','과제 기간과 진행 단계',/^(진행|완료|과제 기간)/],['plans','후속 개발 계획','실적과 구분한 향후 계획',/^(향후|후속)/]],
 ip:[['rights','출원·등록 현황','권리명·번호·출원/등록 구분',/^(지식재산권 보유|현재|특허 현황)/],['scope','기술 연관성·대상 범위','신청 기술과 권리의 관계',/^(본 신청|기술 연관|신청 기술)/],['plans','권리화 계획','향후 출원·등록 계획',/^(향후|권리화 계획)/],['proof','권리 확인 자료','권리자·일자·등록원부 등',/^(확인 필요|증빙|권리 확인)/]],
 partners:[['records','협업 실적 현황','관련 협약·공동사업 실적',/^(외부 협업 실적|현재|협업 현황)/],['details','협업 내용·범위','대상·역할·최근 3년 구분',/^(본 신청|협업 내용|역할)/],['plans','향후 협업 계획','실적과 구분한 협업 방향',/^(향후|협업 방향)/],['proof','협업 증빙','실제 협약·계약 등 확인 자료',/^(확인 필요|증빙|계약)/]],
 performance:[['applicability','적용 여부','신규/재확인 여부와 대상',/^(사업성과 항목|사용자 입력)/],['records','현재 성과 자료','확인된 실적과 미제공 정보',/^(본 기능|현재|실제 실적)/],['metrics','선택 지표·3개년 실적','재확인 기업이 선택한 지표',/^(선택 지표|최근 3년|지표)/],['proof','실적 산정·증빙','지표 산정 기준과 증빙',/^(향후|증빙|산정 기준)/]],
}).map(([key,value])=>[key,fields(value)]));

export function parsePlanSubfields(section){
 const definitions=PLAN_SUBFIELDS[section.id]||[];if(!definitions.length)return [{id:'body',key:'body-0',label:'작성 내용',guide:section.guide||'원문 양식의 요구사항',value:section.value,explicit:false}];
 const marker=/^【([^\n】]+)】[ \t]*(?:\r?\n|$)/gm,found=[...section.value.matchAll(marker)];
 const known=found.filter(m=>definitions.some(d=>d.label===m[1]));
 const rows=[];
 if(known.length){
  if(known[0].index>0)rows.push({...definitions[0],value:section.value.slice(0,known[0].index).trimEnd(),explicit:false});
  for(let i=0;i<known.length;i++){const m=known[i],definition=definitions.find(d=>d.label===m[1]);rows.push({...definition,value:section.value.slice(m.index+m[0].length,known[i+1]?.index??section.value.length).trimEnd(),explicit:true});}
 }else{
  // Existing paragraphs are classified only by their opening phrase; text is never discarded.
  for(const paragraph of section.value.split(/\r?\n[ \t]*\r?\n/)){
   if(!paragraph.trim())continue;
   const definition=definitions.find(d=>d.pattern.test(paragraph.trim()))||definitions[0];
   if(rows.at(-1)?.id===definition.id)rows.at(-1).value+='\n\n'+paragraph;
   else rows.push({...definition,value:paragraph,explicit:false});
  }
 }
 const counts={};
 for(const row of rows){row.key=`${row.id}-${counts[row.id]||0}`;counts[row.id]=(counts[row.id]||0)+1;}
 for(const d of definitions)if(!counts[d.id])rows.push({...d,key:`${d.id}-0`,value:'',explicit:false});
 return rows;
}
export function serializePlanSubfield(section,key,value){
 if(typeof value!=='string'||value.length>16000)throw Error('세부 항목은 16,000자 이내로 작성해 주세요.');
 if(!PLAN_SUBFIELDS[section.id])return value;
 const rows=parsePlanSubfields(section),target=rows.find(r=>r.key===key);if(!target)throw Error('세부 항목을 확인해 주세요.');
 if(target.value===value)return section.value;
 return rows.map(r=>`【${r.label}】\n${r.key===key?value:r.value}`).join('\n\n');
}
