# -*- coding: utf-8 -*-
import json,re,subprocess,tempfile
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor,as_completed
root=Path(__file__).resolve().parents[1];out=root/'data/business-plan-corpus'
index=json.loads((out/'index.json').read_text())
def process(task):
 source,i,unit=task;original=unit['text'];bad=bool(re.search('[À-ÿ]{3,}',original))
 try:
  with tempfile.TemporaryDirectory(prefix='isoedu-ocr-') as temp:
   prefix=temp+'/page';r=subprocess.run(['pdftoppm','-f',str(i),'-l',str(i),'-scale-to','2000','-png','-singlefile',source,prefix],capture_output=True,timeout=60)
   if r.returncode:raise ValueError('PDF render failed')
   r=subprocess.run(['/tmp/isoedu-ocr',prefix+'.png'],capture_output=True,timeout=90)
   if r.returncode:raise ValueError(r.stderr.decode(errors='replace')[:250])
   text=r.stdout.decode(errors='replace').strip();unit.update({'originalText':original,'text':text if len(text)>len(original) or bad else original,'ocrText':text,'ocrStatus':'processed','ocrEngine':'Apple Vision ko-KR/en-US; visual verification pending'})
 except Exception as e:unit['ocrError']=str(e)
 return i,unit
with ThreadPoolExecutor(max_workers=4) as pool:
 for entry in index:
  if entry['method']!='.pdf':continue
  p=out/(entry['id']+'.json');d=json.loads(p.read_text());tasks=[]
  for i,unit in enumerate(d['units'],1):
   if (len(unit['text'].strip())<80 or re.search('[À-ÿ]{3,}',unit['text'])) and unit.get('ocrStatus')!='processed':tasks.append((d['source'],i,unit))
  for future in as_completed([pool.submit(process,t) for t in tasks]):
   i,unit=future.result();d['units'][i-1]=unit
   p.write_text(json.dumps(d,ensure_ascii=False,indent=2))
   print(entry['id'],i,'ocr chars',len(unit.get('ocrText','')),'error',unit.get('ocrError',''),flush=True)
  d['characters']=sum(len(u['text'].strip()) for u in d['units']);d['weakUnits']=[u['location'] for u in d['units'] if len(u['text'].strip())<80]
  p.write_text(json.dumps(d,ensure_ascii=False,indent=2));(out/(entry['id']+'.txt')).write_text('\n\n'.join('['+u['location']+']\n'+u['text'] for u in d['units']))
  entry.update({k:d[k] for k in ['characters','weakUnits']});(out/'index.json').write_text(json.dumps(index,ensure_ascii=False,indent=2)+'\n')
