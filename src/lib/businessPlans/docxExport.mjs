import {zipSync,strToU8} from 'fflate';
import {parsePlanForm} from '../venture/planForm.mjs';
import {parsePlanSubfields} from '../venture/planSubfields.mjs';
import {definitionForAi} from '../venture/catalog.mjs';
import {readDocumentFields} from '../venture/documentFields.mjs';
export const DOCX_MIME='application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const esc=value=>String(value??'').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&apos;');
const W='http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const R='http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const PACKAGE='http://schemas.openxmlformats.org/package/2006/relationships';
const WIDTH=9864;
const xml=body=>'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+body;
function paragraph(text,{style='Normal',bold=false,keep=false,size,align}={}){
 return `<w:p><w:pPr><w:pStyle w:val="${style}"/>${keep?'<w:keepNext/>':''}${align?`<w:jc w:val="${align}"/>`:''}</w:pPr><w:r><w:rPr>${bold?'<w:b/>':''}${size?`<w:sz w:val="${size}"/>`:''}</w:rPr>${String(text??'').split('\n').map((line,i)=>(i?'<w:br/>':'')+`<w:t xml:space="preserve">${esc(line)}</w:t>`).join('')}</w:r></w:p>`;
}
const paragraphs=(text,opts={})=>String(text??'').split(/\n\s*\n/).map(t=>paragraph(t,opts)).join('');
function table(rows,widths,{header=false}={}){
 const total=widths.reduce((a,b)=>a+b,0);if(total!==WIDTH||rows.some(row=>row.length!==widths.length))throw Error('표 열 구성을 확인해 주세요.');
 return `<w:tbl><w:tblPr><w:tblW w:w="${WIDTH}" w:type="dxa"/><w:tblLayout w:type="fixed"/><w:tblBorders>${['top','left','bottom','right','insideH','insideV'].map(k=>`<w:${k} w:val="single" w:sz="4" w:color="D9D9D9"/>`).join('')}</w:tblBorders><w:tblCellMar><w:top w:w="110" w:type="dxa"/><w:left w:w="120" w:type="dxa"/><w:bottom w:w="110" w:type="dxa"/><w:right w:w="120" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>${widths.map(w=>`<w:gridCol w:w="${w}"/>`).join('')}</w:tblGrid>${rows.map((row,i)=>`<w:tr>${header&&i===0?'<w:trPr><w:tblHeader/></w:trPr>':''}${row.map((cell,j)=>`<w:tc><w:tcPr><w:tcW w:w="${widths[j]}" w:type="dxa"/><w:vAlign w:val="center"/>${header&&i===0?'<w:shd w:fill="EAF0F6"/>':''}</w:tcPr>${paragraphs(cell,{style:'TableText',bold:header&&i===0})}</w:tc>`).join('')}</w:tr>`).join('')}</w:tbl>${paragraph('')}`;
}
function columnWidths(columns,rows){
 const weights=columns.map((c,i)=>Math.min(3.5,Math.max(1,Math.sqrt(Math.max(String(c).length,...rows.map(r=>String(r[i]??'').length)))/3)));
 const sum=weights.reduce((a,b)=>a+b,0),widths=weights.map(w=>Math.floor(WIDTH*w/sum));widths[widths.length-1]+=WIDTH-widths.reduce((a,b)=>a+b,0);return widths;
}
function decodePng(uri){
 if(typeof uri!=='string'||!/^data:image\/png;base64,/.test(uri))throw Error('문서에 넣을 이미지가 준비되지 않았습니다. 다운로드를 다시 시도해 주세요.');
 const raw=atob(uri.split(',')[1]),bytes=Uint8Array.from(raw,c=>c.charCodeAt(0));
 if(bytes.length<24||bytes.length>30*1024*1024||[137,80,78,71,13,10,26,10].some((v,i)=>bytes[i]!==v))throw Error('내보낼 이미지 형식을 확인해 주세요.');
 const view=new DataView(bytes.buffer),width=view.getUint32(16),height=view.getUint32(20);if(!width||!height||width*height>50000000)throw Error('내보낼 이미지 크기를 확인해 주세요.');return {bytes,width,height};
}
export function buildPlanDocx(doc,{companyName='',visualImages={}}={}){
 if(!doc?.title||typeof doc.contentDraft!=='string'||!doc.contentDraft.trim())throw Error('저장된 사업계획서 본문이 없습니다.');
 const files={},rels=[['rStyles',R+'/styles','styles.xml'],['rFooter',R+'/footer','footer1.xml']];let imageNo=0;
 const draw=(v)=>{const {bytes,width,height}=decodePng(visualImages[v.id]);imageNo++;const rid='rImage'+imageNo,name=`image${imageNo}.png`;files['word/media/'+name]=bytes;rels.push([rid,R+'/image','media/'+name]);const scale=Math.min(WIDTH*635/width,4200000/height);const cx=Math.round(width*scale),cy=Math.round(height*scale);return `<w:p><w:pPr><w:jc w:val="center"/><w:keepNext/></w:pPr><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="${imageNo}" name="${name}" descr="${esc(v.title)}"/><wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="${imageNo}" name="${name}" descr="${esc(v.title)}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${rid}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`;};
 const visual=v=>{
  let result=paragraph(v.title,{style:'Heading2',keep:true})+paragraph(({fact:'실적·확인값',plan:'계획안',reference:'참고 자료'})[v.basis]||'확인 필요',{style:'Caption',keep:true});
  if(v.type==='table')result+=table([v.columns,...v.rows],columnWidths(v.columns,v.rows),{header:true});else result+=draw(v);
  result+=paragraphs(v.caption,{style:'Caption'})+paragraphs('출처: '+v.source,{style:'Caption'});
  if(['bar','line'].includes(v.type))result+=table([['항목',`값 (${v.unit})`,'수치 근거'],...v.points.map(p=>[p.label,String(p.value),p.evidence])],[2300,1500,6064],{header:true});
  if(v.type==='diagram')result+=v.nodes.map((n,i)=>paragraph(`${i+1}. ${n}`,{style:'Caption'})).join('');return result;
 };
 const ai=doc.ai||{},def=definitionForAi(ai),fields=readDocumentFields(ai),visuals=ai.visuals||[];
 const parsed=parsePlanForm(doc.contentDraft,ai.input?.type||'business_plan',def);
 let body=paragraph(def?.title||doc.title,{style:'Title'})+paragraph('신청 준비용 · 저장한 본문과 시각 자료',{style:'Caption'})+table([
 ['기업명',fields.companyName||companyName||'[확인 필요]','신청 구분',({new:'신규 신청',renewal:'재확인 신청',unknown:'확인 필요'})[fields.application]||'확인 필요'],
 ['대표자',fields.representativeName||'[확인 필요]','사업자등록번호',fields.businessNumber||'[확인 필요]'],
 ['문서 번호',doc.code||'—','수정·검토',`수정 ${doc.revisionNo||1} · ${ai.review?.reviewed?'내부 검토 기록 있음':'검토 전'}`]
 ],[2100,2832,2100,2832]);
 const used=new Set();
 if(parsed){if(parsed.preamble.trim())body+=paragraphs(parsed.preamble);for(const s of parsed.sections){body+=paragraph(s.title,{style:'Heading1',keep:true});const fields=parsePlanSubfields(s);body+=table(fields.map(f=>[f.label,f.value||`[확인 필요: ${f.label}]`]),[1800,8064]);for(const v of visuals.filter(v=>v.sectionId===s.id)){body+=visual(v);used.add(v.id);}}}
 else body+=paragraphs(doc.contentDraft);
 // Never silently omit a saved visual when section headings have been edited.
 const remaining=visuals.filter(v=>!used.has(v.id));if(remaining.length){body+=paragraph('보완 시각 자료',{style:'Heading1',keep:true});body+=remaining.map(visual).join('');}
 body+='<w:sectPr><w:footerReference w:type="default" r:id="rFooter"/><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1021" w:bottom="1134" w:left="1021" w:header="500" w:footer="500"/><w:cols w:space="720"/></w:sectPr>';
 files['word/document.xml']=strToU8(xml(`<w:document xmlns:w="${W}" xmlns:r="${R}" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><w:body>${body}</w:body></w:document>`));
 const style=(id,size,bold=false,spacing=120)=>`<w:style w:type="paragraph" w:styleId="${id}"><w:name w:val="${id}"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="${spacing}" w:line="320" w:lineRule="auto"/>${id.startsWith('Heading')?'<w:keepNext/>':''}</w:pPr><w:rPr><w:sz w:val="${size}"/><w:color w:val="000000"/>${bold?'<w:b/>':''}</w:rPr></w:style>`;
 files['word/styles.xml']=strToU8(xml(`<w:styles xmlns:w="${W}"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:eastAsia="맑은 고딕"/><w:sz w:val="22"/><w:spacing w:val="0"/><w:w w:val="100"/><w:lang w:val="ko-KR" w:eastAsia="ko-KR"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:widowControl/><w:wordWrap/><w:jc w:val="left"/><w:autoSpaceDE w:val="0"/><w:autoSpaceDN w:val="0"/><w:spacing w:after="120" w:line="340" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style>${style('Title',36,true,240)}${style('Heading1',27,true,180)}${style('Heading2',23,true,100)}${style('TableText',20,false,60)}${style('Caption',18,false,100)}</w:styles>`));
 files['word/footer1.xml']=strToU8(xml(`<w:ftr xmlns:w="${W}"><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:fldSimple w:instr="PAGE"><w:r><w:t>1</w:t></w:r></w:fldSimple></w:p></w:ftr>`));
 files['word/_rels/document.xml.rels']=strToU8(xml(`<Relationships xmlns="${PACKAGE}">${rels.map(([id,type,target])=>`<Relationship Id="${id}" Type="${type}" Target="${target}"/>`).join('')}</Relationships>`));
 files['_rels/.rels']=strToU8(xml(`<Relationships xmlns="${PACKAGE}"><Relationship Id="rDoc" Type="${R}/officeDocument" Target="word/document.xml"/></Relationships>`));
 files['[Content_Types].xml']=strToU8(xml('<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/></Types>'));
 return zipSync(files,{level:6});
}
