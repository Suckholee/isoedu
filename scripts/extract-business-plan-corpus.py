# -*- coding: utf-8 -*-
"""Local, read-only source extraction. Optional olefile dependency for HWP/PPT."""
import sys,json,zipfile,struct,zlib,re,subprocess,unicodedata,logging
from pathlib import Path
import xml.etree.ElementTree as E
sys.path.insert(0,'/tmp/isoedu-analysis-deps')
import olefile
from pypdf import PdfReader
logging.getLogger('pypdf').setLevel(logging.ERROR)
root=Path(__file__).resolve().parents[1]
m=json.loads((root/'docs/reference/business-plan-case-files.json').read_text())
out=root/'data/business-plan-corpus';out.mkdir(parents=True,exist_ok=True)
index=[]
def hwp(p):
 with olefile.OleFileIO(p) as o:
  header=o.openstream('FileHeader').read(); flags=struct.unpack_from('<I',header,36)[0]
  if flags&2:raise ValueError('Encrypted HWP')
  result=[]
  for n in sorted(o.listdir(),key=lambda x:'/'.join(x)):
   if n[0]=='BodyText' and n[-1].startswith('Section'):
    b=o.openstream(n).read()
    if flags&1:b=zlib.decompress(b,-15)
    pos=0;paras=[]
    while pos+4<=len(b):
     value=struct.unpack_from('<I',b,pos)[0];pos+=4;tag=value&1023;size=value>>20
     if size==4095:size=struct.unpack_from('<I',b,pos)[0];pos+=4
     chunk=b[pos:pos+size];pos+=size
     if tag==67:
      codes=list(struct.unpack('<'+'H'*(len(chunk)//2),chunk[:len(chunk)//2*2]));clean=[];j=0
      while j<len(codes):
       c=codes[j]
       if c in [9,10,13]:clean.append(' ' if c==9 else '\n');j+=1
       elif c<32:j+=8 if c in [1,2,3,11,12,14,15,16,17,18,19,20,21,22,23] else 1
       else:clean.append(chr(c));j+=1
      paras.append(''.join(clean))
    result.append({'location':'/'.join(n),'text':'\n'.join(paras)})
  return result
for i,f in enumerate(m['files'],1):
 p=Path(m['destination'])/f['file'];suf=p.suffix.lower();units=[];error=None;method=suf
 try:
  if suf=='.hwp':units=hwp(p)
  elif suf=='.pdf':
   d=PdfReader(p);units=[{'location':'page '+str(j+1),'text':page.extract_text() or ''} for j,page in enumerate(d.pages)]
  elif suf in ['.docx','.hwpx','.pptx']:
   with zipfile.ZipFile(p) as z:
    names=[n for n in z.namelist() if n=='word/document.xml' or re.match(r'word/(header|footer|footnotes|endnotes)\d*\.xml$',n) or re.match(r'Contents/section\d+.xml$',n) or re.match(r'ppt/(slides/slide|notesSlides/notesSlide)\d+.xml$',n)]
    names.sort(key=lambda n:(re.sub(r'\d+','',n),int(re.search(r'\d+',n)[0]) if re.search(r'\d+',n) else 0))
    for n in names:
     tree=E.fromstring(z.read(n));paras=[]
     for el in tree.iter():
      if el.tag.endswith('}p'):paras.append(' '.join(t.text or '' for t in el.iter() if t.tag.endswith('}t')))
     units.append({'location':n,'text':'\n'.join(paras)})
  elif suf=='.doc':
   r=subprocess.run(['/usr/bin/textutil','-convert','txt','-stdout',str(p)],capture_output=True,timeout=60)
   if r.returncode:raise ValueError(r.stderr.decode(errors='replace')[:200])
   units=[{'location':'document','text':r.stdout.decode('utf-8',errors='replace')}]
  elif suf=='.ppt':
   with olefile.OleFileIO(p) as o:b=o.openstream('PowerPoint Document').read()
   texts=[]
   def walk(b):
    pos=0
    while pos+8<=len(b):
     ver,typ,size=struct.unpack_from('<HHI',b,pos);pos+=8;c=b[pos:pos+size];pos+=size
     if typ==4000:texts.append(c.decode('utf-16le',errors='replace'))
     elif typ==4008:texts.append(c.decode('cp1252',errors='replace'))
     elif ver&15==15:walk(c)
   walk(b);units=[{'location':'PowerPoint text records','text':'\n'.join(texts)}]
  else:raise ValueError('Unsupported format')
 except Exception as e:error=str(e)
 for x in units:x['text']=x['text'].encode('utf-16','surrogatepass').decode('utf-16','replace')
 chars=sum(len(x['text'].strip()) for x in units);weak=[x['location'] for x in units if len(x['text'].strip())<80]
 key='case-%03d'%i
 data={'id':key,'source':str(p),'sha256':f['sha256'],'label':unicodedata.normalize('NFC',f['file']).split('__')[0],'method':method,'units':units,'characters':chars,'weakUnits':weak,'error':error,'coverage':'all extractable text units; embedded images and layout not verified'}
 (out/(key+'.json')).write_text(json.dumps(data,ensure_ascii=False,indent=2))
 (out/(key+'.txt')).write_text('\n\n'.join('['+x['location']+']\n'+x['text'] for x in units))
 index.append({k:v for k,v in data.items() if k!='units'})
 print(key,suf,chars,'weak',len(weak),'error',bool(error),flush=True)
(out/'index.json').write_text(json.dumps(index,ensure_ascii=False,indent=2)+'\n')
