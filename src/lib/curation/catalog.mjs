import {policyCatalog} from '../meeting/documentPolicies.mjs';
export const CURATION_VERSION='honestone-curation-2026-11-06-v1';
export const REVIEWED_AT='2026-11-06';
export const GOALS={customer:'거래처 요구·납품',procurement:'공공조달 준비',export:'수출·해외 거래',investment:'투자·성장',research:'연구개발 체계',environment:'환경·ESG',safety:'안전보건',security:'정보보호',management:'경영 체계 개선'};
const iso=(id,name,summary,goals,url)=>({id,name,summary,goals,url,policyType:'ISO',kind:'ISO',standard:id,review:'실제 운영 범위·시스템 구축·내부심사와 인증기관의 심사가 필요합니다.'});
export const CERTIFICATIONS=[
 iso('ISO_9001','ISO 9001 · 품질','제품·서비스 품질과 고객 요구 관리', ['customer','export','procurement','management'],'https://www.iso.org/standards/popular/iso-9000-family'),
 iso('ISO_14001','ISO 14001 · 환경','환경 영향과 환경경영 체계 관리',['environment','export'],'https://www.iso.org/standards/popular/iso-14000-family'),
 iso('ISO_45001','ISO 45001 · 안전보건','근로자의 안전보건 위험과 운영 체계 관리',['safety','customer'],'https://www.iso.org/standard/45001'),
 iso('ISO_27001','ISO/IEC 27001 · 정보보호','정보보호 위험과 관리 체계 점검',['security','customer','export'],'https://www.iso.org/standard/27001'),
 {id:'VENTURE_GROWTH',name:'벤처기업확인 · 혁신성장',summary:'기술 혁신성과 사업 성장성을 평가하는 유형',goals:['investment','research'],policyType:'VENTURE_GROWTH',kind:'DOMESTIC',url:'https://www.smes.go.kr/venturein/institution/requireGuide?rgCd=C',review:'기술·성장성에 대한 입력은 준비 신호입니다. 전문평가기관의 평가와 확인위원회의 심의가 남아 있습니다.'},
 {id:'INNOBIZ',name:'이노비즈',summary:'기술혁신 체계와 개별 기술 역량 검토',goals:['research','investment','customer'],policyType:'INNOBIZ',kind:'DOMESTIC',url:'https://www.innobiz.net/consult/consult2.asp?Page=2&SearchKey=&SearchValue=&cate=1&date1=&date2=&table=BoardMem_03',review:'온라인 자가진단·기술사업계획·현장평가가 필요합니다. 법인 전환·업력 경계와 제외 조건은 기관 확인 대상입니다.'},
 {id:'MAINBIZ',name:'메인비즈',summary:'경영혁신 활동과 성과를 갖춘 중소기업 검토',goals:['management','procurement','customer'],policyType:'MAINBIZ',kind:'DOMESTIC',url:'https://www.smes.go.kr/mainbiz/usr/mainbizInfo/descriptMainbiz.do',review:'온라인 자가진단과 현장평가가 필요합니다. 업종·체납·재무·법령 위반 등 최신 제외 조건을 별도로 대조해야 합니다.'},
 {id:'RESEARCH_LAB',name:'기업부설연구소',summary:'규모별 전담인력·공간·연구활동 체계 검토',goals:['research','investment'],policyType:'RESEARCH',kind:'DOMESTIC',url:'https://www.rnd.or.kr/user/newly/requirements.do',review:'인력의 학력·경력·상근/전담 여부, 공간·기자재·업종과 특례 적용을 실제 증빙으로 확인해야 합니다.'},
 {id:'RESEARCH_DEPARTMENT',name:'연구개발전담부서',summary:'연구전담요원 1명 이상을 갖춘 연구부서 검토',goals:['research'],policyType:'RESEARCH',kind:'DOMESTIC',url:'https://www.rnd.or.kr/user/newly/requirements.do',review:'전담요원 수 외에도 자격·공간·기자재·연구 외 업무를 담당할 상시 직원 등의 요건을 확인해야 합니다.'},
].map(c=>({...c,reviewedAt:REVIEWED_AT,sourceVersion:CURATION_VERSION}));
export function preparationDocuments(id){const c=CERTIFICATIONS.find(c=>c.id===id);return (policyCatalog.types[c?.policyType]?.documents||[]).map(d=>({...d,sourceUrl:policyCatalog.types[c.policyType].url,sourceVersion:policyCatalog.version}));}
export const STATUS_LABELS={priority:'우선 검토',candidate:'검토 후보',missing:'정보 보완',conditions:'조건 준비',held:'보유 기록',renewal:'갱신 검토'};
