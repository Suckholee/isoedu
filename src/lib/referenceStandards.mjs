// Structural guidance only. Source-company facts never enter generated drafts.
export function referenceStandard(title, text, sourceCustomer='') {
 let family='일반 사업계획';
 if(/재도전/.test(title))family='재도전';
 else if(/초기창업|창업도약|프리팁스|Pre-TIPS|창업사업화|청년창업|비대면 스타트업/.test(title))family='창업사업화';
 else if(/벤처|혁신성장|연구개발유형/.test(title))family='벤처확인';
 else if(/수출|바우처/.test(title))family='수출지원';
 else if(/기술사업|기보|융자|육성자금/.test(title))family='기술·자금';
 const defaults={
  '재도전':['폐업 원인 분석 및 개선 방안','문제인식 및 목표시장','실현가능성과 준비 현황','성장전략 및 자금운용','조직 구성과 역량'],
  '창업사업화':['문제인식','실현가능성','성장전략','팀 구성'],
  '벤처확인':['제품·서비스 개발배경 및 필요성','솔루션과 핵심 기능','기술개발 경과 및 계획','목표시장과 고객','경쟁사 분석','시장진입 및 확대 전략','자금운용 계획','팀 구성 및 기업가정신'],
  '수출지원':['기업 및 제품 현황','목표시장과 수출 준비 현황','수출마케팅 추진 계획','프로그램별 수행기간','지원금·자부담 및 예산','기대성과와 증빙'],
  '기술·자금':['기업체 개요','대표자 및 경영진 현황','기술·제품과 사업 내용','시장성과 판매계획','자금 용도와 조달계획','추진 일정 및 증빙'],
  '일반 사업계획':['기업 및 사업 개요','문제와 해결방안','제품·서비스 및 기술','시장과 경쟁','사업화 전략','추진 일정','자금계획','팀 구성 및 증빙'],
 };
 const candidates=[];
 const sourceNames=sourceCustomer.replace(/\(주\)|주식회사|㈜/g,'').split(/[\s_,]+/).filter(s=>s.length>=2);
 for(const raw of text.split('\n')){
  const line=raw.trim().replace(/\s+/g,' ');
  if(line.length<5||line.length>85||/\d{2,}-\d{2,}|@|https?:|확인 필요|예시|기재요령/.test(line))continue;
  const subject=line.replace(/^(?:\d{1,2}[.\-)]\s*|[ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩ][.\s]|제\s*\d+\s*장\s*)/,'');
  if(/\d|%/.test(subject)||sourceNames.some(name=>subject.includes(name)))continue;
  if(/^(?:\d{1,2}[.\-)]\s*|[ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩ][.\s]|제\s*\d+\s*장\s*)/.test(line)&&/[가-힣]{2}/.test(line)&&!candidates.includes(line))candidates.push(line);
 }
 const headings=candidates.slice(0,24);
 return {revision:1,family,reviewStatus:'구성 검토 필요',basis:headings.length>=3?'원문에서 추출한 목차 후보':'문서 유형에 따른 제안 구성',headings:headings.length>=3?headings:defaults[family],rules:['작성 대상 회사의 확인된 정보만 사용','실적·목표·추정·미확인 구분','현재 공고의 공식 양식·분량·조건 우선','근거가 없는 수치·인증·선정 여부 생성 금지']};
}
export function createReferenceDraft({company, item, headings, standard, reference}) {
 if(!company?.id||!company?.name)throw new Error('작성 대상 회사를 선택해 주세요.');
 if(!item?.trim())throw new Error('작성할 사업 아이템을 입력해 주세요.');
 const sections=headings.map(s=>s.trim()).filter(Boolean);
 if(!sections.length||sections.length>40||sections.some(s=>s.length>160))throw new Error('목차는 1~40개, 항목당 160자 이내로 입력해 주세요.');
 const content=`# ${company.name} · ${item.trim()}\n\n## 작성 대상 회사\n\n- 회사명: ${company.name}\n- 등록 업종: ${company.industry || '[입력 필요]'}\n- 정보 상태: 등록 정보의 최신 여부 확인 필요\n\n작성 상태: 검토 전 초안\n작성 기준: ${standard.family} / 기준 v${standard.revision}\n\n${sections.map((s,i)=>`## ${i+1}. ${s.replace(/^\d+[.\-)]\s*/, '')}\n\n[${company.name}의 해당 내용을 입력해 주세요.]\n- 확인된 사실: [입력 필요]\n- 계획·목표: [입력 필요]\n- 근거 문서 및 기준일: [확인 필요]`).join('\n\n')}\n\n## 제출 전 검토\n\n- 신청 공고의 공식 양식·분량·자격 확인\n- 수치·실적·인증의 근거 확인\n- 미입력 항목과 타 회사 정보 혼입 확인\n`;
 return {title:`${item.trim()} 사업계획서`,code:`PLAN-${reference.id.toUpperCase()}`,companyId:company.id,hierarchyLevel:'LEVEL_1',standards:['ALL'],category:'사업계획서',status:'DRAFT',docStatus:'작성 중',version:'v1.0-draft',contentDraft:content,summary:'참고문서의 구성 기준으로 생성한 회사별 작성 초안',referenceOrigin:{id:reference.id,sha256:reference.sha256,standardRevision:standard.revision,headings:sections,confirmedByUser:true},businessItem:item.trim()};
}
