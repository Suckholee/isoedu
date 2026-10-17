# -*- coding: utf-8 -*-
import sys,json,zipfile,re,struct,zlib,subprocess
from pathlib import Path
import xml.etree.ElementTree as E
sys.path.insert(0,'/tmp/isoedu-analysis-deps')
p=Path(sys.argv[1]);kind=sys.argv[2];units=[]
if kind=='PDF':
 from pypdf import PdfReader
 units=[{'location':'page '+str(i+1),'text':page.extract_text() or ''} for i,page in enumerate(PdfReader(p).pages)]
elif kind in ['DOCX','HWPX','PPTX']:
 with zipfile.ZipFile(p) as z:
  for n in sorted(z.namelist()):
   if n=='word/document.xml' or re.match(r'Contents/section\d+.xml$',n) or re.match(r'ppt/slides/slide\d+.xml$',n):
    if z.getinfo(n).file_size>20*1024*1024:raise ValueError('XML too large')
    tree=E.fromstring(z.read(n));text='\n'.join(' '.join(t.text or '' for t in el.iter() if t.tag.endswith('}t')) for el in tree.iter() if el.tag.endswith('}p'));units.append({'location':n,'text':text})
elif kind=='DOC':
 r=subprocess.run(['/usr/bin/textutil','-convert','txt','-stdout',str(p)],capture_output=True,check=True,timeout=30);units=[{'location':'document','text':r.stdout.decode('utf-8',errors='replace')}]
elif kind=='HWP':
 import olefile
 with olefile.OleFileIO(p) as o:
  flags=struct.unpack_from('<I',o.openstream('FileHeader').read(),36)[0]
  if flags&2:raise ValueError('Encrypted HWP')
  for n in sorted(o.listdir()):
   if n[0]!='BodyText':continue
   data=o.openstream(n).read();data=zlib.decompress(data,-15) if flags&1 else data;pos=0;paras=[]
   while pos+4<=len(data):
    v=struct.unpack_from('<I',data,pos)[0];pos+=4;tag=v&1023;size=v>>20
    if size==4095:size=struct.unpack_from('<I',data,pos)[0];pos+=4
    b=data[pos:pos+size];pos+=size
    if tag==67:
     codes=list(struct.unpack('<'+'H'*(len(b)//2),b[:len(b)//2*2]));chars=[];j=0
     while j<len(codes):
      c=codes[j]
      if c in [9,10,13]:chars.append(' ' if c==9 else '\n');j+=8 if c==9 else 1
      elif c<32:j+=8 if c in [1,2,3,11,12,14,15,16,17,18,19,20,21,22,23] else 1
      else:chars.append(chr(c));j+=1
     paras.append(''.join(chars).encode('utf-16','surrogatepass').decode('utf-16','replace'))
   units.append({'location':'/'.join(n),'text':'\n'.join(paras)})
else:raise ValueError('No text converter for this format')
print(json.dumps({'units':units},ensure_ascii=False))
