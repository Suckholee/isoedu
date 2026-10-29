import {unzipSync,strFromU8,inflateSync} from 'fflate';
import {dateCandidates} from './documentDateCandidates.mjs';
const MAX_BYTES=50*1024*1024,MAX_PAGES=60,MAX_TEXT=3_000_000;
function officeUnits(bytes,ext,warnings){
 let total=0;const archive=unzipSync(bytes,{filter:file=>{const selected=ext==='docx'?/^word\/(document|header\d+|footer\d+)\.xml$/.test(file.name):ext==='hwpx'?/^Contents\/section\d+\.xml$/.test(file.name):/^xl\/(sharedStrings|styles|workbook|worksheets\/sheet\d+)\.xml$/.test(file.name);if(selected){total+=file.originalSize;if(total>MAX_TEXT*4)throw Error('본문 크기가 너무 큽니다. PDF로 변환해 확인해 주세요.');}return selected;}});
 const units=[];
 for(const [name,data]of Object.entries(archive)){
  const doc=new DOMParser().parseFromString(strFromU8(data),'application/xml');
  if(doc.querySelector('parsererror'))throw Error('손상된 문서 XML입니다.');
  if(ext==='xlsx')continue;
  const paragraphs=[...doc.getElementsByTagName('*')].filter(n=>n.localName==='p');
  const text=paragraphs.map(p=>[...p.getElementsByTagName('*')].filter(n=>n.localName==='t').map(n=>n.textContent).join('')).join('\n');
  units.push({location:name,text,method:'text'});
 }
 if(ext==='xlsx'){
  const strings=archive['xl/sharedStrings.xml']?new DOMParser().parseFromString(strFromU8(archive['xl/sharedStrings.xml']),'application/xml'):null;
  const shared=strings?[...strings.getElementsByTagName('si')].map(n=>n.textContent):[];
  const styles=archive['xl/styles.xml']?new DOMParser().parseFromString(strFromU8(archive['xl/styles.xml']),'application/xml'):null;
  const custom=new Map(styles?[...styles.getElementsByTagName('numFmt')].map(n=>[Number(n.getAttribute('numFmtId')),n.getAttribute('formatCode')]):[]);
  const dateStyles=styles?[...styles.getElementsByTagName('cellXfs')[0]?.children||[]].map(n=>{const id=Number(n.getAttribute('numFmtId')),format=(custom.get(id)||'').replace(/"[^"]*"|\\./g,'');return id>=14&&id<=22||id>=27&&id<=36||id>=50&&id<=58||/[yd]/i.test(format)&&/[md]/i.test(format);}):[];
  const workbook=archive['xl/workbook.xml']?new DOMParser().parseFromString(strFromU8(archive['xl/workbook.xml']),'application/xml'):null;
  const epoch1904=['1','true'].includes(workbook?.getElementsByTagName('workbookPr')[0]?.getAttribute('date1904'));
  for(const [name,data]of Object.entries(archive))if(name.includes('worksheets/')){
   const doc=new DOMParser().parseFromString(strFromU8(data),'application/xml');
   const text=[...doc.getElementsByTagName('row')].map(row=>[...row.getElementsByTagName('c')].map(c=>{const value=c.getElementsByTagName('v')[0]?.textContent||c.getElementsByTagName('is')[0]?.textContent||'';if(c.getAttribute('t')==='s')return shared[Number(value)]||'';if(dateStyles[Number(c.getAttribute('s'))]&&/^\d+(?:\.\d+)?$/.test(value)){const serial=Number(value);if(serial>0&&serial<100000)return new Date(Date.UTC(epoch1904?1904:1899,epoch1904?0:11,epoch1904?1:30)+Math.floor(serial)*86400000).toISOString().slice(0,10);}return value;}).join(' ')).join('\n');
   units.push({location:name,text,method:'text'});
  }
  warnings.push('엑셀의 날짜 서식 셀을 변환했습니다. 도형·삽입 이미지와 사용자 지정 서식은 원문과 대조해 주세요.');
 }
 warnings.push('문서에 삽입된 이미지와 도형 안의 글자는 본문 추출에 포함되지 않을 수 있습니다. 스캔 자료는 PDF·이미지로 올려 주세요.');
 return units;
}
async function hwpUnits(bytes,warnings){
 const CFB=await import('cfb');const cfb=CFB.read(bytes,{type:'array'}),find=name=>cfb.FileIndex.find((f,i)=>cfb.FullPaths[i].endsWith('/'+name));
 const header=find('FileHeader');if(!header)throw Error('HWP 헤더를 확인하지 못했습니다.');const flags=new DataView(Uint8Array.from(header.content).buffer).getUint32(36,true);if(flags&2||flags&4)throw Error('암호화·배포용 HWP는 PDF로 변환해 주세요.');
 const units=[];let size=0;
 for(let i=0;i<cfb.FileIndex.length;i++)if(/\/BodyText\/Section\d+$/.test(cfb.FullPaths[i])){
  const source=Uint8Array.from(cfb.FileIndex[i].content);const body=flags&1?inflateSync(source,{out:new Uint8Array(MAX_TEXT*4)}):source;size+=body.length;if(size>=MAX_TEXT*4)throw Error('HWP 본문 크기 제한을 넘었습니다. PDF로 변환해 주세요.');
  const dv=new DataView(body.buffer,body.byteOffset,body.byteLength),paragraphs=[];let pos=0;
  while(pos+4<=body.length){const tag=dv.getUint32(pos,true);pos+=4;let len=tag>>>20;if(len===4095){if(pos+4>body.length)break;len=dv.getUint32(pos,true);pos+=4;}if(pos+len>body.length)throw Error('손상된 HWP 본문입니다.');
   if((tag&1023)===67){let text='';for(let j=0;j+1<len;){const c=dv.getUint16(pos+j,true);if(c===10||c===13){text+='\n';j+=2;}else if(c===9){text+=' ';j+=16;}else if(c<32)j+=[1,2,3,11,12,14,15,16,17,18,19,20,21,22,23].includes(c)?16:2;else{text+=String.fromCharCode(c);j+=2;}}paragraphs.push(text);}
   pos+=len;
  }
  units.push({location:cfb.FullPaths[i],text:paragraphs.join('\n'),method:'text'});
 }
 warnings.push('HWP 삽입 이미지·도형의 글자는 확인하지 못할 수 있습니다. 스캔 내용은 PDF로 변환해 주세요.');return units;
}
export async function readDocumentDates(file,{signal,onProgress=()=>{}}={}){
 if(file.size>MAX_BYTES)throw Error('자동 읽기는 50MB 이하 문서를 지원합니다.');
 const cancelled=()=>{if(signal?.aborted)throw new DOMException('취소됨','AbortError');};cancelled();
 const warnings=[],units=[];let worker,pdf;const bytes=new Uint8Array(await file.arrayBuffer()),ext=file.name.split('.').pop().toLowerCase();
 const ocr=async(image,location)=>{cancelled();onProgress(`${location} 글자 인식 중`);if(!worker){const {createWorker}=await import('tesseract.js');worker=await createWorker('kor+eng',1,{workerPath:'/document-reader/worker.min.js',corePath:'/document-reader',langPath:'/document-reader',gzip:true,workerBlobURL:false,logger:()=>{}});cancelled();}
  const result=await worker.recognize(image);cancelled();return {location,text:result.data.text,method:'ocr',confidence:result.data.confidence};};
 const abort=()=>{worker?.terminate().catch(()=>{});pdf?.destroy().catch(()=>{});};signal?.addEventListener('abort',abort,{once:true});
 try{
  if(ext==='pdf'){
   const lib=await import('pdfjs-dist/build/pdf.mjs');lib.GlobalWorkerOptions.workerSrc='/document-reader/pdf.worker.min.mjs';
   const task=lib.getDocument({data:bytes,isEvalSupported:false,cMapUrl:'/document-reader/cmaps/',cMapPacked:true,standardFontDataUrl:'/document-reader/standard_fonts/'});pdf=await task.promise;cancelled();
   if(pdf.numPages>MAX_PAGES)warnings.push(`전체 ${pdf.numPages}쪽 중 앞 ${MAX_PAGES}쪽만 읽었습니다. 나머지 원문을 확인해 주세요.`);
   for(let i=1;i<=Math.min(pdf.numPages,MAX_PAGES);i++){
    cancelled();onProgress(`${i}/${pdf.numPages}쪽 읽는 중`);const page=await pdf.getPage(i),content=await page.getTextContent();
    let previousY,text='';for(const item of content.items){if(!('str'in item))continue;const y=item.transform[5];text+=(previousY!==undefined&&Math.abs(previousY-y)>4?'\n':' ')+item.str;previousY=y;if(item.hasEOL){text+='\n';previousY=undefined;}}
    units.push({location:`${i}쪽`,text,method:'text'});
    // OCR also runs on pages containing raster images even when a text layer exists.
    const ops=await page.getOperatorList(),raster=ops.fnArray.some(op=>[lib.OPS.paintImageXObject,lib.OPS.paintInlineImageXObject,lib.OPS.paintImageMaskXObject].includes(op));
    if(text.replace(/\s/g,'').length<40||raster){const viewport=page.getViewport({scale:Math.min(2,2400/Math.max(page.view[2],page.view[3]))}),canvas=document.createElement('canvas');canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);await page.render({canvasContext:canvas.getContext('2d'),viewport}).promise;units.push(await ocr(canvas,`${i}쪽 (스캔)`));canvas.width=canvas.height=0;}
    page.cleanup();if(units.reduce((n,u)=>n+u.text.length,0)>MAX_TEXT){warnings.push('본문 크기 제한으로 이후 페이지는 읽지 못했습니다.');break;}
   }
  }else if(['png','jpg','jpeg'].includes(ext)){const url=URL.createObjectURL(file);try{units.push(await ocr(url,'이미지 원문'));}finally{URL.revokeObjectURL(url);}}
  else if(['docx','xlsx','hwpx'].includes(ext))units.push(...officeUnits(bytes,ext,warnings));
  else if(ext==='hwp')units.push(...await hwpUnits(bytes,warnings));
  else throw Error('이 형식의 자동 읽기는 지원하지 않습니다. PDF·이미지·HWP/HWPX·DOCX·XLSX로 올려 주세요. 원본 보관은 유지됩니다.');
  cancelled();if(!units.some(u=>u.text.trim()))throw Error('날짜를 확인할 본문을 읽지 못했습니다. 원문을 열어 확인해 주세요.');
  const result=dateCandidates(units,{warnings});return {...result,sourceName:file.name,sourceHash:[...new Uint8Array(await crypto.subtle.digest('SHA-256',await file.arrayBuffer()))].map(b=>b.toString(16).padStart(2,'0')).join(''),readAt:new Date().toISOString()};
 }finally{signal?.removeEventListener('abort',abort);if(worker)await worker.terminate().catch(()=>{});if(pdf)await pdf.destroy().catch(()=>{});}
}
