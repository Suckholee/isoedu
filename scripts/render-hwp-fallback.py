import sys,tempfile,base64,mimetypes
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'data/client-drive/pythonlibs'))
from hwp5.hwp5html import main
from lxml import etree as E
source,output=sys.argv[1:3]
with tempfile.TemporaryDirectory(prefix='isoedu-hwp-') as tmp:
 dest=Path(tmp)/'rendered';sys.argv=['hwp5html','--output',str(dest),source];main()
 doc=E.parse(str(dest/'index.xhtml'))
 for node in doc.xpath('//*[local-name()="link"]'):
  href=node.get('href','');p=dest/href
  if href and p.is_file() and dest in p.resolve().parents:
   style=E.Element('style');style.text=p.read_text();node.getparent().replace(node,style)
 for node in doc.xpath('//*[local-name()="img"]'):
  src=node.get('src','');p=dest/src
  if src and p.is_file() and dest in p.resolve().parents:node.set('src','data:'+str(mimetypes.guess_type(p.name)[0] or 'image/png')+';base64,'+base64.b64encode(p.read_bytes()).decode())
 Path(output).write_bytes(E.tostring(doc,encoding='utf-8',method='html'))
