import sys,zipfile,html,re,base64,mimetypes
import xml.etree.ElementTree as E
from pathlib import Path
escape=html.escape
name=lambda e:e.tag.rsplit('}',1)[-1]
images={}
def text(el):return ''.join(t.text or '' for t in el.iter() if name(t)=='t')
def paragraph(p):
 parts=[]
 for r in list(p):
  if name(r)=='run':
   for c in list(r):
    if name(c)=='t':parts.append(escape(c.text or ''))
    elif name(c)=='tbl':parts.append(table(c))
    elif name(c)=='lineBreak':parts.append('<br>')
    else:
     for pic in c.iter():
      ref=pic.get('binaryItemIDRef')
      if ref and ref in images:parts.append('<img style="max-width:100%" src="'+images[ref]+'">')
 return '<div class="paragraph">'+''.join(parts)+'</div>'
def table(tbl):
 rows=[]
 for tr in list(tbl):
  if name(tr)!='tr':continue
  cells=[]
  for tc in list(tr):
   if name(tc)!='tc':continue
   span=next((x for x in list(tc) if name(x)=='cellSpan'),None)
   cs=max(1,min(100,int(span.get('colSpan','1')))) if span is not None else 1
   rs=max(1,min(100,int(span.get('rowSpan','1')))) if span is not None else 1
   paras=[]
   for sub in list(tc):
    if name(sub)=='subList':paras.extend(paragraph(p) for p in list(sub) if name(p)=='p')
   cells.append(f'<td colspan="{cs}" rowspan="{rs}">'+''.join(paras)+'</td>')
  rows.append('<tr>'+''.join(cells)+'</tr>')
 return '<table>'+''.join(rows)+'</table>'
with zipfile.ZipFile(sys.argv[1]) as z:
 for n in z.namelist():
  if n.startswith('BinData/') and Path(n).suffix.lower() in ['.png','.jpg','.jpeg','.gif','.bmp','.webp'] and z.getinfo(n).file_size<20*1024*1024:
   images[Path(n).stem]='data:'+str(mimetypes.guess_type(n)[0] or 'image/png')+';base64,'+base64.b64encode(z.read(n)).decode()
 sections=[]
 for n in sorted(z.namelist()):
  if re.fullmatch(r'Contents/section\d+\.xml',n):
   if z.getinfo(n).file_size>20*1024*1024:raise ValueError('section too large')
   root=E.fromstring(z.read(n));sections.append('<section>'+''.join(paragraph(p) for p in list(root) if name(p)=='p')+'</section>')
 if not sections:raise ValueError('no sections')
 Path(sys.argv[2]).write_text('<!doctype html><html lang="ko"><meta charset="utf-8"><style>body{background:#e9edf3;margin:0;padding:20px;font:14px/1.6 sans-serif}section{background:white;max-width:800px;margin:0 auto 20px;padding:40px;box-shadow:0 1px 6px #aaa}.paragraph{white-space:pre-wrap;min-height:1em;margin:3px 0}table{border-collapse:collapse;width:100%;margin:10px 0}td{border:1px solid #555;padding:6px;vertical-align:top}</style>'+''.join(sections)+'</html>',encoding='utf8')
