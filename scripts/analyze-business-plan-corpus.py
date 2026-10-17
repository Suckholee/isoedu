# -*- coding: utf-8 -*-
from pathlib import Path
from collections import Counter,defaultdict
import json,re,hashlib
root=Path(__file__).resolve().parents[1];out=root/'data/business-plan-corpus';index=json.loads((out/'index.json').read_text());docs=[];hashes=defaultdict(list)
patterns={'검토표시':r'확인\s*필요|확인\s*필','작성지시':r'챗\s*gpt|ChatGPT|입력해\s*주세요|작성해\s*주세요','입력자리':r'_{4,}|\[고객사명 입력\]|\[대표자명 입력\]','목표와계획':r'목표|예정|계획','증빙언급':r'증빙|확인서|증명서|등록증','정산과변경':r'정산|협약변경|승인요청'}
for entry in index:
 d=json.loads((out/(entry['id']+'.json')).read_text());text=(out/(entry['id']+'.txt')).read_text();lines=text.splitlines();flags={}
 for kind,pat in patterns.items():
  found=[{'line':i+1,'text':l[:220]} for i,l in enumerate(lines) if re.search(pat,l,re.I)]
  if found:flags[kind]={'occurrences':len(found),'examples':found[:4]}
 cues=[]
 for i,l in enumerate(lines):
  if re.search(r'창업아이템명|신청기술\s*\(제품/서비스\)명|기술사업\(제품\)명|기술\(제품\)명|아이템 개요|과제명|주요 제품은|● 기존 시장|● 당사에서',l):
   s=' '.join(x.strip() for x in lines[i:i+8] if x.strip())[:500]
   if not re.search(r'OO기술|신청기술\(제품/서비스\)명 : _|기술사업\(제품\)명 ◈|작성요령',s):cues.append({'line':i+1,'text':s})
  if len(cues)>=8:break
 hashes[entry['sha256']].append(entry['id'])
 docs.append({**entry,'textFile':str(out/(entry['id']+'.txt')),'unitCount':len(d['units']),'ocrPages':sum(u.get('ocrStatus')=='processed' for u in d['units']),'ocrErrors':[u['location'] for u in d['units'] if u.get('ocrError')],'flags':flags,'businessCues':cues,'reviewStatus':'전체 추출 텍스트 검색·후보 분석; 전체 도표 시각 검토 미완료'})
summary={'documents':len(docs),'textAvailableDocuments':sum(x['characters']>100 for x in docs),'characters':sum(x['characters'] for x in docs),'formats':dict(Counter(x['method'] for x in docs)),'textUnits':sum(x['unitCount'] for x in docs),'ocrPages':sum(x['ocrPages'] for x in docs),'ocrErrors':sum(len(x['ocrErrors']) for x in docs),'exactDuplicateGroups':[v for v in hashes.values() if len(v)>1],'flagDocumentCounts':{k:sum(k in x['flags'] for x in docs) for k in patterns},'documentsData':docs}
(out/'analysis-index.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n')
profiles=json.loads((root/'docs/reference/customer-candidates.json').read_text());group=defaultdict(list)
for d in docs:group[d['label']].append(d)
md='# 고객 후보별 문서 본문 근거\n\n2026년 10월 18일. 회사명은 기존 65개 원본 묶음 기준이며 법인 동일성 및 현재 계약 여부를 확정하지 않는다. 아래 사업 설명은 본문에서 추출한 후보 문장으로, 계획·추정·양식 안내를 포함할 수 있다. 원문 귀속과 사실 여부 검토가 필요하다.\n\n'
for c in profiles['customers']:
 g=group[c['sourceLabel']];md+='## '+c['candidateName']+'\n\n'+str(len(g))+'개 문서. '+(c['note'] or '법인명과 현재 고객 여부는 미확인.')+'\n\n'
 for d in g:
  md+='- **'+d['id']+'** '+Path(d['source']).name.split('__')[-1]+' — '+str(d['characters'])+'자, '+str(d['unitCount'])+'개 추출 단위, OCR '+str(d['ocrPages'])+'쪽. [본문]('+d['textFile']+')\n'
  if d['businessCues']:
   cue=d['businessCues'][0];s=cue['text'];s=re.sub(r'[\w.+-]+@[\w.-]+','[이메일 생략]',s);s=re.sub(r'\b\d{2,6}-\d{2,7}-?\d{0,7}\b','[식별번호 생략]',s)
   md+='\n  본문 후보: '+s[:350]+' ([근거]('+d['textFile']+':'+str(cue['line'])+'))\n\n'
  if d['flags'].get('검토표시') or d['flags'].get('작성지시') or d['flags'].get('입력자리'):md+='\n  검토할 표현 존재: '+', '.join(k for k in ['검토표시','작성지시','입력자리'] if k in d['flags'])+'. 양식 안내인지 미작성 내용인지 원문 확인 필요.\n\n'
(root/'docs/reference/customer-document-evidence.md').write_text(md)
print(json.dumps({k:v for k,v in summary.items() if k!='documentsData'},ensure_ascii=False,indent=2))
